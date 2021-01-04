'use strict';

/**
 * @module formguard
 * @description Form validation and sanitization library.
 *              Supports pipe-syntax rules, built-in validators, locale messages,
 *              reusable schemas, and common sanitizers.
 * @author idirdev
 */

// ---------------------------------------------------------------------------
// Locale messages
// ---------------------------------------------------------------------------

const MESSAGES = {
  en: {
    required: 'The {field} field is required.',
    email: 'The {field} field must be a valid email address.',
    url: 'The {field} field must be a valid URL.',
    numeric: 'The {field} field must be a number.',
    alpha: 'The {field} field must contain only letters.',
    alphanumeric: 'The {field} field must contain only letters and numbers.',
    min: 'The {field} field must be at least {arg}.',
    max: 'The {field} field must not exceed {arg}.',
    minLength: 'The {field} field must be at least {arg} characters.',
    maxLength: 'The {field} field must not exceed {arg} characters.',
    regex: 'The {field} field format is invalid.',
    in: 'The {field} field must be one of: {arg}.',
  },
  fr: {
    required: 'Le champ {field} est obligatoire.',
    email: 'Le champ {field} doit contenir une adresse e-mail valide.',
    url: 'Le champ {field} doit contenir une URL valide.',
    numeric: 'Le champ {field} doit être un nombre.',
    alpha: 'Le champ {field} ne doit contenir que des lettres.',
    alphanumeric: 'Le champ {field} ne doit contenir que des lettres et des chiffres.',
    min: 'Le champ {field} doit être supérieur ou égal à {arg}.',
    max: 'Le champ {field} ne doit pas dépasser {arg}.',
    minLength: 'Le champ {field} doit comporter au moins {arg} caractères.',
    maxLength: 'Le champ {field} ne doit pas dépasser {arg} caractères.',
    regex: 'Le format du champ {field} est invalide.',
    in: 'Le champ {field} doit être l\'une des valeurs suivantes : {arg}.',
  },
};

let _locale = 'en';

/**
 * Sets the locale for error messages.
 * @param {'en'|'fr'} locale - The locale code.
 * @returns {void}
 * @throws {Error} If the locale is not supported.
 * @example
 * setLocale('fr');
 */
function setLocale(locale) {
  if (!MESSAGES[locale]) throw new Error('Unsupported locale: ' + locale + '. Supported: ' + Object.keys(MESSAGES).join(', '));
  _locale = locale;
}

/**
 * Returns the current locale code.
 * @returns {string}
 */
function getLocale() {
  return _locale;
}

/** @private */
function _msg(rule, field, arg) {
  const tpl = (MESSAGES[_locale] || MESSAGES.en)[rule] || 'The {field} field is invalid.';
  const argStr = Array.isArray(arg) ? arg.join(', ') : String(arg !== undefined ? arg : '');
  return tpl.replace('{field}', field).replace('{arg}', argStr);
}

// ---------------------------------------------------------------------------
// Built-in validators
// ---------------------------------------------------------------------------

/**
 * Map of built-in validator functions.
 * Each validator receives (value, arg?) and returns true if valid.
 * @type {Object.<string, function(*, *=): boolean>}
 */
