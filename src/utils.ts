import type { FieldConfig, FormErrors, ValidationRule } from './types';

/**
 * Validates a single field value against its configured validation rules.
 * Returns the first error message found, or undefined if the value is valid.
 *
 * @param value - The current value of the field
 * @param config - The field configuration containing validation rules
 * @param formValues - All current form values (for cross-field validation)
 * @returns The first error message, or undefined if valid
 */
export function validateField(
  value: unknown,
  config: FieldConfig,
  formValues: Record<string, unknown>
): string | undefined {
  if (!config.validations || config.validations.length === 0) {
    return undefined;
  }

  for (const rule of config.validations) {
    const error = rule.validate(value, formValues);
    if (error) {
      return rule.message ?? error;
    }
  }

  return undefined;
}

/**
 * Validates all fields in the form and returns a map of field names to error messages.
 * Only fields with errors are included in the returned object.
 *
 * @param values - Current form values
 * @param fields - Array of field configurations
 * @returns Object mapping field names to their error messages
 */
export function validateForm(
  values: Record<string, unknown>,
  fields: FieldConfig[]
): FormErrors {
  const errors: FormErrors = {};

  for (const field of fields) {
    const value = values[field.name];
    const error = validateField(value, field, values);
    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
}

/**
 * Gets a nested value from an object using a dot-separated path.
 * Supports array indices with bracket notation.
 *
 * @example
 * getNestedValue({ user: { name: 'John' } }, 'user.name') // 'John'
 * getNestedValue({ items: [{ id: 1 }] }, 'items[0].id') // 1
 *
 * @param obj - The source object
 * @param path - Dot-separated path string
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  if (!path) return undefined;

  // Normalize bracket notation to dot notation: "items[0].id" -> "items.0.id"
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');

  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Sets a nested value on an object using a dot-separated path.
 * Creates intermediate objects/arrays as needed.
 *
 * @param obj - The target object (mutated in place)
 * @param path - Dot-separated path string
 * @param value - The value to set
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const keys = normalizedPath.split('.');

  let current: Record<string, unknown> = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];

    if (current[key] === undefined || current[key] === null) {
      // Create an array if next key is numeric, otherwise an object
      current[key] = /^\d+$/.test(nextKey) ? [] : {};
    }

    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Deep compares two values for equality.
 * Handles primitives, arrays, and plain objects.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  return false;
}

/**
 * Creates a map of field configurations keyed by field name for O(1) lookup.
 */
export function createFieldMap(
  fields: FieldConfig[]
): Map<string, FieldConfig> {
  const map = new Map<string, FieldConfig>();
  for (const field of fields) {
    map.set(field.name, field);
  }
  return map;
}

/**
 * Builds the initial form values from field configurations.
 */
export function buildInitialValues(
  fields: FieldConfig[]
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    values[field.name] = field.defaultValue ?? '';
  }
  return values;
}
