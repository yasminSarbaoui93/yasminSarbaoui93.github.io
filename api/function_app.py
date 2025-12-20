"""
Sedna FM API Functions
- Mood Recommendation API (GPT-5 nano)
- Daily Fact & Match Feature (GPT-5.1)
"""

import azure.functions as func
import json
import logging
import os
import random
import httpx
from datetime import datetime, timezone
from typing import Any
from openai import AzureOpenAI

# GitHub API for committing results
from github import Github

# Create single FunctionApp instance for all functions
app = func.FunctionApp()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==============================================================================
# SHARED: Episode Loading
# ==============================================================================

def load_episodes() -> list[dict[str, Any]]:
    """Load episodes from the JSON file."""
    episodes_path = os.path.join(os.path.dirname(__file__), "episodes.json")
    
    # Fallback to data folder path
    if not os.path.exists(episodes_path):
        episodes_path = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
    
    with open(episodes_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["episodes"]


# ==============================================================================
# MOOD RECOMMENDATION API
# ==============================================================================

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
    
    # Use dedicated env vars for mood API (falls back to shared vars)
    client = AzureOpenAI(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY_MOOD", os.environ.get("AZURE_OPENAI_API_KEY")),
        api_version="2025-01-01-preview",
        azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT_MOOD", os.environ.get("AZURE_OPENAI_ENDPOINT"))
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
        model=os.environ.get("AZURE_OPENAI_MODEL_MOOD", "gpt-5-nano"),
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


@app.route(route="recommend", methods=["POST", "OPTIONS"], auth_level=func.AuthLevel.ANONYMOUS)
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


@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint."""
    return func.HttpResponse(
        json.dumps({"status": "healthy", "service": "sedna-fm-api", "version": "2.0.0"}),
        status_code=200,
        headers={"Content-Type": "application/json"}
    )


# ==============================================================================
# DAILY FACT & MATCH FEATURE
# ==============================================================================

async def fetch_wikipedia_events(month: int, day: int) -> list[dict[str, Any]]:
    """
    Fetch historical events from Wikipedia's "On this day" API.
    Focus on music, science, or space events when possible.
    
    Args:
        month: Month (1-12)
        day: Day of month (1-31)
        
    Returns:
        List of historical events with text, year, and pages info
    """
    url = f"https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/{month:02d}/{day:02d}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers={"User-Agent": "SednaFM/1.0"})
        response.raise_for_status()
        data = response.json()
    
    events = data.get("events", [])
    
    # Filter for music, science, space related events if possible
    # Keywords to prioritize
    priority_keywords = [
        "music", "song", "album", "band", "singer", "composer", "symphony", "concert",
        "space", "nasa", "astronaut", "moon", "mars", "satellite", "rocket", "mission",
        "science", "discovery", "physicist", "scientist", "nobel", "experiment",
        "radio", "broadcast", "television", "film", "artist", "record"
    ]
    
    # Score events based on relevance
    scored_events = []
    for event in events:
        text = event.get("text", "").lower()
        pages = event.get("pages", [])
        
        # Check event text and linked pages for keywords
        score = 0
        for keyword in priority_keywords:
            if keyword in text:
                score += 2
            for page in pages:
                if keyword in page.get("description", "").lower():
                    score += 1
                if keyword in page.get("extract", "").lower():
                    score += 1
        
        scored_events.append({
            "event": event,
            "score": score
        })
    
    # Sort by score (highest first) and take top 20 events
    scored_events.sort(key=lambda x: x["score"], reverse=True)
    top_events = [se["event"] for se in scored_events[:20]]
    
    # Format events for the AI
    formatted_events = []
    for event in top_events:
        # Get Wikipedia URLs from pages
        pages_with_urls = []
        for page in event.get("pages", [])[:3]:
            page_title = page.get("title", "")
            # Create Wikipedia URL from page title
            wiki_url = f"https://en.wikipedia.org/wiki/{page_title.replace(' ', '_')}" if page_title else None
            pages_with_urls.append({
                "title": page_title,
                "description": page.get("description", ""),
                "url": wiki_url
            })
        
        formatted_event = {
            "year": event.get("year"),
            "text": event.get("text"),
            "pages": pages_with_urls
        }
        formatted_events.append(formatted_event)
    
    return formatted_events


async def get_daily_match(events: list[dict], episodes: list[dict]) -> dict[str, Any]:
    """
    Use Azure OpenAI GPT-5.1 to select an intriguing fact and match it with an episode.
    
    Args:
        events: List of historical events from Wikipedia
        episodes: List of Sedna FM episodes
        
    Returns:
        Dictionary containing fact_text and matched episode data
    """
    # Use dedicated env vars for daily fact API (falls back to shared vars)
    client = AzureOpenAI(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY_DAILY", os.environ.get("AZURE_OPENAI_API_KEY")),
        api_version="2025-01-01-preview",
        azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT_DAILY", os.environ.get("AZURE_OPENAI_ENDPOINT"))
    )
    
    # Build the prompt with events and episodes
    events_text = json.dumps(events, indent=2)
    episodes_text = json.dumps(episodes, indent=2)
    
    today = datetime.now(timezone.utc)
    
    system_prompt = """You are an alien curator for Sedna.fm, a radio station broadcasting from another planet.
        
Your task is to:
1. Select the MOST INTRIGUING and CURIOUS fact from today's historical events
2. Pick ONE episode from the Sedna FM catalog that best matches the 'vibe' of that fact

Selection criteria for the fact:
- Prioritize music, science, space, or cultural events
- Choose facts that are surprising, lesser-known, or have an interesting story
- Avoid overly common or mundane events
- The fact should inspire curiosity and wonder

Selection criteria for the episode:
- Match the emotional tone and theme of the fact
- Consider the music genres and description of each episode
- Think about how the episode's atmosphere relates to the historical event
- Be creative in finding unexpected but meaningful connections

You must respond with ONLY a valid JSON object in this exact format:
{
    "fact_text": "<A well-written, engaging description of the historical fact (2-3 sentences)>",
    "fact_year": <year as integer>,
    "fact_wikipedia_url": "<URL of the most relevant Wikipedia page for this fact from the pages array>",
    "episode": {
        "id": <episode id>,
        "title": "<episode title>",
        "description": "<episode description>",
        "soundcloudUrl": "<soundcloud url>",
        "songs": ["<song1>", "<song2>", ...],
        "music-genres": ["<genre1>", "<genre2>", ...]
    },
    "match_reason": "<Brief explanation of why this episode matches the fact's vibe>"
}

Do not include any other text, markdown, or explanation outside the JSON."""

    user_prompt = f"""Today is {today.strftime('%B %d')}. 

Here are the historical events that happened on this day:
{events_text}

Here is the Sedna FM episode catalog:
{episodes_text}

Select the most intriguing fact and the best matching episode."""

    response = client.chat.completions.create(
        model=os.environ.get("AZURE_OPENAI_MODEL_DAILY", "gpt-5.1"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_completion_tokens=4096
    )
    
    # Parse the JSON response
    response_text = response.choices[0].message.content.strip()
    
    try:
        # Clean up potential markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        daily_match = json.loads(response_text.strip())
        return daily_match
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        logger.error(f"Response was: {response_text}")
        raise


def commit_to_github(daily_match: dict[str, Any], date_str: str) -> bool:
    """
    Commit the daily match JSON to GitHub.
    
    Args:
        daily_match: The daily fact and episode match data
        date_str: Date string for the file (YYYY-MM-DD)
        
    Returns:
        True if successful, False otherwise
    """
    github_token = os.environ.get("GITHUB_TOKEN")
    repo_name = os.environ.get("GITHUB_REPO", "yasminSarbaoui93/yasminSarbaoui93.github.io")
    branch = os.environ.get("GITHUB_BRANCH", "main")
    
    if not github_token:
        logger.error("GITHUB_TOKEN environment variable not set")
        return False
    
    try:
        g = Github(github_token)
        repo = g.get_repo(repo_name)
        
        # Add metadata to the match
        daily_match["date"] = date_str
        daily_match["generated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Convert to JSON string
        content = json.dumps(daily_match, indent=2, ensure_ascii=False)
        
        # File path in repo
        file_path = "data/daily_match.json"
        commit_message = f"🌟 Daily fact & match for {date_str}"
        
        try:
            # Try to get existing file
            existing_file = repo.get_contents(file_path, ref=branch)
            # Update existing file
            repo.update_file(
                path=file_path,
                message=commit_message,
                content=content,
                sha=existing_file.sha,
                branch=branch
            )
            logger.info(f"Updated {file_path} in {repo_name}")
        except Exception:
            # File doesn't exist, create it
            repo.create_file(
                path=file_path,
                message=commit_message,
                content=content,
                branch=branch
            )
            logger.info(f"Created {file_path} in {repo_name}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to commit to GitHub: {e}")
        return False


# Timer Trigger: Runs daily at 00:01 CET (23:01 UTC the day before)
# CRON expression: second minute hour day month day-of-week
# 0 1 23 * * * = At 23:01 UTC every day (which is 00:01 CET)
@app.timer_trigger(
    schedule="0 1 23 * * *",
    arg_name="timer",
    run_on_startup=False,
    use_monitor=True
)
async def daily_fact_generator(timer: func.TimerRequest) -> None:
    """
    Timer-triggered function that runs daily to generate the fact of the day
    and match it with a Sedna FM episode.
    """
    logger.info("Daily Fact Generator function started")
    
    if timer.past_due:
        logger.info("The timer is past due!")
    
    try:
        # Get current date (in CET timezone context)
        now = datetime.now(timezone.utc)
        # Adjust for CET (UTC+1) for the date
        date_str = now.strftime("%Y-%m-%d")
        month = now.month
        day = now.day
        
        logger.info(f"Generating daily fact for {date_str} ({month}/{day})")
        
        # Step A: Fetch historical events from Wikipedia
        logger.info("Fetching historical events from Wikipedia...")
        events = await fetch_wikipedia_events(month, day)
        logger.info(f"Fetched {len(events)} events")
        
        if not events:
            logger.warning("No events fetched from Wikipedia")
            return
        
        # Step B: Load episodes
        logger.info("Loading Sedna FM episodes...")
        episodes = load_episodes()
        logger.info(f"Loaded {len(episodes)} episodes")
        
        # Step C: Use AI to match fact with episode
        logger.info("Generating daily match with AI...")
        daily_match = await get_daily_match(events, episodes)
        logger.info(f"Generated match: {daily_match.get('fact_text', '')[:100]}...")
        
        # Step D: Commit to GitHub
        logger.info("Committing to GitHub...")
        success = commit_to_github(daily_match, date_str)
        
        if success:
            logger.info("Daily fact successfully generated and committed!")
        else:
            logger.error("Failed to commit daily fact to GitHub")
            
    except Exception as e:
        logger.error(f"Error in daily fact generator: {e}")
        raise


# HTTP Trigger for manual testing
@app.route(route="generate-daily-fact", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
async def generate_daily_fact_manual(req: func.HttpRequest) -> func.HttpResponse:
    """
    HTTP endpoint for manually triggering the daily fact generation.
    Useful for testing and debugging.
    
    GET /api/generate-daily-fact
    GET /api/generate-daily-fact?date=2025-12-20
    GET /api/generate-daily-fact?commit=true  (also commits to GitHub)
    """
    logger.info("Manual daily fact generation triggered")
    
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    }
    
    try:
        # Get date from query params or use today
        date_param = req.params.get("date")
        if date_param:
            try:
                target_date = datetime.strptime(date_param, "%Y-%m-%d")
            except ValueError:
                return func.HttpResponse(
                    json.dumps({"error": "Invalid date format. Use YYYY-MM-DD"}),
                    status_code=400,
                    headers=headers
                )
        else:
            target_date = datetime.now(timezone.utc)
        
        month = target_date.month
        day = target_date.day
        date_str = target_date.strftime("%Y-%m-%d")
        
        # Fetch events
        events = await fetch_wikipedia_events(month, day)
        
        if not events:
            return func.HttpResponse(
                json.dumps({"error": "No events found for this date"}),
                status_code=404,
                headers=headers
            )
        
        # Load episodes
        episodes = load_episodes()
        
        # Generate match
        daily_match = await get_daily_match(events, episodes)
        
        # Optionally commit to GitHub
        commit_param = req.params.get("commit", "false").lower() == "true"
        if commit_param:
            commit_to_github(daily_match, date_str)
            daily_match["committed"] = True
        
        return func.HttpResponse(
            json.dumps(daily_match, indent=2, ensure_ascii=False),
            status_code=200,
            headers=headers
        )
        
    except Exception as e:
        logger.error(f"Error in manual generation: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            headers=headers
        )
