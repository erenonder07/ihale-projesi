const mysql = require('mysql2');
const config = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
  }
};

let connection = mysql.createConnection(config.db);

connection.connect(function(err) {
    if(err) return console.log(err);
    console.log("MySQL server bağlantısı yapıldı");
});

module.exports = connection.promise(); 