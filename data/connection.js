const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,     
  process.env.DB_USER,     
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    dialect: 'mysql',
    timezone: '+03:00', // Türkiye saati (MySQL oturumu için)
    dialectOptions: {
      ssl: {
        require: true,            // Aiven için zorunlu güvenlik ayarı
        rejectUnauthorized: false 
      },
      dateStrings: true, 
      typeCast: true
    },
    define: {
      timestamps: false
    }
  }
);

module.exports = sequelize;