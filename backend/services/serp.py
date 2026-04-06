import os
from serpapi import GoogleSearch

def get_serp_news(query: str) -> list:
    api_key = os.getenv("SERPAPI_API_KEY")
    if not api_key or api_key == "your_serpapi_api_key_here":
        # Fallback dummy data if not configured
        return [
            {"title": f"Recent developments regarding {query}", "source": "Finance News", "date": "1 hour ago"},
            {"title": f"Market impacts of {query} announced", "source": "Tech Insider", "date": "3 hours ago"},
            {"title": f"Why {query} is trending today", "source": "Global Analyst", "date": "5 hours ago"}
        ]
        
    try:
        params = {
            "engine": "google_news",
            "q": query,
            "api_key": api_key
        }
        search = GoogleSearch(params)
        results = search.get_dict()
        
        news_results = results.get("news_results", [])
        
        formatted_news = []
        for i, article in enumerate(news_results):
            if i >= 5: # Limit to top 5 news
                break
            formatted_news.append({
                "title": article.get("title", ""),
                "source": article.get("source", {}).get("name", "Unknown Source"),
                "date": article.get("date", "Recently"),
                "link": article.get("link", "")
            })
            
        return formatted_news
    except Exception as e:
        print(f"SerpAPI Error: {str(e)}")
        return [{"title": f"Error fetching news for {query}", "source": "System", "date": "Now"}]
