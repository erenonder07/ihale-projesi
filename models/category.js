const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const Category = sequelize.define('Categories', {
    category_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

async function sync() {
    await Category.sync({ force: false });
}
sync();

module.exports = Category;