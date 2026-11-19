const Database = require("../database/database");
const {
  textoPreenchido,
  textoOuNulo,
  somenteDigitos,
  idValido,
} = require("./validacao");

//valores aceitos pela coluna FORMA_PAGAMENTO (enum do banco)
const FORMAS_PAGAMENTO = ["debcred", "ted", "pix", "cheque"];

class Fornecedor {
  #id;
  #cnpjFornecedor;
  #nomeFornecedor;
  #nomeFantasia;
  #nomeResponsavel;
  #cpfResponsavel;
  #emailFornecedor;
  #telefone;
  #celular;
  #cep;
  #cidade;
  #estado;
  #bairro;
  #numero;
  #formaPagamento;
  #senhaFornecedor;

  constructor(
    id,
    cnpjFornecedor,
    nomeFornecedor,
    nomeFantasia,
    nomeResponsavel,
    cpfResponsavel,
    emailFornecedor,
    telefone,
    celular,
    cep,
    cidade,
    estado,
    bairro,
    numero,
    formaPagamento,
    senhaFornecedor,
  ) {
    this.#id = id;
    this.#cnpjFornecedor = cnpjFornecedor;
    this.#nomeFornecedor = nomeFornecedor;
    this.#nomeFantasia = nomeFantasia;
    this.#nomeResponsavel = nomeResponsavel;
    this.#cpfResponsavel = cpfResponsavel;
    this.#emailFornecedor = emailFornecedor;
    this.#telefone = telefone;
    this.#celular = celular;
    this.#cep = cep;
    this.#cidade = cidade;
    this.#estado = estado;
    this.#bairro = bairro;
    this.#numero = numero;
    this.#formaPagamento = formaPagamento;
    this.#senhaFornecedor = senhaFornecedor;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get cnpjFornecedor() {
    return this.#cnpjFornecedor;
  }
  set cnpjFornecedor(valor) {
    this.#cnpjFornecedor = valor;
  }

  get nomeFornecedor() {
    return this.#nomeFornecedor;
  }
  set nomeFornecedor(valor) {
    this.#nomeFornecedor = valor;
  }

  get nomeFantasia() {
    return this.#nomeFantasia;
  }
  set nomeFantasia(valor) {
    this.#nomeFantasia = valor;
  }

  get nomeResponsavel() {
    return this.#nomeResponsavel;
  }
  set nomeResponsavel(valor) {
    this.#nomeResponsavel = valor;
  }

  get cpfResponsavel() {
    return this.#cpfResponsavel;
  }
  set cpfResponsavel(valor) {
    this.#cpfResponsavel = valor;
  }

  get emailFornecedor() {
    return this.#emailFornecedor;
  }
  set emailFornecedor(valor) {
    this.#emailFornecedor = valor;
  }

  get telefone() {
    return this.#telefone;
  }
  set telefone(valor) {
    this.#telefone = valor;
  }

  get celular() {
    return this.#celular;
  }
  set celular(valor) {
    this.#celular = valor;
  }

  get cep() {
    return this.#cep;
  }
  set cep(valor) {
    this.#cep = valor;
  }

  get cidade() {
    return this.#cidade;
  }
  set cidade(valor) {
    this.#cidade = valor;
  }

  get estado() {
    return this.#estado;
  }
  set estado(valor) {
    this.#estado = valor;
  }

  get bairro() {
    return this.#bairro;
  }
  set bairro(valor) {
    this.#bairro = valor;
  }

  get numero() {
    return this.#numero;
  }
  set numero(valor) {
    this.#numero = valor;
  }

  get formaPagamento() {
    return this.#formaPagamento;
  }
  set formaPagamento(valor) {
    this.#formaPagamento = valor;
  }

  get senhaFornecedor() {
    return this.#senhaFornecedor;
  }
  set senhaFornecedor(valor) {
    this.#senhaFornecedor = valor;
  }

