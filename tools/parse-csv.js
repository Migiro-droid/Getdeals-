import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
const file = path.join(process.cwd(), 'products-to-import.csv');
const csv = fs.readFileSync(file, 'utf8');
const res = Papa.parse(csv, { header: true, skipEmptyLines: true });
console.log('fields:', res.meta.fields);
console.log('first row:', res.data[0]);
console.log('row count:', res.data.length);
if (res.errors && res.errors.length) {
  console.log('parse errors:', res.errors.slice(0,5));
}
