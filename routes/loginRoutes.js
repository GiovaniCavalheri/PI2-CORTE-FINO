const express = require("express");
const LoginController = require("../controllers/loginController");

const router = express.Router();
let login = new LoginController();

//login (temporario, sem sessao)
router.post("/login", login.login);
router.post("/administrador/login", login.loginAdministrador);
//router.get("/logout", login.logout);

module.exports = router;
