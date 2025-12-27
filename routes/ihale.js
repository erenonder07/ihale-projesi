const express = require("express");
const router = express.Router();

// MODELLERİ ÇAĞIRIYORUZ (Hocanın Notlarına Uygun)
const Tender = require("../models/tender");
const User = require("../models/user");
const Bid = require("../models/bid");

// Resim Yükleme Ayarları
const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 

// 1. DASHBOARD (PANEL) SAYFASI
router.get("/dashboard", function(req, res) {
    // Güvenlik: Giriş yoksa login'e at
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

// 3. ANASAYFA (İhaleleri Listele - EAGER LOADING)
router.get("/", async function(req, res) {            
    if (!req.session.user_id) return res.redirect("/login");

    try {
        // HOCANIN YÖNTEMİ: İhaleleri çekerken Teklifleri de (Bids) dahil et (include)
        const tenders = await Tender.findAll({
            include: [
                { model: Bid } 
            ],
            order: [['tender_id', 'DESC']] // En yeni en üstte
        });

        // EJS'ye göndermeden önce "En Yüksek Teklifi" hesaplıyoruz
        const islenmisIhaleler = tenders.map(tender => {
            const ihaleObj = tender.toJSON();
            
            // Eğer teklif varsa en büyüğünü bul, yoksa null yap
            if (ihaleObj.Bids && ihaleObj.Bids.length > 0) {
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

// 4. İHALE KAYDETME İŞLEMİ (SEQUELIZE CREATE)
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
        // SQL yerine Model kullanıyoruz
        await Tender.create({
            title: title,
            description: desc,
            start_price: price,
            end_date: date,
            image_url: resimAdi,
            Users_user_id: req.session.user_id, // İlişki sütunu (Foreign Key)
            status: 1
        });
            
        res.redirect("/dashboard");             
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 5. TEKLİF VERME İŞLEMİ
router.post("/bid", async function(req, res) {           
    if (!req.session.user_id) return res.send("Giriş yapmalısınız!");

    const tenderId = req.body.tender_id; 
    const amount = req.body.amount;     
    const userId = req.session.user_id;

    try {
        // Önce ihaleyi bul (Sahibini kontrol etmek için)
        const ihale = await Tender.findByPk(tenderId);

        if (!ihale) {
            return res.send("İhale bulunamadı!");
        }

        // Kendi malına teklif veremezsin kontrolü
        if (ihale.Users_user_id === userId) {
            return res.send(`
                <h1>Hata!</h1>
                <h3>Kendi ilanınıza teklif veremezsiniz.</h3>
                <a href='/'>Listeye Dön</a>
            `);
        }

        // Teklifi Kaydet
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

// 6. YENİ ÖZELLİK: İLANLARIM VE GELEN TEKLİFLER (NESTED INCLUDE)
router.get("/my-tenders", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");

    try {
        const userId = req.session.user_id;

        // HOCANIN EAGER LOADING YÖNTEMİ (İÇ İÇE SORGULAR):
        // 1. Benim ihalelerimi bul
        // 2. O ihalelere gelen Teklifleri (Bid) getir
        // 3. O teklifleri veren Kullanıcıları (User) getir
        const myTenders = await Tender.findAll({
            where: { Users_user_id: userId }, 
            include: [
                {
                    model: Bid, 
                    include: [
                        { model: User } // İsim soyisim görmek için
                    ]
                }
            ],
            order: [['tender_id', 'DESC']]
        });

        res.render("my-tenders", {
            tenders: myTenders,
            user: req.session
        });

    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

module.exports = router;