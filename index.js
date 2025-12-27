const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");

// Rotalarımızı çağırıyoruz
const authRoutes = require("./routes/auth"); 
const ihaleRoutes = require("./routes/ihale");

// Modellerimizi çağırıyoruz (Hocanın notlarına uygun)
const User = require("./models/user");
const Tender = require("./models/tender");
const sequelize = require("./data/connection"); // Veritabanı bağlantımız

// Görüntü Motoru Ayarı
app.set('view engine', 'ejs'); 
app.use(express.urlencoded({ extended: true })); 

// Session Ayarları
app.use(session({
    secret: "cok_gizli_bir_anahtar_kelime", 
    resave: false,
    saveUninitialized: true
}));

// Statik Dosyalar
app.use("/libs", express.static(path.join(__dirname, "node_modules")));
app.use("/static", express.static(path.join(__dirname, "public")));

// --- TABLO İLİŞKİLERİ (ASSOCIATIONS) ---
// Hocanın notlarındaki 'One to Many' yapısına tam uyumlu kısım:

// 1. Bir Kullanıcının ÇOK İhalesi olabilir (hasMany)
User.hasMany(Tender, {
    foreignKey: {
        name: 'Users_user_id', // İhale tablosunda kullanıcıyı tutacak sütun
        allowNull: false
    },
    // Kullanıcı silinirse ihaleleri de silinsin (CASCADE)
    onDelete: "CASCADE", 
    onUpdate: "RESTRICT"
});

// 2. Bir İhale TEK BİR Kullanıcıya aittir (belongsTo)
Tender.belongsTo(User, {
    foreignKey: 'Users_user_id'
});

// Veritabanını Senkronize Et (İlişkileri Kur)
async function syncDatabase() {
    try {
        // force: false -> Mevcut verileri silmeden tabloları güncelle
        await sequelize.sync({ force: false });
        console.log("✅ Tablolar ve İlişkiler başarıyla senkronize edildi.");
    } catch (err) {
        console.error("❌ Senkronizasyon Hatası:", err);
    }
}
syncDatabase();

// Rotaları Kullanıma Al
app.use(authRoutes); 
app.use(ihaleRoutes); 

const PORT = process.env.PORT || 20540; 
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor port: ${PORT}`);
});