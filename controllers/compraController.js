const Compra = require("../models/compraModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Compra.validar)
class CompraController {
  //body: { idFornecedor, idAdm, itens: [{ idProduto, quantidade, precoCompra,
  //        codigoLote, dataFabricacao, dataValidade }] }
  async cadastrar(req, res) {
    let compra = new Compra(0, req.body.idFornecedor, req.body.idAdm);
    let resultado = await compra.cadastrarCompleta(req.body.itens);
    res.send(resultado);
  }

  //filtros opcionais na URL: ?idFornecedor=&dataInicio=&dataFim=
  async listar(req, res) {
    let resultado = await new Compra().listarDetalhado(
      req.query.idFornecedor,
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }
}

module.exports = CompraController;
