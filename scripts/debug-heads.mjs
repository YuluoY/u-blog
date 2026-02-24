import { Pool } from 'pg'
const pool = new Pool({host:'127.0.0.1',port:5432,user:'ublog',password:'Ublog2024!',database:'ublog'})
const client = await pool.connect()
const {rows} = await client.query("SELECT id, content FROM article WHERE id IN (39,40,42) ORDER BY id")
for (const r of rows) {
  const first80 = r.content.slice(0, 80)
  console.log(`#${r.id}:`, JSON.stringify(first80))
  // Test regex
  const re = /^-\s*上一章练习(?:题)?答案/
  console.log(`  ^match:`, re.test(r.content))
  // Check if content starts with newlines
  console.log(`  charCode[0]:`, r.content.charCodeAt(0), `char:`, JSON.stringify(r.content[0]))
}
client.release()
await pool.end()
