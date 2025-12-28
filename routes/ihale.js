const express = require("express");
const router = express.Router();
const { Op } = require("sequelize"); 

// MODELLER
const Tender = require("../models/tender");
const User = require("../models/user"); //
const Bid = require("../models/bid");
const Category = require("../models/category"); 

const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 

// ==========================================================
// 1. DASHBOARD (KESİN ÇÖZÜM: VERİTABANINDAN ÇEKME)
// ==========================================================
router.get("/dashboard", async function(req, res) {
    // Giriş kontrolü
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        // HATA ŞANSINI SIFIRLAMAK İÇİN:
        // Kullanıcıyı doğrudan veritabanından buluyoruz.
        // Session hafızasına güvenmek yerine taze veri çekiyoruz.
        const user = await User.findByPk(req.session.user_id);

        if (user) {
            res.render("dashboard", { 
                user: {
                    user_id: user.user_id,
                    ad_soyad: user.full_name, // Veritabanındaki 'full_name' -> EJS'deki 'ad_soyad'
                    email: user.email,        // Veritabanından gelen e-posta
                    phone: user.phone         // Veritabanından gelen telefon
                }
            });
        } else {
            // Kullanıcı veritabanında bulunamazsa çıkış yap
            res.redirect("/logout");
        }
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
});

// ==========================================================
// 2. YENİ İLAN SAYFASI
// ==========================================================
router.get("/yeni-ilan", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    const categories = await Category.findAll();
    res.render("new-tender", { categories: categories });
});

// ==========================================================
// 3. ANASAYFA
// ==========================================================
router.get("/", async function(req, res) {            
    if (!req.session.user_id) return res.redirect("/login");

    try {
        const durum = req.query.durum; 
        const kategoriId = req.query.kategori;
        
        const categories = await Category.findAll();
        // Anasayfada da kullanıcı adının görünmesi için veriyi çekiyoruz
        const currentUser = await User.findByPk(req.session.user_id);

        let whereKosulu = {}; 
        const now = new Date(); 

        if (durum === 'aktif') {
            whereKosulu.end_date = { [Op.gt]: now };
            whereKosulu.status = 1;
        } else if (durum === 'kapali') {
            whereKosulu[Op.or] = [
                { end_date: { [Op.lt]: now } },
                { status: 0 }
            ];
        }

        if (kategoriId && kategoriId !== 'hepsi') {
            whereKosulu.Categories_category_id = kategoriId;
        }

        const tenders = await Tender.findAll({
            where: whereKosulu,
            include: [
                { model: Bid },
                { model: Category }
            ],
            order: [['end_date', 'ASC']]
        });

        const islenmisIhaleler = tenders.map(tender => {
            const ihaleObj = tender.toJSON();
            if (ihaleObj.Bids && ihaleObj.Bids.length > 0) {
                ihaleObj.en_yuksek_teklif = Math.max(...ihaleObj.Bids.map(b => parseFloat(b.amount)));
            } else {
                ihaleObj.en_yuksek_teklif = null;
            }
            return ihaleObj;
        });
        
        res.render("home", {
            ihaleler: islenmisIhaleler,
            categories: categories,
            user: {
                // Anasayfa menüsü için gerekli bilgiler
                ad_soyad: currentUser ? currentUser.full_name : "Misafir",
                email: currentUser ? currentUser.email : "",
                phone: currentUser ? currentUser.phone : ""
            },
            seciliFiltre: durum || 'tumu',
            seciliKategori: kategoriId || 'hepsi'
        });

    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// ==========================================================
// 4. İHALE EKLEME
// ==========================================================
router.post("/add-tender", upload.single("resim"), async function(req, res) { 
    if (!req.session.user_id) return res.redirect("/login");

    try {
        await Tender.create({
            title: req.body.title,
            description: req.body.description,
            start_price: req.body.start_price,
            end_date: req.body.end_date,
            image_url: req.file ? req.file.filename : null,
            Users_user_id: req.session.user_id,
            Categories_category_id: req.body.category_id,
            status: 1
        });
        res.redirect("/dashboard");             
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// ==========================================================
// 5. TEKLİF VERME
// ==========================================================
router.post("/bid", async function(req, res) {           
    if (!req.session.user_id) return res.send("Giriş yapmalısınız!");
    try {
        const ihale = await Tender.findByPk(req.body.tender_id);
        if (!ihale) return res.send("İhale bulunamadı!");
        if (ihale.Users_user_id === req.session.user_id) return res.send("Kendi ilanınıza teklif veremezsiniz.");
        if (new Date(ihale.end_date) < new Date()) return res.send("Süre doldu.");

        await Bid.create({
            amount: req.body.amount,
            Users_user_id: req.session.user_id,
            Tenders_tender_id: req.body.tender_id
        });
        res.redirect("/");
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// ==========================================================
// 6. İLANLARIM
// ==========================================================
router.get("/my-tenders", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    try {
        const myTenders = await Tender.findAll({
            where: { Users_user_id: req.session.user_id }, 
            include: [
                { model: Bid, include: [{ model: User }] },
                { model: Category }
            ],
            order: [['tender_id', 'DESC']]
        });
        
        // Kullanıcıyı veritabanından çekip gönderiyoruz
        const user = await User.findByPk(req.session.user_id);

        res.render("my-tenders", { 
            tenders: myTenders, 
            user: {
                ad_soyad: user ? user.full_name : "Kullanıcı"
            }
        });
    } catch(err) {
        res.send("Hata: " + err.message);
    }
});

// ==========================================================
// 7. ÇIKIŞ
// ==========================================================
router.get("/logout", function(req, res) {
    req.session.destroy(() => {
        res.clearCookie('connect.sid'); 
        res.redirect("/login");
    });
});

module.exports = router;