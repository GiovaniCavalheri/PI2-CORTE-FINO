const express = require("express");
const CategoriaController = require("../controllers/categoriaController");

const router = express.Router();
let categoria = new CategoriaController();

router.get("/categoria/listar", categoria.listar);
router.get("/categoria/buscar/:id", categoria.buscar);
router.post("/categoria/cadastrar", categoria.cadastrar);
router.post("/categoria/alterar", categoria.alterar);
router.delete("/categoria/excluir/:id", categoria.excluir);

module.exports = router;
