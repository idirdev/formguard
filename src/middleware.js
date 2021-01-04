'use strict';

const { validate } = require('./validator');

/**
 * Express middleware factory for request validation.
 *
 * Usage:
 *   const { formguard } = require('@idirdev/formguard/middleware');
 *
 *   app.post('/register', formguard({
 *     email: ['required', 'email'],
 *     password: ['required', { rule: 'minLength', param: 8 }]
 *   }), (req, res) => { ... });
 *
 * @param {Object} rules - Validation rules object
 * @param {Object} [options] - Options
 * @param {string} [options.source='body'] - Request property to validate ('body', 'query', 'params')
 * @param {string} [options.locale='en'] - Locale for error messages
 * @param {Object} [options.messages] - Custom message overrides
 * @param {number} [options.statusCode=422] - HTTP status code on validation failure
 * @param {boolean} [options.abortEarly=false] - Stop on first error
 * @param {Object} [options.labels] - Human-readable field labels
 * @param {Function} [options.onError] - Custom error handler (err, req, res, next)
 * @returns {Function} Express middleware
 */
function formguard(rules, options = {}) {
  const {
    source = 'body',
    locale = 'en',
    messages: customMessages,
    statusCode = 422,
    abortEarly = false,
    labels,
    onError
  } = options;

  return function formguardMiddleware(req, res, next) {
    const data = req[source] || {};

    const result = validate(data, rules, {
      locale,
      messages: customMessages,
      abortEarly,
      labels
    });

    if (result.valid) {
      return next();
    }

    if (onError) {
      return onError(result.errors, req, res, next);
    }

    return res.status(statusCode).json({
      success: false,
      message: locale === 'fr' ? 'Erreurs de validation' : 'Validation failed',
      errors: result.errors
    });
  };
}

/**
 * Express middleware that validates and attaches sanitized data to req.validated.
 * Combines validation with the sanitizers module.
 */
function formguardSanitized(rules, sanitizerMap = {}, options = {}) {
  const { source = 'body', ...validateOptions } = options;

  let sanitizers;
  try {
    sanitizers = require('./sanitizers');
  } catch (e) {
    sanitizers = null;
  }

  return function formguardSanitizedMiddleware(req, res, next) {
    const data = req[source] || {};

    // Apply sanitizers first
    const sanitized = {};
    for (const [field, value] of Object.entries(data)) {
      if (sanitizerMap[field] && sanitizers) {
        let val = value;
        const fns = Array.isArray(sanitizerMap[field]) ? sanitizerMap[field] : [sanitizerMap[field]];
        for (const fn of fns) {
          if (typeof fn === 'string' && sanitizers[fn]) {
            val = sanitizers[fn](val);
          } else if (typeof fn === 'function') {
            val = fn(val);
          }
        }
        sanitized[field] = val;
      } else {
        sanitized[field] = value;
      }
    }

    const result = validate(sanitized, rules, validateOptions);

    if (result.valid) {
      req.validated = sanitized;
      return next();
    }

    const statusCode = options.statusCode || 422;
    const locale = validateOptions.locale || 'en';

    return res.status(statusCode).json({
      success: false,
      message: locale === 'fr' ? 'Erreurs de validation' : 'Validation failed',
      errors: result.errors
    });
  };
}

module.exports = { formguard, formguardSanitized };
