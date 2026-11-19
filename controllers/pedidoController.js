const Pedidos = require("../models/classPedidos");

//o controller so le a requisicao e devolve a resposta:
//as regras (login, itens do carrinho, status validos) ficam no model
class PedidoController {
  //body: { idCliente, itens: [{ idProduto, quantidade }] }
  async finalizar(req, res) {
    let resultado = await new Pedidos().finalizar(req.body.idCliente, req.body.itens);
    res.send(resultado);
  }

  async listar(req, res) {
    let pedidos = await new Pedidos().listarDetalhado();
    res.send(pedidos);
  }

  //tela de Pedidos do admin: muda o status de um pedido
  async alterarStatus(req, res) {
    let resultado = await new Pedidos().alterarStatus(req.body.id, req.body.status);
    res.send(resultado);
  }
}

module.exports = PedidoController;
