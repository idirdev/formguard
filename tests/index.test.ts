import { describe, it, expect } from 'vitest';
import {
  required,
  minLength,
  maxLength,
  pattern,
  email,
  min,
  max,
  custom,
  matches,
  url,
  oneOf,
} from '../src/validators';
import {
  validateField,
  validateForm,
  getNestedValue,
  setNestedValue,
  deepEqual,
  buildInitialValues,
  createFieldMap,
} from '../src/utils';
import type { FieldConfig, ValidationRule } from '../src/types';

// ─── Validators ───

describe('required', () => {
  const rule = required();

  it('should fail for null', () => {
    expect(rule.validate(null, {})).toBe('This field is required');
  });

  it('should fail for undefined', () => {
    expect(rule.validate(undefined, {})).toBe('This field is required');
  });

  it('should fail for empty string', () => {
    expect(rule.validate('', {})).toBe('This field is required');
  });

  it('should fail for whitespace-only string', () => {
    expect(rule.validate('   ', {})).toBe('This field is required');
  });

  it('should fail for empty array', () => {
    expect(rule.validate([], {})).toBe('This field is required');
  });

  it('should pass for non-empty string', () => {
    expect(rule.validate('hello', {})).toBeNull();
  });

  it('should pass for a number', () => {
    expect(rule.validate(42, {})).toBeNull();
  });

  it('should support custom error message', () => {
    const customRule = required('Name is mandatory');
    expect(customRule.validate('', {})).toBe('Name is mandatory');
  });
});

describe('minLength', () => {
  const rule = minLength(3);

  it('should pass when string meets minimum', () => {
    expect(rule.validate('abc', {})).toBeNull();
  });

  it('should fail when string is too short', () => {
    expect(rule.validate('ab', {})).toBe('Must be at least 3 characters');
  });

  it('should skip non-string values', () => {
    expect(rule.validate(42, {})).toBeNull();
  });

  it('should skip empty strings (let required handle that)', () => {
    expect(rule.validate('', {})).toBeNull();
  });
});

describe('maxLength', () => {
  const rule = maxLength(5);

  it('should pass when within limit', () => {
    expect(rule.validate('hello', {})).toBeNull();
  });

  it('should fail when exceeding limit', () => {
    expect(rule.validate('toolong', {})).toBe('Must be at most 5 characters');
  });
});

describe('pattern', () => {
  const rule = pattern(/^\d+$/, 'Numbers only');

  it('should pass for matching string', () => {
    expect(rule.validate('12345', {})).toBeNull();
  });

  it('should fail for non-matching string', () => {
    expect(rule.validate('abc', {})).toBe('Numbers only');
  });

  it('should skip empty strings', () => {
    expect(rule.validate('', {})).toBeNull();
  });
});

describe('email', () => {
  const rule = email();

  it('should pass for valid email', () => {
    expect(rule.validate('user@example.com', {})).toBeNull();
  });

  it('should fail for invalid email', () => {
    expect(rule.validate('not-an-email', {})).toBe('Please enter a valid email address');
  });

  it('should skip empty string', () => {
    expect(rule.validate('', {})).toBeNull();
  });
});

describe('min', () => {
  const rule = min(10);

  it('should pass for number above minimum', () => {
    expect(rule.validate(15, {})).toBeNull();
  });

  it('should pass for number equal to minimum', () => {
    expect(rule.validate(10, {})).toBeNull();
  });

  it('should fail for number below minimum', () => {
    expect(rule.validate(5, {})).toBe('Must be at least 10');
  });

  it('should handle string numbers', () => {
    expect(rule.validate('15', {})).toBeNull();
    expect(rule.validate('5', {})).toBe('Must be at least 10');
  });
});

describe('max', () => {
  const rule = max(100);

  it('should pass for number within limit', () => {
    expect(rule.validate(50, {})).toBeNull();
  });

  it('should fail for number exceeding limit', () => {
    expect(rule.validate(150, {})).toBe('Must be at most 100');
  });
});

describe('custom', () => {
  it('should use a custom validation function', () => {
    const rule = custom('even', (value) => {
      if (typeof value === 'number' && value % 2 !== 0) return 'Must be even';
      return null;
    });

    expect(rule.validate(4, {})).toBeNull();
    expect(rule.validate(3, {})).toBe('Must be even');
  });
});

describe('matches', () => {
  const rule = matches('password', 'Passwords must match');

  it('should pass when fields match', () => {
    expect(rule.validate('secret', { password: 'secret' })).toBeNull();
  });

  it('should fail when fields differ', () => {
    expect(rule.validate('secret', { password: 'other' })).toBe('Passwords must match');
  });
});

