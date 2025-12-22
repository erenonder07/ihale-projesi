const express = require("express");
const router = express.Router();
const db = require("../data/db");

// --- MULTER AYARLARI (Resim Yükleme İçin) ---
const multer = require("multer");
const upload = multer({ dest: "./public/images" }); 

// 1. DASHBOARD (PANEL) SAYFASI - (Hata Veren Yer Burasıydı)
router.get("/dashboard", function(req, res) {
    // Giriş kontrolü: Kimlik yoksa login'e git
    if (!req.session.user_id) {
        return res.redirect("/login");
    }
    // Giriş varsa dashboard.ejs dosyasını aç
    res.render("dashboard", {
        user: req.session 
    });
});

// 2. YENİ İLAN OLUŞTURMA SAYFASI
router.get("/yeni-ilan", function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    res.render("new-tender");
});

// 3. ANASAYFA (İhaleleri Listele)
router.get("/", async function(req, res) {            
    
    // GÜVENLİK: Anasayfaya giren kişi giriş yapmamışsa Login'e atılsın
    if (!req.session.user_id) {
        return res.redirect("/login");
    }

    try {
        const query = `
            SELECT Tenders.*, MAX(Bids.amount) AS en_yuksek_teklif 
            FROM Tenders 
            LEFT JOIN Bids ON Tenders.tender_id = Bids.Tenders_tender_id 
            GROUP BY Tenders.tender_id
            ORDER BY Tenders.tender_id DESC
        `;

        const [sonuclar, ] = await db.execute(query);
        
        res.render("home", {
            ihaleler: sonuclar,
            user: req.session 
        });
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 4. İHALE KAYDETME İŞLEMİ (Resimli)
router.post("/add-tender", upload.single("resim"), async function(req, res) { 
    const title = req.body.title;
    const desc = req.body.description;
    const price = req.body.start_price;
    const date = req.body.end_date;
    
    let resimAdi = null;
    if (req.file) {
        resimAdi = req.file.filename; 
    }

    if (!req.session.user_id) {
        return res.redirect("/login");
    }

    try {
        const userId = req.session.user_id; 

        await db.execute(
            "INSERT INTO Tenders(title, description, start_price, end_date, Users_user_id, status, image_url) VALUES(?,?,?,?,?,?,?)", 
            [title, desc, price, date, userId, 1, resimAdi]
        );
            
        // Kayıt bitince Panele dönsün
        res.redirect("/dashboard");             
    } catch(err) {
        console.log(err);
        res.send("Hata: " + err.message);
    }
});

// 5. TEKLİF VERME İŞLEMİ
router.post("/bid", async function(req, res) {           
    
    const tenderId = req.body.tender_id; 
    const amount = req.body.amount;     
    
    // 1. Giriş yapmamışsa durdur
    if (!req.session.user_id) {
        return res.send("Giriş yapmalısınız!");
    }

    try {
        const userId = req.session.user_id; 

        // --- YENİ EKLENEN KONTROL KISMI BAŞLANGIÇ ---
        
        // Önce ihalenin sahibini veritabanından öğrenelim
        const [ihaleBilgisi] = await db.execute(
            "SELECT Users_user_id FROM Tenders WHERE tender_id = ?", 
            [tenderId]
        );
        
        const ihaleSahibiId = ihaleBilgisi[0].Users_user_id;

        // EĞER: İhale Sahibi == Şu Anki Kullanıcı ise...
        if (ihaleSahibiId === userId) {
            return res.send(`
                <h1>Hata!</h1>
                <h3>Kendi ilanınıza teklif veremezsiniz.</h3>
                <a href='/'>Listeye Dön</a>
            `);
        }
        // --- KONTROL BİTİŞ ---

        // Sorun yoksa teklifi kaydet
        await db.execute(
            "INSERT INTO Bids(amount, Users_user_id, Tenders_tender_id) VALUES(?,?,?)", 
            [amount, userId, tenderId]
        );

        res.redirect("/");
        
    } catch(err) {
        console.log(err);
        res.send("Teklif verirken hata oluştu: " + err.message);
    }
});

module.exports = router;