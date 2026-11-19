const Database = require("../database/database");

class Promocao {
  #id;
  #descontoPorc;
  #dataInicio;
  #dataFim;
  #precoPromocional;
  #ativa;

  constructor(id, descontoPorc, dataInicio, dataFim, precoPromocional, ativa) {
    this.#id = id;
    this.#descontoPorc = descontoPorc;
    this.#dataInicio = dataInicio;
    this.#dataFim = dataFim;
    this.#precoPromocional = precoPromocional;
    this.#ativa = ativa;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get descontoPorc() {
    return this.#descontoPorc;
  }
  set descontoPorc(valor) {
    this.#descontoPorc = valor;
  }

  get dataInicio() {
    return this.#dataInicio;
  }
  set dataInicio(valor) {
    this.#dataInicio = valor;
  }

  get dataFim() {
    return this.#dataFim;
  }
  set dataFim(valor) {
    this.#dataFim = valor;
  }

  get precoPromocional() {
    return this.#precoPromocional;
  }
  set precoPromocional(value) {
    this.#precoPromocional = value;
  }

  get ativa() {
    return this.#ativa;
  }

  set ativa(value) {
    this.#ativa = value;
  }

  async cadastrar() {
    let sql =
      "insert into PROMOCAO (DESCONTO_PORC, DATA_INICIO, DATA_FIM, PRECO_PROMOCIONAL, ATIVA) values (?,?,?,?,?)";
    let valores = [
      this.#descontoPorc,
      this.#dataInicio,
      this.#dataFim,
      this.#precoPromocional,
      this.#ativa,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async excluir(id) {
    let sql = "delete from PROMOCAO where ID_PROMOCAO = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async listar() {
    let sql = "select * from PROMOCAO";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let promocao = new Promocao(
        linha["ID_PROMOCAO"],
        linha["DESCONTO_PORC"],
        linha["DATA_INICIO"],
        linha["DATA_FIM"],
        linha["PRECO_PROMOCIONAL"],
        linha["ATIVA"],
      );

      lista.push(promocao);
    }
    return lista;
  }

  async alterar() {
    let sql =
      "update PROMOCAO set DESCONTO_PORC = ?, DATA_INICIO = ?, DATA_FIM = ?, PRECO_PROMOCIONAL = ?, ATIVA = ? where ID_PROMOCAO = ?";
    let valores = [
      this.#descontoPorc,
      this.#dataInicio,
      this.#dataFim,
      this.#precoPromocional,
      this.#ativa,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }
}

module.exports = Promocao;
