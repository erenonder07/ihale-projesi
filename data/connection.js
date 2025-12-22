const Sequelize = require('sequelize');

// Render Environment değişkenlerini kullanarak bağlantı oluşturuyoruz
const sequelize = new Sequelize(
  process.env.DB_NAME,     // Veritabanı adı (Environment'tan)
  process.env.DB_USER,     // Kullanıcı adı (Environment'tan)
  process.env.DB_PASSWORD, // Şifre (Environment'tan)
  {
    host: process.env.DB_HOST, // Host adresi
    port: process.env.DB_PORT, // Port (20540)
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Aiven gibi bulut sağlayıcılar için SSL ayarı
      }
    },
    define: {
      timestamps: false // Senin ayarın
    }
  }
);

module.exports = sequelize;