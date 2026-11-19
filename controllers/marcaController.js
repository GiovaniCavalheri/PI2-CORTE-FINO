const Marca = require("../models/marcaModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Marca.validar)
class MarcaController {
  async listar(req, res) {
    let marcas = await new Marca().listar();

    //monta a lista so com os campos que a tela usa
    let lista = [];
    for (let i = 0; i < marcas.length; i++) {
      lista.push({
        id: marcas[i].id,
        nomeMarca: marcas[i].nomeMarca,
      });
    }
    res.send(lista);
  }

  async buscar(req, res) {
    let marca = await new Marca().buscarPorId(req.params.id);
    if (marca == null) {
      res.send({ ok: false, erro: "Marca não encontrada." });
    } else {
      //campos privados nao aparecem no JSON: monta o objeto pelos getters
      res.send({
        ok: true,
        marca: { id: marca.id, nomeMarca: marca.nomeMarca },
      });
    }
  }

  async cadastrar(req, res) {
    let marca = new Marca(0, req.body.nome);
    res.send(await marca.cadastrar());
  }

  async alterar(req, res) {
    let marca = new Marca(req.body.id, req.body.nome);
    res.send(await marca.alterar());
  }

  //exclusao via fetch
  async excluir(req, res) {
    res.send(await new Marca().excluir(req.params.id));
  }
}

module.exports = MarcaController;
