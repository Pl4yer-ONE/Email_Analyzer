import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { message, history } = req.body;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          ...history,
          {
            role: 'user',
            content: `${message} - Analyze email headers and answer security questions`
          }
        ],
        stream: false
      }),
    });

    const data = await response.json();
    res.status(200).json({ response: data.message.content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
} 