const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 


const Bid = sequelize.define('Bids', {
    bid_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false, // bos geçilemez
        primaryKey: true  //unique
    },

    amount: {
        type: DataTypes.DECIMAL(10, 2),  //10basamak-2ondalık
        allowNull: false    
    }
});

module.exports = Bid;