const Database = require("../database/database");
const { diasValidos, idValido, dataValida, hoje } = require("./validacao");

//prazo padrao para "proximo do vencimento"
const DIAS_PADRAO_VENCIMENTO = 7;

class Lote {
  #id;
  #idProduto;
  #dataValidade;
  #qntLote;
  #codigoLote;
  #dataFabricacao;

  constructor(
    id,
    idProduto,
    dataValidade,
    qntLote,
    codigoLote,
    dataFabricacao,
  ) {
    this.#id = id;
    this.#idProduto = idProduto;
    this.#dataValidade = dataValidade;
    this.#qntLote = qntLote;
    this.#codigoLote = codigoLote;
    this.#dataFabricacao = dataFabricacao;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get idProduto() {
    return this.#idProduto;
  }
  set idProduto(valor) {
    this.#idProduto = valor;
  }

  get dataValidade() {
    return this.#dataValidade;
  }
  set dataValidade(valor) {
    this.#dataValidade = valor;
  }

  get qntLote() {
    return this.#qntLote;
  }
  set qntLote(valor) {
    this.#qntLote = valor;
  }

  get codigoLote() {
    return this.#codigoLote;
  }
  set codigoLote(valor) {
    this.#codigoLote = valor;
  }

  get dataFabricacao() {
    return this.#dataFabricacao;
  }
  set dataFabricacao(valor) {
    this.#dataFabricacao = valor;
  }

