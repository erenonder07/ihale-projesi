const express = require("express");
const router = express.Router();
// HOCANIN NOTLARINDAKİ GİBİ OPERATÖRLERİ (Op) ÇAĞIRIYORUZ
const { Op } = require("sequelize"); 

// MODELLER
const Tender = require("../models/tender");
const User = require("../models/user");
const Bid = require("../models/bid");

const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 

// 1. DASHBOARD
router.get("/dashboard", function(req, res) {
    if (!req.session.user_id) {
        return res.redirect("/login");
    }
    res.render("dashboard", {
        user: req.session 
    });
});

// 2. YENİ İLAN SAYFASI
router.get("/yeni-ilan", function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    res.render("new-tender");
});

// 3. ANASAYFA (FİLTRELEME EKLENDİ - Op.gt ve Op.lt)
router.get("/", async function(req, res) {            
    if (!req.session.user_id) return res.redirect("/login");

    try {
        // Linkten gelen filtre bilgisini al (Örn: /?durum=aktif)
        const durum = req.query.durum; 
        
        let whereKosulu = {}; // Varsayılan: Hepsi
        const now = new Date(); // Şu anki zaman

        // Hocanın 'where' ve 'Op' mantığını kullanıyoruz:
        if (durum === 'aktif') {
            whereKosulu = {
                end_date: { [Op.gt]: now }, // Bitiş tarihi ŞİMDİDEN BÜYÜK olanlar (Gelecek)
                status: 1
            };
        } else if (durum === 'kapali') {
            whereKosulu = {
                [Op.or]: [
                    { end_date: { [Op.lt]: now } }, // Bitiş tarihi ŞİMDİDEN KÜÇÜK olanlar (Geçmiş)
                    { status: 0 }
                ]
            };
        }

        // Sorguyu çalıştır
        const tenders = await Tender.findAll({
            where: whereKosulu, // Filtreyi buraya koyduk
            include: [
                { model: Bid } 
            ],
            order: [['end_date', 'ASC']] // Bitiş tarihi en yakın olan en üstte
        });

        // En yüksek teklif hesaplama (Aynı kalıyor)
        const islenmisIhaleler = tenders.map(tender => {
            const ihaleObj = tender.toJSON();
            if (ihaleObj.Bids && ihaleObj.Bids.length > 0) {
                const maxTeklif = Math.max(...ihaleObj.Bids.map(b => parseFloat(b.amount)));
                ihaleObj.en_yuksek_teklif = maxTeklif;
            } else {
                ihaleObj.en_yuksek_teklif = null;
            }
            return ihaleObj;
        });
        
        // Sayfaya mevcut filtre bilgisini de gönderiyoruz (durum: durum)
        res.render("home", {
            ihaleler: islenmisIhaleler,
            user: req.session,
            seciliFiltre: durum || 'tumu' 
        });

    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 4. İHALE EKLEME
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
        await Tender.create({
            title: title,
            description: desc,
            start_price: price,
            end_date: date,
            image_url: resimAdi,
            Users_user_id: req.session.user_id,
            status: 1
        });
        res.redirect("/dashboard");             
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 5. TEKLİF VERME
router.post("/bid", async function(req, res) {           
    if (!req.session.user_id) return res.send("Giriş yapmalısınız!");

    const tenderId = req.body.tender_id; 
    const amount = req.body.amount;     
    const userId = req.session.user_id;

    try {
        const ihale = await Tender.findByPk(tenderId);
        if (!ihale) return res.send("İhale bulunamadı!");

        if (ihale.Users_user_id === userId) {
            return res.send(`<h1>Hata!</h1><h3>Kendi ilanınıza teklif veremezsiniz.</h3><a href='/'>Listeye Dön</a>`);
        }

        // Süre kontrolü (Backend tarafında da yapalım)
        if (new Date(ihale.end_date) < new Date()) {
            return res.send("Bu ihalenin süresi dolmuş, teklif verilemez.");
        }

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

// 6. KULLANICININ İLANLARI
router.get("/my-tenders", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    try {
        const userId = req.session.user_id;
        const myTenders = await Tender.findAll({
            where: { Users_user_id: userId }, 
            include: [
                {
                    model: Bid, 
                    include: [{ model: User }]
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

// 7. ÇIKIŞ
router.get("/logout", function(req, res) {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.clearCookie('connect.sid'); 
        res.redirect("/login");
    });
});

module.exports = router;