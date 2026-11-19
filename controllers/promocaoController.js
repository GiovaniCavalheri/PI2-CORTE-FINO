const Promocao = require("../models/promocaoModel");
const Lote = require("../models/loteModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Promocao.validar)
class PromocaoController {
  //lotes que vencem nos proximos ?dias= dias (padrao 7)
  async proximosVencimento(req, res) {
    let resultado = await new Lote().listarProximosVencimento(req.query.dias);
    res.send(resultado);
  }

  //body: { idsProdutos: [..], tipo: "percentual" | "preco", valor, dataInicio, dataFim }
  async cadastrar(req, res) {
    let tipo = req.body.tipo;
    let valor = req.body.valor;

    //o formulario manda tipo + valor; o model recebe um dos dois campos
    let promocao = new Promocao(
      0,
      tipo == "percentual" ? valor : null,
      req.body.dataInicio,
      req.body.dataFim,
      tipo == "preco" ? valor : null,
      1,
    );
    let resultado = await promocao.cadastrarCompleta(req.body.idsProdutos);
    res.send(resultado);
  }

  async ativas(req, res) {
    let promocoes = await new Promocao().listarAtivas();
    res.send({ ok: true, promocoes: promocoes });
  }

  //body: { id }
  async encerrar(req, res) {
    let resultado = await new Promocao().encerrar(req.body.id);
    res.send(resultado);
  }
}

module.exports = PromocaoController;
