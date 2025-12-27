const { DataTypes } = require('sequelize');
const sequelize = require("../data/connection"); 

const Tender = sequelize.define('Tenders', {
    // Tablodaki 'tender_id' sütunu (Primary Key)
    tender_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    // Başlık
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Açıklama
    description: {
        type: DataTypes.TEXT, // Uzun yazılar için TEXT kullanılır
        allowNull: false
    },
    // Başlangıç Fiyatı
    start_price: {
        type: DataTypes.DECIMAL(10, 2), // Para birimi için en uygunu
        allowNull: false
    },
    // Resim Adı
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Bitiş Tarihi
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    // Durum (Aktif/Pasif) - Varsayılan 1 (Aktif)
    status: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    }
    // NOT: Users_user_id (Yani ilanı kimin açtığı) ilişkisini 
    // bir sonraki adımda 'Association' ile kuracağız.
});

// Tabloyu veritabanıyla eşle
async function sync() {
    // force: false diyoruz ki içindeki mevcut ilanların silinmesin!
    await Tender.sync({ force: false }); 
    console.log("Tenders (İhaleler) tablosu senkronize edildi");
}
sync();

module.exports = Tender;