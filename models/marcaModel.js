const Database = require("../database/database");
const { textoPreenchido, idValido } = require("./validacao");

class Marca {
  #id;
  #nomeMarca;

  constructor(id, nomeMarca) {
    this.#id = id;
    this.#nomeMarca = nomeMarca;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get nomeMarca() {
    return this.#nomeMarca;
  }
  set nomeMarca(valor) {
    this.#nomeMarca = valor;
  }

  //regras da marca: nome obrigatorio. Devolve o texto do erro ou null
  validar() {
    if (!textoPreenchido(this.#nomeMarca)) {
      return "Informe o nome da marca.";
    }
    this.#nomeMarca = this.#nomeMarca.trim();
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql = "insert into MARCA (NOME_MARCA) values (?)";
    let valores = [this.#nomeMarca];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //a marca nao pode ser excluida se tiver produtos vinculados.
  //Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Marca inválida." };
    }
    if (await this.possuiProdutos(id)) {
      return {
        ok: false,
        erro: "Esta marca possui produtos vinculados e não pode ser excluída.",
      };
    }

    let sql = "delete from MARCA where ID_MARCA = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //usado antes de excluir: a marca nao pode ter produtos vinculados
  async possuiProdutos(id) {
    let sql = "select count(*) as total from PRODUTOS where ID_MARCA = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async listar() {
    let sql = "select * from MARCA";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let marca = new Marca(linha["ID_MARCA"], linha["NOME_MARCA"]);

      lista.push(marca);
    }
    return lista;
  }

  //devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Marca inválida." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql = "update MARCA set NOME_MARCA = ? where ID_MARCA = ?";
    let valores = [this.#nomeMarca, this.#id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //devolve a marca, ou null se o id for invalido ou nao existir
  async buscarPorId(id) {
    if (!idValido(id)) {
      return null;
    }

    let sql = "SELECT * FROM MARCA WHERE ID_MARCA = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    if (linhas.length == 0) {
      return null;
    } else {
      return new Marca(linhas[0]["ID_MARCA"], linhas[0]["NOME_MARCA"]);
    }
  }
}

module.exports = Marca;
