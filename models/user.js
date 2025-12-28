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
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false, // Telefon da zorunlu olsun
        unique: true
    },
    tckn: {
        type: DataTypes.STRING(11), // Standart 11 hane
        allowNull: false, // <--- ARTIK ZORUNLU (False yaptık)
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = User;