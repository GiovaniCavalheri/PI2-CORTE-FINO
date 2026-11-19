const express = require("express");
const DescarteController = require("../controllers/descarteController");

const router = express.Router();
let descarte = new DescarteController();

//descartes: lotes vencidos, registrar (baixa o estoque) e historico
router.get("/descarte/vencidos", descarte.vencidos);
router.post("/descarte/cadastrar", descarte.cadastrar);
router.get("/descarte/historico", descarte.historico);

module.exports = router;
