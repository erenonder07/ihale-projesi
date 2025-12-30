const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,     
  process.env.DB_USER,     
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    dialect: 'mysql',
    timezone: '+03:00', 
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Aiven 
      },
      // Tarihlerin string olarak değil, doğru saat dilimiyle gelmesi için ek önlem:
      dateStrings: true,
      typeCast: true
    },
    define: {
      timestamps: false // tarih
    }
  }
);

module.exports = sequelize;