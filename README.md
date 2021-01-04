# formguard

> **[EN]** Lightweight form validation and sanitization library for Node.js — 30+ built-in rules, fluent schema builder, i18n messages and HTML sanitizers.
> **[FR]** Bibliothèque légère de validation et sanitisation de formulaires pour Node.js — plus de 30 règles intégrées, constructeur de schéma fluent, messages i18n et sanitiseurs HTML.

---

## Features / Fonctionnalités

**[EN]**
- 30+ built-in validation rules: required, email, url, minLength, maxLength, integer, numeric, phone, creditCard, uuid, ip, date, slug, strongPassword, oneOf, matches and more
- Fluent schema builder with method chaining (`createSchema().field().required().email()...`)
- Pipe-syntax string rules: `"required|email|maxLength:255"`
- Sanitizers: `escapeHtml`, `stripTags`, `slugify`, and generic `sanitize`
- Multi-locale error messages with `setLocale` / `registerLocale`
- `abortEarly` option to stop on first error per field
- Nested field support via dot notation (`"address.city"`)
- Returns `{ valid, errors }` — easy to plug into any HTTP framework

**[FR]**
- Plus de 30 règles de validation intégrées : required, email, url, minLength, maxLength, integer, numeric, phone, creditCard, uuid, ip, date, slug, strongPassword, oneOf, matches et plus encore
- Constructeur de schéma fluent avec chaînage de méthodes (`createSchema().field().required().email()...`)
- Règles de chaîne avec syntaxe pipe : `"required|email|maxLength:255"`
- Sanitiseurs : `escapeHtml`, `stripTags`, `slugify` et `sanitize` générique
- Messages d'erreur multi-locales avec `setLocale` / `registerLocale`
- Option `abortEarly` pour s'arrêter à la première erreur par champ
- Support des champs imbriqués via la notation pointée (`"address.city"`)
- Retourne `{ valid, errors }` — facile à brancher sur n'importe quel framework HTTP

---

## Installation

```bash
npm install @idirdev/formguard
```

---

## API (Programmatic) / API (Programmation)

### Object-rules style / Style règles objet

```js
const { validate, sanitize, escapeHtml, slugify } = require('@idirdev/formguard');

const body = { email: 'alice@example.com', age: '17', bio: '<script>bad</script>' };

const result = validate(body, {
  email: 'required|email',
  age:   'required|integer|min:18',
  bio:   'required|maxLength:500',
});

console.log(result.valid);         // false
console.log(result.errors.age);    // ['age must be at least 18']

// Sanitize before storing / Sanitiser avant de stocker
const cleanBio = escapeHtml(body.bio);   // &lt;script&gt;bad&lt;/script&gt;
const tag = slugify('Hello World!');     // 'hello-world'
```

### Fluent schema builder / Constructeur de schéma fluent

```js
const { createSchema, setLocale } = require('@idirdev/formguard');

setLocale('fr'); // switch to French messages / passer aux messages français

const schema = createSchema()
  .field('username').required().minLength(3).maxLength(32)
  .field('email').required().email()
  .field('password').required().strongPassword()
  .field('age').required().integer().min(13).max(120);

const { valid, errors } = schema.validate({
  username: 'id',
  email: 'not-an-email',
  password: 'weak',
  age: 10,
});

// errors.username → ['username must be at least 3 characters']
// errors.email    → ['email must be a valid email address']
// errors.password → ['password must be at least 8 characters with uppercase, lowercase, digit and symbol']
// errors.age      → ['age must be at least 13']
```

### Express middleware example / Exemple middleware Express

```js
app.post('/register', (req, res) => {
  const { valid, errors } = validate(req.body, {
    email:    'required|email',
    password: 'required|strongPassword',
    name:     'required|minLength:2|maxLength:80',
  });
  if (!valid) return res.status(422).json({ errors });
  // proceed...
});
```

---

## License

MIT — idirdev
