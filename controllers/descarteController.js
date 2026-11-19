const Descarte = require("../models/descarteModel");
const Lote = require("../models/loteModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Descarte.validar)
class DescarteController {
  //lotes vencidos que ainda tem saldo
  async vencidos(req, res) {
    let lotes = await new Lote().listarVencidos();
    res.send({ ok: true, lotes: lotes });
  }

  //body: { idLote, idAdm, quantidade, motivo, dataDescarte }
  async cadastrar(req, res) {
    let descarte = new Descarte(
      0,
      req.body.idLote,
      req.body.idAdm,
      req.body.dataDescarte,
      req.body.quantidade,
      req.body.motivo,
    );
    let resultado = await descarte.registrar();
    res.send(resultado);
  }

  //filtros opcionais na URL: ?dataInicio=&dataFim=
  async historico(req, res) {
    let resultado = await new Descarte().historico(
      req.query.dataInicio,
      req.query.dataFim,
    );
    res.send(resultado);
  }
}

module.exports = DescarteController;
