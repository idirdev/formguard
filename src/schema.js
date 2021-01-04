'use strict';
const { validate: run } = require('./validators');
class Schema {
  constructor() { this._f = {}; this._c = null; }
  field(n) { this._c = n; this._f[n] = []; return this; }
  required() { this._f[this._c].push({ name: 'required', params: [] }); return this; }
  email() { this._f[this._c].push({ name: 'email', params: [] }); return this; }
  minLength(n) { this._f[this._c].push({ name: 'minLength', params: [n] }); return this; }
  maxLength(n) { this._f[this._c].push({ name: 'maxLength', params: [n] }); return this; }
  min(n) { this._f[this._c].push({ name: 'min', params: [n] }); return this; }
  max(n) { this._f[this._c].push({ name: 'max', params: [n] }); return this; }
  integer() { this._f[this._c].push({ name: 'integer', params: [] }); return this; }
  strongPassword() { this._f[this._c].push({ name: 'strongPassword', params: [] }); return this; }
  validate(data, opts) { return run(data, this._f, opts); }
}
module.exports = { createSchema: () => new Schema(), Schema };