  //regras do fornecedor. Obrigatorios: CNPJ (14 digitos), razao social,
  //e-mail, celular e forma de pagamento. Opcionais: nome fantasia,
  //responsavel, CPF do responsavel, telefone e endereco (CPF, CEP e UF,
  //se vierem, tem que estar completos). Devolve o texto do erro ou null
  validar() {
    if (
      !textoPreenchido(this.#cnpjFornecedor) ||
      !textoPreenchido(this.#nomeFornecedor) ||
      !textoPreenchido(this.#emailFornecedor) ||
      !textoPreenchido(this.#celular)
    ) {
      return "Preencha CNPJ, razão social, e-mail e celular.";
    }
    if (!FORMAS_PAGAMENTO.includes(this.#formaPagamento)) {
      return "Selecione a forma de pagamento.";
    }

    //CNPJ, CPF e CEP ficam no banco somente com os digitos
    let cnpj = somenteDigitos(this.#cnpjFornecedor);
    if (cnpj.length != 14) {
      return "O CNPJ precisa ter 14 dígitos.";
    }
    let cpf = textoOuNulo(this.#cpfResponsavel);
    if (cpf != null) {
      cpf = somenteDigitos(cpf);
      if (cpf.length != 11) {
        return "O CPF do responsável precisa ter 11 dígitos.";
      }
    }
    let cep = textoOuNulo(this.#cep);
    if (cep != null) {
      cep = somenteDigitos(cep);
      if (cep.length != 8) {
        return "O CEP precisa ter 8 dígitos.";
      }
    }
    let uf = textoOuNulo(this.#estado);
    if (uf != null) {
      uf = uf.toUpperCase();
      if (uf.length != 2) {
        return "A UF precisa ter 2 letras.";
      }
    }

    this.#cnpjFornecedor = cnpj;
    this.#nomeFornecedor = this.#nomeFornecedor.trim();
    this.#nomeFantasia = textoOuNulo(this.#nomeFantasia);
    this.#nomeResponsavel = textoOuNulo(this.#nomeResponsavel);
    this.#cpfResponsavel = cpf;
    this.#emailFornecedor = this.#emailFornecedor.trim();
    this.#telefone = textoOuNulo(this.#telefone);
    this.#celular = this.#celular.trim();
    this.#cep = cep;
    this.#cidade = textoOuNulo(this.#cidade);
    this.#estado = uf;
    this.#bairro = textoOuNulo(this.#bairro);
    this.#numero = textoOuNulo(this.#numero);
    if (typeof this.#senhaFornecedor != "string") {
      this.#senhaFornecedor = null;
    }
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "insert into FORNECEDOR (CNPJ_FORNECEDOR, NOME_FORNECEDOR, NOME_FANTASIA, NOME_RESPONSAVEL, CPF_RESPONSAVEL, EMAIL_FORNECEDOR, TELEFONE, CELULAR, CEP, CIDADE, ESTADO, BAIRRO, NUMERO, FORMA_PAGAMENTO, SENHA_FORNECEDOR) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    let valores = [
      this.#cnpjFornecedor,
      this.#nomeFornecedor,
      this.#nomeFantasia,
      this.#nomeResponsavel,
      this.#cpfResponsavel,
      this.#emailFornecedor,
      this.#telefone,
      this.#celular,
      this.#cep,
      this.#cidade,
      this.#estado,
      this.#bairro,
      this.#numero,
      this.#formaPagamento,
      this.#senhaFornecedor,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //o fornecedor nao pode ser excluido se tiver compras registradas.
  //Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Fornecedor inválido." };
    }
    if (await this.possuiCompras(id)) {
      return {
        ok: false,
        erro: "Este fornecedor possui compras registradas e não pode ser excluído.",
      };
    }

    let sql = "delete from FORNECEDOR where ID_FORNECEDOR = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }

  //login: devolve o fornecedor com esse e-mail e senha, ou null
  //(o e-mail pode se repetir: procura o que tem essa senha)
  async autenticar(email, senha) {
    if (!textoPreenchido(email) || typeof senha != "string" || senha == "") {
      return null;
    }
    let fornecedores = await this.buscarPorEmail(email.trim());
    for (let i = 0; i < fornecedores.length; i++) {
      if (fornecedores[i].verificarSenha(senha)) {
        return fornecedores[i];
      }
    }
    return null;
  }

  //usado antes de excluir: o fornecedor nao pode ter compras registradas
  async possuiCompras(id) {
    let sql = "select count(*) as total from COMPRA where ID_FORNECEDOR = ?";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async listar() {
    let sql = "select * from FORNECEDOR";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      lista.push(Fornecedor.#deLinha(linhas[i]));
    }
    return lista;
  }

  //devolve o fornecedor, ou null se o id for invalido ou nao existir
  //(usado para conferir o fornecedor logado na area do fornecedor)
  async buscarPorId(id) {
    if (!idValido(id)) {
      return null;
    }
    let sql = "select * from FORNECEDOR where ID_FORNECEDOR = ?";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, [id]);

    if (linhas.length == 0) {
      return null;
    }
    return Fornecedor.#deLinha(linhas[0]);
  }

  //usado no login: o e-mail nao e unico em FORNECEDOR, por isso devolve uma lista
  async buscarPorEmail(email) {
    let sql = "select * from FORNECEDOR where EMAIL_FORNECEDOR = ?";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, [email]);

    return linhas.map((linha) => Fornecedor.#deLinha(linha));
  }

  verificarSenha(senhaDigitada) {
    return this.#senhaFornecedor === senhaDigitada;
  }

  static #deLinha(linha) {
    return new Fornecedor(
      linha["ID_FORNECEDOR"],
      linha["CNPJ_FORNECEDOR"],
      linha["NOME_FORNECEDOR"],
      linha["NOME_FANTASIA"],
      linha["NOME_RESPONSAVEL"],
      linha["CPF_RESPONSAVEL"],
      linha["EMAIL_FORNECEDOR"],
      linha["TELEFONE"],
      linha["CELULAR"],
      linha["CEP"],
      linha["CIDADE"],
      linha["ESTADO"],
      linha["BAIRRO"],
      linha["NUMERO"],
      linha["FORMA_PAGAMENTO"],
      linha["SENHA_FORNECEDOR"],
    );
  }

  //na alteracao a senha nao muda. Devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Fornecedor inválido." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "update FORNECEDOR set CNPJ_FORNECEDOR = ?, NOME_FORNECEDOR = ?, NOME_FANTASIA = ?, NOME_RESPONSAVEL = ?, CPF_RESPONSAVEL = ?, EMAIL_FORNECEDOR = ?, TELEFONE = ?, CELULAR = ?, CEP = ?, CIDADE = ?, ESTADO = ?, BAIRRO = ?, NUMERO = ?, FORMA_PAGAMENTO = ? where ID_FORNECEDOR = ?";
    let valores = [
      this.#cnpjFornecedor,
      this.#nomeFornecedor,
      this.#nomeFantasia,
      this.#nomeResponsavel,
      this.#cpfResponsavel,
      this.#emailFornecedor,
      this.#telefone,
      this.#celular,
      this.#cep,
      this.#cidade,
      this.#estado,
      this.#bairro,
      this.#numero,
      this.#formaPagamento,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }
}

module.exports = Fornecedor;
