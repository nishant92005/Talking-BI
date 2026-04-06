import json
from services.ai import get_groq_client
from services.alpha_vantage import get_daily_stock_data
from services.trends import get_google_trends
from services.serp import get_serp_news

def parse_json_safely(content: str) -> dict:
    try:
        # Groq might wrap JSON in markdown blocks like ```json ... ```
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except:
        return {}

def orchestrate_query(user_query: str) -> dict:
    client = get_groq_client()
    
    # 1. Routing phase - Determine which APIs to call
    routing_prompt = f"""
You are an autonomous agent API router. Based on the user's query, determine which data sources are needed.
Return ONLY valid JSON, no other text.

Data sources available:
- "stock_api": use when user asks for stock prices/data/trends. Needs a valid stock ticker symbol (e.g. MSFT, TSLA, AAPL).
- "trends_api": use when user asks for search trends, market interest, or comparative buzz. Needs a search keyword.
- "news_api": use when user asks for latest news, announcements, or recent developments via google. Needs a search query.

User Query: "{user_query}"

Schema required:
{{
  "use_stock": boolean,
  "stock_symbol": string or null,
  "use_trends": boolean,
  "trends_keyword": string or null,
  "use_news": boolean,
  "news_query": string or null
}}
"""

    routing_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": routing_prompt}],
        model="llama-3.1-8b-instant",
        temperature=0.1,
        max_tokens=500,
        response_format={"type": "json_object"}
    )
    
    routing_decisions = parse_json_safely(routing_completion.choices[0].message.content)
    
    fetched_data = {}
    
    # 2. Fetching phase
    if routing_decisions.get("use_stock") and routing_decisions.get("stock_symbol"):
        try:
            fetched_data["stock"] = get_daily_stock_data(routing_decisions["stock_symbol"])
        except Exception as e:
            fetched_data["stock_error"] = str(e)
            
    if routing_decisions.get("use_trends") and routing_decisions.get("trends_keyword"):
        fetched_data["trends"] = get_google_trends(routing_decisions["trends_keyword"])
        
    if routing_decisions.get("use_news") and routing_decisions.get("news_query"):
        fetched_data["news"] = get_serp_news(routing_decisions["news_query"])
        
    try:
        raw_data_json = json.dumps(fetched_data)[:3000] # Truncated to avoid context limits
    except TypeError:
        raw_data_json = str(fetched_data)[:3000]

    # 3. Analysis & Dashboard Generation Phase
    # We pass the fetched data back to Groq to act as the Data Analyst and format the dashboard layout.
    analysis_prompt = f"""
You are an expert Data Analyst and BI Dashboard Generator. 
You have gathered the following raw data based on the user's query: "{user_query}".

RAW DATA:
{raw_data_json}

Your task is to analyze this data, summarize the key findings, and decide how to visualize it on a frontend dashboard.

CRITICAL INSTRUCTION: You MUST generate at least 3 charts in your response:
1. ONE "line" chart (e.g. tracking stock prices or trends over time)
2. ONE "bar" chart (e.g. comparing specific values, averages, or categories)
3. ONE "pie" chart (e.g. showing volume breakdown, market distribution, or percentages)

Ensure the "data" for each chart makes logical sense for its type (e.g. Pie charts data must be categorical and positive values).

Return ONLY a valid JSON object following this EXACT schema:
{{
  "insights_summary": "A 2-3 sentence executive summary of the findings.",
  "bullet_insights": [
     "Specific detailed insight 1",
     "Specific detailed insight 2"
  ],
  "charts": [
     {{
       "type": "line",     // Can be "line", "bar", or "pie"
       "title": "Stock Growth vs Time",
       "dataKeyX": "date",  // Key to use for X-axis
       "dataKeyY": "close", // Key to use for Y-axis or value
       "data": [
          {{"date": "2023-10-01", "close": 150.0}},
          {{"date": "2023-10-02", "close": 152.0}}
          // Include ALL relevant data points from the RAW DATA to draw the chart properly
       ]
     }}
  ],
  "news": [
     // If news was gathered, populate it here
     {{"title": "News Title", "source": "Source", "date": "Date"}}
  ]
}}
"""

    try:
        analysis_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": analysis_prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        final_dashboard = parse_json_safely(analysis_completion.choices[0].message.content)
    except Exception as api_err:
        final_dashboard = {
            "insights_summary": f"Dashboard AI Generation failed: {str(api_err)}. The required APIs may be rate limited.",
            "bullet_insights": [],
            "charts": [],
            "news": fetched_data.get("news", []),
            "raw_data_fetched": fetched_data
        }
    
    # Fallback structure if parsing completely fails
    if not final_dashboard or "charts" not in final_dashboard:
        final_dashboard = {
            "insights_summary": "Failed to generate comprehensive dashboard structure.",
            "bullet_insights": [],
            "charts": [],
            "news": [],
            "raw_data_fetched": fetched_data
        }
        
    return final_dashboard
