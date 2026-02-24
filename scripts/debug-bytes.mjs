import { Pool } from 'pg'
const pool = new Pool({host:'127.0.0.1',port:5432,user:'ublog',password:'Ublog2024!',database:'ublog'})
const client = await pool.connect()
const { rows } = await client.query('SELECT id, content FROM article WHERE id = 39')
const c = rows[0].content
// Print first 30 char codes
const codes = []
for (let i = 0; i < Math.min(30, c.length); i++) {
  codes.push({ i, char: c[i], code: c.charCodeAt(i), hex: '0x' + c.charCodeAt(i).toString(16) })
}
console.log(JSON.stringify(codes, null, 2))
console.log('startsWith dash:', c.startsWith('-'))
console.log('startsWith "- ":', c.startsWith('- '))
console.log('indexOf "上一章":', c.indexOf('上一章'))
client.release()
await pool.end()
