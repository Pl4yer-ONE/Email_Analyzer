import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { headers } = req.body;

  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        prompt: `Analyze these email headers for security risks. Format response in markdown:\n\n${JSON.stringify(headers)}`,
        stream: false,
      }),
    });

    const analysis = await ollamaResponse.json();
    res.status(200).json({ analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze headers' });
  }
} 