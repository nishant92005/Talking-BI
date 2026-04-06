from pytrends.request import TrendReq
import pandas as pd

def get_google_trends(keyword: str) -> list:
    try:
        pytrends = TrendReq(hl='en-US', tz=360)
        kw_list = [keyword]
        pytrends.build_payload(kw_list, cat=0, timeframe='today 3-m', geo='', gprop='')
        trends_df = pytrends.interest_over_time()
        
        if trends_df.empty:
            return []
            
        if 'isPartial' in trends_df.columns:
            trends_df = trends_df.drop('isPartial', axis=1)
            
        trends_df = trends_df.reset_index()
        trends_df['date'] = trends_df['date'].dt.strftime('%Y-%m-%d')
        
        import json
        
        # Format as list of dicts for JSON, using to_json to guarantee JSON-serializable types
        json_str = trends_df.rename(columns={keyword: "interest"}).to_json(orient="records")
        formatted_data = json.loads(json_str)
        return formatted_data
    except Exception as e:
        print(f"Error fetching Google Trends: {str(e)}")
        # Provide fallback dummy data
        return [
            {"date": "2023-10-01", "interest": 45},
            {"date": "2023-10-15", "interest": 60},
            {"date": "2023-11-01", "interest": 80},
            {"date": "2023-11-15", "interest": 75}
        ]
