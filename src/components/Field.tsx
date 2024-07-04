import React from 'react';
import type { FieldProps } from '../types';

/**
 * Field component that renders a labeled input with error message display.
 * Supports all standard HTML input types, textareas, and selects.
 *
 * Automatically integrates with the useForm hook for validation, touched
 * state, and error display. Only shows errors for fields that have been
 * touched or after form submission.
 *
 * @example
 * ```tsx
 * <Field name="email" form={form} label="Email Address" type="email" />
 * <Field name="bio" form={form} type="textarea" placeholder="Tell us about yourself" />
 * <Field name="role" form={form} type="select">
 *   <option value="">Select a role</option>
 *   <option value="admin">Admin</option>
 *   <option value="user">User</option>
 * </Field>
 * ```
 */
export function Field({
  name,
  form,
  label,
  type = 'text',
  placeholder,
  className,
  children,
  renderInput,
}: FieldProps) {
  const { register, getError, isTouched, formState } = form;
  const registerProps = register(name);
  const error = getError(name);
  const fieldTouched = isTouched(name);
  const showError = error && (fieldTouched || formState.isSubmitted);

  const errorId = `${name}-error`;
  const labelId = `${name}-label`;

  // If a custom render function is provided, use it
  if (renderInput) {
    return (
      <div className={className} style={{ marginBottom: '16px' }}>
        {label && (
          <label
            id={labelId}
            htmlFor={name}
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: 500,
              color: showError ? '#dc2626' : '#374151',
            }}
          >
            {label}
          </label>
        )}
        {renderInput(registerProps, showError ? error : undefined)}
        {showError && (
          <p
            id={errorId}
            role="alert"
            style={{
              margin: '4px 0 0 0',
              fontSize: '13px',
              color: '#dc2626',
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  // Base input styles
  const inputStyles: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: type === 'textarea' ? '8px 12px' : '8px 12px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#111827',
    backgroundColor: '#ffffff',
    border: `1px solid ${showError ? '#dc2626' : '#d1d5db'}`,
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
  };

  /**
   * Renders the appropriate input element based on the type prop.
   */
  const renderInputElement = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...registerProps}
            id={name}
            placeholder={placeholder}
            value={registerProps.value as string}
            aria-labelledby={label ? labelId : undefined}
            rows={4}
            style={{
              ...inputStyles,
              resize: 'vertical',
              minHeight: '80px',
            }}
          />
        );

      case 'select':
        return (
          <select
            {...registerProps}
            id={name}
            value={registerProps.value as string}
            aria-labelledby={label ? labelId : undefined}
            style={{
              ...inputStyles,
              appearance: 'none',
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236b7280\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              paddingRight: '36px',
            }}
          >
            {children}
          </select>
        );

      case 'checkbox':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              {...registerProps}
              id={name}
              type="checkbox"
              checked={!!registerProps.value}
              aria-labelledby={label ? labelId : undefined}
              style={{
                width: '16px',
                height: '16px',
                margin: 0,
                cursor: 'pointer',
                accentColor: '#3b82f6',
              }}
            />
            {label && (
              <label
                id={labelId}
                htmlFor={name}
                style={{
                  fontSize: '14px',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {label}
              </label>
            )}
          </div>
        );

      default:
        return (
          <input
            {...registerProps}
            id={name}
            type={type}
            placeholder={placeholder}
            value={registerProps.value as string}
            aria-labelledby={label ? labelId : undefined}
            style={inputStyles}
          />
        );
    }
  };

  return (
    <div className={className} style={{ marginBottom: '16px' }}>
      {/* Label (rendered separately for non-checkbox types) */}
      {label && type !== 'checkbox' && (
        <label
          id={labelId}
          htmlFor={name}
          style={{
            display: 'block',
            marginBottom: '4px',
            fontSize: '14px',
            fontWeight: 500,
            color: showError ? '#dc2626' : '#374151',
          }}
        >
          {label}
        </label>
      )}

      {/* Input element */}
      {renderInputElement()}

      {/* Error message */}
      {showError && (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: '4px 0 0 0',
            fontSize: '13px',
            color: '#dc2626',
            lineHeight: '1.4',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
