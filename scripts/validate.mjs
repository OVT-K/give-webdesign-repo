/**
 * Valida data/catalog.json contra data/catalog.schema.json (AJV).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const schema = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.schema.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

if (!validate(data)) {
  console.error('catalog.json inválido:');
  console.error(ajv.errorsText(validate.errors, { separator: '\n' }));
  process.exit(1);
}

console.log('catalog.json OK (schema v2020-12).');
