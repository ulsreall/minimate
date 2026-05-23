export default function handler(req, res) {
  // Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['GET', 'HEAD']
    });
  }

  // Health check response
  res.status(200).json({
    status: 'ok',
    service: 'MiniMate',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
