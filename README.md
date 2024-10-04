# FormGuard

[![npm version](https://img.shields.io/npm/v/@idirdev/formguard)](https://www.npmjs.com/package/@idirdev/formguard)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@idirdev/formguard)](https://bundlephobia.com/package/@idirdev/formguard)

Lightweight React form validation library. Simple API, powerful validation, zero headaches.

## Features

- **Declarative validation** -- define rules alongside field configs
- **Built-in validators** -- required, email, minLength, pattern, and more
- **Cross-field validation** -- password confirmation, conditional rules
- **Touched/dirty tracking** -- show errors only when appropriate
- **Accessible** -- ARIA attributes, error focus management, screen reader support
- **TypeScript first** -- full type safety throughout
- **Component & hook APIs** -- use the `<Form>` / `<Field>` components or go headless with `useForm`
- **Zero dependencies** -- only React as a peer dependency

## Installation

```bash
npm install @idirdev/formguard
```

## Quick Start

```tsx
import { useForm, Form, Field, required, email, minLength } from '@idirdev/formguard';

function LoginForm() {
  const form = useForm({
    fields: [
      { name: 'email', validations: [required(), email()] },
      { name: 'password', validations: [required(), minLength(8)] },
    ],
    onSubmit: async (values) => {
      await login(values.email, values.password);
    },
  });

  return (
    <Form form={form} showErrorSummary>
      <Field name="email" form={form} label="Email" type="email" />
      <Field name="password" form={form} label="Password" type="password" />
      <button type="submit">Sign In</button>
    </Form>
  );
}
```

## Built-in Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `required(msg?)` | Value must not be empty | `required('Email is required')` |
| `minLength(n, msg?)` | Minimum string length | `minLength(8)` |
| `maxLength(n, msg?)` | Maximum string length | `maxLength(100)` |
| `pattern(regex, msg?)` | Must match regex | `pattern(/^[A-Z]/, 'Must start uppercase')` |
| `email(msg?)` | Valid email format | `email()` |
| `min(n, msg?)` | Minimum numeric value | `min(18, 'Must be 18+')` |
| `max(n, msg?)` | Maximum numeric value | `max(120)` |
| `url(msg?)` | Valid URL format | `url()` |
| `matches(field, msg?)` | Must match another field | `matches('password', 'Passwords must match')` |
| `oneOf(values, msg?)` | Must be in allowed list | `oneOf(['admin', 'user'])` |
| `custom(name, fn, msg?)` | Custom validation logic | `custom('unique', checkUnique)` |

## Headless Usage (Hook Only)

```tsx
import { useForm, required } from '@idirdev/formguard';

function MyForm() {
  const { register, handleSubmit, formState, getError } = useForm({
    fields: [
      { name: 'name', validations: [required()] },
    ],
    onSubmit: (values) => console.log(values),
  });

  return (
    <form onSubmit={handleSubmit}>
      <input {...register('name')} />
      {getError('name') && <span>{getError('name')}</span>}
      <button type="submit" disabled={formState.isSubmitting}>Submit</button>
    </form>
  );
}
```

## API Reference

### useForm(options)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fields` | `FieldConfig[]` | required | Field configurations |
| `onSubmit` | `(values) => void \| Promise` | required | Submit handler |
| `validateOnSubmit` | `boolean` | `true` | Validate all fields on submit |
| `resetOnSubmit` | `boolean` | `false` | Reset form after successful submit |

**Returns:** `{ register, handleSubmit, formState, setValue, setError, clearError, clearErrors, reset, validateField, validateAll, getError, isTouched, isDirtyField }`

### FieldConfig

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Field name/key |
| `label` | `string` | Display label |
| `type` | `InputType` | Input type |
| `defaultValue` | `unknown` | Initial value |
| `validations` | `ValidationRule[]` | Validation rules |
| `validateOnBlur` | `boolean` | Validate on blur (default: true) |
| `validateOnChange` | `boolean` | Validate on change (default: false) |

### Components

- `<Form form={form}>` -- Form wrapper with optional error summary
- `<Field name="..." form={form}>` -- Input with label and error display
- `<ErrorMessage name="..." form={form}>` -- Standalone error message

## License

MIT

---

## 🇫🇷 Documentation en français

### Description
FormGuard est une bibliothèque légère de validation de formulaires React. Elle propose une API déclarative, des validateurs intégrés (required, email, minLength, pattern, etc.), la validation croisée entre champs, et un support complet de TypeScript. Aucune dépendance externe — uniquement React en peer dependency.

### Installation
```bash
npm install @idirdev/formguard
```

### Utilisation
```tsx
import { useForm, Form, Field, required, email, minLength } from '@idirdev/formguard';

function LoginForm() {
  const form = useForm({
    fields: [
      { name: 'email', validations: [required(), email()] },
      { name: 'password', validations: [required(), minLength(8)] },
    ],
    onSubmit: async (values) => { await login(values); },
  });

  return (
    <Form form={form}>
      <Field name="email" form={form} label="Email" type="email" />
      <Field name="password" form={form} label="Mot de passe" type="password" />
      <button type="submit">Connexion</button>
    </Form>
  );
}
```

Consultez la section **API Reference** et **Built-in Validators** ci-dessus pour la documentation complète.

