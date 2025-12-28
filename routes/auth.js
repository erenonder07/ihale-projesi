const express = require("express");
const router = express.Router();

// Modelleri çağırıyoruz
const User = require("../models/user"); 
const Tender = require("../models/tender"); // İlan işlemleri için gerekli

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
        if (err.name === 'SequelizeUniqueConstraintError') {
            let hataMesaji = "Bu bilgilerle zaten bir kayıt mevcut!";
            if (err.fields.email) hataMesaji = "Bu E-posta adresi zaten kullanılıyor.";
            else if (err.fields.phone) hataMesaji = "Bu Telefon numarası zaten kullanılıyor.";
            else if (err.fields.tckn) hataMesaji = "Bu TC Kimlik numarası zaten kullanılıyor.";

            return res.send(`<script>alert("${hataMesaji}"); window.location.href = "/login";</script>`);
        }
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
            where: { email: email, password: password } 
        });
        
        if (user) {
            req.session.user_id = user.user_id; 
            req.session.ad_soyad = user.full_name;
            req.session.email = user.email; 
            req.session.phone = user.phone; 
            res.redirect("/dashboard");
        } else {
            res.send(`<script>alert("E-posta veya şifre hatalı!"); window.location.href = "/login";</script>`);
        }
    } catch(err) {
        console.log(err);
        res.send("Giriş Hatası: " + err.message);
    }
});

// 4. Güvenli Çıkış
router.get("/logout", function(req, res) {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.clearCookie('connect.sid'); 
        res.redirect("/login");
    });
});

// ==========================================================
// 13. HAFTA MÜFREDATI: GÜNCELLEME VE SİLME (CRUD EKLENDİ)
// ==========================================================

// A. DÜZENLEME SAYFASINI GETİR (GET)
router.get("/duzenle/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    const tenderId = req.params.id;

    try {
        // İhaleyi bul (Hocanın notlarındaki mantık)
        const tender = await Tender.findOne({
            where: {
                tender_id: tenderId,
                Users_user_id: req.session.user_id // Güvenlik: Sadece kendi ilanını düzenleyebilir
            }
        });

        if (tender) {
            res.render("edit-tender", { tender: tender });
        } else {
            res.send("İlan bulunamadı veya yetkiniz yok.");
        }
    } catch(err) {
        console.log(err);
        res.redirect("/dashboard");
    }
});

// B. GÜNCELLEMEYİ KAYDET (POST)
router.post("/duzenle/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    const tenderId = req.params.id;
    const { title, description, start_price, end_date } = req.body;

    try {
        // Önce veriyi bul
        const tender = await Tender.findByPk(tenderId);

        // Veri varsa ve sahibi bizsek güncelle
        if (tender && tender.Users_user_id === req.session.user_id) {
            // Hocanın notlarındaki yöntem
            tender.title = title;
            tender.description = description;
            tender.start_price = start_price;
            tender.end_date = end_date;
            
            await tender.save(); // Değişiklikleri kaydet
            res.redirect("/my-tenders"); 
        } else {
            res.send("Yetkisiz işlem.");
        }
    } catch(err) {
        console.log("Güncelleme Hatası:", err);
        res.send("Hata oluştu.");
    }
});

// C. SİLME İŞLEMİ (POST)
router.post("/sil/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    const tenderId = req.params.id;

    try {
        // Hocanın notlarındaki destroy yöntemi
        await Tender.destroy({
            where: {
                tender_id: tenderId,
                Users_user_id: req.session.user_id // Sadece kendi ilanını silebilir
            }
        });
        res.redirect("/my-tenders");
    } catch(err) {
        console.log(err);
        res.send("Silme işlemi başarısız.");
    }
});

module.exports = router;