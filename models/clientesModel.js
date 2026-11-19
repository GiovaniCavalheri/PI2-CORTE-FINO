const Database = require("../database/database");
const {
  textoPreenchido,
  textoOuNulo,
  somenteDigitos,
  idValido,
  dataValida,
  hoje,
} = require("./validacao");

class Cliente {
  #id;
  #nomeCliente;
  #dataNascimento;
  #cpfCliente;
  #rgCliente;
  #emailCliente;
  #enderecoCliente;
  #telefone;
  #telComercial;
  #cep;
  #cidade;
  #estado;
  #bairro;
  #numero;
  #complemento;
  #senhaCliente;

  constructor(
    id,
    nomeCliente,
    dataNascimento,
    cpfCliente,
    rgCliente,
    emailCliente,
    enderecoCliente,
    telefone,
    telComercial,
    cep,
    cidade,
    estado,
    bairro,
    numero,
    complemento,
    senhaCliente,
  ) {
    this.#id = id;
    this.#nomeCliente = nomeCliente;
    this.#dataNascimento = dataNascimento;
    this.#cpfCliente = cpfCliente;
    this.#rgCliente = rgCliente;
    this.#emailCliente = emailCliente;
    this.#enderecoCliente = enderecoCliente;
    this.#telefone = telefone;
    this.#telComercial = telComercial;
    this.#cep = cep;
    this.#cidade = cidade;
    this.#estado = estado;
    this.#bairro = bairro;
    this.#numero = numero;
    this.#complemento = complemento;
    this.#senhaCliente = senhaCliente;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get nomeCliente() {
    return this.#nomeCliente;
  }
  set nomeCliente(valor) {
    this.#nomeCliente = valor;
  }

  get dataNascimento() {
    return this.#dataNascimento;
  }
  set dataNascimento(valor) {
    this.#dataNascimento = valor;
  }

  get cpfCliente() {
    return this.#cpfCliente;
  }
  set cpfCliente(valor) {
    this.#cpfCliente = valor;
  }

  get rgCliente() {
    return this.#rgCliente;
  }
  set rgCliente(valor) {
    this.#rgCliente = valor;
  }

  get emailCliente() {
    return this.#emailCliente;
  }
  set emailCliente(valor) {
    this.#emailCliente = valor;
  }

  get enderecoCliente() {
    return this.#enderecoCliente;
  }
  set enderecoCliente(valor) {
    this.#enderecoCliente = valor;
  }

  get telefone() {
    return this.#telefone;
  }
  set telefone(valor) {
    this.#telefone = valor;
  }

  get telComercial() {
    return this.#telComercial;
  }
  set telComercial(valor) {
    this.#telComercial = valor;
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

  get complemento() {
    return this.#complemento;
  }
  set complemento(valor) {
    this.#complemento = valor;
  }

  get senhaCliente() {
    return this.#senhaCliente;
  }
  set senhaCliente(valor) {
    this.#senhaCliente = valor;
  }

  //colunas gravadas no insert, na mesma ordem dos valores
  #valoresCadastro() {
    return [
      this.#nomeCliente,
      this.#dataNascimento,
      this.#cpfCliente,
      this.#rgCliente,
      this.#emailCliente,
      this.#enderecoCliente,
      this.#telefone,
      this.#telComercial,
      this.#cep,
      this.#cidade,
      this.#estado,
      this.#bairro,
      this.#numero,
      this.#complemento,
      this.#senhaCliente,
    ];
  }

