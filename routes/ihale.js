const express = require("express");
const router = express.Router();
const { Op } = require("sequelize"); 

// MODELLER
const Tender = require("../models/tender");
const User = require("../models/user"); 
const Bid = require("../models/bid");
const Category = require("../models/category"); 

const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 



router.get("/dashboard", async function(req, res) {
    // Giriş kontrolü
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        const user = await User.findByPk(req.session.user_id);

        if (user) {
            res.render("dashboard", { 
                user: {
                    user_id: user.user_id,
                    ad_soyad: user.full_name, 
                    email: user.email,        
                    phone: user.phone         
                }
            });
        } else {
            res.redirect("/logout");
        }
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
});



router.get("/yeni-ilan", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    const categories = await Category.findAll();
    res.render("new-tender", { categories: categories });
});

// -----------------------------------------------------------
//  ANASAYFA 

router.get("/", async function(req, res) {            
    if (!req.session.user_id) return res.redirect("/login");

    try {
        const durum = req.query.durum; 
        const kategoriId = req.query.kategori;
        
        const categories = await Category.findAll();
        const currentUser = await User.findByPk(req.session.user_id);

        let whereKosulu = {}; 
        const now = new Date(); 
        
        // Eğer kullanıcı "Biten" sekmesine tıkladıysa:
        if (durum === 'kapali') {                 
            whereKosulu[Op.or] = [
                { end_date: { [Op.lt]: now } }, // Süresi bitmiş olanlar
                { status: 0 }                   // Veya manuel kapatılanlar
            ];
        } 
        else {
            whereKosulu.end_date = { [Op.gt]: now }; 
            whereKosulu.status = 1;                  
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



// İHALE EKLEME

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



//  TEKLİF VERME

router.post("/bid", async function(req, res) {           
    if (!req.session.user_id) return res.send("Giriş yapmalısınız");
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


//  İLANLARIM

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



//  ÇIKIŞ

router.get("/logout", function(req, res) {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;
