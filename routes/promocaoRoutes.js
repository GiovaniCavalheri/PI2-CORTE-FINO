const express = require("express");
const PromocaoController = require("../controllers/promocaoController");

const router = express.Router();
let promocao = new PromocaoController();

router.get("/promocao/proximos-vencimento", promocao.proximosVencimento);
router.post("/promocao/cadastrar", promocao.cadastrar);
router.get("/promocao/ativas", promocao.ativas);
router.post("/promocao/encerrar", promocao.encerrar);

module.exports = router;
