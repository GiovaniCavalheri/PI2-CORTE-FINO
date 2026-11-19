const CategoriasProduto = require("../models/categoriaProdutoModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (CategoriasProduto.validar)
class CategoriaController {
  async listar(req, res) {
    let categorias = await new CategoriasProduto().listar();

    //monta a lista so com os campos que a tela usa
    let lista = [];
    for (let i = 0; i < categorias.length; i++) {
      lista.push({
        id: categorias[i].id,
        nomeCategoria: categorias[i].nomeCategoria,
        descricao: categorias[i].descricao,
      });
    }
    res.send(lista);
  }

  async buscar(req, res) {
    let categoria = await new CategoriasProduto().buscarPorId(req.params.id);
    if (categoria == null) {
      res.send({ ok: false, erro: "Categoria não encontrada." });
    } else {
      //campos privados nao aparecem no JSON: monta o objeto pelos getters
      res.send({
        ok: true,
        categoria: {
          id: categoria.id,
          nomeCategoria: categoria.nomeCategoria,
          descricao: categoria.descricao,
        },
      });
    }
  }

  async cadastrar(req, res) {
    let categoria = new CategoriasProduto(0, req.body.nome, req.body.descricao);
    res.send(await categoria.cadastrar());
  }

  async alterar(req, res) {
    let categoria = new CategoriasProduto(
      req.body.id,
      req.body.nome,
      req.body.descricao,
    );
    res.send(await categoria.alterar());
  }

  async excluir(req, res) {
    res.send(await new CategoriasProduto().excluir(req.params.id));
  }
}

module.exports = CategoriaController;
