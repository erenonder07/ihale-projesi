const express = require("express");
const router = express.Router();

// ARTIK ESKİ DB DOSYASINI DEĞİL, MODELLERİ ÇAĞIRIYORUZ
const Tender = require("../models/tender");
const User = require("../models/user");
const Bid = require("../models/bid");

// Resim Yükleme Ayarları (Aynı Kalıyor)
const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 

// 1. DASHBOARD (PANEL) SAYFASI
router.get("/dashboard", function(req, res) {
    if (!req.session.user_id) {
        return res.redirect("/login");
    }
    res.render("dashboard", {
        user: req.session 
    });
});

// 2. YENİ İLAN OLUŞTURMA SAYFASI
router.get("/yeni-ilan", function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    res.render("new-tender");
});

// 3. ANASAYFA (İhaleleri Listele - MODERN YÖNTEM)
router.get("/", async function(req, res) {            
    if (!req.session.user_id) return res.redirect("/login");

    try {
        // SQL YERİNE SEQUELIZE KULLANIYORUZ:
        // "Bana tüm ihaleleri getir, yanında da Teklifleri (Bids) getir."
        const tenders = await Tender.findAll({
            include: [
                { model: Bid } // İlişkili teklifleri de çek
            ],
            order: [['tender_id', 'DESC']] // En yeni en üstte
        });

        // EJS dosyamız "en_yuksek_teklif" diye bir veri bekliyor.
        // Bunu hesaplayıp her ihalenin içine ekleyelim:
        const islenmisIhaleler = tenders.map(tender => {
            // Sequelize verisini düz objeye çevir
            const ihaleObj = tender.toJSON();
            
            // Teklifler arasından en büyüğünü bul
            if (ihaleObj.Bids && ihaleObj.Bids.length > 0) {
                // Teklifleri fiyatlarına göre sırala, en yükseği al
                const maxTeklif = Math.max(...ihaleObj.Bids.map(b => parseFloat(b.amount)));
                ihaleObj.en_yuksek_teklif = maxTeklif;
            } else {
                ihaleObj.en_yuksek_teklif = null;
            }
            
            return ihaleObj;
        });
        
        res.render("home", {
            ihaleler: islenmisIhaleler,
            user: req.session 
        });

    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 4. İHALE KAYDETME İŞLEMİ (MODERN YÖNTEM)
router.post("/add-tender", upload.single("resim"), async function(req, res) { 
    if (!req.session.user_id) return res.redirect("/login");

    const title = req.body.title;
    const desc = req.body.description;
    const price = req.body.start_price;
    const date = req.body.end_date;
    
    let resimAdi = null;
    if (req.file) {
        resimAdi = req.file.filename; 
    }

    try {
        // SQL INSERT YERİNE:
        await Tender.create({
            title: title,
            description: desc,
            start_price: price,
            end_date: date,
            image_url: resimAdi,
            Users_user_id: req.session.user_id, // İlişki sütunu
            status: 1
        });
            
        res.redirect("/dashboard");             
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 5. TEKLİF VERME İŞLEMİ (MODERN YÖNTEM)
router.post("/bid", async function(req, res) {           
    if (!req.session.user_id) return res.send("Giriş yapmalısınız!");

    const tenderId = req.body.tender_id; 
    const amount = req.body.amount;     
    const userId = req.session.user_id;

    try {
        // 1. İhaleyi bul (Sahibini kontrol etmek için)
        const ihale = await Tender.findByPk(tenderId);

        if (!ihale) {
            return res.send("İhale bulunamadı!");
        }

        // Kendi malına teklif veremezsin
        if (ihale.Users_user_id === userId) {
            return res.send(`
                <h1>Hata!</h1>
                <h3>Kendi ilanınıza teklif veremezsiniz.</h3>
                <a href='/'>Listeye Dön</a>
            `);
        }

        // 2. Teklifi Kaydet (Bid.create)
        await Bid.create({
            amount: amount,
            Users_user_id: userId,
            Tenders_tender_id: tenderId
        });

        res.redirect("/");
        
    } catch(err) {
        console.log(err);
        res.send("Teklif hatası: " + err.message);
    }
});

module.exports = router;