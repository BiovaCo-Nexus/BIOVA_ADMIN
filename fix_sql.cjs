const fs = require('fs');
let sql = fs.readFileSync('supabase/organization_setup.sql', 'utf-8');
sql = sql.replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
fs.writeFileSync('supabase/organization_setup.sql', sql);
console.log("Fixed SQL");
