const express = require("express");
const CompraController = require("../controllers/compraController");

const router = express.Router();
let compra = new CompraController();

//compras: cria os lotes e soma no estoque
router.post("/compra/cadastrar", compra.cadastrar);
router.get("/compra/listar", compra.listar);

module.exports = router;
