const Database = require("../database/database");
const {
  idValido,
  idOpcional,
  dataValida,
  hoje,
  validarPeriodo,
} = require("./validacao");

//regras de um item da compra. Devolve o item limpo ou { erro }
function validarItem(item, posicao) {
  let prefixo = "Item " + posicao + ": ";
  if (item == null || typeof item != "object") {
    return { erro: prefixo + "inválido." };
  }

  let quantidade = Number(item.quantidade);
  let precoCompra = Number(item.precoCompra);
  let codigoLote =
    typeof item.codigoLote == "string" ? item.codigoLote.trim() : "";

  if (!idValido(item.idProduto)) {
    return { erro: prefixo + "selecione o produto." };
  }
  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { erro: prefixo + "a quantidade tem que ser um número inteiro maior que zero." };
  }
  if (item.precoCompra === "" || !Number.isFinite(precoCompra) || precoCompra < 0) {
    return { erro: prefixo + "preço de compra inválido." };
  }
  if (codigoLote == "" || codigoLote.length > 20) {
    return { erro: prefixo + "informe o código do lote (até 20 caracteres)." };
  }
  if (!dataValida(item.dataFabricacao) || !dataValida(item.dataValidade)) {
    return { erro: prefixo + "informe as datas de fabricação e de validade." };
  }
  if (item.dataFabricacao > hoje()) {
    return { erro: prefixo + "a data de fabricação não pode estar no futuro." };
  }
  if (item.dataFabricacao > item.dataValidade) {
    return { erro: prefixo + "a validade não pode ser antes da fabricação." };
  }

  return {
    idProduto: Number(item.idProduto),
    quantidade: quantidade,
    precoCompra: Math.round(precoCompra * 100) / 100,
    codigoLote: codigoLote,
    dataFabricacao: item.dataFabricacao,
    dataValidade: item.dataValidade,
  };
}

class Compra {
  #id;
  #idFornecedor;
  #idAdm;
  #dataCompra;

  constructor(id, idFornecedor, idAdm, dataCompra) {
    this.#id = id;
    this.#idFornecedor = idFornecedor;
    this.#idAdm = idAdm;
    this.#dataCompra = dataCompra;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get idFornecedor() {
    return this.#idFornecedor;
  }
  set idFornecedor(valor) {
    this.#idFornecedor = valor;
  }

  get idAdm() {
    return this.#idAdm;
  }
  set idAdm(valor) {
    this.#idAdm = valor;
  }

  get dataCompra() {
    return this.#dataCompra;
  }
  set dataCompra(valor) {
    this.#dataCompra = valor;
  }

  async cadastrar() {
    let sql = "insert into COMPRA (ID_FORNECEDOR, ID_ADM) values (?,?)";
    let valores = [this.#idFornecedor, this.#idAdm];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async excluir(id) {
    let sql = "delete from COMPRA where ID_COMPRA = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async listar() {
    let sql = "select * from COMPRA";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let compra = new Compra(
        linha["ID_COMPRA"],
        linha["ID_FORNECEDOR"],
        linha["ID_ADM"],
        linha["DATA_COMPRA"],
      );

      lista.push(compra);
    }
    return lista;
  }

