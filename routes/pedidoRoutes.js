const express = require("express");
const PedidoController = require("../controllers/pedidoController");

const router = express.Router();
let pedido = new PedidoController();

//pedido (carrinho): baixa o estoque e grava PEDIDOS + ITENS_PEDIDOS
router.post("/pedido/finalizar", pedido.finalizar);
router.get("/pedido/listar", pedido.listar);
router.post("/pedido/status", pedido.alterarStatus);

module.exports = router;
