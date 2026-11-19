const Produtos = require("../models/produtosModel");
const CategoriasProduto = require("../models/categoriaProdutoModel");
const Marca = require("../models/marcaModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Produtos.validar)
function produtoDoFormulario(id, body) {
  return new Produtos(
    id,
    body.categoria,
    body.marca,
    body.nome,
    body.descricao,
    body.preco,
    body.estoque,
  );
}

class ProdutoController {
  async listar(req, res) {
    let produtos = await new Produtos().listarDetalhado();
    res.send(produtos);
  }

  async buscar(req, res) {
    //o model ja devolve um objeto comum (linha do banco com o JOIN)
    let produto = await new Produtos().buscarPorId(req.params.id);
    if (produto == null) {
      res.send({ ok: false, erro: "Produto não encontrado." });
    } else {
      res.send({ ok: true, produto: produto });
    }
  }

  async produtosView(req, res) {
    let produtos = await new Produtos().listarDetalhado();
    res.render("products", { produtos: produtos });
  }

  async painelView(req, res) {
    let produtos = await new Produtos().listarDetalhado();
    let categorias = await new CategoriasProduto().listar();
    let marcas = await new Marca().listar();

    res.render("pageAdm", {
      produtos: produtos,
      categorias: categorias,
      marcas: marcas,
    });
  }

  async cadastrar(req, res) {
    let produto = produtoDoFormulario(0, req.body);
    res.send(await produto.cadastrar());
  }

  async alterar(req, res) {
    let produto = produtoDoFormulario(req.body.id, req.body);
    res.send(await produto.alterar());
  }

  //exclusao via fetch
  async excluir(req, res) {
    res.send(await new Produtos().excluir(req.params.id));
  }
}

module.exports = ProdutoController;
