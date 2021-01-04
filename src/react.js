'use strict';

/**
 * React hook for real-time form validation with FormGuard.
 *
 * Usage:
 *   import { useFormGuard } from '@idirdev/formguard/react';
 *
 *   function LoginForm() {
 *     const { values, errors, touched, handleChange, handleBlur, handleSubmit, isValid, reset } =
 *       useFormGuard({
 *         initialValues: { email: '', password: '' },
 *         rules: {
 *           email: ['required', 'email'],
 *           password: ['required', { rule: 'minLength', param: 8 }]
 *         },
 *         onSubmit: (data) => { console.log(data); }
 *       });
 *
 *     return (
 *       <form onSubmit={handleSubmit}>
 *         <input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
 *         {touched.email && errors.email && <span>{errors.email[0]}</span>}
 *         ...
 *       </form>
 *     );
 *   }
 */

let React;
try {
  React = require('react');
} catch (e) {
  // React not available; exports will throw clear errors when called
}

const { validate } = require('./validator');

/**
 * @param {Object} config
 * @param {Object} config.initialValues - Initial form values
 * @param {Object} config.rules - Validation rules
 * @param {Function} [config.onSubmit] - Submission handler (receives validated data)
 * @param {string} [config.locale='en'] - Locale for messages
 * @param {Object} [config.messages] - Custom messages
 * @param {Object} [config.labels] - Human-readable field labels
 * @param {boolean} [config.validateOnChange=false] - Validate on every change
 * @param {boolean} [config.validateOnBlur=true] - Validate on blur
 */
function useFormGuard(config) {
  if (!React) {
    throw new Error('FormGuard: React is required for useFormGuard. Install react as a dependency.');
  }

  const { useState, useCallback, useRef, useMemo } = React;

  const {
    initialValues = {},
    rules: validationRules = {},
    onSubmit,
    locale = 'en',
    messages: customMessages,
    labels,
    validateOnChange = false,
    validateOnBlur = true
  } = config;

  const [values, setValues] = useState({ ...initialValues });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const rulesRef = useRef(validationRules);
  rulesRef.current = validationRules;

  const validateOptions = useMemo(() => ({
    locale,
    messages: customMessages,
    labels
  }), [locale, customMessages, labels]);

  /**
   * Validate a single field.
   */
  const validateField = useCallback((fieldName, fieldValue, allValues) => {
    if (!rulesRef.current[fieldName]) return [];

    const result = validate(
      { ...allValues, [fieldName]: fieldValue },
      { [fieldName]: rulesRef.current[fieldName] },
      validateOptions
    );

    return result.errors[fieldName] || [];
  }, [validateOptions]);

  /**
   * Validate all fields.
   */
  const validateAll = useCallback((data) => {
    return validate(data || values, rulesRef.current, validateOptions);
  }, [values, validateOptions]);

  /**
   * Handle input change events.
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues(prev => {
      const next = { ...prev, [name]: newValue };

      if (validateOnChange || submitCount > 0) {
        const fieldErrors = validateField(name, newValue, next);
        setErrors(prevErrors => {
          const updated = { ...prevErrors };
          if (fieldErrors.length > 0) {
            updated[name] = fieldErrors;
          } else {
            delete updated[name];
          }
          return updated;
        });
      }

      return next;
    });
  }, [validateOnChange, validateField, submitCount]);

  /**
   * Handle blur events (triggers field validation).
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;

    setTouched(prev => ({ ...prev, [name]: true }));

    if (validateOnBlur) {
      const fieldErrors = validateField(name, values[name], values);
      setErrors(prev => {
        const updated = { ...prev };
        if (fieldErrors.length > 0) {
          updated[name] = fieldErrors;
        } else {
          delete updated[name];
        }
        return updated;
      });
    }
  }, [validateOnBlur, validateField, values]);

  /**
   * Set a single field value programmatically.
   */
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Set a field error programmatically.
   */
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: Array.isArray(error) ? error : [error]
    }));
  }, []);

  /**
   * Handle form submission.
   */
  const handleSubmit = useCallback((e) => {
    if (e && e.preventDefault) e.preventDefault();

    setSubmitCount(c => c + 1);

    // Mark all fields as touched
    const allTouched = {};
    for (const key of Object.keys(rulesRef.current)) {
      allTouched[key] = true;
    }
    setTouched(prev => ({ ...prev, ...allTouched }));

    const result = validateAll(values);
    setErrors(result.errors);

    if (!result.valid) return;

    if (onSubmit) {
      setIsSubmitting(true);
      const maybePromise = onSubmit(values);
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise
          .catch(() => {})
          .finally(() => setIsSubmitting(false));
      } else {
        setIsSubmitting(false);
      }
    }
  }, [values, validateAll, onSubmit]);

  /**
   * Reset form to initial state.
   */
  const reset = useCallback((newValues) => {
    setValues(newValues || { ...initialValues });
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(values).some(key => values[key] !== initialValues[key]);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    isSubmitting,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setValues,
    setErrors,
    validateAll,
    validateField,
    reset
  };
}

module.exports = { useFormGuard };
