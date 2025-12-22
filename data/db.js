const mysql = require("mysql2");

const config = {
    db: {
        host: "localhost",
        user: "root",
        password: "root", 
        database: "ihale_db"
    }
};


let connection = mysql.createConnection(config.db);

connection.connect(function(err) {
    if(err) return console.log(err);
    console.log("MySQL server bağlantısı yapıldı");
});

module.exports = connection.promise(); 