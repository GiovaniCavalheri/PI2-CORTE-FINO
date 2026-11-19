const Produtos = require("../models/produtosModel");
const Lote = require("../models/loteModel");
const CategoriasProduto = require("../models/categoriaProdutoModel");
const Marca = require("../models/marcaModel");

//area do fornecedor: cadastro de produtos com lotes.
//So chega aqui quem passou pelo middleware exigirFornecedor (req.fornecedor).
//O controller so le a requisicao e devolve a resposta:
//as regras ficam nos models (Produtos.cadastrarComLotes e Lote.cadastrarNoProduto)
class AreaFornecedorController {
  async produtosView(req, res) {
    let produtos = await new Produtos().listarDetalhado();
    let categorias = await new CategoriasProduto().listar();
    let marcas = await new Marca().listar();

    res.render("fornecedorProdutos", {
      fornecedor: {
        id: req.fornecedor.id,
        nome: req.fornecedor.nomeFantasia || req.fornecedor.nomeFornecedor,
      },
      produtos: produtos,
      categorias: categorias,
      marcas: marcas,
    });
  }

  async listarProdutos(req, res) {
    res.send(await new Produtos().listarDetalhado());
  }

  //body: { nome, categoria, marca, preco, descricao, lotes: [...] }
  async cadastrarProduto(req, res) {
    let body = req.body;
    //estoque e validade sao calculados a partir dos lotes no model
    let produto = new Produtos(
      0,
      body.categoria,
      body.marca,
      body.nome,
      body.descricao,
      body.preco,
      0,
      null,
    );
    res.send(await produto.cadastrarComLotes(body.lotes));
  }

  //body: { idProduto, codigoLote, quantidade, dataFabricacao, dataValidade }
  async cadastrarLote(req, res) {
    let body = req.body;
    let lote = new Lote(
      0,
      body.idProduto,
      body.dataValidade,
      body.quantidade,
      body.codigoLote,
      body.dataFabricacao,
    );
    res.send(await lote.cadastrarNoProduto());
  }
}

module.exports = AreaFornecedorController;
