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

app.use("/libs", express.static("node_modules"));
app.use("/static", express.static("public"));

// Rotaları Aktif Et
app.use(authRoutes); 
app.use(ihaleRoutes); 

app.listen(3000, () => {
    console.log("Sunucu çalışıyor: http://localhost:3000");
});