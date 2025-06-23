export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body;

  console.log('Received from GHL:', body);

  // 未来我们将在这里调用 Meta API

  return res.status(200).json({ message: 'Received successfully!' });
}