  //regras do lote: codigo (ate 20 caracteres), quantidade inteira > 0,
  //fabricacao ate hoje e validade nao antes da fabricacao.
  //O produto e conferido em cadastrarNoProduto. Devolve o texto do erro ou null
  validar() {
    let codigo = typeof this.#codigoLote == "string" ? this.#codigoLote.trim() : "";
    let quantidade = Number(this.#qntLote);

    if (codigo == "" || codigo.length > 20) {
      return "informe o código do lote (até 20 caracteres).";
    }
    if (this.#qntLote === "" || !Number.isInteger(quantidade) || quantidade <= 0) {
      return "a quantidade tem que ser um número inteiro maior que zero.";
    }
    if (!dataValida(this.#dataFabricacao) || !dataValida(this.#dataValidade)) {
      return "informe as datas de fabricação e de validade.";
    }
    if (this.#dataFabricacao > hoje()) {
      return "a data de fabricação não pode estar no futuro.";
    }
    if (this.#dataFabricacao > this.#dataValidade) {
      return "a validade não pode ser antes da fabricação.";
    }

    this.#codigoLote = codigo;
    this.#qntLote = quantidade;
    return null;
  }

  //adiciona o lote a um produto que ja existe e soma a quantidade no estoque
  //(transacao: tudo ou nada). Devolve { ok, idLote } ou { ok: false, erro }
  async cadastrarNoProduto() {
    if (!idValido(this.#idProduto)) {
      return { ok: false, erro: "Selecione o produto." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: "Lote: " + erro };
    }

    let lote = this;
    let idProduto = Number(this.#idProduto);
    let banco = new Database();
    let idLote = await banco.ExecutaTransacao(async function (executar) {
      let produto = await executar(
        "update PRODUTOS set QNT_ESTOQUE = QNT_ESTOQUE + ? where ID_PRODUTO = ?",
        [lote.qntLote, idProduto],
      );
      if (produto.affectedRows == 0) {
        return null;
      }
      let result = await executar(
        "insert into LOTE (ID_PRODUTO, DATA_VALIDADE, QNT_LOTE, CODIGO_LOTE, DATA_FABRICACAO) values (?,?,?,?,?)",
        [idProduto, lote.dataValidade, lote.qntLote, lote.codigoLote, lote.dataFabricacao],
      );
      return result.insertId;
    });

    if (idLote == null) {
      return { ok: false, erro: "Produto não encontrado." };
    }
    return { ok: true, idLote: idLote };
  }

  async cadastrar() {
    let sql =
      "insert into LOTE (ID_PRODUTO, DATA_VALIDADE, QNT_LOTE, CODIGO_LOTE, DATA_FABRICACAO) values (?,?,?,?,?)";
    let valores = [
      this.#idProduto,
      this.#dataValidade,
      this.#qntLote,
      this.#codigoLote,
      this.#dataFabricacao,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async excluir(id) {
    let sql = "delete from LOTE where ID_LOTE = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async listar() {
    let sql = "select * from LOTE";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let lote = new Lote(
        linha["ID_LOTE"],
        linha["ID_PRODUTO"],
        linha["DATA_VALIDADE"],
        linha["QNT_LOTE"],
        linha["CODIGO_LOTE"],
        linha["DATA_FABRICACAO"],
      );

      lista.push(lote);
    }
    return lista;
  }

  //lotes com saldo e validade ja passada (tela de Descartes)
  async listarVencidos() {
    let sql =
      "select l.ID_LOTE, l.CODIGO_LOTE, l.DATA_FABRICACAO, l.DATA_VALIDADE, l.QNT_LOTE, " +
      "p.ID_PRODUTO, p.NOME_PRODUTO, datediff(curdate(), l.DATA_VALIDADE) as DIAS_VENCIDO " +
      "from LOTE l inner join PRODUTOS p on p.ID_PRODUTO = l.ID_PRODUTO " +
      "where l.QNT_LOTE > 0 and l.DATA_VALIDADE < curdate() " +
      "order by l.DATA_VALIDADE, p.NOME_PRODUTO";

    let banco = new Database();
    return await banco.ExecutaComando(sql);
  }

  //lotes com saldo que vencem de hoje ate daqui a "dias" dias (padrao 7)
  //(tela de Promocoes e relatorio de vencimento).
  //Devolve { ok, dias, lotes } ou { ok: false, erro }
  async listarProximosVencimento(dias) {
    dias = diasValidos(dias, DIAS_PADRAO_VENCIMENTO);
    if (dias == null) {
      return { ok: false, erro: "Informe um número de dias entre 0 e 365." };
    }

    let sql =
      "select l.ID_LOTE, l.CODIGO_LOTE, l.DATA_FABRICACAO, l.DATA_VALIDADE, l.QNT_LOTE, " +
      "p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO_VENDA, c.NOME_CATEGORIA, m.NOME_MARCA, " +
      "datediff(l.DATA_VALIDADE, curdate()) as DIAS_RESTANTES, " +
      //1 se o produto ja esta numa promocao ativa que ainda nao terminou
      "exists (select 1 from PROMOCAO_PRODUTO pp " +
      "inner join PROMOCAO pr on pr.ID_PROMOCAO = pp.ID_PROMOCAO " +
      "where pp.ID_PRODUTO = p.ID_PRODUTO and pr.ATIVA = 1 and pr.DATA_FIM >= curdate()) as EM_PROMOCAO " +
      "from LOTE l " +
      "inner join PRODUTOS p on p.ID_PRODUTO = l.ID_PRODUTO " +
      "inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
      "inner join MARCA m on m.ID_MARCA = p.ID_MARCA " +
      "where l.QNT_LOTE > 0 " +
      "and l.DATA_VALIDADE between curdate() and date_add(curdate(), interval ? day) " +
      "order by l.DATA_VALIDADE, p.NOME_PRODUTO";
    let valores = [dias];

    let banco = new Database();
    let lotes = await banco.ExecutaComando(sql, valores);
    return { ok: true, dias: dias, lotes: lotes };
  }

  async alterar() {
    let sql =
      "update LOTE set ID_PRODUTO = ?, DATA_VALIDADE = ?, QNT_LOTE = ?, CODIGO_LOTE = ?, DATA_FABRICACAO = ? where ID_LOTE = ?";
    let valores = [
      this.#idProduto,
      this.#dataValidade,
      this.#qntLote,
      this.#codigoLote,
      this.#dataFabricacao,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }
}

module.exports = Lote;
