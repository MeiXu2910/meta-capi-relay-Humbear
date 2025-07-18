import fetch from 'node-fetch';
import crypto from 'crypto';

// Hash function for SHA256
function hashSHA256(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract body values
  const {
    em,
    ph,
    fn,
    ln,
    fbc,
    fbp,
    event_name,
    event_time,
    event_source_url,
    action_source,
  } = req.body.customData || {};

  // Meta Pixel ID and Token
  const pixel_id = '1453717848975586';
  const access_token = 'EAAUQrscohwYBO3KfUYftAXthoAWSh2xur5y5MvK3LXcGCEwhJfrmDjmlmUTijmSdMQSa00tewd363ZCdTFZA47Sl8kzpPrlOsCZAHr4tsXba87gq62of0cQ6ZAJIRtUP8QxWCMg8cJ667enKMbVqhqChNgZCNH5EZBmkjzPdwNADhQv1md40wEFiCB5r8ZCqKWHTwZDZD';

  // Validate required fields
  if (!event_name) {
    return res.status(400).json({ error: 'Missing required field: event_name' });
  }

  // Automatically extract IP and User Agent
  const client_ip_address = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress;
  const client_user_agent = req.headers['user-agent'];

  // Construct user_data object
  const user_data = {};
  if (em) user_data.em = [hashSHA256(em)];
  if (ph) user_data.ph = [hashSHA256(ph)];
  if (fn) user_data.fn = [hashSHA256(fn)];
  if (ln) user_data.ln = [hashSHA256(ln)];
  if (fbc) user_data.fbc = fbc;
  if (fbp) user_data.fbp = fbp;
  if (client_ip_address) user_data.client_ip_address = client_ip_address;
  if (client_user_agent) user_data.client_user_agent = client_user_agent;

  if (Object.keys(user_data).length === 0) {
    return res.status(400).json({
      error: 'Missing valid user data. Please provide at least one identifier such as email, phone, fbc, or fbp.',
    });
  }

  // Final payload
  const payload = {
    data: [
      {
        event_name,
        event_time: parseInt(event_time || Date.now() / 1000),
        event_source_url,
        action_source: action_source || 'website',
        user_data,
      },
    ],
  };

  // Send to Meta CAPI
  const url = `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`;

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
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}



