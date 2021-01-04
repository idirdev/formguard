'use strict';

/**
 * @file formguard.test.js
 * @description Tests for formguard: validators, sanitizers, schema, locale.
 * @author idirdev
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  setLocale, getLocale,
  validate, validateField, createSchema,
  sanitize, escapeHtml, stripTags, slugify, trim, normalizeEmail,
  VALIDATORS,
} = require('../src/index.js');

// Reset locale before each test group that touches it
function resetLocale() { setLocale('en'); }

// ---------------------------------------------------------------------------
// Individual validators
// ---------------------------------------------------------------------------

describe('VALIDATORS.required', () => {
  it('fails for null', () => assert.equal(VALIDATORS.required(null), false));
  it('fails for undefined', () => assert.equal(VALIDATORS.required(undefined), false));
  it('fails for empty string', () => assert.equal(VALIDATORS.required(''), false));
  it('fails for whitespace-only string', () => assert.equal(VALIDATORS.required('   '), false));
  it('passes for non-empty string', () => assert.equal(VALIDATORS.required('hello'), true));
  it('passes for number 0', () => assert.equal(VALIDATORS.required(0), true));
  it('passes for false boolean', () => assert.equal(VALIDATORS.required(false), true));
  it('fails for empty array', () => assert.equal(VALIDATORS.required([]), false));
  it('passes for non-empty array', () => assert.equal(VALIDATORS.required([1]), true));
});

describe('VALIDATORS.email', () => {
  it('passes for valid email', () => assert.equal(VALIDATORS.email('user@example.com'), true));
  it('fails for missing @', () => assert.equal(VALIDATORS.email('notanemail'), false));
  it('fails for missing domain', () => assert.equal(VALIDATORS.email('user@'), false));
  it('passes for empty value (not required)', () => assert.equal(VALIDATORS.email(''), true));
  it('passes for null (not required)', () => assert.equal(VALIDATORS.email(null), true));
});

describe('VALIDATORS.url', () => {
  it('passes for https URL', () => assert.equal(VALIDATORS.url('https://example.com'), true));
  it('passes for http URL with path', () => assert.equal(VALIDATORS.url('http://foo.bar/path?q=1'), true));
  it('fails for plain string without protocol', () => assert.equal(VALIDATORS.url('example.com'), false));
  it('passes for empty value', () => assert.equal(VALIDATORS.url(''), true));
});

describe('VALIDATORS.min / max', () => {
  it('min passes when value equals threshold', () => assert.equal(VALIDATORS.min(5, '5'), true));
  it('min fails when value is below threshold', () => assert.equal(VALIDATORS.min(2, '5'), false));
  it('max passes when value equals threshold', () => assert.equal(VALIDATORS.max(10, '10'), true));
  it('max fails when value exceeds threshold', () => assert.equal(VALIDATORS.max(11, '10'), false));
  it('min passes for empty value', () => assert.equal(VALIDATORS.min('', '5'), true));
});

describe('VALIDATORS.minLength / maxLength', () => {
  it('minLength passes when length equals threshold', () => assert.equal(VALIDATORS.minLength('abc', '3'), true));
  it('minLength fails when too short', () => assert.equal(VALIDATORS.minLength('ab', '3'), false));
  it('maxLength passes when length equals threshold', () => assert.equal(VALIDATORS.maxLength('abc', '3'), true));
  it('maxLength fails when too long', () => assert.equal(VALIDATORS.maxLength('abcd', '3'), false));
});

describe('VALIDATORS.numeric / alpha / alphanumeric', () => {
  it('numeric passes for integer string', () => assert.equal(VALIDATORS.numeric('42'), true));
  it('numeric passes for float string', () => assert.equal(VALIDATORS.numeric('3.14'), true));
  it('numeric fails for non-numeric', () => assert.equal(VALIDATORS.numeric('abc'), false));
  it('alpha passes for letters only', () => assert.equal(VALIDATORS.alpha('Hello'), true));
  it('alpha fails when digits included', () => assert.equal(VALIDATORS.alpha('Hello1'), false));
  it('alphanumeric passes for mixed', () => assert.equal(VALIDATORS.alphanumeric('abc123'), true));
  it('alphanumeric fails for special chars', () => assert.equal(VALIDATORS.alphanumeric('abc!'), false));
});

describe('VALIDATORS.regex', () => {
  it('passes when regex matches', () => assert.equal(VALIDATORS.regex('abc123', '^[a-z0-9]+$'), true));
  it('fails when regex does not match', () => assert.equal(VALIDATORS.regex('ABC', '^[a-z]+$'), false));
  it('accepts RegExp object', () => assert.equal(VALIDATORS.regex('foo', /^foo$/), true));
});

describe('VALIDATORS.in', () => {
  it('passes when value is in list', () => assert.equal(VALIDATORS.in('red', 'red,green,blue'), true));
  it('fails when value not in list', () => assert.equal(VALIDATORS.in('yellow', 'red,green,blue'), false));
  it('passes with array arg', () => assert.equal(VALIDATORS.in('b', ['a', 'b', 'c']), true));
  it('passes for empty value', () => assert.equal(VALIDATORS.in('', 'a,b'), true));
});

// ---------------------------------------------------------------------------
// validateField
// ---------------------------------------------------------------------------

describe('validateField()', () => {
  it('returns valid=true when all rules pass', () => {
    const r = validateField('user@test.com', 'required|email');
    assert.equal(r.valid, true);
    assert.equal(r.errors.length, 0);
  });

  it('returns errors for failing rules', () => {
    const r = validateField('', 'required|email', 'email');
    assert.equal(r.valid, false);
    assert.ok(r.errors.length >= 1);
    assert.ok(r.errors[0].includes('email'));
  });

  it('parses min:arg from pipe syntax', () => {
    const r = validateField('2', 'min:5', 'age');
    assert.equal(r.valid, false);
    assert.ok(r.errors[0].includes('age'));
  });

  it('skips unknown rules silently', () => {
    const r = validateField('hello', 'required|unknownrule');
    assert.equal(r.valid, true);
  });
});

// ---------------------------------------------------------------------------
// validate()
// ---------------------------------------------------------------------------

describe('validate()', () => {
  it('validates a complete schema successfully', () => {
    const r = validate(
      { username: 'alice', email: 'alice@example.com', age: '25' },
      { username: 'required|minLength:3', email: 'required|email', age: 'numeric|min:18' }
    );
    assert.equal(r.valid, true);
    assert.equal(r.errors.length, 0);
  });

  it('collects errors for multiple failing fields', () => {
    const r = validate(
      { username: '', email: 'not-an-email' },
      { username: 'required', email: 'required|email' }
    );
    assert.equal(r.valid, false);
    assert.equal(r.errors.length, 2);
    const fields = r.errors.map(e => e.field);
    assert.ok(fields.includes('username'));
    assert.ok(fields.includes('email'));
  });

  it('treats missing fields as null (fails required)', () => {
    const r = validate({}, { name: 'required' });
    assert.equal(r.valid, false);
    assert.equal(r.errors[0].field, 'name');
  });

  it('throws TypeError when data is not an object', () => {
    assert.throws(() => validate(null, {}), TypeError);
    assert.throws(() => validate('string', {}), TypeError);
  });
});

// ---------------------------------------------------------------------------
// createSchema()
// ---------------------------------------------------------------------------

describe('createSchema()', () => {
  it('returns an object with a validate method', () => {
    const s = createSchema({ email: 'required|email' });
    assert.equal(typeof s.validate, 'function');
  });

  it('schema.validate() delegates to validate()', () => {
    const s = createSchema({ email: 'required|email' });
    const r = s.validate({ email: 'bad' });
    assert.equal(r.valid, false);
  });

  it('throws TypeError for non-object definition', () => {
    assert.throws(() => createSchema(null), TypeError);
  });
});

// ---------------------------------------------------------------------------
// Locale switching
// ---------------------------------------------------------------------------

describe('setLocale()', () => {
  beforeEach(resetLocale);

  it('default locale is en', () => assert.equal(getLocale(), 'en'));

  it('switches to fr and produces French messages', () => {
    setLocale('fr');
    const r = validateField('', 'required', 'nom');
    assert.equal(r.valid, false);
    assert.ok(r.errors[0].includes('nom'));
    assert.ok(r.errors[0].includes('obligatoire'));
  });

  it('throws for unsupported locale', () => {
    assert.throws(() => setLocale('de'), /Unsupported locale/);
  });

  it('can switch back to en', () => {
    setLocale('fr');
    setLocale('en');
    assert.equal(getLocale(), 'en');
    const r = validateField('', 'required', 'name');
    assert.ok(r.errors[0].includes('required'));
  });
});

// ---------------------------------------------------------------------------
// Sanitizers
// ---------------------------------------------------------------------------

describe('escapeHtml()', () => {
  it('escapes all special HTML chars', () => {
    assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });
  it('escapes single quotes', () => assert.ok(escapeHtml("it's").includes('&#x27;')));
  it('escapes ampersands', () => assert.equal(escapeHtml('a & b'), 'a &amp; b'));
  it('handles non-string input', () => assert.equal(typeof escapeHtml(42), 'string'));
});

describe('stripTags()', () => {
  it('removes HTML tags', () => assert.equal(stripTags('<b>Hello</b>'), 'Hello'));
  it('removes multiple tags', () => assert.equal(stripTags('<p>Hello <strong>world</strong></p>'), 'Hello world'));
  it('returns plain string unchanged', () => assert.equal(stripTags('no tags'), 'no tags'));
});

describe('slugify()', () => {
  it('lowercases and hyphenates', () => assert.equal(slugify('Hello World'), 'hello-world'));
  it('removes special characters', () => assert.equal(slugify('Hello, World!'), 'hello-world'));
  it('handles multiple spaces', () => assert.equal(slugify('foo   bar'), 'foo-bar'));
  it('strips accented characters', () => assert.equal(slugify('Héllo'), 'hello'));
});

describe('trim()', () => {
  it('trims whitespace', () => assert.equal(trim('  hello  '), 'hello'));
  it('returns empty string for null', () => assert.equal(trim(null), ''));
  it('returns empty string for undefined', () => assert.equal(trim(undefined), ''));
});

describe('normalizeEmail()', () => {
  it('lowercases and trims', () => assert.equal(normalizeEmail('  User@Example.COM  '), 'user@example.com'));
  it('handles non-string', () => assert.equal(normalizeEmail(42), ''));
});

describe('sanitize()', () => {
  it('trims fields', () => {
    const r = sanitize({ name: '  Alice  ' }, { name: 'trim' });
    assert.equal(r.name, 'Alice');
  });

  it('escapes HTML in fields', () => {
    const r = sanitize({ comment: '<b>hi</b>' }, { comment: 'escape' });
    assert.ok(r.comment.includes('&lt;'));
  });

  it('applies array of sanitizers in order', () => {
    const r = sanitize({ name: '  <b>Alice</b>  ' }, { name: ['trim', 'stripTags'] });
    assert.equal(r.name, 'Alice');
  });

  it('does not mutate the original object', () => {
    const original = { name: ' test ' };
    sanitize(original, { name: 'trim' });
    assert.equal(original.name, ' test ');
  });

  it('slugifies a field', () => {
    const r = sanitize({ slug: 'My Post Title!' }, { slug: 'slugify' });
    assert.equal(r.slug, 'my-post-title');
  });
});
