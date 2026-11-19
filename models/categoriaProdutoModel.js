const Database = require("../database/database");
const { textoPreenchido, idValido } = require("./validacao");

class CategoriasProduto {
  #id;
  #nomeCategoria;
  #descricao;

  constructor(id, nomeCategoria, descricao) {
    this.#id = id;
    this.#nomeCategoria = nomeCategoria;
    this.#descricao = descricao;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get nomeCategoria() {
    return this.#nomeCategoria;
  }
  set nomeCategoria(valor) {
    this.#nomeCategoria = valor;
  }

  get descricao() {
    return this.#descricao;
  }
  set descricao(valor) {
    this.#descricao = valor;
  }

  //regras da categoria: nome obrigatorio; descricao opcional (vazia = "").
  //Devolve o texto do erro ou null
  validar() {
    if (!textoPreenchido(this.#nomeCategoria)) {
      return "Informe o nome da categoria.";
    }
    this.#nomeCategoria = this.#nomeCategoria.trim();
    this.#descricao =
      typeof this.#descricao == "string" ? this.#descricao.trim() : "";
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "insert into CATEGORIAS_PRODUTO (NOME_CATEGORIA, DESCRICAO) values (?,?)";
    let valores = [this.#nomeCategoria, this.#descricao];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //a categoria nao pode ser excluida se tiver produtos vinculados.
  //Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Categoria inválida." };
    }
    if (await this.possuiProdutos(id)) {
      return {
        ok: false,
        erro: "Esta categoria possui produtos vinculados e não pode ser excluída.",
      };
    }

    let sql = "delete from CATEGORIAS_PRODUTO where ID_CATEGORIA = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //usado antes de excluir: a categoria nao pode ter produtos vinculados
  async possuiProdutos(id) {
    let sql = "select count(*) as total from PRODUTOS where ID_CATEGORIA = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async listar() {
    let sql = "select * from CATEGORIAS_PRODUTO";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let categoria = new CategoriasProduto(
        linha["ID_CATEGORIA"],
        linha["NOME_CATEGORIA"],
        linha["DESCRICAO"],
      );

      lista.push(categoria);
    }
    return lista;
  }

  //devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Categoria inválida." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "update CATEGORIAS_PRODUTO set NOME_CATEGORIA = ?, DESCRICAO = ? where ID_CATEGORIA = ?";
    let valores = [this.#nomeCategoria, this.#descricao, this.#id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //devolve a categoria, ou null se o id for invalido ou nao existir
  async buscarPorId(id) {
    if (!idValido(id)) {
      return null;
    }

    let sql = "SELECT * FROM CATEGORIAS_PRODUTO WHERE ID_CATEGORIA = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);
    if (linhas.length == 0) {
      return null;
    } else {
      return new CategoriasProduto(
        linhas[0]["ID_CATEGORIA"],
        linhas[0]["NOME_CATEGORIA"],
        linhas[0]["DESCRICAO"],
      );
    }
  }
}

module.exports = CategoriasProduto;
