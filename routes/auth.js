const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // dosya silme


const User = require("../models/user"); 
const Tender = require("../models/tender");

// MULTER AYARLARI (Dosya Yükleme) 

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


router.get("/login", function(req, res) {  //login
    res.render("login"); 
});


router.post("/register", async function(req, res) {   //register
    
    try {
        await User.create({   //user.js
            full_name: req.body.full_name,
            email: req.body.email,
            phone: req.body.phone,
            tckn: req.body.tckn,
            password: req.body.password
        });
        res.redirect("/login"); 
    } catch(err) {
        if (err.name === 'SequelizeUniqueConstraintError') {   //zaten var
             return res.send(`<script>alert("Bu bilgilerle zaten kayıt var!"); window.location.href = "/login";</script>`);
        }
        res.send("Hata: " + err.message);
    }
});


router.post("/login", async function(req, res) {

    try {
        const user = await User.findOne({ where: { email: req.body.email, password: req.body.password } });
        if (user) {
            req.session.user_id = user.user_id;            //hatır
            req.session.ad_soyad = user.full_name;         //lama
            res.redirect("/dashboard");
        } else {
            res.send(`<script>alert("Hatali Giris!"); window.location.href = "/login";</script>`);
        }
    } catch(err) {
        res.send("Hata: " + err.message);
    }
});


router.get("/logout", function(req, res) {       //log
    req.session.destroy(() => {                  //out
        
        res.redirect("/login");
    });
});



// DÜZENLEME SAYFAS
router.get("/duzenle/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        const tender = await Tender.findOne({                                               //GET
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

//  GÜNCELLEME İŞLEMİ 
router.post("/duzenle/:id", upload.single("image"), async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    const tenderId = req.params.id;
    const { title, description, start_price, end_date } = req.body;

    try {
        const tender = await Tender.findByPk(tenderId);
                                                                                        //POST
        if (tender && tender.Users_user_id === req.session.user_id) {
            
            // YENİ RESİM yüklendiyse
            if (req.file) {
                // Eski resmi klasörden sil
                if (tender.image_url) {
                    const eskiResimYolu = path.join(__dirname, "../public/images", tender.image_url);
                    
                    if (fs.existsSync(eskiResimYolu)) {
                        fs.unlinkSync(eskiResimYolu);
                    }
                }
                //  Veritabanına yeni resim adını kaydet
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
            res.send("bulunamadi");
        }
    } catch(err) {
        console.log("Güncelleme Hatası:", err);
        res.send("Hata");
    }
});

//  SİLME İŞLEMİ
router.post("/sil/:id", async function(req, res) {
    if (!req.session.user_id) return res.redirect("/login");
    
    try {
        const tender = await Tender.findOne({
            where: { tender_id: req.params.id, Users_user_id: req.session.user_id }
        });

        if (tender) {
            //  önce resmi klasörden sil 
            if (tender.image_url) {
                const resimYolu = path.join(__dirname, "../public/images", tender.image_url);
                if (fs.existsSync(resimYolu)) {    //KONTROL
                    fs.unlinkSync(resimYolu);
                }
            }

            // veritabanından kaydı sil (destroy) 
            await tender.destroy();
            res.redirect("/my-tenders");
        } else {
            res.send("ilan bulunamadı.");
        }

    } catch(err) {
        console.log(err);
        res.send("silme işlemi başarısız.");
    }
});

module.exports = router;