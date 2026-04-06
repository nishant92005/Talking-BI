from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.alpha_vantage import get_daily_stock_data
from services.trends import get_google_trends
from services.ai import analyze_data, chat_with_data
from agents.orchestrator import orchestrate_query
import pandas as pd
import io
import requests
import re

router = APIRouter()

class StockRequest(BaseModel):
    symbol: str

class TrendRequest(BaseModel):
    keyword: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None

class AgentQueryRequest(BaseModel):
    query: str

class DriveLinkRequest(BaseModel):
    url: str

@router.post("/query")
async def execute_agent_query(request: AgentQueryRequest):
    try:
        dashboard_data = orchestrate_query(request.query)
        return {"query": request.query, "dashboard": dashboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent orchestrator failed: {str(e)}")

@router.post("/get-stock-data")
async def get_stock_data(request: StockRequest):
    try:
        data = get_daily_stock_data(request.symbol)
        return {"symbol": request.symbol, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/get-trends")
async def get_trends(request: TrendRequest):
    try:
        data = get_google_trends(request.keyword)
        return {"keyword": request.keyword, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        # Basic cleaning and converting to JSON for frontend
        df = df.dropna(how="all").fillna("")
        df = df.head(10) # Pickup up to 10 rows only
        data_json = df.to_dict(orient="records")
        return {"filename": file.filename, "rows": len(data_json), "data": data_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV: {str(e)}")

@router.post("/upload-drive-link")
async def upload_drive_link(request: DriveLinkRequest):
    url = request.url
    # Attempt to extract file ID using regex
    file_id_match = re.search(r'/d/([^/]+)', url) or re.search(r'id=([^&]+)', url)
    
    if not file_id_match:
        raise HTTPException(status_code=400, detail="Could not extract Google Drive File ID. Please ensure it is a valid shareable link.")
        
    file_id = file_id_match.group(1)
    
    try:
        # 1. First try as a Google Sheet export
        download_url_csv = f"https://docs.google.com/spreadsheets/d/{file_id}/export?format=csv"
        response = requests.get(download_url_csv)
        
        if response.status_code == 200 and 'text/csv' in response.headers.get('Content-Type', '').lower():
            content = response.content
        else:
            # 2. Fallback to standard Drive File download
            download_url_file = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"
            session = requests.Session()
            response = session.get(download_url_file)
            
            # If Google Drive shows the large-file virus warning, it returns HTML
            if response.status_code == 200 and 'html' in response.headers.get('Content-Type', '').lower():
                # Extract the confirmation download URL from the warning page
                warning_url_match = re.search(r'href="(/uc\?export=download[^"]+)"', response.text)
                if warning_url_match:
                    download_url_file = "https://drive.google.com" + warning_url_match.group(1).replace('&amp;', '&')
                    response = session.get(download_url_file)
                else:
                    raise Exception("File is restricted, empty, or not a CSV list.")
                    
            if response.status_code != 200:
                raise Exception(f"HTTP GET failed with status: {response.status_code}")
            content = response.content

        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise Exception("File content is not parseable as a valid CSV. Ensure it is a pure CSV file or Google Sheet.")

        df = df.dropna(how="all").fillna("")
        df = df.head(10) 
        data_json = df.to_dict(orient="records")
        
        return {"filename": f"DriveFile-{file_id}.csv", "rows": len(data_json), "data": data_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading from Google Drive: {str(e)}")

@router.post("/analyze")
async def analyze_dataset(payload: dict):
    # payload should contain {"dataset": [...], "type": "stock|trend|csv"}
    try:
        insights = analyze_data(payload)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = chat_with_data(request.message, request.context)
        return {"reply": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
