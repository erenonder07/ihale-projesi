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
        rejectUnauthorized: false
      },
      dateStrings: true, // Tarihleri doğru formatta tutar
      typeCast: true
    },
    define: {
      timestamps: false
    }
  }
);

module.exports = sequelize;
