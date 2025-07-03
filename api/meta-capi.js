import fetch from 'node-fetch';
import crypto from 'crypto';

function hashSHA256(value) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export default async function handler(req, res) {
  // ✅ 打印请求体和请求头
  console.log("📥 Incoming Request Body:", req.body);
  console.log("📥 Headers:", req.headers);

  // ✅ 只接受 POST 方法
  if (req.method !== 'POST') {
    console.error("❌ Method not allowed");
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ 校验 customData 是否存在
  if (!req.body || !req.body.customData) {
    console.error("❌ Missing customData in request body");
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
  } = req.body.customData;

  // ✅ 校验必要字段
  if (!event_name) {
    console.error("❌ Missing required field: event_name");
    return res.status(400).json({ error: "Missing required field: event_name" });
  }

  // ✅ 构造用户数据
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Meta API returned error:', result);
      return res.status(response.status).json({ error: result });
    }

    // ✅ 成功响应
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('❌ Error in meta-capi relay:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}




