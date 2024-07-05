import React from 'react';
import {
  useForm,
  Form,
  Field,
  ErrorMessage,
  required,
  email,
  minLength,
  maxLength,
  min,
  max,
  pattern,
  matches,
  custom,
  url,
} from '../src';

/**
 * RegistrationForm example demonstrating complex form validation:
 * - Multiple field types (text, email, password, number, textarea, select, checkbox)
 * - Cross-field validation (password confirmation)
 * - Custom validators (username format)
 * - URL validation
 * - Age range validation
 * - Terms acceptance
 */
export function RegistrationForm() {
  const form = useForm({
    fields: [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        placeholder: 'johndoe',
        validations: [
          required('Username is required'),
          minLength(3, 'Username must be at least 3 characters'),
          maxLength(20, 'Username must be at most 20 characters'),
          pattern(
            /^[a-zA-Z0-9_-]+$/,
            'Username can only contain letters, numbers, hyphens, and underscores'
          ),
          custom(
            'noConsecutiveDots',
            (value) => {
              if (typeof value === 'string' && value.includes('..')) {
                return 'Username cannot contain consecutive dots';
              }
              return null;
            }
          ),
        ],
        validateOnChange: true,
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'john@example.com',
        validations: [
          required('Email is required'),
          email('Please enter a valid email address'),
        ],
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Create a strong password',
        validations: [
          required('Password is required'),
          minLength(8, 'Password must be at least 8 characters'),
          pattern(
            /(?=.*[a-z])/,
            'Password must contain at least one lowercase letter'
          ),
          pattern(
            /(?=.*[A-Z])/,
            'Password must contain at least one uppercase letter'
          ),
          pattern(
            /(?=.*\d)/,
            'Password must contain at least one number'
          ),
        ],
        validateOnChange: true,
      },
      {
        name: 'confirmPassword',
        label: 'Confirm Password',
        type: 'password',
        placeholder: 'Repeat your password',
        validations: [
          required('Please confirm your password'),
          matches('password', 'Passwords do not match'),
        ],
      },
      {
        name: 'age',
        label: 'Age',
        type: 'number',
        placeholder: '25',
        validations: [
          required('Age is required'),
          min(13, 'You must be at least 13 years old'),
          max(120, 'Please enter a valid age'),
        ],
      },
      {
        name: 'website',
        label: 'Website (optional)',
        type: 'url',
        placeholder: 'https://yoursite.com',
        validations: [url('Please enter a valid URL')],
      },
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        defaultValue: '',
        validations: [required('Please select a role')],
      },
      {
        name: 'bio',
        label: 'Bio',
        type: 'textarea',
        placeholder: 'Tell us about yourself...',
        validations: [
          maxLength(500, 'Bio must be 500 characters or less'),
        ],
      },
      {
        name: 'terms',
        label: 'I agree to the Terms of Service and Privacy Policy',
        type: 'checkbox',
        defaultValue: false,
        validations: [
          required('You must accept the terms to continue'),
        ],
      },
    ],
    onSubmit: async (values) => {
      console.log('Registration data:', values);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(
        `Account created successfully!\n\nUsername: ${values.username}\nEmail: ${values.email}`
      );
    },
    resetOnSubmit: true,
  });

  const { formState } = form;

  /**
   * Computes a password strength indicator.
   */
  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    const password = (formState.values.password as string) || '';
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (password.length === 0) return { label: '', color: '#e5e7eb', width: '0%' };
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%' };
    if (score <= 2) return { label: 'Fair', color: '#f59e0b', width: '40%' };
    if (score <= 3) return { label: 'Good', color: '#3b82f6', width: '60%' };
    if (score <= 4) return { label: 'Strong', color: '#10b981', width: '80%' };
    return { label: 'Excellent', color: '#059669', width: '100%' };
  };

  const pwStrength = getPasswordStrength();

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          padding: '32px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
        }}
      >
        <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
          Create Account
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
          Fill in the details below to register.
        </p>

        <Form form={form} showErrorSummary>
          {/* Username */}
          <Field name="username" form={form} label="Username" placeholder="johndoe" />

          {/* Email */}
          <Field name="email" form={form} label="Email Address" type="email" placeholder="john@example.com" />

          {/* Password with strength meter */}
          <div style={{ marginBottom: '16px' }}>
            <Field name="password" form={form} label="Password" type="password" placeholder="Create a strong password" />
            {(formState.values.password as string)?.length > 0 && (
              <div style={{ marginTop: '-8px' }}>
                <div style={{ height: '4px', backgroundColor: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: pwStrength.width,
                      backgroundColor: pwStrength.color,
                      borderRadius: '2px',
                      transition: 'width 0.3s, background-color 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontSize: '12px', color: pwStrength.color, fontWeight: 500 }}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <Field name="confirmPassword" form={form} label="Confirm Password" type="password" placeholder="Repeat your password" />

          {/* Age and Website side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field name="age" form={form} label="Age" type="number" placeholder="25" />
            <Field name="website" form={form} label="Website" type="url" placeholder="https://yoursite.com" />
          </div>

          {/* Role select */}
          <Field name="role" form={form} label="Role" type="select">
            <option value="">Select a role...</option>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
            <option value="other">Other</option>
          </Field>

          {/* Bio textarea */}
          <Field name="bio" form={form} label="Bio" type="textarea" placeholder="Tell us about yourself..." />
          <div style={{ marginTop: '-12px', marginBottom: '16px', textAlign: 'right' }}>
            <span
              style={{
                fontSize: '12px',
                color: ((formState.values.bio as string) || '').length > 500 ? '#dc2626' : '#9ca3af',
              }}
            >
              {((formState.values.bio as string) || '').length}/500
            </span>
          </div>

          {/* Terms checkbox */}
          <Field name="terms" form={form} label="I agree to the Terms of Service and Privacy Policy" type="checkbox" />
          <ErrorMessage name="terms" form={form} />

          {/* Submit */}
          <button
            type="submit"
            disabled={formState.isSubmitting}
            style={{
              width: '100%',
              padding: '12px 16px',
              marginTop: '8px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: formState.isSubmitting ? '#93c5fd' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: formState.isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
            }}
          >
            {formState.isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </Form>
      </div>
    </div>
  );
}
