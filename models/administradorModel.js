const Database = require("../database/database");
const { textoPreenchido, idValido } = require("./validacao");

class Administrador {
  #id;
  #nomeAdm;
  #emailAdm;
  #senhaAdm;

  constructor(id, nomeAdm, emailAdm, senhaAdm) {
    this.#id = id;
    this.#nomeAdm = nomeAdm;
    this.#emailAdm = emailAdm;
    this.#senhaAdm = senhaAdm;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get nomeAdm() {
    return this.#nomeAdm;
  }
  set nomeAdm(valor) {
    this.#nomeAdm = valor;
  }

  get emailAdm() {
    return this.#emailAdm;
  }
  set emailAdm(valor) {
    this.#emailAdm = valor;
  }

  get senhaAdm() {
    return this.#senhaAdm;
  }
  set senhaAdm(valor) {
    this.#senhaAdm = valor;
  }

  verificarSenha(senhaDigitada) {
    return this.#senhaAdm === senhaDigitada;
  }

  //regras de nome e e-mail (cadastro e alteracao). Devolve o erro ou null
  validarDados() {
    if (!textoPreenchido(this.#nomeAdm)) {
      return "Informe o nome do administrador.";
    }
    if (!textoPreenchido(this.#emailAdm)) {
      return "Informe o e-mail do administrador.";
    }
    this.#nomeAdm = this.#nomeAdm.trim();
    this.#emailAdm = this.#emailAdm.trim();
    return null;
  }

  //regra da senha: obrigatoria. Devolve o erro ou null
  validarSenha() {
    if (!textoPreenchido(this.#senhaAdm)) {
      return "Informe a senha.";
    }
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validarDados() || this.validarSenha();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "insert into ADMINISTRADOR (NOME_ADM, EMAIL_ADM, SENHA_ADM) values (?,?,?)";
    let valores = [this.#nomeAdm, this.#emailAdm, this.#senhaAdm];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //o administrador que registrou compras ou descartes nao pode ser excluido
  //(o historico guarda quem fez). Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Administrador inválido." };
    }

    let banco = new Database();
    let uso = await banco.ExecutaComando(
      "select (select count(*) from COMPRA where ID_ADM = ?) + " +
        "(select count(*) from DESCARTE where ID_ADM = ?) as total",
      [id, id],
    );
    if (uso[0]["total"] > 0) {
      return {
        ok: false,
        erro: "Este administrador registrou compras ou descartes e não pode ser excluído.",
      };
    }

    let sql = "delete from ADMINISTRADOR where ID_ADM = ?";
    let valores = [id];
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //login: devolve o administrador se e-mail e senha conferem, ou null
  async autenticar(email, senha) {
    if (!textoPreenchido(email) || typeof senha != "string" || senha == "") {
      return null;
    }
    let administrador = await this.buscarPorEmail(email.trim());
    if (administrador != null && administrador.verificarSenha(senha)) {
      return administrador;
    }
    return null;
  }

  async listar() {
    let sql = "select ID_ADM, NOME_ADM, EMAIL_ADM from ADMINISTRADOR";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let administrador = new Administrador(
        linha["ID_ADM"],
        linha["NOME_ADM"],
        linha["EMAIL_ADM"],
        linha["SENHA_ADM"],
      );

      lista.push(administrador);
    }
    return lista;
  }

  //usado no login: traz a senha para comparar com a digitada
  async buscarPorEmail(email) {
    let sql =
      "select ID_ADM, NOME_ADM, EMAIL_ADM, SENHA_ADM from ADMINISTRADOR where EMAIL_ADM = ?";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, [email]);
    if (linhas.length === 0) return null;

    let linha = linhas[0];
    return new Administrador(
      linha["ID_ADM"],
      linha["NOME_ADM"],
      linha["EMAIL_ADM"],
      linha["SENHA_ADM"],
    );
  }

  //altera nome e e-mail. Devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Administrador inválido." };
    }
    let erro = this.validarDados();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "update ADMINISTRADOR set NOME_ADM = ?, EMAIL_ADM = ? where ID_ADM = ?";
    let valores = [this.#nomeAdm, this.#emailAdm, this.#id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //altera so a senha. Devolve { ok } ou { ok: false, erro }
  async alterarSenha() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Administrador inválido." };
    }
    let erro = this.validarSenha();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql = "update ADMINISTRADOR set SENHA_ADM = ? where ID_ADM = ?";
    let valores = [this.#senhaAdm, this.#id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }
}

module.exports = Administrador;
