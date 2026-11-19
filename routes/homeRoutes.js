const express = require("express");
const HomeController = require("../controllers/homeController");

const router = express.Router();
let home = new HomeController();

//paginas do site
router.get("/", home.indexView);
router.get("/about", home.aboutView);
router.get("/services", home.servicesView);
router.get("/contact", home.contactView);
router.get("/offers", home.offersView);
router.get("/signatures", home.signaturesView);
router.get("/join", home.joinView);
router.get("/cart", home.cartView);
router.get("/cadastro", home.cadastroView);
router.get("/usuario/cadastrar", home.cadastroView);
router.get("/adm", home.admView);

module.exports = router;
