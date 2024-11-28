import React from 'react'
import { OpenAI } from 'openai';

const chatgpt = () => {

  // Initialize OpenAI API client
  const openai = new OpenAI({
    apiKey: process.env.REACT_API_KEY,
    dangerouslyAllowBrowser: true
  });

  useEffect(() => {
    // Define an async function inside useEffect to handle async logic
    const fetchHaiku = async () => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Use the correct model name
          messages: [
            { "role": "user", "content": "Write a haiku about AI" }
          ]
        });

        // Handle the completion result
        console.log(completion.choices[0].message.content);
      } catch (error) {
        console.error("Error fetching from OpenAI:", error);
      }
    };

    // Call the function to fetch the haiku
    fetchHaiku();
  }, []);
  return (
    <div>chatgpt</div>
  )
}

export default chatgpt