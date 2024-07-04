import { useState, useCallback, useRef, useMemo } from 'react';
import type {
  UseFormOptions,
  UseFormReturn,
  FormState,
  FormErrors,
  RegisterReturn,
} from './types';
import {
  validateField as validateFieldUtil,
  validateForm as validateFormUtil,
  buildInitialValues,
  createFieldMap,
  deepEqual,
} from './utils';

/**
 * React hook for form state management and validation.
 *
 * Provides field registration, validation, touched/dirty tracking,
 * error management, and submission handling with a simple API.
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   fields: [
 *     { name: 'email', validations: [required(), email()] },
 *     { name: 'password', validations: [required(), minLength(8)] },
 *   ],
 *   onSubmit: async (values) => {
 *     await loginUser(values.email, values.password);
 *   },
 * });
 * ```
 */
export function useForm(options: UseFormOptions): UseFormReturn {
  const { fields, onSubmit, validateOnSubmit = true, resetOnSubmit = false } = options;

  // Stable references
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  // Build field map for O(1) lookups
  const fieldMap = useMemo(() => createFieldMap(fields), [fields]);

  // Initial values derived from field configs
  const initialValues = useMemo(() => buildInitialValues(fields), [fields]);
  const initialValuesRef = useRef(initialValues);

  // Core state
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Derived state
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const isDirty = useMemo(
    () => Object.values(dirty).some(Boolean),
    [dirty]
  );

  // Build the complete form state object
  const formState: FormState = useMemo(
    () => ({
      values,
      errors,
      touched,
      dirty,
      isSubmitting,
      isSubmitted,
      isValid,
      isDirty,
    }),
    [values, errors, touched, dirty, isSubmitting, isSubmitted, isValid, isDirty]
  );

  /**
   * Validate a single field by name. Updates the errors state and returns the error.
   */
  const validateField = useCallback(
    (name: string): string | undefined => {
      const config = fieldMap.get(name);
      if (!config) return undefined;

      const error = validateFieldUtil(values[name], config, values);

      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        }
        // Remove the error if it no longer exists
        if (prev[name] !== undefined) {
          const next = { ...prev };
          delete next[name];
          return next;
        }
        return prev;
      });

      return error;
    },
    [fieldMap, values]
  );

  /**
   * Validate all fields. Updates the errors state and returns the full error map.
   */
  const validateAll = useCallback((): FormErrors => {
    const allErrors = validateFormUtil(values, fieldsRef.current);
    setErrors(allErrors);
    return allErrors;
  }, [values]);

  /**
   * Register a field for use with an input element.
   * Returns props to spread on the input: name, value, onChange, onBlur, aria attributes.
   */
  const register = useCallback(
    (name: string): RegisterReturn => {
      const config = fieldMap.get(name);
      const currentValue = values[name] ?? '';
      const hasError = !!errors[name];

      return {
        name,
        value: currentValue,
        onChange: (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => {
          const target = e.target;
          let newValue: unknown;

          if (target instanceof HTMLInputElement && target.type === 'checkbox') {
            newValue = target.checked;
          } else if (target instanceof HTMLInputElement && target.type === 'number') {
            newValue = target.value === '' ? '' : Number(target.value);
          } else {
            newValue = target.value;
          }

          setValues((prev) => ({ ...prev, [name]: newValue }));

          // Track dirty state
          const isDirtyNow = !deepEqual(newValue, initialValuesRef.current[name]);
          setDirty((prev) => ({ ...prev, [name]: isDirtyNow }));

          // Validate on change if configured
          if (config?.validateOnChange) {
            const fieldConfig = fieldMap.get(name);
            if (fieldConfig) {
              const error = validateFieldUtil(newValue, fieldConfig, {
                ...values,
                [name]: newValue,
              });
              setErrors((prev) => {
                if (error) return { ...prev, [name]: error };
                const next = { ...prev };
                delete next[name];
                return next;
              });
            }
          }
        },
        onBlur: () => {
          setTouched((prev) => ({ ...prev, [name]: true }));

          // Validate on blur if configured (default: true)
          if (config?.validateOnBlur !== false) {
            const fieldConfig = fieldMap.get(name);
            if (fieldConfig) {
              const error = validateFieldUtil(values[name], fieldConfig, values);
              setErrors((prev) => {
                if (error) return { ...prev, [name]: error };
                const next = { ...prev };
                delete next[name];
                return next;
              });
            }
          }
        },
        disabled: config?.disabled,
        'aria-invalid': hasError ? true : undefined,
        'aria-describedby': hasError ? `${name}-error` : undefined,
      };
    },
    [fieldMap, values, errors]
  );

  /**
   * Handle form submission. Validates all fields first (if configured),
   * then calls the onSubmit handler with the current values.
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setIsSubmitted(true);

      // Mark all fields as touched on submit
      const allTouched: Record<string, boolean> = {};
      for (const field of fieldsRef.current) {
        allTouched[field.name] = true;
      }
      setTouched(allTouched);

      // Validate all fields if configured
      if (validateOnSubmit) {
        const allErrors = validateFormUtil(values, fieldsRef.current);
        setErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {
          // Focus the first field with an error
          const firstErrorField = fieldsRef.current.find(
            (f) => allErrors[f.name]
          );
          if (firstErrorField) {
            const element = document.querySelector<HTMLElement>(
              `[name="${firstErrorField.name}"]`
            );
            element?.focus();
          }
          return;
        }
      }

      setIsSubmitting(true);

      try {
        const result = onSubmitRef.current(values);
        if (result instanceof Promise) {
          await result;
        }

        if (resetOnSubmit) {
          setValues(initialValuesRef.current);
          setErrors({});
          setTouched({});
          setDirty({});
          setIsSubmitted(false);
        }
      } catch (err) {
        console.error('[FormGuard] Submit error:', err);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateOnSubmit, resetOnSubmit]
  );

  /**
   * Programmatically set a field's value.
   */
  const setValue = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      const isDirtyNow = !deepEqual(value, initialValuesRef.current[name]);
      setDirty((prev) => ({ ...prev, [name]: isDirtyNow }));
    },
    []
  );

  /**
   * Programmatically set an error for a field.
   */
  const setError = useCallback((name: string, message: string) => {
    setErrors((prev) => ({ ...prev, [name]: message }));
  }, []);

  /**
   * Clear the error for a specific field.
   */
  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  /**
   * Clear all form errors.
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Reset the form to its initial state.
   */
  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
    setTouched({});
    setDirty({});
    setIsSubmitting(false);
    setIsSubmitted(false);
  }, []);

  /**
   * Get the error message for a specific field.
   */
  const getError = useCallback(
    (name: string): string | undefined => errors[name],
    [errors]
  );

  /**
   * Check if a specific field has been touched.
   */
  const isTouched = useCallback(
    (name: string): boolean => !!touched[name],
    [touched]
  );

  /**
   * Check if a specific field is dirty (changed from default).
   */
  const isDirtyField = useCallback(
    (name: string): boolean => !!dirty[name],
    [dirty]
  );

  return {
    register,
    handleSubmit,
    formState,
    setValue,
    setError,
    clearError,
    clearErrors,
    reset,
    validateField,
    validateAll,
    getError,
    isTouched,
    isDirtyField,
  };
}
