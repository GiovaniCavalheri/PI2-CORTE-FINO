const express = require("express");
const RelatorioController = require("../controllers/relatorioController");

const router = express.Router();
let relatorio = new RelatorioController();

//relatorios gerenciais (filtros pela URL)
router.get("/relatorio/mais-vendidos", relatorio.maisVendidos);
router.get("/relatorio/descartes", relatorio.descartados);
router.get("/relatorio/promocoes", relatorio.maisPromocoes);
router.get("/relatorio/vencimento", relatorio.proximosVencimento);
router.get("/relatorio/compras", relatorio.compras);

module.exports = router;
