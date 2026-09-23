// manual db init
const db = require('./db');

const { count } = db.prepare('SELECT COUNT(*) AS count FROM capsules').get();
console.log(`Database ready at ${db.dbPath} (${count} capsule records)`);
db.close();
