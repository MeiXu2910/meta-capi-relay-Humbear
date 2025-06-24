import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, phone, event_name, event_time, event_source_url, action_source } = req.body;

  const payload = {
    data: [
      {
        event_name,
        event_time,
        event_source_url,
        action_source,
        user_data: {
          em: email,
          ph: phone,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/<1453717848975586>/events?access_token=<EAAUQrscohwYBO3KfUYftAXthoAWSh2xur5y5MvK3LXcGCEwhJfrmDjmlmUTijmSdMQSa00tewd363ZCdTFZA47Sl8kzpPrlOsCZAHr4tsXba87gq62of0cQ6ZAJIRtUP8QxWCMg8cJ667enKMbVqhqChNgZCNH5EZBmkjzPdwNADhQv1md40wEFiCB5r8ZCqKWHTwZDZD>`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Facebook API error', details: result });
    }

    return res.status(200).json({ message: 'Event sent to Meta', result });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error });
  }
}


