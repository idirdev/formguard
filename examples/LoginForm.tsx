import React from 'react';
import { useForm, Form, Field, required, email, minLength } from '../src';

/**
 * LoginForm example demonstrating a simple login form with:
 * - Email validation
 * - Password minimum length
 * - Remember me checkbox
 * - Error summary display
 * - Submit handling with loading state
 */
export function LoginForm() {
  const form = useForm({
    fields: [
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'you@example.com',
        validations: [
          required('Email is required'),
          email('Please enter a valid email'),
        ],
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter your password',
        validations: [
          required('Password is required'),
          minLength(8, 'Password must be at least 8 characters'),
        ],
      },
      {
        name: 'rememberMe',
        label: 'Remember me',
        type: 'checkbox',
        defaultValue: false,
      },
    ],
    onSubmit: async (values) => {
      // Simulate API call
      console.log('Submitting login:', values);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert(`Welcome! Logged in as ${values.email}`);
    },
    resetOnSubmit: false,
  });

  const { formState } = form;

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '40px auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2
          style={{
            margin: '0 0 4px 0',
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Sign In
        </h2>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          Enter your credentials to access your account.
        </p>

        <Form form={form} showErrorSummary>
          <Field name="email" form={form} label="Email Address" type="email" placeholder="you@example.com" />

          <Field name="password" form={form} label="Password" type="password" placeholder="Enter your password" />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Field name="rememberMe" form={form} label="Remember me" type="checkbox" />
            <a
              href="#forgot"
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                textDecoration: 'none',
              }}
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={formState.isSubmitting}
            style={{
              width: '100%',
              padding: '10px 16px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: formState.isSubmitting ? '#93c5fd' : '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              cursor: formState.isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {formState.isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </Form>

        {/* Debug info */}
        <details style={{ marginTop: '24px', fontSize: '12px', color: '#9ca3af' }}>
          <summary style={{ cursor: 'pointer' }}>Form State Debug</summary>
          <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', fontSize: '11px' }}>
            {JSON.stringify(
              {
                values: formState.values,
                errors: formState.errors,
                touched: formState.touched,
                dirty: formState.dirty,
                isValid: formState.isValid,
                isDirty: formState.isDirty,
                isSubmitting: formState.isSubmitting,
                isSubmitted: formState.isSubmitted,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  );
}
