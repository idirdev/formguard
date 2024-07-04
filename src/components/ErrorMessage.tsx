import React from 'react';
import type { ErrorMessageProps } from '../types';

/**
 * Standalone error message component for a specific form field.
 *
 * Renders the validation error message for the given field name.
 * Only displays when the field has been touched (or the form submitted)
 * and there is an active validation error.
 *
 * Useful when you want to position error messages independently
 * from the Field component, or when using custom input rendering.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <input {...form.register('email')} />
 * <ErrorMessage name="email" form={form} />
 *
 * // Custom render
 * <ErrorMessage
 *   name="password"
 *   form={form}
 *   render={(msg) => <CustomAlert>{msg}</CustomAlert>}
 * />
 * ```
 */
export function ErrorMessage({
  name,
  form,
  className,
  render,
}: ErrorMessageProps) {
  const { getError, isTouched, formState } = form;
  const error = getError(name);
  const fieldTouched = isTouched(name);

  // Only show errors for touched fields or after submission attempt
  const shouldShow = error && (fieldTouched || formState.isSubmitted);

  if (!shouldShow || !error) {
    return null;
  }

  // Use custom render if provided
  if (render) {
    return <>{render(error)}</>;
  }

  return (
    <div
      id={`${name}-error`}
      className={className}
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '4px',
        fontSize: '13px',
        color: '#dc2626',
        lineHeight: '1.4',
      }}
    >
      {/* Small warning icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 9.5a.75.75 0 110-1.5.75.75 0 010 1.5zM7.75 7a.75.75 0 01-1.5 0V4.5a.75.75 0 011.5 0V7z"
          fill="currentColor"
        />
      </svg>
      <span>{error}</span>
    </div>
  );
}
