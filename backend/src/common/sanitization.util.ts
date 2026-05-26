import { BadRequestException } from '@nestjs/common';

/**
 * SQL Injection Prevention Utilities
 * Provides sanitization and validation for database inputs
 */

/**
 * Whitelist validator for SQL identifiers (column names, table names)
 * Only allows alphanumeric characters and underscores
 */
export function validateSqlIdentifier(
  identifier: string,
  allowedValues?: string[],
): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new BadRequestException('Invalid SQL identifier');
  }

  // If allowedValues is provided, use strict whitelist
  if (allowedValues) {
    if (!allowedValues.includes(identifier)) {
      throw new BadRequestException(
        `Invalid identifier. Allowed values: ${allowedValues.join(', ')}`,
      );
    }
    return identifier;
  }

  // Otherwise, validate format (alphanumeric and underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new BadRequestException(
      'SQL identifier contains invalid characters. Only alphanumeric and underscore allowed',
    );
  }

  if (identifier.length > 128) {
    throw new BadRequestException('SQL identifier is too long');
  }

  return identifier;
}

/**
 * Escape dangerous characters in strings for SQL LIKE queries
 * This should be used in conjunction with parameterized queries
 */
export function escapeLikePattern(pattern: string): string {
  if (!pattern || typeof pattern !== 'string') {
    return '';
  }

  // Escape special characters: %, _, \
  return pattern.replace(/[\\%_]/g, '\\$&');
}

/**
 * Validate and sanitize search input
 * Prevents excessive length and filters dangerous characters
 */
export function validateSearchInput(
  input: string,
  maxLength: number = 255,
): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Check length
  if (sanitized.length > maxLength) {
    throw new BadRequestException(
      `Search input exceeds maximum length of ${maxLength} characters`,
    );
  }

  // Remove null bytes
  if (sanitized.includes('\0')) {
    throw new BadRequestException('Search input contains invalid characters');
  }

  // Check for suspicious patterns (basic SQL keywords)
  const suspiciousPatterns = ['--', '/*', '*/', 'xp_', 'sp_'];
  const lowerSanitized = sanitized.toLowerCase();

  for (const pattern of suspiciousPatterns) {
    if (lowerSanitized.includes(pattern)) {
      throw new BadRequestException('Search input contains suspicious patterns');
    }
  }

  return sanitized;
}

/**
 * Validate numeric ID to prevent injection attacks
 */
export function validateNumericId(id: any): number {
  const numId = Number(id);

  if (!Number.isInteger(numId) || numId <= 0) {
    throw new BadRequestException('Invalid numeric identifier');
  }

  return numId;
}

/**
 * NoSQL Injection prevention: validate object keys
 * Ensures no $ or . characters in keys (MongoDB operators)
 */
export function validateObjectKeys(obj: any): boolean {
  if (obj === null || obj === undefined) {
    return true;
  }

  if (typeof obj !== 'object') {
    return true;
  }

  if (Array.isArray(obj)) {
    return obj.every((item) => validateObjectKeys(item));
  }

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Prevent MongoDB operators: $, etc.
      if (key.startsWith('$') || key.includes('.')) {
        throw new BadRequestException(
          `Invalid object key "${key}". Keys starting with $ or containing . are not allowed`,
        );
      }

      // Recursively validate nested objects
      if (!validateObjectKeys(obj[key])) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Rate limit string input to prevent ReDoS (Regular Expression Denial of Service)
 */
export function validateRegexPattern(pattern: string, maxLength: number = 100): string {
  if (!pattern || typeof pattern !== 'string') {
    return '';
  }

  if (pattern.length > maxLength) {
    throw new BadRequestException(
      `Regex pattern exceeds maximum length of ${maxLength} characters`,
    );
  }

  // Detect potential ReDoS patterns (nested quantifiers)
  const redosPatterns = [/\(\w*\*\)+/, /\(\w*\+\)+/, /\(.*\{.*\}\)+/];

  for (const redosPattern of redosPatterns) {
    if (redosPattern.test(pattern)) {
      throw new BadRequestException(
        'Regex pattern contains potentially dangerous nested quantifiers',
      );
    }
  }

  return pattern;
}
