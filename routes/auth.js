const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Dosya silmek için gerekli (Hafta 13 Notları)

// Modeller
const User = require("../models/user"); 
const Tender = require("../models/tender");

// --- MULTER AYARLARI (Dosya Yükleme) ---
// Not: Resimler 'public/images' klasörüne kaydedilir [cite: 1402]
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },
    filename: function (req, file, cb) {
        // Dosya adı çakışmasın diye benzersiz isim veriyoruz
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. Giriş Sayfasını Göster
router.get("/login", function(req, res) {
    res.render("login"); 
});

// 2. Kayıt Olma İşlemi
router.post("/register", async function(req, res) {
    // ... (Eski kodlar aynı kalıyor)
    try {
        await User.create({
            full_name: req.body.full_name,
            email: req.body.email,
            phone: req.body.phone,
            tckn: req.body.tckn,
            password: req.body.password
        });
        res.redirect("/login"); 
    } catch(err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
             return res.send(`<script>alert("Bu bilgilerle zaten kayıt var!"); window.location.href = "/login";</script>`);
        }
        res.send("Hata: " + err.message);
    }
});

// 3. Giriş Yapma İşlemi
router.post("/login", async function(req, res) {
    // ... (Eski kodlar aynı kalıyor)
    try {
        const user = await User.findOne({ where: { email: req.body.email, password: req.body.password } });
        if (user) {
            req.session.user_id = user.user_id; 
            req.session.ad_soyad = user.full_name;
            res.redirect("/dashboard");
        } else {
            res.send(`<script>alert("Hatalı Giriş!"); window.location.href = "/login";</script>`);
        }
    } catch(err) {
        res.send("Hata: " + err.message);
    }
});

// 4. Çıkış
router.get("/logout", function(req, res) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); 
        res.redirect("/login");
    });
});

// ==========================================================
// 13. HAFTA: RESİM GÜNCELLEME VE SİLME İŞLEMLERİ
// ==========================================================

// A. DÜZENLEME SAYFASINI GETİR
router.get("/duzenle/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        const tender = await Tender.findOne({
            where: { tender_id: req.params.id, Users_user_id: req.session.user_id }
        });

        if (tender) {
            res.render("edit-tender", { tender: tender });
        } else {
            res.send("İlan bulunamadı.");
        }
    } catch(err) {
        console.log(err);
        res.redirect("/dashboard");
    }
});

// B. GÜNCELLEME İŞLEMİ (RESİM SİLMELİ)
// upload.single('image') ekledik, formdan gelen dosyayı yakalar [cite: 1404]
router.post("/duzenle/:id", upload.single("image"), async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    const tenderId = req.params.id;
    const { title, description, start_price, end_date } = req.body;

    try {
        const tender = await Tender.findByPk(tenderId);

        if (tender && tender.Users_user_id === req.session.user_id) {
            
            // Eğer YENİ RESİM yüklendiyse
            if (req.file) {
                // 1. Eski resmi klasörden sil (fs.unlink) 
                if (tender.image_url) {
                    const eskiResimYolu = path.join(__dirname, "../public/images", tender.image_url);
                    // Dosya var mı kontrol et, varsa sil
                    if (fs.existsSync(eskiResimYolu)) {
                        fs.unlinkSync(eskiResimYolu);
                    }
                }
                // 2. Veritabanına yeni resim adını kaydet
                tender.image_url = req.file.filename;
            }

            // Diğer bilgileri güncelle
            tender.title = title;
            tender.description = description;
            tender.start_price = start_price;
            tender.end_date = end_date;
            
            await tender.save();
            res.redirect("/my-tenders"); 
        } else {
            res.send("Yetkisiz işlem.");
        }
    } catch(err) {
        console.log("Güncelleme Hatası:", err);
        res.send("Hata oluştu.");
    }
});

// C. SİLME İŞLEMİ (RESİM SİLMELİ)
router.post("/sil/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        const tender = await Tender.findOne({
            where: { tender_id: req.params.id, Users_user_id: req.session.user_id }
        });

        if (tender) {
            // 1. Önce resmi klasörden sil (Çöp oluşmasın)
            if (tender.image_url) {
                const resimYolu = path.join(__dirname, "../public/images", tender.image_url);
                if (fs.existsSync(resimYolu)) {
                    fs.unlinkSync(resimYolu);
                }
            }

            // 2. Sonra veritabanından kaydı sil (destroy) [cite: 228]
            await tender.destroy();
            res.redirect("/my-tenders");
        } else {
            res.send("İlan bulunamadı.");
        }

    } catch(err) {
        console.log(err);
        res.send("Silme işlemi başarısız.");
    }
});

module.exports = router;