describe('url', () => {
  const rule = url();

  it('should pass for valid URL', () => {
    expect(rule.validate('https://example.com', {})).toBeNull();
  });

  it('should fail for invalid URL', () => {
    expect(rule.validate('not-a-url', {})).toBe('Please enter a valid URL');
  });

  it('should skip empty string', () => {
    expect(rule.validate('', {})).toBeNull();
  });
});

describe('oneOf', () => {
  const rule = oneOf(['red', 'green', 'blue']);

  it('should pass for allowed value', () => {
    expect(rule.validate('red', {})).toBeNull();
  });

  it('should fail for disallowed value', () => {
    expect(rule.validate('purple', {})).toContain('Must be one of');
  });

  it('should skip empty values', () => {
    expect(rule.validate('', {})).toBeNull();
    expect(rule.validate(null, {})).toBeNull();
  });
});

// ─── Utils ───

describe('validateField', () => {
  it('should return undefined when no validations configured', () => {
    const config: FieldConfig = { name: 'test' };
    expect(validateField('anything', config, {})).toBeUndefined();
  });

  it('should return first error from validation rules', () => {
    const config: FieldConfig = {
      name: 'test',
      validations: [required(), minLength(5)],
    };
    expect(validateField('', config, {})).toBe('This field is required');
  });

  it('should return undefined when value is valid', () => {
    const config: FieldConfig = {
      name: 'test',
      validations: [required(), minLength(3)],
    };
    expect(validateField('hello', config, {})).toBeUndefined();
  });
});

describe('validateForm', () => {
  it('should validate all fields and return errors', () => {
    const fields: FieldConfig[] = [
      { name: 'name', validations: [required()] },
      { name: 'email', validations: [required(), email()] },
    ];

    const errors = validateForm({ name: '', email: 'bad' }, fields);
    expect(errors.name).toBe('This field is required');
    expect(errors.email).toBe('Please enter a valid email address');
  });

  it('should return empty errors for valid form', () => {
    const fields: FieldConfig[] = [
      { name: 'name', validations: [required()] },
    ];

    const errors = validateForm({ name: 'John' }, fields);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe('getNestedValue', () => {
  it('should get a top-level value', () => {
    expect(getNestedValue({ name: 'John' }, 'name')).toBe('John');
  });

  it('should get a nested value', () => {
    expect(getNestedValue({ user: { name: 'John' } }, 'user.name')).toBe('John');
  });

  it('should get array elements with bracket notation', () => {
    expect(getNestedValue({ items: [{ id: 1 }] }, 'items[0].id')).toBe(1);
  });

  it('should return undefined for missing path', () => {
    expect(getNestedValue({}, 'missing.path')).toBeUndefined();
  });

  it('should return undefined for empty path', () => {
    expect(getNestedValue({ a: 1 }, '')).toBeUndefined();
  });
});

describe('setNestedValue', () => {
  it('should set a top-level value', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'name', 'John');
    expect(obj.name).toBe('John');
  });

  it('should set a nested value, creating intermediate objects', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'user.name', 'John');
    expect((obj.user as any).name).toBe('John');
  });

  it('should create arrays for numeric keys', () => {
    const obj: Record<string, unknown> = {};
    setNestedValue(obj, 'items[0].id', 42);
    expect(Array.isArray(obj.items)).toBe(true);
    expect((obj.items as any)[0].id).toBe(42);
  });
});

describe('deepEqual', () => {
  it('should return true for identical primitives', () => {
    expect(deepEqual(42, 42)).toBe(true);
    expect(deepEqual('hello', 'hello')).toBe(true);
  });

  it('should return false for different primitives', () => {
    expect(deepEqual(42, 43)).toBe(false);
  });

  it('should compare arrays deeply', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should compare objects deeply', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('should handle null values', () => {
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
  });
});

describe('buildInitialValues', () => {
  it('should build values from field configs', () => {
    const fields: FieldConfig[] = [
      { name: 'name', defaultValue: 'John' },
      { name: 'age', defaultValue: 25 },
      { name: 'bio' },
    ];

    const values = buildInitialValues(fields);
    expect(values.name).toBe('John');
    expect(values.age).toBe(25);
    expect(values.bio).toBe('');
  });
});

describe('createFieldMap', () => {
  it('should create a map keyed by field name', () => {
    const fields: FieldConfig[] = [
      { name: 'email', type: 'email' },
      { name: 'password', type: 'password' },
    ];

    const map = createFieldMap(fields);
    expect(map.size).toBe(2);
    expect(map.get('email')?.type).toBe('email');
    expect(map.get('password')?.type).toBe('password');
  });
});
