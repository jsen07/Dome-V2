from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import os
import openai
from openai import AsyncOpenAI
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
# Loads variables from the .env file
load_dotenv()

client = AsyncOpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  # Disable authentication
@permission_classes([AllowAny])  # Allow any request (no authentication required)
def chatbot_message(request):
    message = request.data.get("message")  # Get the message from the request data
    if not message:
        return Response({"error": "No message provided"}, status=400)
    return Response({"message": message}, status=200)


async def index(request) -> None:
    try:
        response = chatbot_message(request)
        message = response.data.get("message")
        stream = await client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    f"content": message
                }
            ],
            model = "gpt-4o-mini",
            temperature=0,
            stream=True,
            max_tokens=75
        )
        content = ""
        async for chunk in stream:
            content += chunk.choices[0].delta.content or ""

        return HttpResponse(content, content_type="text/plain")
    except openai.APIConnectionError as e:
        print("The server could not be reached")
        print(e.__cause__)  # an underlying Exception, likely raised within httpx.
    except openai.RateLimitError as e:
        print("A 429 status code was received; we should back off a bit.")
    except openai.APIStatusError as e:
        print("Another non-200-range status code was received")
        print(e.status_code)
        print(e.response)