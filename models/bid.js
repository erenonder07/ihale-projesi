const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const Bid = sequelize.define('Bids', {
    bid_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
});

module.exports = Bid;