  //regras da compra: admin, fornecedor e pelo menos um item valido.
  //Devolve { itens } (ja limpos) ou { erro }
  validar(itens) {
    if (!idValido(this.#idAdm)) {
      return { erro: "Entre como administrador para registrar a compra." };
    }
    if (!idValido(this.#idFornecedor)) {
      return { erro: "Selecione o fornecedor." };
    }
    if (!Array.isArray(itens) || itens.length == 0) {
      return { erro: "Adicione pelo menos um produto à compra." };
    }

    let lista = [];
    for (let i = 0; i < itens.length; i++) {
      let item = validarItem(itens[i], i + 1);
      if (item.erro) {
        return { erro: item.erro };
      }
      lista.push(item);
    }
    return { itens: lista };
  }

  //registra a compra inteira numa transacao (tudo ou nada). Para cada item:
  //cria o LOTE, liga o lote a compra (COMPRA_LOTE) e soma no estoque do produto.
  //itens: [{ idProduto, quantidade, precoCompra, codigoLote, dataFabricacao, dataValidade }]
  //Devolve { ok, idCompra } ou { ok: false, erro }
  async cadastrarCompleta(itens) {
    let validacao = this.validar(itens);
    if (validacao.erro) {
      return { ok: false, erro: validacao.erro };
    }

    try {
      let idCompra = await this.#gravar(validacao.itens);
      return { ok: true, idCompra: idCompra };
    } catch (erro) {
      //chave estrangeira: fornecedor, administrador ou produto nao existe
      if (erro.code == "ER_NO_REFERENCED_ROW_2") {
        return {
          ok: false,
          erro: "Fornecedor, administrador ou produto não encontrado.",
        };
      }
      throw erro;
    }
  }

  //grava a compra ja validada (usado por cadastrarCompleta)
  async #gravar(itens) {
    let idFornecedor = Number(this.#idFornecedor);
    let idAdm = Number(this.#idAdm);

    let banco = new Database();
    return await banco.ExecutaTransacao(async function (executar) {
      let compra = await executar(
        "insert into COMPRA (ID_FORNECEDOR, ID_ADM) values (?,?)",
        [idFornecedor, idAdm],
      );
      let idCompra = compra.insertId;

      for (let i = 0; i < itens.length; i++) {
        let item = itens[i];

        let lote = await executar(
          "insert into LOTE (ID_PRODUTO, DATA_VALIDADE, QNT_LOTE, CODIGO_LOTE, DATA_FABRICACAO) values (?,?,?,?,?)",
          [
            item.idProduto,
            item.dataValidade,
            item.quantidade,
            item.codigoLote,
            item.dataFabricacao,
          ],
        );

        await executar(
          "insert into COMPRA_LOTE (ID_COMPRA, ID_LOTE, QNT_COMPRADA, VALOR_COMPRA) values (?,?,?,?)",
          [idCompra, lote.insertId, item.quantidade, item.precoCompra],
        );

        await executar(
          "update PRODUTOS set QNT_ESTOQUE = QNT_ESTOQUE + ? where ID_PRODUTO = ?",
          [item.quantidade, item.idProduto],
        );
      }

      return idCompra;
    });
  }

  //historico de compras com fornecedor, responsavel, total e itens.
  //filtros opcionais (vazio = sem filtro): fornecedor e periodo da compra.
  //Devolve { ok, compras } ou { ok: false, erro }
  async listarDetalhado(idFornecedor, dataInicio, dataFim) {
    let periodo = validarPeriodo(dataInicio, dataFim);
    if (periodo.erro) {
      return { ok: false, erro: periodo.erro };
    }
    idFornecedor = idOpcional(idFornecedor);
    if (idFornecedor === false) {
      return { ok: false, erro: "Fornecedor inválido." };
    }
    dataInicio = periodo.dataInicio;
    dataFim = periodo.dataFim;

    let filtros = "";
    let valores = [];
    if (idFornecedor != null) {
      filtros += " and c.ID_FORNECEDOR = ?";
      valores.push(idFornecedor);
    }
    if (dataInicio != null) {
      filtros += " and c.DATA_COMPRA >= ?";
      valores.push(dataInicio);
    }
    if (dataFim != null) {
      //DATA_COMPRA tem hora: pega ate o fim do dia final
      filtros += " and c.DATA_COMPRA < date_add(?, interval 1 day)";
      valores.push(dataFim);
    }

    let banco = new Database();
    let compras = await banco.ExecutaComando(
      "select c.ID_COMPRA, c.DATA_COMPRA, c.ID_FORNECEDOR, f.NOME_FORNECEDOR, f.NOME_FANTASIA, " +
        "a.NOME_ADM, sum(cl.QNT_COMPRADA) as QNT_TOTAL, " +
        "sum(cl.QNT_COMPRADA * cl.VALOR_COMPRA) as VALOR_TOTAL " +
        "from COMPRA c " +
        "inner join FORNECEDOR f on f.ID_FORNECEDOR = c.ID_FORNECEDOR " +
        "inner join ADMINISTRADOR a on a.ID_ADM = c.ID_ADM " +
        "left join COMPRA_LOTE cl on cl.ID_COMPRA = c.ID_COMPRA " +
        "where 1 = 1" +
        filtros +
        " group by c.ID_COMPRA, c.DATA_COMPRA, c.ID_FORNECEDOR, f.NOME_FORNECEDOR, f.NOME_FANTASIA, a.NOME_ADM" +
        " order by c.DATA_COMPRA desc, c.ID_COMPRA desc",
      valores,
    );
    if (compras.length == 0) {
      return { ok: true, compras: [] };
    }

    let itens = await banco.ExecutaComando(
      "select cl.ID_COMPRA, l.ID_LOTE, l.CODIGO_LOTE, l.DATA_FABRICACAO, l.DATA_VALIDADE, " +
        "p.NOME_PRODUTO, cl.QNT_COMPRADA, cl.VALOR_COMPRA " +
        "from COMPRA_LOTE cl " +
        "inner join LOTE l on l.ID_LOTE = cl.ID_LOTE " +
        "inner join PRODUTOS p on p.ID_PRODUTO = l.ID_PRODUTO " +
        "where cl.ID_COMPRA in (?) order by p.NOME_PRODUTO",
      [compras.map((compra) => compra.ID_COMPRA)],
    );

    return {
      ok: true,
      compras: compras.map((compra) => ({
        ...compra,
        ITENS: itens.filter((item) => item.ID_COMPRA === compra.ID_COMPRA),
      })),
    };
  }

  async alterar() {
    let sql =
      "update COMPRA set ID_FORNECEDOR = ?, ID_ADM = ?, DATA_COMPRA = ? where ID_COMPRA = ?";
    let valores = [this.#idFornecedor, this.#idAdm, this.#dataCompra, this.#id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }
}

module.exports = Compra;
