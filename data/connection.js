const Sequelize = require('sequelize');

// Veritabanı adı, Kullanıcı adı, Şifre
const sequelize = new Sequelize('ihale_db', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',
    define: {
        timestamps: false // CreatedAt gibi otomatik tarihleri kapatıyoruz şimdilik
    }
});

module.exports = sequelize;