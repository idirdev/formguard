'use strict';

const builtInRules = require('./rules');
const { getMessage } = require('./messages');

/**
 * Parse a rule definition into a normalized structure.
 * Supports multiple formats:
 *   - String:   'required'
 *   - String with params: 'minLength:6'
 *   - Function: (value) => boolean
 *   - Object:   { rule: 'email', message: 'Bad email' }
 *   - Array:    ['required', 'email', { rule: 'minLength', param: 6 }]
 */
function parseRuleDefinition(def) {
  if (typeof def === 'string') {
    const [name, ...paramParts] = def.split(':');
    const param = paramParts.length > 0 ? paramParts.join(':') : undefined;
    return [{ name, param }];
  }

  if (typeof def === 'function') {
    return [{ name: 'custom', fn: def }];
  }

  if (Array.isArray(def)) {
    const results = [];
    for (const item of def) {
      results.push(...parseRuleDefinition(item));
    }
    return results;
  }

  if (typeof def === 'object' && def !== null) {
    return [{
      name: def.rule || 'custom',
      param: def.param,
      message: def.message,
      fn: def.fn || def.validate
    }];
  }

  return [];
}

/**
 * Resolve a parsed rule definition into an executable validation function.
 */
function resolveRule(parsed) {
  if (parsed.fn) {
    const fn = typeof parsed.fn === 'function' ? parsed.fn : null;
    return { validate: fn, name: parsed.name, param: parsed.param, message: parsed.message, needsData: true };
  }

  const rule = builtInRules[parsed.name];
  if (!rule) {
    throw new Error(`FormGuard: Unknown rule "${parsed.name}". Register it or use a custom function.`);
  }

  // Rules that take parameters return a function
  const parameterizedRules = ['min', 'max', 'minLength', 'maxLength', 'pattern', 'before', 'after', 'in', 'enum', 'notIn', 'equals', 'confirmed', 'custom'];

  if (parameterizedRules.includes(parsed.name) && typeof rule === 'function') {
    let param = parsed.param;
    // Auto-parse numeric params for min/max/minLength/maxLength
    if (['min', 'max', 'minLength', 'maxLength'].includes(parsed.name) && typeof param === 'string') {
      param = Number(param);
    }
    // Parse array params for in/notIn/enum
    if (['in', 'notIn', 'enum'].includes(parsed.name) && typeof param === 'string') {
      param = param.split(',').map(s => s.trim());
    }

    const validatorFn = rule(param);
    return {
      validate: validatorFn,
      name: parsed.name,
      param: param,
      message: parsed.message,
      needsData: validatorFn._needsData || false
    };
  }

  return {
    validate: rule,
    name: parsed.name,
    param: parsed.param,
    message: parsed.message,
    needsData: rule._needsData || false
  };
}

/**
 * Validate a data object against a set of rules.
 *
 * @param {Object} data - The data object to validate
 * @param {Object} rules - Validation rules keyed by field name
 * @param {Object} [options] - Options
 * @param {string} [options.locale='en'] - Locale for error messages ('en' or 'fr')
 * @param {Object} [options.messages] - Custom error message overrides
 * @param {boolean} [options.abortEarly=false] - Stop on first error
 * @param {Object} [options.labels] - Human-readable field labels { fieldName: 'Label' }
 * @returns {{ valid: boolean, errors: Object<string, string[]> }}
 */
function validate(data, rules, options = {}) {
  const {
    locale = 'en',
    messages: customMessages = {},
    abortEarly = false,
    labels = {}
  } = options;

  const errors = {};
  const dataObj = data || {};

  for (const [field, ruleDefs] of Object.entries(rules)) {
    const fieldLabel = labels[field] || field;
    const value = getNestedValue(dataObj, field);
    const parsedRules = parseRuleDefinition(ruleDefs);
    const fieldErrors = [];

    for (const parsed of parsedRules) {
      const resolved = resolveRule(parsed);

      if (!resolved.validate) continue;

      let isValid;
      if (resolved.needsData) {
        isValid = resolved.validate(value, field, dataObj);
      } else {
        isValid = resolved.validate(value);
      }

      if (!isValid) {
        const msg = resolved.message ||
          getMessage(resolved.name, fieldLabel, resolved.param, locale, customMessages);
        fieldErrors.push(msg);

        if (abortEarly) break;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      if (abortEarly) break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Get a nested value from an object using dot notation.
 * Supports array indexing: 'items.0.name'
 */
function getNestedValue(obj, path) {
  if (!path.includes('.')) return obj[path];
  return path.split('.').reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, obj);
}

/**
 * Async version of validate for rules that return promises.
 */
async function validateAsync(data, rules, options = {}) {
  const {
    locale = 'en',
    messages: customMessages = {},
    abortEarly = false,
    labels = {}
  } = options;

  const errors = {};
  const dataObj = data || {};

  for (const [field, ruleDefs] of Object.entries(rules)) {
    const fieldLabel = labels[field] || field;
    const value = getNestedValue(dataObj, field);
    const parsedRules = parseRuleDefinition(ruleDefs);
    const fieldErrors = [];

    for (const parsed of parsedRules) {
      const resolved = resolveRule(parsed);
      if (!resolved.validate) continue;

      let isValid;
      if (resolved.needsData) {
        isValid = await resolved.validate(value, field, dataObj);
      } else {
        isValid = await resolved.validate(value);
      }

      if (!isValid) {
        const msg = resolved.message ||
          getMessage(resolved.name, fieldLabel, resolved.param, locale, customMessages);
        fieldErrors.push(msg);
        if (abortEarly) break;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      if (abortEarly) break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = { validate, validateAsync, parseRuleDefinition, resolveRule, getNestedValue };
