import Papa from 'papaparse';
import fs from 'fs';
const csv = fs.readFileSync('products-to-import.csv','utf8');
const res = Papa.parse(csv, { header: true, skipEmptyLines: true });
const rows = res.data;
let added = 0, failed = 0;
(async () => {
  for (let i=0;i<rows.length;i++){
    const row = rows[i];
    if (!row.name || !row.price || !row.category) { console.log(i+1,'skipped - missing required fields'); failed++; continue; }
    const items = row.items ? String(row.items).split(/[,;]+/).map(s=>s.trim()).filter(Boolean) : undefined;
    const payload = {
      name: row.name,
      price: Number(row.price),
      originalPrice: row.originalPrice? Number(row.originalPrice) : undefined,
      image: row.image && String(row.image).trim() ? String(row.image).trim() : '/placeholder.svg',
      category: row.category,
      description: row.description || undefined,
      items
    };
    try {
      const r = await fetch('http://localhost:4000/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = await r.text();
      let body = text;
      try { body = JSON.parse(text); } catch(e){}
      if (!r.ok) {
        console.log(i+1,'FAILED',r.status, r.statusText, body);
        failed++;
      } else {
        console.log(i+1,'OK', (body && body.id) ? body.id : body);
        added++;
      }
    } catch (e) {
      console.log(i+1,'ERROR', String(e));
      failed++;
    }
  }
  console.log('SUMMARY', { added, failed, total: rows.length });
})();
