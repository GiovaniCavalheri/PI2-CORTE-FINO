const express = require("express");
const MarcaController = require("../controllers/marcaController");

const router = express.Router();
let marca = new MarcaController();

router.get("/marca/listar", marca.listar);
router.get("/marca/buscar/:id", marca.buscar);
router.post("/marca/cadastrar", marca.cadastrar);
router.post("/marca/alterar", marca.alterar);
router.delete("/marca/excluir/:id", marca.excluir);

module.exports = router;
