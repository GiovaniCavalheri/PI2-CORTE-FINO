const express = require("express");
const UsuarioController = require("../controllers/usuarioController");
const ExclusaoController = require("../controllers/exclusaoController");

const router = express.Router();
let usuario = new UsuarioController();
let exclusao = new ExclusaoController();

router.get("/usuario/listar", usuario.listar);
router.post("/usuario/cadastrar", usuario.cadastrar);
router.post("/usuario/alterar", usuario.alterar);
router.delete("/usuario/excluir/:id", exclusao.excluirUsuario);

module.exports = router;
