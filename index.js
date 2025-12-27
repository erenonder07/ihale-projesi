const express = require("express");
const app = express();
const path = require("path");
const session = require("express-session");

// Rotalar
const authRoutes = require("./routes/auth"); 
const ihaleRoutes = require("./routes/ihale");

// Modeller
const User = require("./models/user");
const Tender = require("./models/tender");
const Bid = require("./models/bid");
const Category = require("./models/category"); // Kategori Modeli
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

// --- TABLO İLİŞKİLERİ ---

// 1. Kullanıcı - İhale İlişkisi
User.hasMany(Tender, { foreignKey: 'Users_user_id', onDelete: "CASCADE" });
Tender.belongsTo(User, { foreignKey: 'Users_user_id' });

// 2. Kullanıcı - Teklif İlişkisi
User.hasMany(Bid, { foreignKey: 'Users_user_id', onDelete: "CASCADE" });
Bid.belongsTo(User, { foreignKey: 'Users_user_id' });

// 3. İhale - Teklif İlişkisi
Tender.hasMany(Bid, { foreignKey: 'Tenders_tender_id', onDelete: "CASCADE" });
Bid.belongsTo(Tender, { foreignKey: 'Tenders_tender_id' });

// 4. Kategori - İhale İlişkisi
Category.hasMany(Tender, { 
    foreignKey: 'Categories_category_id', 
    onDelete: "SET NULL" 
});
Tender.belongsTo(Category, { foreignKey: 'Categories_category_id' });


// --- VERİTABANI SENKRONİZASYONU ---
async function syncDatabase() {
    try {
        await sequelize.sync({ alter: true });   //burası önemli dikkat
        console.log("✅ Tablolar senkronize edildi.");

        // Kategorileri Kontrol Et ve Doldur
        const count = await Category.count();
        if(count === 0) {
            await Category.bulkCreate([
                { name: "Elektronik" },
                { name: "Vasıta" },
                { name: "Emlak & Konut" },
                { name: "Giyim & Moda" },
                { name: "Ev & Yaşam" },
                { name: "Spor & Outdoor" },
                { name: "Hobi & Oyuncak" },
                { name: "Kozmetik & Kişisel Bakım" },
                { name: "Kitap & Dergi" },
                { name: "Koleksiyon & Antika" },
                { name: "Sanayi & İş Makineleri" },
                { name: "Diğer" }
            ]);
            console.log("🚀 Genişletilmiş kategoriler eklendi.");
        }

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