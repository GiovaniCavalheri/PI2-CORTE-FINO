const Database = require("../database/database");
const { idValido, dataValida, hoje, validarPeriodo } = require("./validacao");

class Descarte {
  #id;
  #idLote;
  #idAdm;
  #dataDescarte;
  #qntDescartada;
  #motivoDescarte;

  constructor(id, idLote, idAdm, dataDescarte, qntDescartada, motivoDescarte) {
    this.#id = id;
    this.#idLote = idLote;
    this.#idAdm = idAdm;
    this.#dataDescarte = dataDescarte;
    this.#qntDescartada = qntDescartada;
    this.#motivoDescarte = motivoDescarte;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get idLote() {
    return this.#idLote;
  }
  set idLote(valor) {
    this.#idLote = valor;
  }

  get idAdm() {
    return this.#idAdm;
  }
  set idAdm(valor) {
    this.#idAdm = valor;
  }

  get dataDescarte() {
    return this.#dataDescarte;
  }
  set dataDescarte(valor) {
    this.#dataDescarte = valor;
  }

  get qntDescartada() {
    return this.#qntDescartada;
  }
  set qntDescartada(valor) {
    this.#qntDescartada = valor;
  }

  get motivoDescarte() {
    return this.#motivoDescarte;
  }
  set motivoDescarte(valor) {
    this.#motivoDescarte = valor;
  }

  async cadastrar() {
    let sql =
      "insert into DESCARTE (ID_LOTE, ID_ADM, QNT_DESCARTADA, MOTIVO_DESCARTE) values (?,?,?,?)";
    let valores = [
      this.#idLote,
      this.#idAdm,
      this.#qntDescartada,
      this.#motivoDescarte,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async excluir(id) {
    let sql = "delete from DESCARTE where ID_DESCARTE = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async listar() {
    let sql = "select * from DESCARTE";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let descarte = new Descarte(
        linha["ID_DESCARTE"],
        linha["ID_LOTE"],
        linha["ID_ADM"],
        linha["DATA_DESCARTE"],
        linha["QNT_DESCARTADA"],
        linha["MOTIVO_DESCARTE"],
      );

      lista.push(descarte);
    }
    return lista;
  }

