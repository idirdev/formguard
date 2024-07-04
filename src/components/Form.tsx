import React from 'react';
import type { FormProps } from '../types';

/**
 * Form wrapper component that handles submission through the useForm hook.
 *
 * Automatically prevents default form submission and delegates to the
 * useForm handleSubmit function. Optionally shows a global error summary
 * at the top of the form listing all current validation errors.
 *
 * @example
 * ```tsx
 * const form = useForm({ fields, onSubmit: handleLogin });
 *
 * <Form form={form} showErrorSummary>
 *   <Field name="email" form={form} />
 *   <Field name="password" form={form} />
 *   <button type="submit" disabled={form.formState.isSubmitting}>
 *     Log In
 *   </button>
 * </Form>
 * ```
 */
export function Form({
  form,
  children,
  className,
  showErrorSummary = false,
  noValidate = true,
}: FormProps) {
  const { handleSubmit, formState } = form;
  const { errors, isSubmitted, isSubmitting } = formState;

  const errorEntries = Object.entries(errors).filter(
    ([, message]) => message !== undefined
  );
  const hasErrors = errorEntries.length > 0 && isSubmitted;

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      noValidate={noValidate}
      aria-label="form"
    >
      {/* Global error summary */}
      {showErrorSummary && hasErrors && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '14px',
          }}
        >
          <p
            style={{
              margin: '0 0 8px 0',
              fontWeight: 600,
              fontSize: '15px',
            }}
          >
            Please fix the following errors:
          </p>
          <ul
            style={{
              margin: 0,
              paddingLeft: '20px',
              listStyleType: 'disc',
            }}
          >
            {errorEntries.map(([fieldName, message]) => (
              <li key={fieldName} style={{ marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.querySelector<HTMLElement>(
                      `[name="${fieldName}"]`
                    );
                    el?.focus();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '14px',
                  }}
                >
                  {message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Form fields and controls */}
      <fieldset
        disabled={isSubmitting}
        style={{
          border: 'none',
          margin: 0,
          padding: 0,
          opacity: isSubmitting ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {children}
      </fieldset>
    </form>
  );
}
