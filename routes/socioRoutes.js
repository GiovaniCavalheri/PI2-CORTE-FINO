const express = require("express");
const SocioController = require("../controllers/socioController");
const ExclusaoController = require("../controllers/exclusaoController");

const router = express.Router();
let socio = new SocioController();
let exclusao = new ExclusaoController();

router.get("/socio/listar", socio.listar);
router.post("/socio/cadastrar", socio.cadastrar);
router.post("/socio/alterar", socio.alterar);
router.delete("/socio/excluir/:id", exclusao.excluirSocio);

module.exports = router;