const VALIDATORS = {
  required(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  email(value) {
    if (!value && value !== 0) return true; // skip if empty (use required for that)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
  },
  url(value) {
    if (!value) return true;
    try { new URL(String(value)); return true; } catch { return false; }
  },
  numeric(value) {
    if (value === null || value === undefined || value === '') return true;
    return !isNaN(Number(value)) && String(value).trim() !== '';
  },
  alpha(value) {
    if (!value && value !== 0) return true;
    return /^[a-zA-Z]+$/.test(String(value));
  },
  alphanumeric(value) {
    if (!value && value !== 0) return true;
    return /^[a-zA-Z0-9]+$/.test(String(value));
  },
  min(value, arg) {
    if (value === null || value === undefined || value === '') return true;
    return Number(value) >= Number(arg);
  },
  max(value, arg) {
    if (value === null || value === undefined || value === '') return true;
    return Number(value) <= Number(arg);
  },
  minLength(value, arg) {
    if (!value) return true;
    return String(value).length >= Number(arg);
  },
  maxLength(value, arg) {
    if (!value) return true;
    return String(value).length <= Number(arg);
  },
  regex(value, arg) {
    if (!value) return true;
    const re = arg instanceof RegExp ? arg : new RegExp(arg);
    return re.test(String(value));
  },
  in(value, arg) {
    if (value === null || value === undefined || value === '') return true;
    const list = Array.isArray(arg) ? arg : String(arg).split(',').map(s => s.trim());
    return list.includes(String(value));
  },
};

// ---------------------------------------------------------------------------
// Rule parsing
// ---------------------------------------------------------------------------

/**
 * Parses a pipe-syntax rule string into an array of { rule, arg } objects.
 * @param {string|string[]} rules - Pipe-delimited rule string like "required|email|min:3|max:100",
 *                                   or an array of rule strings.
 * @returns {Array<{ rule: string, arg: string|undefined }>}
 * @example
 * _parseRules('required|minLength:3|max:100');
 * // => [{ rule: 'required' }, { rule: 'minLength', arg: '3' }, { rule: 'max', arg: '100' }]
 */
function _parseRules(rules) {
  const list = Array.isArray(rules) ? rules : String(rules).split('|');
  return list
    .map(r => r.trim())
    .filter(Boolean)
    .map(r => {
      const idx = r.indexOf(':');
      if (idx === -1) return { rule: r, arg: undefined };
      return { rule: r.slice(0, idx).trim(), arg: r.slice(idx + 1).trim() };
    });
}

// ---------------------------------------------------------------------------
// Core validation
// ---------------------------------------------------------------------------

/**
 * Validates a single value against a pipe-syntax rule string (or array).
 * @param {*} value - The value to validate.
 * @param {string|string[]} rules - Pipe-delimited rules, e.g. "required|email|maxLength:200".
 * @param {string} [field='value'] - Field name for error messages.
 * @returns {{ valid: boolean, errors: string[] }}
 * @example
 * validateField('', 'required|email');
 * // => { valid: false, errors: ['The value field is required.'] }
 */
function validateField(value, rules, field = 'value') {
  const parsed = _parseRules(rules);
  const errors = [];
  for (const { rule, arg } of parsed) {
    const fn = VALIDATORS[rule];
    if (!fn) continue;
    const ok = fn(value, arg);
    if (!ok) errors.push(_msg(rule, field, arg));
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a data object against a schema.
 * @param {object} data - Plain object of field values.
 * @param {Object.<string, string|string[]>} schema - Map of field name to pipe-syntax rules.
 * @returns {{ valid: boolean, errors: Array<{ field: string, messages: string[] }> }}
 * @throws {TypeError} If data or schema are not objects.
 * @example
 * const result = validate({ email: 'bad' }, { email: 'required|email' });
 * // => { valid: false, errors: [{ field: 'email', messages: ['...'] }] }
 */
function validate(data, schema) {
  if (typeof data !== 'object' || data === null) throw new TypeError('data must be a non-null object');
  if (typeof schema !== 'object' || schema === null) throw new TypeError('schema must be a non-null object');

  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field] !== undefined ? data[field] : null;
    const { valid, errors: fieldErrors } = validateField(value, rules, field);
    if (!valid) errors.push({ field, messages: fieldErrors });
  }
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Reusable schemas
// ---------------------------------------------------------------------------

/**
 * Creates a reusable schema object with a validate() method bound to the definition.
 * @param {Object.<string, string|string[]>} definition - Schema definition (field -> rules).
 * @returns {{ validate: function(object): { valid: boolean, errors: Array } }}
 * @example
 * const loginSchema = createSchema({ email: 'required|email', password: 'required|minLength:8' });
 * const result = loginSchema.validate({ email: 'x@y.com', password: 'secret123' });
 */
function createSchema(definition) {
  if (typeof definition !== 'object' || definition === null) throw new TypeError('definition must be a non-null object');
  return {
    /** @type {Object.<string, string|string[]>} */
    definition,
    /**
     * Validates data against this schema.
     * @param {object} data
     * @returns {{ valid: boolean, errors: Array }}
     */
    validate(data) {
      return validate(data, this.definition);
    },
  };
}

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Input string.
 * @returns {string} Escaped string.
 * @example
 * escapeHtml('<script>alert(1)</script>'); // '&lt;script&gt;alert(1)&lt;/script&gt;'
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str !== undefined && str !== null ? str : '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Strips all HTML tags from a string.
 * @param {string} str - Input string, possibly containing HTML.
 * @returns {string} Plain text with tags removed.
 * @example
 * stripTags('<b>Hello</b> <i>world</i>'); // 'Hello world'
 */
function stripTags(str) {
  if (typeof str !== 'string') return String(str !== undefined && str !== null ? str : '');
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Converts a string into a URL-safe slug.
 * @param {string} str - Input string.
 * @returns {string} Lowercase, hyphen-separated slug.
 * @example
 * slugify('Hello World!'); // 'hello-world'
 */
function slugify(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

/**
 * Trims whitespace from both ends of a string.
 * @param {string} str - Input string.
 * @returns {string} Trimmed string.
 * @example
 * trim('  hello  '); // 'hello'
 */
function trim(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

/**
 * Normalises an email address (lowercase, trimmed).
 * @param {string} str - Raw email string.
 * @returns {string} Normalised email.
 * @example
 * normalizeEmail('  User@Example.COM  '); // 'user@example.com'
 */
function normalizeEmail(str) {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase();
}

/**
 * Sanitizes a data object according to a map of sanitizer names per field.
 * Supported sanitizers: 'trim', 'escape', 'stripTags', 'slugify', 'normalizeEmail'.
 * @param {object} data - Raw field values.
 * @param {Object.<string, string|string[]>} rules - Map of field name to sanitizer name(s).
 * @returns {object} New object with sanitized values (original is not mutated).
 * @example
 * sanitize({ name: '  <b>Alice</b>  ' }, { name: ['trim', 'stripTags'] });
 * // => { name: 'Alice' }
 */
function sanitize(data, rules) {
  if (typeof data !== 'object' || data === null) return {};
  const sanitizers = { trim, escape: escapeHtml, stripTags, slugify, normalizeEmail };
  const out = Object.assign({}, data);
  for (const [field, fieldRules] of Object.entries(rules)) {
    const list = Array.isArray(fieldRules) ? fieldRules : [fieldRules];
    let val = out[field];
    for (const name of list) {
      if (sanitizers[name]) val = sanitizers[name](val);
    }
    out[field] = val;
  }
  return out;
}

module.exports = {
  setLocale,
  getLocale,
  validate,
  validateField,
  createSchema,
  sanitize,
  escapeHtml,
  stripTags,
  slugify,
  trim,
  normalizeEmail,
  VALIDATORS,
};
