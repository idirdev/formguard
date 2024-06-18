/**
 * Supported input types for form fields.
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file';

/**
 * A single validation rule that can be applied to a field.
 */
export interface ValidationRule {
  /** The name of the validator (e.g., 'required', 'minLength') */
  name: string;
  /** The validation function. Returns an error message string if invalid, or null/undefined if valid. */
  validate: (value: unknown, formValues: Record<string, unknown>) => string | null | undefined;
  /** The error message to display. Overrides the message returned by `validate`. */
  message?: string;
}

/**
 * Configuration for a single form field.
 */
export interface FieldConfig {
  /** The name/key of the field */
  name: string;
  /** The label text for the field */
  label?: string;
  /** The input type */
  type?: InputType;
  /** Initial/default value */
  defaultValue?: unknown;
  /** Placeholder text */
  placeholder?: string;
  /** Array of validation rules */
  validations?: ValidationRule[];
  /** Whether to validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Whether to validate on change (default: false) */
  validateOnChange?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
}

/**
 * Error map keyed by field name.
 */
export type FormErrors = Record<string, string | undefined>;

/**
 * The state of the entire form.
 */
export interface FormState {
  /** Current values of all fields */
  values: Record<string, unknown>;
  /** Current validation errors */
  errors: FormErrors;
  /** Which fields have been focused and blurred */
  touched: Record<string, boolean>;
  /** Which fields have been modified from their default value */
  dirty: Record<string, boolean>;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Whether the form has been submitted at least once */
  isSubmitted: boolean;
  /** Whether all fields are valid (no errors) */
  isValid: boolean;
  /** Whether any field is dirty */
  isDirty: boolean;
}

/**
 * Props returned by `register` to spread on an input element.
 */
export interface RegisterReturn {
  name: string;
  value: unknown;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Options for the useForm hook.
 */
export interface UseFormOptions {
  /** Field configurations */
  fields: FieldConfig[];
  /** Submit handler called with validated values */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Whether to validate all fields on submit (default: true) */
  validateOnSubmit?: boolean;
  /** Whether to reset the form after successful submission (default: false) */
  resetOnSubmit?: boolean;
}

/**
 * Return type of the useForm hook.
 */
export interface UseFormReturn {
  /** Register a field -- spread the result on an input element */
  register: (name: string) => RegisterReturn;
  /** Handle form submission */
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  /** Current form state */
  formState: FormState;
  /** Set a specific field's value programmatically */
  setValue: (name: string, value: unknown) => void;
  /** Set a specific field's error programmatically */
  setError: (name: string, message: string) => void;
  /** Clear a specific field's error */
  clearError: (name: string) => void;
  /** Clear all errors */
  clearErrors: () => void;
  /** Reset the entire form to initial values */
  reset: () => void;
  /** Validate a single field and return its error */
  validateField: (name: string) => string | undefined;
  /** Validate all fields and return errors map */
  validateAll: () => FormErrors;
  /** Get the error for a specific field */
  getError: (name: string) => string | undefined;
  /** Check if a specific field has been touched */
  isTouched: (name: string) => boolean;
  /** Check if a specific field is dirty */
  isDirtyField: (name: string) => boolean;
}

/**
 * Props for the Form component.
 */
export interface FormProps {
  /** The useForm return object */
  form: UseFormReturn;
  /** Children elements */
  children: React.ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Whether to show a global error summary */
  showErrorSummary?: boolean;
  /** Disable the native browser validation */
  noValidate?: boolean;
}

/**
 * Props for the Field component.
 */
export interface FieldProps {
  /** Field name (must match a registered field) */
  name: string;
  /** The useForm return object */
  form: UseFormReturn;
  /** Override the label */
  label?: string;
  /** Override the input type */
  type?: InputType;
  /** Override the placeholder */
  placeholder?: string;
  /** Additional CSS class for the field wrapper */
  className?: string;
  /** Children for select fields (option elements) */
  children?: React.ReactNode;
  /** Custom render function for the input */
  renderInput?: (props: RegisterReturn, error?: string) => React.ReactNode;
}

/**
 * Props for the ErrorMessage component.
 */
export interface ErrorMessageProps {
  /** Field name */
  name: string;
  /** The useForm return object */
  form: UseFormReturn;
  /** CSS class for the error container */
  className?: string;
  /** Custom render function */
  render?: (message: string) => React.ReactNode;
}
