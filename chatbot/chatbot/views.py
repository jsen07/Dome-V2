from transformers import GPT2LMHeadModel, GPT2Tokenizer
from rest_framework.decorators import api_view
from rest_framework.response import Response
import torch

# Load GPT2 model and tokenizer
model_name = "gpt2"
model = GPT2LMHeadModel.from_pretrained(model_name)
tokenizer = GPT2Tokenizer.from_pretrained(model_name)

# Set model to evaluation mode
model.eval()

def remove_repeats(text):
    words = text.split()
    unique_words = []
    for word in words:
        if word not in unique_words:
            unique_words.append(word)
    return ' '.join(unique_words)

def gpt2_response(user_input):
    input_ids = tokenizer.encode(user_input + tokenizer.eos_token, return_tensors='pt')
    
    output = model.generate(
        input_ids,
        max_length=100,
        temperature=0.7,  # Allow for some creativity
        top_p=0.9,
        num_return_sequences=1,  # Generate multiple responses if needed
        pad_token_id=tokenizer.eos_token_id
    )

    response = tokenizer.decode(output[:, input_ids.shape[-1]:][0], skip_special_tokens=True)

    return response

@api_view(['POST'])
def chatbot_response(request):
    user_input = request.data.get("message")
    if user_input:
        response = gpt2_response(user_input)
        return Response({"response": response})
    return Response({"error": "No message provided"}, status=400)
