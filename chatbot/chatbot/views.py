from transformers import GPT2LMHeadModel, GPT2Tokenizer
from rest_framework.decorators import api_view
from rest_framework.response import Response
import torch
import sys
sys.dont_write_bytecode = True

# Load GPT2 model and tokenizer
model_name = "gpt2"
model = GPT2LMHeadModel.from_pretrained(model_name)
tokenizer = GPT2Tokenizer.from_pretrained(model_name)

# Eval mode
model.eval()

# Chatbot response generation
def gpt2_response(user_input):
    # Encode user input and add token
    input_ids = tokenizer.encode(
        user_input + tokenizer.eos_token,
        return_tensors = 'pt')
    
    # Generate responses
    output = model.generate(
        input_ids, max_length = 100,
        temperature = 0.7,
        top_p = 0.9,
        pad_token_id = tokenizer.eos_token_id
    )

    # Put it into text
    response = tokenizer.decode(
        output[:,
               input_ids.shape[-1]:][0],
               skip_special_tokens = True
    )
    return response

@api_view(['POST'])
def chatbot_response(request):
    user_input = request.data.get("message")
    if user_input:
        response = gpt2_response(user_input)
        return Response({"response": response})
    return Response({"error": "No message provided"}, status=400)