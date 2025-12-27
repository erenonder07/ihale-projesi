const express = require("express");
const router = express.Router();

// Modelimizi çağırıyoruz
const User = require("../models/user"); 

// 1. Giriş Sayfasını Göster
router.get("/login", function(req, res) {
    res.render("login"); 
});

// 2. Kayıt Olma İşlemi
router.post("/register", async function(req, res) {
    const name = req.body.full_name;
    const mail = req.body.email;
    const tel = req.body.phone;
    const tc = req.body.tckn;
    const pass = req.body.password;

    try {
        await User.create({
            full_name: name,
            email: mail,
            phone: tel,
            tckn: tc,
            password: pass
        });
        
        res.redirect("/login"); 
    } catch(err) {
        console.log(err);
        res.send("Kayıt Hatası: " + err.message);
    }
});

// 3. Giriş Yapma İşlemi (GÜNCELLENDİ)
router.post("/login", async function(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findOne({ 
            where: { 
                email: email, 
                password: password 
            } 
        });
        
        if (user) {
            // -- GİRİŞ BAŞARILI --
            req.session.user_id = user.user_id; 
            req.session.ad_soyad = user.full_name;
            req.session.email = user.email; // E-posta'yı kaydet
            req.session.phone = user.phone; // YENİ: Telefonu da kaydet
            
            console.log("Giriş Başarılı: " + user.full_name);
            res.redirect("/dashboard");
        } else {
            res.send("<h1>Hata</h1><p>E-posta veya şifre yanlış.</p><a href='/login'>Tekrar Dene</a>");
        }

    } catch(err) {
        console.log(err);
        res.send("Giriş Hatası: " + err.message);
    }
});

module.exports = router;