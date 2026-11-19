const express = require("express");
const AdministradorController = require("../controllers/administradorController");
const ExclusaoController = require("../controllers/exclusaoController");

const router = express.Router();
let administrador = new AdministradorController();
let exclusao = new ExclusaoController();

router.get("/administrador/listar", administrador.listar);
router.post("/administrador/cadastrar", administrador.cadastrar);
router.post("/administrador/alterar", administrador.alterar);
router.delete("/administrador/excluir/:id", exclusao.excluirAdministrador);

module.exports = router;
