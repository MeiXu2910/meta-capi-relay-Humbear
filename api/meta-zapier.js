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
  console.log("📥 Headers:", req.headers);

  if (req.method !== 'POST') {
    console.error("❌ Method not allowed");
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body;
  try {
    const rawBody = await getRawBody(req);
    body = JSON.parse(rawBody.toString('utf8'));
    console.log("📥 Parsed Body:", body);
  } catch (err) {
    console.error("❌ Failed to parse JSON:", err.message);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (!body || !body.customData) {
    console.error("❌ Missing customData in body");
    return res.status(400).json({ error: "Missing customData in request body" });
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
  } = body.customData;

  if (!event_name) {
    console.error("❌ Missing event_name");
    return res.status(400).json({ error: "Missing required field: event_name" });
  }

  const user_data = {};
  if (em) user_data.em = [hashSHA256(em)];
  if (ph) user_data.ph = [hashSHA256(ph)];
  if (fbp) user_data.fbp = [fbp];
  if (fbc) user_data.fbc = [fbc];

  const pixel_id = '1453717848975586';
  const access_token = 'EAAUQrs...'; // 建议用环境变量隐藏
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
      console.error("❌ Facebook error:", result);
      return res.status(response.status).json({ error: result });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}





