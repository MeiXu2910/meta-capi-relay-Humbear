import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    em,
    ph,
    event_name,
    event_time,
    event_source_url,
    action_source,
  } = req.body;

  const pixel_id = '1453717848975586';
  const access_token = 'EAAUQrscohwYBO3KfUYftAXthoAWSh2xur5y5MvK3LXcGCEwhJfrmDjmlmUTijmSdMQSa00tewd363ZCdTFZA47Sl8kzpPrlOsCZAHr4tsXba87gq62of0cQ6ZAJIRtUP8QxWCMg8cJ667enKMbVqhqChNgZCNH5EZBmkjzPdwNADhQv1md40wEFiCB5r8ZCqKWHTwZDZD';
  const url = `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`;

  const payload = {
    data: [
      {
        event_name,
        event_time,
        event_source_url,
        action_source,
        user_data: {
          em: [em],
          ph: [ph],
        },
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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


