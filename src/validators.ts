import type { ValidationRule } from './types';

/**
 * Creates a "required" validation rule.
 * Fails if the value is empty, null, undefined, or a whitespace-only string.
 *
 * @param message - Custom error message
 */
export function required(message: string = 'This field is required'): ValidationRule {
  return {
    name: 'required',
    message,
    validate: (value: unknown) => {
      if (value === null || value === undefined) return message;
      if (typeof value === 'string' && value.trim() === '') return message;
      if (typeof value === 'boolean' && !value) return message;
      if (Array.isArray(value) && value.length === 0) return message;
      return null;
    },
  };
}

/**
 * Creates a "minLength" validation rule for strings.
 *
 * @param min - Minimum number of characters
 * @param message - Custom error message
 */
export function minLength(min: number, message?: string): ValidationRule {
  const defaultMsg = `Must be at least ${min} characters`;
  return {
    name: 'minLength',
    message: message ?? defaultMsg,
    validate: (value: unknown) => {
      if (typeof value !== 'string') return null; // Skip non-strings
      if (value.length > 0 && value.length < min) return message ?? defaultMsg;
      return null;
    },
  };
}

/**
 * Creates a "maxLength" validation rule for strings.
 *
 * @param max - Maximum number of characters
 * @param message - Custom error message
 */
export function maxLength(max: number, message?: string): ValidationRule {
  const defaultMsg = `Must be at most ${max} characters`;
  return {
    name: 'maxLength',
    message: message ?? defaultMsg,
    validate: (value: unknown) => {
      if (typeof value !== 'string') return null;
      if (value.length > max) return message ?? defaultMsg;
      return null;
    },
  };
}

/**
 * Creates a "pattern" validation rule that tests a value against a regex.
 *
 * @param regex - The regular expression to test
 * @param message - Custom error message
 */
export function pattern(regex: RegExp, message: string = 'Invalid format'): ValidationRule {
  return {
    name: 'pattern',
    message,
    validate: (value: unknown) => {
      if (typeof value !== 'string' || value === '') return null;
      if (!regex.test(value)) return message;
      return null;
    },
  };
}

/**
 * Creates an "email" validation rule.
 * Uses a practical regex that covers most valid email addresses.
 *
 * @param message - Custom error message
 */
export function email(message: string = 'Please enter a valid email address'): ValidationRule {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return {
    name: 'email',
    message,
    validate: (value: unknown) => {
      if (typeof value !== 'string' || value === '') return null;
      if (!emailRegex.test(value)) return message;
      return null;
    },
  };
}

/**
 * Creates a "min" validation rule for numeric values.
 *
 * @param minValue - Minimum allowed value
 * @param message - Custom error message
 */
export function min(minValue: number, message?: string): ValidationRule {
  const defaultMsg = `Must be at least ${minValue}`;
  return {
    name: 'min',
    message: message ?? defaultMsg,
    validate: (value: unknown) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) return null;
      if (num < minValue) return message ?? defaultMsg;
      return null;
    },
  };
}

/**
 * Creates a "max" validation rule for numeric values.
 *
 * @param maxValue - Maximum allowed value
 * @param message - Custom error message
 */
export function max(maxValue: number, message?: string): ValidationRule {
  const defaultMsg = `Must be at most ${maxValue}`;
  return {
    name: 'max',
    message: message ?? defaultMsg,
    validate: (value: unknown) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof num !== 'number' || isNaN(num)) return null;
      if (num > maxValue) return message ?? defaultMsg;
      return null;
    },
  };
}

/**
 * Creates a custom validation rule with your own logic.
 *
 * @param name - A unique name for this validator
 * @param validateFn - The validation function
 * @param message - Fallback error message
 */
export function custom(
  name: string,
  validateFn: (value: unknown, formValues: Record<string, unknown>) => string | null | undefined,
  message?: string
): ValidationRule {
  return {
    name,
    message,
    validate: validateFn,
  };
}

/**
 * Creates a "matches" rule that ensures two fields have the same value.
 * Useful for password confirmation fields.
 *
 * @param fieldName - The name of the field to match against
 * @param message - Custom error message
 */
export function matches(fieldName: string, message?: string): ValidationRule {
  const defaultMsg = `Must match ${fieldName}`;
  return {
    name: 'matches',
    message: message ?? defaultMsg,
    validate: (value: unknown, formValues: Record<string, unknown>) => {
      const otherValue = formValues[fieldName];
      if (value !== otherValue) return message ?? defaultMsg;
      return null;
    },
  };
}

/**
 * Creates a "url" validation rule.
 *
 * @param message - Custom error message
 */
export function url(message: string = 'Please enter a valid URL'): ValidationRule {
  return {
    name: 'url',
    message,
    validate: (value: unknown) => {
      if (typeof value !== 'string' || value === '') return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    },
  };
}

/**
 * Creates a "oneOf" rule that checks if the value is in an allowed list.
 *
 * @param allowedValues - Array of allowed values
 * @param message - Custom error message
 */
export function oneOf(allowedValues: unknown[], message?: string): ValidationRule {
  const defaultMsg = `Must be one of: ${allowedValues.join(', ')}`;
  return {
    name: 'oneOf',
    message: message ?? defaultMsg,
    validate: (value: unknown) => {
      if (value === '' || value === null || value === undefined) return null;
      if (!allowedValues.includes(value)) return message ?? defaultMsg;
      return null;
    },
  };
}
