import { Request } from 'express';

export function getClientIp(req: Request): string {
  // Check for IP from proxy
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for IP from CF-Connecting-IP (Cloudflare)
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string') {
    return cfIp;
  }

  // Check for IP from X-Real-IP
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }

  // Fall back to socket remote address
  return req.socket.remoteAddress || 'UNKNOWN';
}
