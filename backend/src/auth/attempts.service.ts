import { Injectable } from '@nestjs/common';

type Entry = { count: number; firstAttempt: number; blockedUntil?: number };

@Injectable()
export class AttemptsService {
  private attempts = new Map<string, Entry>();
  private readonly windowMs = 60_000;
  private readonly maxAttempts = 5;
  private readonly blockDurationMs = 15 * 60_000;

  constructor() {
    // Periodic cleanup of expired windows and blocks.
    setInterval(() => this.cleanup(), Math.max(10_000, this.windowMs));
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, val] of this.attempts.entries()) {
      if (val.blockedUntil && val.blockedUntil < now) {
        this.attempts.delete(key);
      } else if (!val.blockedUntil && now - val.firstAttempt > this.windowMs) {
        this.attempts.delete(key);
      }
    }
  }

  isBlocked(key: string) {
    const entry = this.attempts.get(key);
    if (!entry || !entry.blockedUntil) return false;
    return entry.blockedUntil > Date.now();
  }

  getRemainingSeconds(key: string) {
    const entry = this.attempts.get(key);
    if (!entry || !entry.blockedUntil) return 0;
    return Math.max(0, Math.ceil((entry.blockedUntil - Date.now()) / 1000));
  }

  recordFailure(key: string) {
    const now = Date.now();
    const entry = this.attempts.get(key);
    if (!entry) {
      this.attempts.set(key, { count: 1, firstAttempt: now });
      return;
    }

    if (entry.blockedUntil && entry.blockedUntil > now) return;

    if (now - entry.firstAttempt <= this.windowMs) {
      entry.count++;
      if (entry.count > this.maxAttempts) {
        entry.blockedUntil = now + this.blockDurationMs;
      }
      this.attempts.set(key, entry);
      return;
    }

    this.attempts.set(key, { count: 1, firstAttempt: now });
  }

  reset(key: string) {
    this.attempts.delete(key);
  }
}
