const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const Bid = sequelize.define('Bids', {
    // Teklif ID (Primary Key)
    bid_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    // Teklif Miktarı
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    // NOT: Hangi kullanıcı verdi (Users_user_id) ve Hangi ilana verdi (Tenders_tender_id)
    // bilgilerini birazdan 'index.js' dosyasında ilişki olarak tanımlayacağız.
});

// Tabloyu veritabanıyla eşle
async function sync() {
    await Bid.sync({ force: false }); 
    console.log("Bids (Teklifler) tablosu senkronize edildi");
}
sync();

module.exports = Bid;