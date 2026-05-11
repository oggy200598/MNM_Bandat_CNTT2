require('dotenv').config({path:__dirname+'/.env'});
const {Pool}=require('pg');
const pool=new Pool({user:process.env.DB_USER,host:process.env.DB_HOST,database:process.env.DB_NAME,password:process.env.DB_PASSWORD,port:process.env.DB_PORT});
(async()=>{
  for (const table of ['properties_property','accounts_agent','properties_amenity']) {
    const r=await pool.query(`select column_name,data_type,udt_name from information_schema.columns where table_name=$1 order by ordinal_position`,[table]);
    console.log('\n'+table);
    console.table(r.rows);
  }
  await pool.end();
})().catch(e=>{console.error(e);process.exit(1)});
