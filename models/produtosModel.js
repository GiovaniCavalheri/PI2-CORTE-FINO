const Database = require("../database/database");
const Promocao = require("./promocaoModel");
const Lote = require("./loteModel");
const { textoPreenchido, idValido, dataValida, hoje } = require("./validacao");

//validade do lote com saldo que vence primeiro (LOTE.ID_PRODUTO liga o lote
//ao produto). Usado nas listagens junto com a DATA_VALIDADE do produto
const SQL_VALIDADE_LOTE =
  "(select min(l.DATA_VALIDADE) from LOTE l " +
  "where l.ID_PRODUTO = p.ID_PRODUTO and l.QNT_LOTE > 0)";

class Produtos {
  #id;
  #idCategoria;
  #idMarca;
  #nomeProduto;
  #descricaoProduto;
  #precoVenda;
  #qntEstoque;
  #dataValidade;

  constructor(
    id,
    idCategoria,
    idMarca,
    nomeProduto,
    descricaoProduto,
    precoVenda,
    qntEstoque,
    dataValidade,
  ) {
    this.#id = id;
    this.#idCategoria = idCategoria;
    this.#idMarca = idMarca;
    this.#nomeProduto = nomeProduto;
    this.#descricaoProduto = descricaoProduto;
    this.#precoVenda = precoVenda;
    this.#qntEstoque = qntEstoque;
    this.#dataValidade = dataValidade;
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

  get dataValidade() {
    return this.#dataValidade;
  }
  set dataValidade(valor) {
    this.#dataValidade = valor;
  }

  //regras do produto: nome, categoria e marca obrigatorios, preco >= 0,
  //estoque inteiro >= 0, descricao e validade opcionais.
  //Devolve o texto do erro ou null
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
    //validade nao informada (null, undefined ou vazia) vira a data de hoje
    //(new Date() no formato "AAAA-MM-DD", o mesmo que a coluna DATE usa)
    if (this.#dataValidade == null || this.#dataValidade === "") {
      this.#dataValidade = hoje();
    }
    if (!dataValida(this.#dataValidade)) {
      return "Data de validade inválida.";
    }

    this.#nomeProduto = this.#nomeProduto.trim();
    this.#idCategoria = Number(this.#idCategoria);
    this.#idMarca = Number(this.#idMarca);
    this.#precoVenda = preco;
    this.#qntEstoque = estoque;
    this.#descricaoProduto = (this.#descricaoProduto || "").trim();
    return null;
  }

  //cadastro sem lote: o produto ainda nao chegou, entao o estoque tem que
  //ser 0 (produto que chegou entra por cadastrarComLotes, que cria o lote).
  //Devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }
    if (this.#qntEstoque > 0) {
      return {
        ok: false,
        erro: "Produto com estoque precisa de um lote: informe o lote de entrada.",
      };
    }

    let sql =
      "insert into PRODUTOS (ID_CATEGORIA, ID_MARCA, NOME_PRODUTO, DESCRICAO, PRECO_VENDA, QNT_ESTOQUE, DATA_VALIDADE) values (?,?,?,?,?,?,?)";
    let valores = [
      this.#idCategoria,
      this.#idMarca,
      this.#nomeProduto,
      this.#descricaoProduto,
      this.#precoVenda,
      this.#qntEstoque,
      this.#dataValidade,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //cadastro de produto que chegou (tela do administrador e area do
  //fornecedor): grava o produto e os lotes numa transacao (tudo ou nada).
  //O estoque e a soma dos lotes. Se a validade do produto nao foi informada,
  //usa a do lote que vence primeiro.
  //lotes: [{ codigoLote, quantidade, dataFabricacao, dataValidade }]
  //Devolve { ok, idProduto } ou { ok: false, erro }
  async cadastrarComLotes(lotes) {
    if (!Array.isArray(lotes) || lotes.length == 0) {
      return { ok: false, erro: "Adicione pelo menos um lote ao produto." };
    }

    let listaLotes = [];
    for (let i = 0; i < lotes.length; i++) {
      let item = lotes[i] || {};
      let lote = new Lote(
        0,
        0,
        item.dataValidade,
        item.quantidade,
        item.codigoLote,
        item.dataFabricacao,
      );
      let erro = lote.validar();
      if (erro != null) {
        return { ok: false, erro: "Lote " + (i + 1) + ": " + erro };
      }
      listaLotes.push(lote);
    }

    this.#qntEstoque = listaLotes.reduce((soma, lote) => soma + lote.qntLote, 0);
    if (this.#dataValidade == null || this.#dataValidade === "") {
      this.#dataValidade = listaLotes
        .map((lote) => lote.dataValidade)
        .sort()[0];
    }

    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let produto = this;
    let banco = new Database();
    try {
      let idProduto = await banco.ExecutaTransacao(async function (executar) {
        let result = await executar(
          "insert into PRODUTOS (ID_CATEGORIA, ID_MARCA, NOME_PRODUTO, DESCRICAO, PRECO_VENDA, QNT_ESTOQUE, DATA_VALIDADE) values (?,?,?,?,?,?,?)",
          [
            produto.idCategoria,
            produto.idMarca,
            produto.nomeProduto,
            produto.descricaoProduto,
            produto.precoVenda,
            produto.qntEstoque,
            produto.dataValidade,
          ],
        );
        for (let i = 0; i < listaLotes.length; i++) {
          let lote = listaLotes[i];
          await executar(
            "insert into LOTE (ID_PRODUTO, DATA_VALIDADE, QNT_LOTE, CODIGO_LOTE, DATA_FABRICACAO) values (?,?,?,?,?)",
            [
              result.insertId,
              lote.dataValidade,
              lote.qntLote,
              lote.codigoLote,
              lote.dataFabricacao,
            ],
          );
        }
        return result.insertId;
      });
      return { ok: true, idProduto: idProduto };
    } catch (erro) {
      //chave estrangeira: categoria ou marca nao existe
      if (erro.code == "ER_NO_REFERENCED_ROW_2") {
        return { ok: false, erro: "Categoria ou marca não encontrada." };
      }
      throw erro;
    }
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
        linha["DATA_VALIDADE"],
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
      "update PRODUTOS set ID_CATEGORIA = ?, ID_MARCA = ?, NOME_PRODUTO = ?, DESCRICAO = ?, PRECO_VENDA = ?, QNT_ESTOQUE = ?, DATA_VALIDADE = ? where ID_PRODUTO = ?";
    let valores = [
      this.#idCategoria,
      this.#idMarca,
      this.#nomeProduto,
      this.#descricaoProduto,
      this.#precoVenda,
      this.#qntEstoque,
      this.#dataValidade,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //listagem com JOIN para trazer o nome da categoria e da marca.
  //PRECO_ATUAL = preco com a promocao em vigor (ou o preco de venda)
  //DATA_VALIDADE = validade cadastrada no produto
  //VALIDADE_LOTE = validade do lote com saldo que vence primeiro (ou null)
  async listarDetalhado() {
    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, p.DESCRICAO, p.PRECO_VENDA, p.QNT_ESTOQUE, " +
      "p.DATA_VALIDADE, " +
      SQL_VALIDADE_LOTE +
      " as VALIDADE_LOTE, " +
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
      "p.DATA_VALIDADE, " +
      SQL_VALIDADE_LOTE +
      " as VALIDADE_LOTE, " +
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
