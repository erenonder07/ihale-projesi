const Sequelize = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,     
  process.env.DB_USER,     
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      dateStrings: true, // Tarihi olduğu gibi (string) al
      typeCast: true     // Değiştirme yapma
    },
    define: {
      timestamps: false
    }
  }
);

module.exports = sequelize;
