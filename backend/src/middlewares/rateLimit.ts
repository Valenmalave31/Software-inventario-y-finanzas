import { Request, Response, NextFunction } from 'express';

type Entry = { count: number; firstRequest: number; blockedUntil?: number };

export const createRateLimiter = ({ windowMs = 60_000, max = 5, blockDurationMs = 15 * 60_000 } = {}) => {
  const hits = new Map<string, Entry>();

  // Periodic cleanup to avoid memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of hits.entries()) {
      if (val.blockedUntil && val.blockedUntil < now) {
        hits.delete(key);
      } else if (!val.blockedUntil && now - val.firstRequest > windowMs) {
        hits.delete(key);
      }
    }
  }, Math.max(10_000, windowMs));

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.connection.remoteAddress || 'unknown').toString();
    const key = ip;
    const now = Date.now();
    const entry = hits.get(key);

    if (entry && entry.blockedUntil && entry.blockedUntil > now) {
      const remainingSec = Math.ceil((entry.blockedUntil - now) / 1000);
      const human = remainingSec < 60
        ? `${remainingSec} segundos`
        : (remainingSec % 60 === 0
          ? `${Math.floor(remainingSec / 60)} minutos`
          : `${Math.floor(remainingSec / 60)} minutos ${remainingSec % 60} segundos`);
      res.setHeader('Retry-After', String(remainingSec));
      res.status(429).json({ mensaje: `No se permiten más intentos hasta dentro de ${human}.`, retryAfterSeconds: remainingSec, retryAfterHuman: human, blockedUntil: entry.blockedUntil });
      return;
    }

    if (!entry) {
      hits.set(key, { count: 1, firstRequest: now });
      return next();
    }

    if (!entry.blockedUntil) {
      if (now - entry.firstRequest <= windowMs) {
        entry.count++;
        if (entry.count > max) {
          entry.blockedUntil = now + blockDurationMs;
          hits.set(key, entry);
          const remainingSec = Math.ceil(blockDurationMs / 1000);
          const human = remainingSec < 60
            ? `${remainingSec} segundos`
            : (remainingSec % 60 === 0
              ? `${Math.floor(remainingSec / 60)} minutos`
              : `${Math.floor(remainingSec / 60)} minutos ${remainingSec % 60} segundos`);
          res.setHeader('Retry-After', String(remainingSec));
          res.status(429).json({ mensaje: `No se permiten más intentos hasta dentro de ${human}.`, retryAfterSeconds: remainingSec, retryAfterHuman: human, blockedUntil: entry.blockedUntil });
          return;
        }
        hits.set(key, entry);
        return next();
      } else {
        // reset window
        hits.set(key, { count: 1, firstRequest: now });
        return next();
      }
    }

    // blockedUntil existed but <= now was handled at top; fallback
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      hits.delete(key);
      hits.set(key, { count: 1, firstRequest: now });
      return next();
    }

    res.status(429).json({ mensaje: 'Demasiadas solicitudes. Intenta más tarde.' });
  };
};
