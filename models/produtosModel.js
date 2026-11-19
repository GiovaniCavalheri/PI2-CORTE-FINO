const Database = require("../database/database");
const Promocao = require("./promocaoModel");
const { textoPreenchido, idValido } = require("./validacao");

class Produtos {
  #id;
  #idCategoria;
  #idMarca;
  #nomeProduto;
  #descricaoProduto;
  #precoVenda;
  #qntEstoque;

  constructor(
    id,
    idCategoria,
    idMarca,
    nomeProduto,
    descricaoProduto,
    precoVenda,
    qntEstoque,
  ) {
    this.#id = id;
    this.#idCategoria = idCategoria;
    this.#idMarca = idMarca;
    this.#nomeProduto = nomeProduto;
    this.#descricaoProduto = descricaoProduto;
    this.#precoVenda = precoVenda;
    this.#qntEstoque = qntEstoque;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get idCategoria() {
    return this.#idCategoria;
  }
  set idCategoria(valor) {
    this.#idCategoria = valor;
  }

  get idMarca() {
    return this.#idMarca;
  }
  set idMarca(valor) {
    this.#idMarca = valor;
  }

  get nomeProduto() {
    return this.#nomeProduto;
  }
  set nomeProduto(valor) {
    this.#nomeProduto = valor;
  }

  get descricaoProduto() {
    return this.#descricaoProduto;
  }
  set descricaoProduto(valor) {
    this.#descricaoProduto = valor;
  }

  get precoVenda() {
    return this.#precoVenda;
  }
  set precoVenda(valor) {
    this.#precoVenda = valor;
  }

  get qntEstoque() {
    return this.#qntEstoque;
  }
  set qntEstoque(valor) {
    this.#qntEstoque = valor;
  }

  //regras do produto: nome, categoria e marca obrigatorios, preco >= 0,
  //estoque inteiro >= 0, descricao opcional. Devolve o texto do erro ou null
  validar() {
    if (!textoPreenchido(this.#nomeProduto)) {
      return "Informe o nome do produto.";
    }
    if (!idValido(this.#idCategoria)) {
      return "Selecione a categoria.";
    }
    if (!idValido(this.#idMarca)) {
      return "Selecione a marca.";
    }
    let preco = Number(this.#precoVenda);
    if (this.#precoVenda === "" || this.#precoVenda == null || !Number.isFinite(preco) || preco < 0) {
      return "O preço tem que ser um número maior ou igual a zero.";
    }
    let estoque = Number(this.#qntEstoque);
    if (this.#qntEstoque === "" || this.#qntEstoque == null || !Number.isInteger(estoque) || estoque < 0) {
      return "O estoque tem que ser um número inteiro maior ou igual a zero.";
    }
    if (this.#descricaoProduto != null && typeof this.#descricaoProduto != "string") {
      return "Descrição inválida.";
    }

    this.#nomeProduto = this.#nomeProduto.trim();
    this.#idCategoria = Number(this.#idCategoria);
    this.#idMarca = Number(this.#idMarca);
    this.#precoVenda = preco;
    this.#qntEstoque = estoque;
    this.#descricaoProduto = (this.#descricaoProduto || "").trim();
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "insert into PRODUTOS (ID_CATEGORIA, ID_MARCA, NOME_PRODUTO, DESCRICAO, PRECO_VENDA, QNT_ESTOQUE) values (?,?,?,?,?,?)";
    let valores = [
      this.#idCategoria,
      this.#idMarca,
      this.#nomeProduto,
      this.#descricaoProduto,
      this.#precoVenda,
      this.#qntEstoque,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //o produto nao pode ser excluido se estiver em pedido, lote ou promocao.
  //Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Produto inválido." };
    }
    if (await this.possuiPedidos(id)) {
      return { ok: false, erro: "Este produto está em pedidos e não pode ser excluído." };
    }
    if (await this.possuiLotes(id)) {
      return { ok: false, erro: "Este produto possui lotes no estoque e não pode ser excluído." };
    }
    if (await this.possuiPromocoes(id)) {
      return { ok: false, erro: "Este produto está em uma promoção e não pode ser excluído." };
    }

    let sql = "delete from PRODUTOS where ID_PRODUTO = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //usados antes de excluir: o produto nao pode estar em pedido, lote ou promocao
  async possuiPedidos(id) {
    let sql =
      "select count(*) as total from ITENS_PEDIDOS where ID_PRODUTO = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async possuiLotes(id) {
    let sql = "select count(*) as total from LOTE where ID_PRODUTO = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async possuiPromocoes(id) {
    let sql =
      "select count(*) as total from PROMOCAO_PRODUTO where ID_PRODUTO = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async listar() {
    let sql = "select * from PRODUTOS";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let produto = new Produtos(
        linha["ID_PRODUTO"],
        linha["ID_CATEGORIA"],
        linha["ID_MARCA"],
        linha["NOME_PRODUTO"],
        linha["DESCRICAO"],
        linha["PRECO_VENDA"],
        linha["QNT_ESTOQUE"],
      );

      lista.push(produto);
    }
    return lista;
  }

  //devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Produto inválido." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "update PRODUTOS set ID_CATEGORIA = ?, ID_MARCA = ?, NOME_PRODUTO = ?, DESCRICAO = ?, PRECO_VENDA = ?, QNT_ESTOQUE = ? where ID_PRODUTO = ?";
    let valores = [
      this.#idCategoria,
      this.#idMarca,
      this.#nomeProduto,
      this.#descricaoProduto,
      this.#precoVenda,
      this.#qntEstoque,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //listagem com JOIN para trazer o nome da categoria e da marca.
  //PRECO_ATUAL = preco com a promocao em vigor (ou o preco de venda)
  async listarDetalhado() {
    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, p.DESCRICAO, p.PRECO_VENDA, p.QNT_ESTOQUE, " +
      "p.ID_CATEGORIA, p.ID_MARCA, c.NOME_CATEGORIA, m.NOME_MARCA, " +
      Promocao.SQL_PRECO_ATUAL +
      " as PRECO_ATUAL " +
      "from PRODUTOS p " +
      "inner join CATEGORIAS_PRODUTO c on p.ID_CATEGORIA = c.ID_CATEGORIA " +
      "inner join MARCA m on p.ID_MARCA = m.ID_MARCA";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    return linhas;
  }

  //devolve o produto (com nome da categoria e da marca), ou null se o id
  //for invalido ou nao existir
  async buscarPorId(id) {
    if (!idValido(id)) {
      return null;
    }

    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, p.DESCRICAO, p.PRECO_VENDA, p.QNT_ESTOQUE, " +
      "p.ID_CATEGORIA, p.ID_MARCA, c.NOME_CATEGORIA, m.NOME_MARCA " +
      "from PRODUTOS p " +
      "inner join CATEGORIAS_PRODUTO c on p.ID_CATEGORIA = c.ID_CATEGORIA " +
      "inner join MARCA m on p.ID_MARCA = m.ID_MARCA " +
      "where p.ID_PRODUTO = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    if (linhas.length == 0) {
      return null;
    }
    return linhas[0];
  }
}

module.exports = Produtos;
