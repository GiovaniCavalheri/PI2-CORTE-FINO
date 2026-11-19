const express = require("express");
const ProdutoController = require("../controllers/produtoController");

const router = express.Router();
let produto = new ProdutoController();

//telas que usam a lista de produtos
router.get("/products", produto.produtosView);
router.get("/pageAdm", produto.painelView);

router.get("/produto/listar", produto.listar);
router.get("/produto/buscar/:id", produto.buscar);
router.post("/produto/cadastrar", produto.cadastrar);
router.post("/produto/alterar", produto.alterar);
router.delete("/produto/excluir/:id", produto.excluir);

module.exports = router;
