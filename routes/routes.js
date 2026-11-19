const express = require("express");

const router = express.Router();

router.use(require("./homeRoutes"));
router.use(require("./loginRoutes"));
router.use(require("./pedidoRoutes"));
router.use(require("./produtoRoutes"));
router.use(require("./categoriaRoutes"));
router.use(require("./marcaRoutes"));
router.use(require("./usuarioRoutes"));
router.use(require("./administradorRoutes"));
router.use(require("./fornecedorRoutes"));
router.use(require("./socioRoutes"));
router.use(require("./compraRoutes"));
router.use(require("./descarteRoutes"));

module.exports = router;
