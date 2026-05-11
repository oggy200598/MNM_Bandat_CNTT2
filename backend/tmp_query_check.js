require('dotenv').config({path:__dirname+'/.env'});
const {Pool}=require('pg');
const pool=new Pool({user:process.env.DB_USER,host:process.env.DB_HOST,database:process.env.DB_NAME,password:process.env.DB_PASSWORD,port:process.env.DB_PORT});
(async()=>{
  for (const sql of [
    'select id,title,location::text as location from properties_property limit 1',
    'select id,name,location::text as location from accounts_agent limit 1',
    'select id,name,location::text as location from properties_amenity limit 1'
  ]) {
    try { const r=await pool.query(sql); console.log(sql, r.rows); }
    catch(e){ console.error(sql, e.message); }
  }
  await pool.end();
})();
