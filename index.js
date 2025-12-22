const express = require("express");
const app = express();
const path = require("path");


const session = require("express-session"); 

const authRoutes = require("./routes/auth"); 
const ihaleRoutes = require("./routes/ihale");

app.set('view engine', 'ejs'); 
app.use(express.urlencoded({ extended: true })); 

// 2. EKSİK OLAN KISIM: Session Ayarlarını Yap (Rotalardan ÖNCE olmalı!)
app.use(session({
    secret: "cok_gizli_bir_anahtar_kelime", // Şifreleme anahtarı
    resave: false,
    saveUninitialized: true
}));

app.use("/libs", express.static(path.join(__dirname, "node_modules")));
app.use("/static", express.static(path.join(__dirname, "public")));

// Rotaları Aktif Et
app.use(authRoutes); 
app.use(ihaleRoutes); 

// index.js dosyasının en altındaki kısmı böyle yap:

const PORT = process.env.PORT || 3000; // Render bir port verirse onu kullan, yoksa 3000

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor port: ${PORT}`);
});