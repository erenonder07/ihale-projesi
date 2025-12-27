const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const Tender = sequelize.define('Tenders', {
    tender_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT, 
        allowNull: false
    },
    start_price: {
        type: DataTypes.DECIMAL(10, 2), 
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
});

module.exports = Tender;