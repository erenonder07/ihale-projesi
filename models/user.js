const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const User = sequelize.define('Users', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // <-- AYNI E-POSTA İLE KAYIT ENGELLENDİ
        validate: {
            isEmail: true // E-posta formatını kontrol eder
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true // <-- AYNI TELEFON İLE KAYIT ENGELLENDİ
    },
    tckn: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true // <-- AYNI TC İLE KAYIT ENGELLENDİ
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = User;