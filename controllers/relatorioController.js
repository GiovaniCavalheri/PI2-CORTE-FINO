const Relatorio = require("../models/relatorioModel");

//o controller so le os filtros da URL e devolve a resposta:
//a validacao dos filtros fica no model (Relatorio)
class RelatorioController {
  //R1: ?idCategoria=&idMarca=&dataInicio=&dataFim=
  async maisVendidos(req, res) {
    let resultado = await new Relatorio().maisVendidos(
      req.query.idCategoria,
      req.query.idMarca,
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }

  //R2: ?dataInicio=&dataFim=
  async descartados(req, res) {
    let resultado = await new Relatorio().descartados(
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }

  //R3: ?dataInicio=&dataFim=
  async maisPromocoes(req, res) {
    let resultado = await new Relatorio().maisPromocoes(
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }

  //R4: ?dias= (padrao 7)
  async proximosVencimento(req, res) {
    let resultado = await new Relatorio().proximosVencimento(req.query.dias);
    res.send(resultado);
  }

  //R5: ?idFornecedor=&dataInicio=&dataFim=
  async compras(req, res) {
    let resultado = await new Relatorio().compras(
      req.query.idFornecedor,
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }
}

module.exports = RelatorioController;
