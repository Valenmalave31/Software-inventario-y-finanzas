/**
 * Frontend Input Sanitization Utilities
 * Prevents SQL/NoSQL injection and XSS attacks at the client-side
 */

/**
 * Detecta patrones sospechosos de inyección SQL
 */
export function detectSQLInjectionPattern(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const suspiciousPatterns = [
    /(['"`])\s*(;|OR|AND|UNION|SELECT|DROP|INSERT|UPDATE|DELETE|CREATE|ALTER|EXEC|EXECUTE|SCRIPT)\b/gi,
    /--\s*$/,
    /\/\*.*?\*\//,
    /xp_|sp_/gi,
    /(\bOR\b.*=.*|\bAND\b.*=.*)/gi,
    /(%27)|(\')|(%23)|(#)/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detecta patrones sospechosos de inyección NoSQL (MongoDB)
 */
export function detectNoSQLInjectionPattern(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  const suspiciousPatterns = [
    /\$\w+/g, // MongoDB operators: $ne, $gt, $lt, etc
    /\{\s*["']?\$/, // {$operator
    /[.]\w+\s*:/g, // Dot notation: field.nested:
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitiza string removiendo/escapando caracteres peligrosos
 * Para uso en búsquedas LIKE
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Trim whitespace
  let sanitized = input.trim();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Escape special characters for LIKE queries
  sanitized = sanitized.replace(/[\\%_]/g, '\\$&');

  return sanitized;
}

/**
 * Sanitiza string removiendo caracteres HTML/script
 * Para uso en inputs de texto general
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove leading/trailing whitespace
  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove script tags and common XSS vectors
  sanitized = sanitized
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Valida número (previene NaN, Infinity, etc)
 */
export function sanitizeNumberInput(input: any): number | null {
  const num = Number(input);

  if (!Number.isFinite(num)) {
    return null;
  }

  return num;
}

/**
 * Valida email
 */
export function sanitizeEmailInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const sanitized = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Valida y sanitiza fecha
 */
export function sanitizeDateInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(input)) {
    return null;
  }

  // Verify it's a valid date
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    return null;
  }

  return input;
}

/**
 * Valida y sanitiza URL
 */
export function sanitizeUrlInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  try {
    const url = new URL(input);
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Valida que el input sea de uno de los valores permitidos (whitelist)
 */
export function validateEnum<T extends string>(
  input: string,
  allowedValues: T[],
): T | null {
  if (!input || typeof input !== 'string') return null;

  const sanitized = input.trim();

  if (allowedValues.includes(sanitized as T)) {
    return sanitized as T;
  }

  return null;
}

/**
 * Comprueba que el input no exceda la longitud máxima
 */
export function validateMaxLength(input: string, maxLength: number): boolean {
  if (!input || typeof input !== 'string') return true;

  return input.length <= maxLength;
}

/**
 * Comprueba que el input tenga la longitud mínima
 */
export function validateMinLength(input: string, minLength: number): boolean {
  if (!input || typeof input !== 'string') return false;

  return input.length >= minLength;
}

/**
 * Validador genérico que ejecuta múltiples checks
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string | number | null;
}

export function validateInput(
  input: any,
  rules: {
    type?: 'text' | 'email' | 'number' | 'date' | 'url' | 'enum';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
    checkInjection?: boolean;
  },
): ValidationResult {
  // Check if required
  if (rules.required && (!input || (typeof input === 'string' && input.trim() === ''))) {
    return { isValid: false, error: 'Este campo es requerido' };
  }

  if (!input) {
    return { isValid: true, sanitized: null };
  }

  // Check for injection patterns
  if (rules.checkInjection === true && typeof input === 'string') {
    if (detectSQLInjectionPattern(input) || detectNoSQLInjectionPattern(input)) {
      return {
        isValid: false,
        error: 'La entrada contiene caracteres no permitidos. No se permite código SQL o scripts.',
      };
    }
  }

  // Type-specific validation
  switch (rules.type) {
    case 'email': {
      const email = sanitizeEmailInput(input);
      if (!email) {
        return { isValid: false, error: 'Email inválido' };
      }
      return { isValid: true, sanitized: email };
    }

    case 'number': {
      const num = sanitizeNumberInput(input);
      if (num === null) {
        return { isValid: false, error: 'Debe ser un número válido' };
      }
      return { isValid: true, sanitized: num };
    }

    case 'date': {
      const date = sanitizeDateInput(input);
      if (!date) {
        return { isValid: false, error: 'Fecha inválida (formato: YYYY-MM-DD)' };
      }
      return { isValid: true, sanitized: date };
    }

    case 'url': {
      const url = sanitizeUrlInput(input);
      if (!url) {
        return { isValid: false, error: 'URL inválida' };
      }
      return { isValid: true, sanitized: url };
    }

    case 'enum': {
      if (!rules.enum || !Array.isArray(rules.enum)) {
        return { isValid: false, error: 'Configuración de validación incorrecta' };
      }
      const enumValue = validateEnum(input, rules.enum as any);
      if (!enumValue) {
        return {
          isValid: false,
          error: `Debe ser uno de: ${rules.enum.join(', ')}`,
        };
      }
      return { isValid: true, sanitized: enumValue };
    }

    default: {
      // Text validation (default)
      const sanitized = sanitizeTextInput(input);

      // Check length limits
      if (rules.minLength && !validateMinLength(sanitized, rules.minLength)) {
        return {
          isValid: false,
          error: `Debe tener al menos ${rules.minLength} caracteres`,
        };
      }

      if (rules.maxLength && !validateMaxLength(sanitized, rules.maxLength)) {
        return {
          isValid: false,
          error: `No puede exceder ${rules.maxLength} caracteres`,
        };
      }

      // Check pattern
      if (rules.pattern && !rules.pattern.test(sanitized)) {
        return {
          isValid: false,
          error: 'Formato inválido',
        };
      }

      return { isValid: true, sanitized };
    }
  }
}