  //regras do cliente. Obrigatorios: nome, data de nascimento, CPF (11
  //digitos), e-mail e celular (telefone). Opcionais: RG, telefone comercial
  //e endereco (CEP e UF, se vierem, tem que estar completos).
  //Monta tambem o ENDERECO_CLIENTE. Devolve o texto do erro ou null
  validar() {
    if (
      !textoPreenchido(this.#nomeCliente) ||
      !textoPreenchido(this.#dataNascimento) ||
      !textoPreenchido(this.#cpfCliente) ||
      !textoPreenchido(this.#emailCliente) ||
      !textoPreenchido(this.#telefone)
    ) {
      return "Preencha nome, data de nascimento, CPF, e-mail e celular.";
    }
    if (!dataValida(this.#dataNascimento) || this.#dataNascimento > hoje()) {
      return "Data de nascimento inválida.";
    }

    //CPF e CEP ficam no banco somente com os digitos
    let cpf = somenteDigitos(this.#cpfCliente);
    if (cpf.length != 11) {
      return "O CPF precisa ter 11 dígitos.";
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

    this.#nomeCliente = this.#nomeCliente.trim();
    this.#cpfCliente = cpf;
    this.#rgCliente = textoOuNulo(this.#rgCliente);
    this.#emailCliente = this.#emailCliente.trim();
    this.#telefone = this.#telefone.trim();
    this.#telComercial = textoOuNulo(this.#telComercial);
    this.#cep = cep;
    this.#cidade = textoOuNulo(this.#cidade);
    this.#estado = uf;
    this.#bairro = textoOuNulo(this.#bairro);
    this.#numero = textoOuNulo(this.#numero);
    this.#complemento = textoOuNulo(this.#complemento);
    if (typeof this.#senhaCliente != "string") {
      this.#senhaCliente = null;
    }

    //ENDERECO_CLIENTE: junta as partes preenchidas ("Centro, 100, Sao Paulo, SP, 01001000")
    let partes = [
      this.#bairro,
      this.#numero,
      this.#complemento,
      this.#cidade,
      this.#estado,
      this.#cep,
    ];
    let preenchidas = partes.filter((parte) => parte != null);
    this.#enderecoCliente = preenchidas.length ? preenchidas.join(", ") : null;
    return null;
  }

  //devolve { ok } ou { ok: false, erro }
  async cadastrar() {
    let resultado = await this.cadastrarComId();
    return resultado.ok ? { ok: true } : resultado;
  }

  //cadastra e devolve o id gerado (o cadastro de socio usa esse id).
  //Devolve { ok, id } ou { ok: false, erro }
  async cadastrarComId() {
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "insert into CLIENTE (NOME_CLIENTE, DATA_NASCIMENTO, CPF_CLIENTE, RG_CLIENTE, EMAIL_CLIENTE, ENDERECO_CLIENTE, TELEFONE, TEL_COMERCIAL, CEP, CIDADE, ESTADO, BAIRRO, NUMERO, COMPLEMENTO, SENHA_CLIENTE) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
    let valores = this.#valoresCadastro();

    let banco = new Database();
    let id = await banco.ExecutaComandoLastInserted(sql, valores);
    return { ok: id > 0, id: id };
  }

  //o cliente nao pode ser excluido com pedido em aberto. Exclui numa
  //transacao, apagando junto o historico de pedidos.
  //Devolve { ok } ou { ok: false, erro }
  async excluir(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Cliente inválido." };
    }
    if (await this.possuiPedidosEmAberto(id)) {
      return {
        ok: false,
        erro: "Este cliente possui pedidos em aberto e não pode ser excluído.",
      };
    }

    let banco = new Database();
    let ok = await banco.ExecutaTransacao(async function (executar) {
      await executar(
        "delete from ENTREGA_PEDIDO where ID_PEDIDO in (select ID_PEDIDO from PEDIDOS where ID_CLIENTE = ?)",
        [id],
      );
      await executar(
        "delete from ITENS_PEDIDOS where ID_PEDIDO in (select ID_PEDIDO from PEDIDOS where ID_CLIENTE = ?)",
        [id],
      );
      await executar("delete from PEDIDOS where ID_CLIENTE = ?", [id]);
      let cliente = await executar("delete from CLIENTE where ID_CLIENTE = ?", [id]);
      return cliente.affectedRows > 0;
    });
    return { ok: ok };
  }

  //login: devolve o cliente com esse e-mail e senha, ou null
  //(o e-mail pode se repetir: procura o que tem essa senha)
  async autenticar(email, senha) {
    if (!textoPreenchido(email) || typeof senha != "string" || senha == "") {
      return null;
    }
    let clientes = await this.buscarPorEmail(email.trim());
    for (let i = 0; i < clientes.length; i++) {
      if (clientes[i].verificarSenha(senha)) {
        return clientes[i];
      }
    }
    return null;
  }

  //usado antes de excluir: o cliente (socio) nao pode ter pedido em aberto.
  //pedido em aberto = qualquer status que nao seja 'Entregue' nem 'Cancelado'
  async possuiPedidosEmAberto(id) {
    let sql =
      "select count(*) as total from PEDIDOS where ID_CLIENTE = ? and STATUS_PEDIDO not in ('Entregue', 'Cancelado')";
    let valores = [id];

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);

    return linhas[0]["total"] > 0;
  }

  async listar() {
    let sql = "select * from CLIENTE";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      lista.push(Cliente.#deLinha(linhas[i]));
    }
    return lista;
  }

  //usado no login: o e-mail nao e unico em CLIENTE, por isso devolve uma lista
  async buscarPorEmail(email) {
    let sql = "select * from CLIENTE where EMAIL_CLIENTE = ?";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, [email]);

    return linhas.map((linha) => Cliente.#deLinha(linha));
  }

  verificarSenha(senhaDigitada) {
    return this.#senhaCliente === senhaDigitada;
  }

  static #deLinha(linha) {
    return new Cliente(
      linha["ID_CLIENTE"],
      linha["NOME_CLIENTE"],
      linha["DATA_NASCIMENTO"],
      linha["CPF_CLIENTE"],
      linha["RG_CLIENTE"],
      linha["EMAIL_CLIENTE"],
      linha["ENDERECO_CLIENTE"],
      linha["TELEFONE"],
      linha["TEL_COMERCIAL"],
      linha["CEP"],
      linha["CIDADE"],
      linha["ESTADO"],
      linha["BAIRRO"],
      linha["NUMERO"],
      linha["COMPLEMENTO"],
      linha["SENHA_CLIENTE"],
    );
  }

  //na alteracao a senha nao muda. Devolve { ok } ou { ok: false, erro }
  async alterar() {
    if (!idValido(this.#id)) {
      return { ok: false, erro: "Cliente inválido." };
    }
    let erro = this.validar();
    if (erro != null) {
      return { ok: false, erro: erro };
    }

    let sql =
      "update CLIENTE set NOME_CLIENTE = ?, DATA_NASCIMENTO = ?, CPF_CLIENTE = ?, RG_CLIENTE = ?, EMAIL_CLIENTE = ?, ENDERECO_CLIENTE = ?, TELEFONE = ?, TEL_COMERCIAL = ?, CEP = ?, CIDADE = ?, ESTADO = ?, BAIRRO = ?, NUMERO = ?, COMPLEMENTO = ? where ID_CLIENTE = ?";
    let valores = [
      this.#nomeCliente,
      this.#dataNascimento,
      this.#cpfCliente,
      this.#rgCliente,
      this.#emailCliente,
      this.#enderecoCliente,
      this.#telefone,
      this.#telComercial,
      this.#cep,
      this.#cidade,
      this.#estado,
      this.#bairro,
      this.#numero,
      this.#complemento,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return { ok: result };
  }
}

module.exports = Cliente;
