import fetch from 'node-fetch';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    email,
    phone,
    event_name,
    event_time,
    event_source_url,
    action_source,
  } = req.body;

  const hash = (data) =>
    crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');

  const pixel_id = '1453717848975586';
  const access_token = 'YOUR_ACCESS_TOKEN';
  const url = `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`;

  const payload = {
    data: [
      {
        event_name,
        event_time,
        event_source_url,
        action_source,
        user_data: {
          em: hash(email),
          ph: hash(phone),
        },
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

