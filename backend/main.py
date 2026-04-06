import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.api import router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Talking BI Dashboard API")

# Setup CORS for the Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Talking BI backend is running."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
