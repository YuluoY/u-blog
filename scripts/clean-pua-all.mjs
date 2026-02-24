import { createRequire } from 'module';
const require2 = createRequire(import.meta.url);
const { Pool } = require2('pg');
const pool = new Pool({ host: '127.0.0.1', port: 5432, user: 'ublog', password: 'Ublog2024!', database: 'ublog' });

const c = await pool.connect();
const { rows } = await c.query('SELECT id,title,content FROM article WHERE id < 37 ORDER BY id');
let n = 0;
for (const r of rows) {
  const orig = r.content;
  const fixed = orig.replace(/[\uE000-\uF8FF\u200B-\u200F\uFEFF]/g, '');
  if (fixed !== orig) {
    await c.query('UPDATE article SET content=$1 WHERE id=$2', [fixed, r.id]);
    n++;
    console.log(`#${r.id} ${r.title}: removed ${orig.length - fixed.length} hidden chars`);
  }
}
console.log(`Total fixed: ${n}`);
c.release();
pool.end();
