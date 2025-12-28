const express = require("express");
const router = express.Router();

// Modelimizi çağırıyoruz
const User = require("../models/user"); 

// 1. Giriş Sayfasını Göster
router.get("/login", function(req, res) {
    res.render("login"); 
});

// 2. Kayıt Olma İşlemi (GÜNCELLENDİ)
router.post("/register", async function(req, res) {
    const name = req.body.full_name;
    const mail = req.body.email;
    const tel = req.body.phone;
    const tc = req.body.tckn;
    const pass = req.body.password;

    try {
        // Kullanıcıyı oluşturmayı dene
        await User.create({
            full_name: name,
            email: mail,
            phone: tel,
            tckn: tc,
            password: pass
        });
        
        // Başarılıysa giriş sayfasına yönlendir
        res.redirect("/login"); 

    } catch(err) {
        // --- ÖZEL HATA YAKALAMA KISMI ---
        
        // Eğer veritabanından "Eşsizlik Hatası" (Unique Constraint) gelirse:
        if (err.name === 'SequelizeUniqueConstraintError') {
            let hataMesaji = "Bu bilgilerle zaten bir kayıt mevcut!";

            // Hangi alanın çakıştığını kontrol edip mesajı özelleştiriyoruz
            if (err.fields.email) hataMesaji = "Bu E-posta adresi zaten kullanılıyor.";
            else if (err.fields.phone) hataMesaji = "Bu Telefon numarası zaten kullanılıyor.";
            else if (err.fields.tckn) hataMesaji = "Bu TC Kimlik numarası zaten kullanılıyor.";

            // Kullanıcıya alert verip geri yönlendiren basit bir script gönderiyoruz
            return res.send(`
                <script>
                    alert("${hataMesaji}");
                    window.location.href = "/login";
                </script>
            `);
        }

        // Başka bir hata varsa konsola yaz ve ekrana bas
        console.log(err);
        res.send("Kayıt Hatası: " + err.message);
    }
});

// 3. Giriş Yapma İşlemi
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
            req.session.email = user.email; 
            req.session.phone = user.phone; 
            
            console.log("Giriş Başarılı: " + user.full_name);
            res.redirect("/dashboard");
        } else {
            res.send(`
                <script>
                    alert("E-posta veya şifre hatalı!");
                    window.location.href = "/login";
                </script>
            `);
        }

    } catch(err) {
        console.log(err);
        res.send("Giriş Hatası: " + err.message);
    }
});

// 4. GÜVENLİ ÇIKIŞ İŞLEMİ
router.get("/logout", function(req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.clearCookie('connect.sid'); 
        res.redirect("/login");
    });
});

module.exports = router;