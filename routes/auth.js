const express = require("express");
const router = express.Router();

// ESKİSİ: const db = require("../data/db");  <-- Artık buna ihtiyacımız yok
// YENİSİ: Oluşturduğumuz User modelini çağırıyoruz
const User = require("../models/user"); 

// 1. Giriş Sayfasını Göster
router.get("/login", function(req, res) {
    res.render("login"); 
});

// 2. Kayıt Olma İşlemi (Sequelize ile)
router.post("/register", async function(req, res) {
    // Formdan gelen veriler
    const name = req.body.full_name;
    const mail = req.body.email;
    const tel = req.body.phone;
    const tc = req.body.tckn;
    const pass = req.body.password;

    try {
        // ESKİ SQL KODU: await db.execute("INSERT INTO...", [...]) 
        
        // YENİ SEQUELIZE KODU:
        // Tabloya yeni bir satır eklemek için .create() kullanılır.
        await User.create({
            full_name: name,
            email: mail,
            phone: tel,
            tckn: tc,
            password: pass
        });
        
        // Kayıt başarılıysa girişe yönlendir
        res.redirect("/login"); 
    } catch(err) {
        console.log(err);
        res.send("Kayıt Hatası: " + err.message);
    }
});

// 3. Giriş Yapma İşlemi (Sequelize ile)
router.post("/login", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    try {
        // ESKİ SQL KODU: const [users, ] = await db.execute("SELECT * ...")

        // YENİ SEQUELIZE KODU:
        // Şartlara uyan İLK kullanıcıyı bulmak için .findOne() kullanılır.
        const user = await User.findOne({ 
            where: { 
                email: email, 
                password: password 
            } 
        });
        
        // Sequelize'da "user" varsa direkt nesne gelir, yoksa null gelir.
        if (user) {
            // -- GİRİŞ BAŞARILI --

            // user nesnesinden verileri alıp Session'a kaydediyoruz
            req.session.user_id = user.user_id; 
            req.session.ad_soyad = user.full_name;
            
            console.log("Giriş Başarılı: " + user.full_name);

            // Panele yönlendir
            res.redirect("/dashboard");
        } else {
            // Kullanıcı bulunamadı
            res.send("<h1>Hata</h1><p>E-posta veya şifre yanlış.</p><a href='/login'>Tekrar Dene</a>");
        }

    } catch(err) {
        console.log(err);
        res.send("Giriş Hatası: " + err.message);
    }
});

module.exports = router;