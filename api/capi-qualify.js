// /api/capi-qualify.js  —— Data Set 版本 (HIPAA 安全)
import crypto from 'crypto';

function hashSHA256(value) {
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body?.customData || req.body || {};

  const {
    em, ph, fn, ln,
    fbc, fbp,
    event_name,
    event_time,
    event_source_url,
    action_source,
    lead_id,
    custom_data,
    test_event_code
  } = body;

  // 从请求头获取 IP 和 UA（可提升匹配率）
  const client_ip_address =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    '';
  const client_user_agent = req.headers['user-agent'] || '';

  if (!event_name) {
    return res.status(400).json({ error: 'Missing required field: event_name' });
  }

  // ✅ 用 Data Set，而不是 Pixel
  const dataset_id   = process.env.META_DATASET_ID;
  const access_token = process.env.META_ACCESS_TOKEN;

  if (!dataset_id || !access_token) {
    return res.status(500).json({
      error: 'Server config error: META_DATASET_ID or META_ACCESS_TOKEN is missing'
    });
  }

  // ✅ Data Set 的 Endpoint
  const url = `https://graph.facebook.com/v19.0/${dataset_id}/events?access_token=${access_token}`;

  const user_data = {};
  if (em) user_data.em = [hashSHA256(em)];
  if (ph) user_data.ph = [hashSHA256(ph)];
  if (fn) user_data.fn = [hashSHA256(fn)];
  if (ln) user_data.ln = [hashSHA256(ln)];
  if (fbc) user_data.fbc = fbc;
  if (fbp) user_data.fbp = fbp;
  if (client_ip_address) user_data.client_ip_address = client_ip_address;
  if (client_user_agent) user_data.client_user_agent = client_user_agent;

  if (Object.keys(user_data).length === 0 && !lead_id) {
    return res.status(400).json({
      error: 'Missing identifiers. Provide at least one of email/phone/fbc/fbp or a lead_id.'
    });
  }

  const event = {
    event_name,
    event_time: parseInt(event_time || Date.now() / 1000, 10),
    action_source: action_source || 'website',
    user_data
  };

  if (event_source_url) event.event_source_url = event_source_url;
  if (lead_id) event.lead_id = lead_id;
  if (custom_data && typeof custom_data === 'object') {
    event.custom_data = custom_data;
  }

  const payload = { data: [event] };
  if (test_event_code) payload.test_event_code = test_event_code;

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

