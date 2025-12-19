"""
Sedna FM Mood Recommendation API
Azure Function that uses GPT-5 nano to recommend episodes based on mood.
"""

import azure.functions as func
import json
import logging
import os
import random
from openai import AzureOpenAI

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# Load episodes data
def load_episodes():
    """Load episodes from the JSON file."""
    episodes_path = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
    
    # Try local path first, then Azure deployment path
    if not os.path.exists(episodes_path):
        episodes_path = os.path.join(os.path.dirname(__file__), "episodes.json")
    
    with open(episodes_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["episodes"]


def get_mood_recommendation(mood: str, episodes: list, exclude_ids: list = None) -> dict:
    """Use GPT-5-nano to recommend an episode based on mood.
    
    Args:
        mood: The mood to match
        episodes: List of all episodes
        exclude_ids: List of episode IDs to exclude (already played in session)
    """
    if exclude_ids is None:
        exclude_ids = []
    
    # Filter out excluded episodes
    available_episodes = [ep for ep in episodes if ep['id'] not in exclude_ids]
    
    # If all episodes have been played, reset and use all episodes
    memory_reset = False
    if len(available_episodes) == 0:
        available_episodes = episodes
        memory_reset = True
        logging.info(f"All episodes played for mood '{mood}', resetting memory")
    
    client = AzureOpenAI(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
        api_version="2025-01-01-preview",
        azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT")
    )
    
    # Shuffle available episodes to present them in random order - encourages variety
    shuffled_episodes = available_episodes.copy()
    random.shuffle(shuffled_episodes)
    
    # Build episode catalog for the prompt (in random order, excluding already played)
    episode_catalog = "\n".join([
        f"ID: {ep['id']}\nTitle: {ep['title']}\nDescription: {ep['description']}\nSongs: {', '.join(ep.get('songs', []))}\n"
        for ep in shuffled_episodes
    ])
    
    # Add randomness hint to encourage variety
    random_seed = random.randint(1, 1000)
    
    # Pick a random subset hint to encourage exploration
    random_series = random.choice(["Sedna FM main series", "Morning Drops", "Evening Flows", "On The Go", "any series"])
    
    system_prompt = """You are Sedna FM's mood-based music curator. Your job is to recommend the perfect episode based on the listener's current mood.

Analyze each episode's description and song list to understand its emotional atmosphere, then match it to the requested mood.

CRITICAL GUIDELINES FOR VARIETY:
1. Many episodes can match any given mood - DO NOT always pick the same one!
2. Do not Consider the episode ORDER in your list - you can pick from anywhere in the catalog
3. Look beyond obvious keyword matches - a "reflective" mood could match adventure stories too
4. Each series has episodes that fit every mood - explore Sedna FM, Morning Drops, Evening Flows, and On The Go
5. If an episode mentions a specific emotion, that's just ONE signal - other episodes without that keyword might fit even better
6. BE CREATIVE in your selections!

You must respond with ONLY a valid JSON object in this exact format:
{"episode_id": <number>, "reason": "<brief explanation of why this episode matches the mood>"}

Do not include any other text, markdown, or explanation outside the JSON."""

    user_prompt = f"""The listener is feeling: {mood}


Available episodes:
{episode_catalog}

Select the best matching episode. IMPORTANT: Vary your selection - don't always pick the most obvious episode!"""

    response = client.chat.completions.create(
        model=os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5-nano"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=16384,
        reasoning_effort="minimal"  # Use minimal reasoning for fastest response
    )
    
    # Parse the AI response
    ai_response = response.choices[0].message.content.strip()
    
    try:
        recommendation = json.loads(ai_response)
        episode_id = recommendation.get("episode_id")
        reason = recommendation.get("reason", "")
        
        # Find the full episode details
        episode = next((ep for ep in episodes if ep["id"] == episode_id), None)
        
        if episode:
            return {
                "success": True,
                "episode": episode,
                "reason": reason,
                "memoryReset": memory_reset
            }
        else:
            # Fallback to first available episode if ID not found
            return {
                "success": True,
                "episode": available_episodes[0],
                "reason": "Here's a great episode for you!",
                "memoryReset": memory_reset
            }
            
    except json.JSONDecodeError:
        logging.error(f"Failed to parse AI response: {ai_response}")
        # Return first available episode as fallback
        return {
            "success": True,
            "episode": available_episodes[0],
            "reason": "Here's a recommended episode for your mood!",
            "memoryReset": memory_reset
        }


@app.route(route="recommend", methods=["POST", "OPTIONS"])
def recommend_episode(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP endpoint to get mood-based episode recommendations.
    
    POST /api/recommend
    Body: {"mood": "Happy"}
    
    Returns: {"success": true, "episode": {...}, "reason": "..."}
    """
    
    # Handle CORS preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    # CORS headers for actual request
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    }
    
    try:
        # Parse request body
        req_body = req.get_json()
        mood = req_body.get("mood")
        exclude_ids = req_body.get("exclude", [])  # List of episode IDs to exclude
        
        # Ensure exclude_ids is a list of integers
        if not isinstance(exclude_ids, list):
            exclude_ids = []
        exclude_ids = [int(id) for id in exclude_ids if isinstance(id, (int, str)) and str(id).isdigit()]
        
        if not mood:
            return func.HttpResponse(
                json.dumps({"success": False, "error": "Missing 'mood' in request body"}),
                status_code=400,
                headers=headers
            )
        
        # Validate mood
        valid_moods = ["Happy", "Calm", "Reflective", "Sad", "Energetic", "Intimate", "Moody", "Carefree"]
        if mood not in valid_moods:
            return func.HttpResponse(
                json.dumps({"success": False, "error": f"Invalid mood. Must be one of: {', '.join(valid_moods)}"}),
                status_code=400,
                headers=headers
            )
        
        # Load episodes and get recommendation
        episodes = load_episodes()
        result = get_mood_recommendation(mood, episodes, exclude_ids)
        
        return func.HttpResponse(
            json.dumps(result),
            status_code=200,
            headers=headers
        )
        
    except ValueError as e:
        logging.error(f"Invalid JSON in request: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "Invalid JSON in request body"}),
            status_code=400,
            headers=headers
        )
    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return func.HttpResponse(
            json.dumps({"success": False, "error": "Internal server error"}),
            status_code=500,
            headers=headers
        )


@app.route(route="health", methods=["GET"])
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint."""
    return func.HttpResponse(
        json.dumps({"status": "healthy", "service": "sedna-fm-mood-api"}),
        status_code=200,
        headers={"Content-Type": "application/json"}
    )