  //regras do descarte (as que nao dependem do banco).
  //Sem data, usa hoje. Devolve o texto do erro ou null se estiver tudo certo
  validar() {
    if (typeof this.#motivoDescarte == "string") {
      this.#motivoDescarte = this.#motivoDescarte.trim();
    }
    if (!this.#dataDescarte) {
      this.#dataDescarte = hoje();
    }

    if (!idValido(this.#idAdm)) {
      return "Entre como administrador para registrar o descarte.";
    }
    if (!idValido(this.#idLote)) {
      return "Selecione o lote.";
    }
    let quantidade = Number(this.#qntDescartada);
    if (this.#qntDescartada === "" || !Number.isInteger(quantidade) || quantidade <= 0) {
      return "A quantidade tem que ser um número inteiro maior que zero.";
    }
    if (
      typeof this.#motivoDescarte != "string" ||
      this.#motivoDescarte == "" ||
      this.#motivoDescarte.length > 255
    ) {
      return "Informe o motivo do descarte (até 255 caracteres).";
    }
    if (!dataValida(this.#dataDescarte) || this.#dataDescarte > hoje()) {
      return "Data do descarte inválida (não pode estar no futuro).";
    }
    return null;
  }

  //registra o descarte numa transacao: grava DESCARTE e tira a quantidade
  //do lote e do estoque do produto. Devolve { ok } ou { ok: false, erro }.
  //dataDescarte: "AAAA-MM-DD" (se for hoje, grava tambem a hora atual)
  async registrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    try {
      return await this.#gravar();
    } catch (erroBanco) {
      if (erroBanco.code == "ER_NO_REFERENCED_ROW_2") {
        return { ok: false, erro: "Administrador não encontrado." };
      }
      throw erroBanco;
    }
  }

  //grava o descarte ja validado; confere o saldo do lote e do produto
  //dentro da transacao (regras que dependem do banco)
  async #gravar() {
    let idLote = Number(this.#idLote);
    let idAdm = Number(this.#idAdm);
    let dataDescarte = this.#dataDescarte;
    let qntDescartada = Number(this.#qntDescartada);
    let motivo = this.#motivoDescarte;

    let banco = new Database();
    return await banco.ExecutaTransacao(async function (executar) {
      let lotes = await executar(
        "select ID_PRODUTO from LOTE where ID_LOTE = ?",
        [idLote],
      );
      if (lotes.length == 0) {
        return { ok: false, erro: "Lote não encontrado." };
      }
      let idProduto = lotes[0]["ID_PRODUTO"];

      //trava produto e depois lote (mesma ordem da venda, evita deadlock)
      let produtos = await executar(
        "select QNT_ESTOQUE from PRODUTOS where ID_PRODUTO = ? for update",
        [idProduto],
      );
      let saldoLote = (
        await executar(
          "select QNT_LOTE from LOTE where ID_LOTE = ? for update",
          [idLote],
        )
      )[0]["QNT_LOTE"];

      if (qntDescartada > saldoLote) {
        return {
          ok: false,
          erro: "Quantidade maior que o saldo do lote (" + saldoLote + ").",
        };
      }
      if (qntDescartada > produtos[0]["QNT_ESTOQUE"]) {
        return {
          ok: false,
          erro:
            "Quantidade maior que o estoque do produto (" +
            produtos[0]["QNT_ESTOQUE"] +
            ").",
        };
      }

      await executar(
        "insert into DESCARTE (ID_LOTE, ID_ADM, DATA_DESCARTE, QNT_DESCARTADA, MOTIVO_DESCARTE) " +
          "values (?, ?, if(? = curdate(), now(), ?), ?, ?)",
        [idLote, idAdm, dataDescarte, dataDescarte, qntDescartada, motivo],
      );
      await executar(
        "update LOTE set QNT_LOTE = QNT_LOTE - ? where ID_LOTE = ?",
        [qntDescartada, idLote],
      );
      await executar(
        "update PRODUTOS set QNT_ESTOQUE = QNT_ESTOQUE - ? where ID_PRODUTO = ?",
        [qntDescartada, idProduto],
      );
      return { ok: true };
    });
  }

  //historico de descartes (mais recentes primeiro), com periodo opcional.
  //Devolve { ok, descartes } ou { ok: false, erro }
  async historico(dataInicio, dataFim) {
    let periodo = validarPeriodo(dataInicio, dataFim);
    if (periodo.erro) {
      return { ok: false, erro: periodo.erro };
    }
    dataInicio = periodo.dataInicio;
    dataFim = periodo.dataFim;

    let filtros = "";
    let valores = [];
    if (dataInicio != null) {
      filtros += " and d.DATA_DESCARTE >= ?";
      valores.push(dataInicio);
    }
    if (dataFim != null) {
      filtros += " and d.DATA_DESCARTE < date_add(?, interval 1 day)";
      valores.push(dataFim);
    }

    let sql =
      "select d.ID_DESCARTE, d.DATA_DESCARTE, d.QNT_DESCARTADA, d.MOTIVO_DESCARTE, " +
      "l.ID_LOTE, l.CODIGO_LOTE, l.DATA_VALIDADE, p.ID_PRODUTO, p.NOME_PRODUTO, a.NOME_ADM " +
      "from DESCARTE d " +
      "inner join LOTE l on l.ID_LOTE = d.ID_LOTE " +
      "inner join PRODUTOS p on p.ID_PRODUTO = l.ID_PRODUTO " +
      "inner join ADMINISTRADOR a on a.ID_ADM = d.ID_ADM " +
      "where 1 = 1" +
      filtros +
      " order by d.DATA_DESCARTE desc, d.ID_DESCARTE desc";

    let banco = new Database();
    let descartes = await banco.ExecutaComando(sql, valores);
    return { ok: true, descartes: descartes };
  }

  async alterar() {
    let sql =
      "update DESCARTE set ID_LOTE = ?, ID_ADM = ?, DATA_DESCARTE = ?, QNT_DESCARTADA = ?, MOTIVO_DESCARTE = ? where ID_DESCARTE = ?";
    let valores = [
      this.#idLote,
      this.#idAdm,
      this.#dataDescarte,
      this.#qntDescartada,
      this.#motivoDescarte,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }
}

module.exports = Descarte;
