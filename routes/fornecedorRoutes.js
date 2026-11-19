const express = require("express");
const FornecedorController = require("../controllers/fornecedorController");
const ExclusaoController = require("../controllers/exclusaoController");

const router = express.Router();
let fornecedor = new FornecedorController();
let exclusao = new ExclusaoController();

router.get("/fornecedor/listar", fornecedor.listar);
router.post("/fornecedor/cadastrar", fornecedor.cadastrar);
router.post("/fornecedor/alterar", fornecedor.alterar);
router.delete("/fornecedor/excluir/:id", exclusao.excluirFornecedor);

module.exports = router;
