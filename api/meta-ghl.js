import fetch from 'node-fetch';
import crypto from 'crypto';
import getRawBody from 'raw-body';

function hashSHA256(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log("📥 GHL Headers:", req.headers);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    const rawBody = await getRawBody(req);
    body = JSON.parse(rawBody.toString('utf8'));
    console.log("📥 GHL Parsed Body:", body);
  } catch (err) {
    console.error("❌ GHL JSON Parse Error:", err.message);
    return res.status(400).json({ "CAPI Status": "Failed", error: 'Invalid JSON' }); // ✅ 改1
  }

  const {
    em,
    ph,
    fbp,
    fbc,
    event_name,
    event_time,
    event_source_url,
    action_source,
  } = body.customData || body || {};
  if (!event_name) {
    return res.status(400).json({ "CAPI Status": "Failed", error: 'Missing required field: event_name' }); // ✅ 改2
  }

  const user_data = {};
  if (em) user_data.em = [hashSHA256(em)];
  if (ph) user_data.ph = [hashSHA256(ph)];
  if (fbp) user_data.fbp = [fbp];
  if (fbc) user_data.fbc = [fbc];

  const pixel_id = '1453717848975586';
  const access_token = 'EAAUQrscohwYBO3KfUYftAXthoAWSh2xur5y5MvK3LXcGCEwhJfrmDjmlmUTijmSdMQSa00tewd363ZCdTFZA47Sl8kzpPrlOsCZAHr4tsXba87gq62of0cQ6ZAJIRtUP8QxWCMg8cJ667enKMbVqhqChNgZCNH5EZBmkjzPdwNADhQv1md40wEFiCB5r8ZCqKWHTwZDZD';
  const url = `https://graph.facebook.com/v19.0/${pixel_id}/events?access_token=${access_token}`;

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

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ "CAPI Status": "Failed", error: result }); // ✅ 改3
    }

    return res.status(200).json({ "CAPI Status": "Success", result }); // ✅ 改4
  } catch (err) {
    console.error("❌ GHL Relay Error:", err);
    return res.status(500).json({ "CAPI Status": "Failed", error: 'Internal Server Error', detail: err.message }); // ✅ 改5
  }
}
