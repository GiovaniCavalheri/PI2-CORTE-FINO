const express = require("express");
const AreaFornecedorController = require("../controllers/areaFornecedorController");
const { exigirFornecedor } = require("../middleware/exigirFornecedor");

//rotas da area do fornecedor logado. Montado em routes.js com o prefixo
///area-fornecedor, entao o middleware abaixo so vale para estas rotas.
//(o cadastro de fornecedores feito pelo administrador fica em fornecedorRoutes)
const router = express.Router();
let area = new AreaFornecedorController();

router.use(exigirFornecedor);

router.get("/produtos", area.produtosView);
router.get("/produtos/listar", area.listarProdutos);
router.post("/produtos/cadastrar", area.cadastrarProduto);
router.post("/lotes/cadastrar", area.cadastrarLote);

module.exports = router;
