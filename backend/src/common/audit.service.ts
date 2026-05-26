import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface AuditLog {
  timestamp?: string;
  event: string; // 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'PASSWORD_CHANGE' | 'LOGOUT' | 'BLOCKED_ATTEMPT' | 'ACCESS_DENIED'
  userId?: number;
  email?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details?: string;
  retryAfterSeconds?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly auditLogFile = path.join(this.logsDir, 'audit.log');

  constructor() {
    this.ensureLogsDirectory();
  }

  private ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  log(auditLog: AuditLog) {
    const entry = {
      ...auditLog,
      timestamp: new Date().toISOString(),
    };

    // Log to console (for development)
    this.logger.log(`[${entry.event}] ${entry.email || entry.userId || 'UNKNOWN'} from ${entry.ip}`);

    // Log to file (JSON for easy parsing)
    this.writeToFile(entry);
  }

  private writeToFile(entry: AuditLog) {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditLogFile, logLine, 'utf8');
  }

  // Specific audit events
  logLoginSuccess(email: string, userId: number, ip: string, userAgent?: string) {
    this.log({
      event: 'LOGIN_SUCCESS',
      email,
      userId,
      ip,
      userAgent,
      endpoint: '/auth/login',
      details: 'User logged in successfully',
    });
  }

  logLoginFailure(email: string, ip: string, userAgent?: string, reason: string = 'Invalid credentials') {
    this.log({
      event: 'LOGIN_FAILURE',
      email,
      ip,
      userAgent,
      endpoint: '/auth/login',
      details: reason,
    });
  }

  logLoginBlocked(email: string, ip: string, userAgent?: string, retryAfterSeconds?: number) {
    this.log({
      event: 'LOGIN_BLOCKED',
      email,
      ip,
      userAgent,
      endpoint: '/auth/login',
      details: 'Login attempt blocked due to rate limit',
      retryAfterSeconds,
    });
  }

  logPasswordChangeSuccess(userId: number, email: string, ip: string, userAgent?: string) {
    this.log({
      event: 'PASSWORD_CHANGE_SUCCESS',
      userId,
      email,
      ip,
      userAgent,
      endpoint: '/auth/change-password',
      details: 'Password changed successfully',
    });
  }

  logPasswordChangeFailure(userId: number, email: string, ip: string, userAgent?: string, reason: string = 'Invalid old password') {
    this.log({
      event: 'PASSWORD_CHANGE_FAILURE',
      userId,
      email,
      ip,
      userAgent,
      endpoint: '/auth/change-password',
      details: reason,
    });
  }

  logPasswordChangeBlocked(userId: number, email: string, ip: string, userAgent?: string, retryAfterSeconds?: number) {
    this.log({
      event: 'PASSWORD_CHANGE_BLOCKED',
      userId,
      email,
      ip,
      userAgent,
      endpoint: '/auth/change-password',
      details: 'Password change blocked due to rate limit',
      retryAfterSeconds,
    });
  }

  logLogout(userId: number, email: string, ip: string, userAgent?: string) {
    this.log({
      event: 'LOGOUT',
      userId,
      email,
      ip,
      userAgent,
      endpoint: '/auth/logout',
      details: 'User logged out',
    });
  }

  logAccessDenied(email: string | number | undefined, ip: string, endpoint: string, userAgent?: string) {
    this.log({
      event: 'ACCESS_DENIED',
      email: typeof email === 'string' ? email : undefined,
      userId: typeof email === 'number' ? email : undefined,
      ip,
      userAgent,
      endpoint,
      details: 'Access denied (401/403)',
    });
  }

  logForgotPassword(email: string, ip: string, userAgent?: string) {
    this.log({
      event: 'FORGOT_PASSWORD_REQUESTED',
      email,
      ip,
      userAgent,
      endpoint: '/auth/forgot-password',
      details: 'Password reset link requested',
    });
  }

  logRegister(email: string, ip: string, userAgent?: string) {
    this.log({
      event: 'USER_REGISTERED',
      email,
      ip,
      userAgent,
      endpoint: '/auth/register',
      details: 'New user registration',
    });
  }
}
