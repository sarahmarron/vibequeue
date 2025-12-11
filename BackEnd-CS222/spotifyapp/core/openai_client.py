import os
import json
from openai import OpenAI

# do not commit the api key, will set up env thing later!
# OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
# create a .env folder in BackEnd-CS222/spotifyapp and paste in the line "OPENAI_API_KEY=" and enter my key there
# OPENAI_API_KEY = "sk- ................ ENTER IT HERE BUT DON'T COMMIT IT PLS ITS IN SLACK FOR NOW"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

def get_song_recommendations_from_gpt(user_prompt: str) -> list[dict]:
    """
    Takes a escription (e.g. 'happy cheerful spring songs')
    and returns { "title": str, "artist": str }.
    """

    system_msg = (
        "You are a music recommendation assistant. "
        "Always respond with ONLY valid JSON in this exact format:\n"
        "{ \"songs\": [ { \"title\": string, \"artist\": string } ] }\n"
        "Include at most 5 songs. No extra fields, no explanations."
    )

    user_msg = (
        f"Recommend up to 5 songs that match this vibe description: '{user_prompt}'. "
    )

    response = client.chat.completions.create(
        model="gpt-5-mini",  # can change
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        temperature=1, # must be one for gpt5 it seems which isn't bad
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return data.get("songs", [])