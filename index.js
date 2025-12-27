const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");

// Rotalar
const authRoutes = require("./routes/auth"); 
const ihaleRoutes = require("./routes/ihale");

// Modeller (Hocanın notlarına uygun)
const User = require("./models/user");
const Tender = require("./models/tender");
const Bid = require("./models/bid"); // YENİ: Teklif Modelini ekledik
const sequelize = require("./data/connection");

app.set('view engine', 'ejs'); 
app.use(express.urlencoded({ extended: true })); 

// Session Ayarları
app.use(session({
    secret: "cok_gizli_bir_anahtar_kelime", 
    resave: false,
    saveUninitialized: true
}));

app.use("/libs", express.static(path.join(__dirname, "node_modules")));
app.use("/static", express.static(path.join(__dirname, "public")));

// --- TABLO İLİŞKİLERİ (ASSOCIATIONS) ---

// 1. Kullanıcı - İhale İlişkisi (User -> Tenders)
User.hasMany(Tender, {
    foreignKey: 'Users_user_id', 
    onDelete: "CASCADE"
});
Tender.belongsTo(User, { foreignKey: 'Users_user_id' });

// 2. Kullanıcı - Teklif İlişkisi (User -> Bids)
User.hasMany(Bid, {
    foreignKey: 'Users_user_id',
    onDelete: "CASCADE"
});
Bid.belongsTo(User, { foreignKey: 'Users_user_id' });

// 3. İhale - Teklif İlişkisi (Tender -> Bids)
Tender.hasMany(Bid, {
    foreignKey: 'Tenders_tender_id',
    onDelete: "CASCADE" // İhale silinirse teklifleri de silinsin
});
Bid.belongsTo(Tender, { foreignKey: 'Tenders_tender_id' });


// Veritabanını Senkronize Et
async function syncDatabase() {
    try {
        await sequelize.sync({ force: false });
        console.log("✅ Tüm Tablolar ve İlişkiler senkronize edildi.");
    } catch (err) {
        console.error("❌ Senkronizasyon Hatası:", err);
    }
}
syncDatabase();

// Rotaları Aktif Et
app.use(authRoutes); 
app.use(ihaleRoutes); 

const PORT = process.env.PORT || 20540; 
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor port: ${PORT}`);
});