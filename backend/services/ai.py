import os
import json
from groq import Groq

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key == "your_groq_api_key_here":
        raise Exception("Groq API key not configured. Please set GROQ_API_KEY in .env.")
    return Groq(api_key=api_key)

def parse_json_safely(content: str) -> dict:
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except:
        return {}

def analyze_data(payload: dict) -> dict:
    """
    Analyzes the provided dataset using the Groq API and returns a dashboard JSON.
    """
    try:
        client = get_groq_client()
        dataset = payload.get("dataset", [])
        data_type = payload.get("type", "data")
        
        # Limit the dataset heavily to reduce tokens
        if dataset and isinstance(dataset, list) and len(dataset) > 0:
            columns = list(dataset[0].keys()) if isinstance(dataset[0], dict) else []
            data_keys_str = ", ".join(f"'{c}'" for c in columns)
            dataset_sample = dataset[:10]
            dataset_str = f"Columns: {columns}\nSample Data: {json.dumps(dataset_sample)}"
        else:
            data_keys_str = "None"
            dataset_str = "No dataset provided."
            
        prompt = f"""
You are an expert Data Analyst and BI Dashboard Generator. 
Analyze the following {data_type} dataset. Your task is to analyze this data, summarize the key findings, and decide how to visualize it on a frontend dashboard.

CRITICAL INSTRUCTION 1: You MUST generate AT LEAST 4 charts in your response. 
Carefully analyze the dataset and dynamically choose the best chart types ("line", "bar", or "pie") that actually make sense for the provided data. 
- Use "line" for trends over time/sequence.
- Use "bar" for comparing categories.
- Use "pie" for distributions/parts of a whole.
You can include multiple charts of the same type if it fits the data well. Do NOT force a chart type if the dataset doesn't support it, but you MUST provide at least 4 meaningful and distinct charts.

CRITICAL INSTRUCTION 2: Your 'dataKeyX' and 'dataKeyY' MUST EXACTLY MATCH one of these exact string column names: [{data_keys_str}]. Do NOT make up column names or change their capitalization/spacing!

Ensure the "data" for each chart makes logical sense and contains valid data points from the dataset.

Return ONLY a valid JSON object following this EXACT schema:
{{
  "kpis": [
     {{"label": "Total Revenue (or similar metric)", "value": "$1.2M (or any string representation of a key number)"}},
     {{"label": "Another Critical Metric", "value": "12.4K"}}
  ],
  "insights_summary": "A 2-3 sentence executive summary of the findings.",
  "bullet_insights": [
     "Specific detailed insight 1",
     "Specific detailed insight 2"
  ],
  "charts": [
     {{
       "type": "pie",     // Must be exactly "line", "bar", or "pie"
       "title": "Chart Title",
       "dataKeyX": "columnKeyForX",  // Key to use for X-axis (e.g. "Category" or "Date")
       "dataKeyY": "columnKeyForY", // Key to use for Y-axis (or empty if aggregation is 'count')
       "aggregation": "sum", // MUST be "sum", "average", "count", or "none" (none=plot raw points directly)
       "data": [] // LEAVE THIS FIELD AS AN EMPTY ARRAY. The frontend will aggregate the raw dataset.
     }}
  ]
}}

Dataset sample:
{dataset_str}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        return parse_json_safely(chat_completion.choices[0].message.content)
    except Exception as e:
        return {
            "insights_summary": f"Failed to analyze data via Groq API: {str(e)}",
            "bullet_insights": [],
            "charts": []
        }

def chat_with_data(message: str, context: dict = None) -> str:
    """
    Chat directly with the AI about the dataset or dashboard.
    """
    try:
        client = get_groq_client()
        
        context_str = json.dumps(context) if context else "No specific data context provided."
        
        prompt = f"""
You are an AI-powered 'Talking BI Dashboard' assistant. 
Answer the user's query thoughtfully and accurately based on providing financial and data insights.

Context Data (if any):
{context_str}

User Query: {message}
        """

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.5,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        return f"Groq AI error: {str(e)}"
