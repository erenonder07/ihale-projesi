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
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    tckn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Tabloyu veritabanıyla eşle
// force: false diyoruz ki içindeki veriler silinmesin!
async function sync() {
    await User.sync({ force: false }); 
    console.log("Users tablosu eklendi");
}
sync();

module.exports = User;