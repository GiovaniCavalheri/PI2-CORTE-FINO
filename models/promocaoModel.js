const Database = require("../database/database");
const { idValido, dataValida, hoje } = require("./validacao");

//preco de um produto numa promocao: o preco fixo, ou o preco de venda com
//o desconto percentual. Usa os apelidos "pr" (PROMOCAO) e "p" (PRODUTOS).
const SQL_PRECO_NA_PROMOCAO =
  "coalesce(pr.PRECO_PROMOCIONAL, round(p.PRECO_VENDA * (1 - pr.DESCONTO_PORC / 100), 2))";

class Promocao {
  //preco que o produto custa hoje: o menor preco entre as promocoes em vigor
  //(ativas e com hoje dentro do periodo) ou o preco de venda, se nao houver.
  //Para usar dentro de um select que tenha PRODUTOS com o apelido "p".
  static SQL_PRECO_ATUAL =
    "coalesce((select min(" +
    SQL_PRECO_NA_PROMOCAO +
    ") from PROMOCAO_PRODUTO pp " +
    "inner join PROMOCAO pr on pr.ID_PROMOCAO = pp.ID_PROMOCAO " +
    "where pp.ID_PRODUTO = p.ID_PRODUTO and pr.ATIVA = 1 " +
    "and curdate() between pr.DATA_INICIO and pr.DATA_FIM), p.PRECO_VENDA)";

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

  //regras da promocao (as que nao dependem do banco). A promocao tem OU
  //desconto percentual OU preco fixo (o outro fica null).
  //Devolve { ids } (produtos sem repetir) ou { erro }
  validar(idsProdutos) {
    if (!Array.isArray(idsProdutos) || idsProdutos.length == 0) {
      return { erro: "Selecione pelo menos um produto." };
    }
    for (let i = 0; i < idsProdutos.length; i++) {
      if (!idValido(idsProdutos[i])) {
        return { erro: "Produto inválido na seleção." };
      }
    }
    //tira os repetidos (o mesmo produto pode aparecer em varios lotes)
    let ids = [...new Set(idsProdutos.map(Number))];

    if (!dataValida(this.#dataInicio) || !dataValida(this.#dataFim)) {
      return { erro: "Informe as datas de início e de fim." };
    }
    if (this.#dataInicio > this.#dataFim) {
      return { erro: "A data de início não pode ser depois da data de fim." };
    }
    if (this.#dataFim < hoje()) {
      return { erro: "A promoção não pode terminar no passado." };
    }

    let temPercentual = this.#descontoPorc != null;
    let temPreco = this.#precoPromocional != null;
    if (temPercentual == temPreco) {
      return { erro: "Escolha desconto percentual ou preço promocional." };
    }

    if (temPercentual) {
      let desconto = Number(this.#descontoPorc);
      if (this.#descontoPorc === "" || !Number.isFinite(desconto) || desconto <= 0 || desconto >= 100) {
        return { erro: "O desconto tem que ser maior que 0% e menor que 100%." };
      }
      this.#descontoPorc = Math.round(desconto * 100) / 100;
    } else {
      let preco = Number(this.#precoPromocional);
      if (this.#precoPromocional === "" || !Number.isFinite(preco) || preco <= 0) {
        return { erro: "Informe um preço promocional maior que zero." };
      }
      //um preco fixo so faz sentido para um produto
      if (ids.length != 1) {
        return {
          erro: "Preço promocional fixo só pode ser usado com um produto. Para vários, use percentual.",
        };
      }
      this.#precoPromocional = Math.round(preco * 100) / 100;
    }
    return { ids: ids };
  }

  //cria a promocao e liga os produtos numa transacao. Confere se os produtos
  //existem, se o preco fixo fica abaixo do preco de venda e se algum produto
  //ja esta em outra promocao ativa no mesmo periodo.
  //Devolve { ok, idPromocao } ou { ok: false, erro }
  async cadastrarCompleta(idsProdutos) {
    let validacao = this.validar(idsProdutos);
    if (validacao.erro) {
      return { ok: false, erro: validacao.erro };
    }
    idsProdutos = validacao.ids;

    let descontoPorc = this.#descontoPorc;
    let precoPromocional = this.#precoPromocional;
    let dataInicio = this.#dataInicio;
    let dataFim = this.#dataFim;

    let banco = new Database();
    return await banco.ExecutaTransacao(async function (executar) {
      let produtos = await executar(
        "select ID_PRODUTO, NOME_PRODUTO, PRECO_VENDA from PRODUTOS where ID_PRODUTO in (?) for update",
        [idsProdutos],
      );
      if (produtos.length != idsProdutos.length) {
        return { ok: false, erro: "Um dos produtos não foi encontrado." };
      }

      if (precoPromocional != null) {
        for (let i = 0; i < produtos.length; i++) {
          if (precoPromocional >= Number(produtos[i]["PRECO_VENDA"])) {
            return {
              ok: false,
              erro:
                "O preço promocional tem que ser menor que o preço de venda de " +
                produtos[i]["NOME_PRODUTO"] +
                " (R$ " +
                produtos[i]["PRECO_VENDA"] +
                ").",
            };
          }
        }
      }

      //periodos se cruzam quando um comeca antes do outro terminar
      let conflitos = await executar(
        "select distinct p.NOME_PRODUTO from PROMOCAO_PRODUTO pp " +
          "inner join PROMOCAO pr on pr.ID_PROMOCAO = pp.ID_PROMOCAO " +
          "inner join PRODUTOS p on p.ID_PRODUTO = pp.ID_PRODUTO " +
          "where pp.ID_PRODUTO in (?) and pr.ATIVA = 1 " +
          "and pr.DATA_INICIO <= ? and pr.DATA_FIM >= ?",
        [idsProdutos, dataFim, dataInicio],
      );
      if (conflitos.length > 0) {
        return {
          ok: false,
          erro:
            "Já existe promoção ativa nesse período para: " +
            conflitos.map((linha) => linha["NOME_PRODUTO"]).join(", ") +
            ".",
        };
      }

      let promocao = await executar(
        "insert into PROMOCAO (DESCONTO_PORC, DATA_INICIO, DATA_FIM, PRECO_PROMOCIONAL, ATIVA) values (?,?,?,?,1)",
        [descontoPorc, dataInicio, dataFim, precoPromocional],
      );
      for (let i = 0; i < idsProdutos.length; i++) {
        await executar(
          "insert into PROMOCAO_PRODUTO (ID_PROMOCAO, ID_PRODUTO) values (?,?)",
          [promocao.insertId, idsProdutos[i]],
        );
      }
      return { ok: true, idPromocao: promocao.insertId };
    });
  }

  //promocoes ativas que ainda nao terminaram (em vigor ou agendadas),
  //cada uma com seus produtos e o preco de cada produto na promocao
  async listarAtivas() {
    let banco = new Database();
    let linhas = await banco.ExecutaComando(
      "select pr.ID_PROMOCAO, pr.DESCONTO_PORC, pr.PRECO_PROMOCIONAL, pr.DATA_INICIO, pr.DATA_FIM, " +
        "(pr.DATA_INICIO <= curdate()) as EM_VIGOR, " +
        "p.ID_PRODUTO, p.NOME_PRODUTO, p.PRECO_VENDA, " +
        SQL_PRECO_NA_PROMOCAO +
        " as PRECO_FINAL " +
        "from PROMOCAO pr " +
        "inner join PROMOCAO_PRODUTO pp on pp.ID_PROMOCAO = pr.ID_PROMOCAO " +
        "inner join PRODUTOS p on p.ID_PRODUTO = pp.ID_PRODUTO " +
        "where pr.ATIVA = 1 and pr.DATA_FIM >= curdate() " +
        "order by pr.DATA_INICIO, pr.ID_PROMOCAO, p.NOME_PRODUTO",
    );

    //agrupa as linhas por promocao
    let promocoes = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let atual = promocoes[promocoes.length - 1];
      if (!atual || atual.ID_PROMOCAO != linha.ID_PROMOCAO) {
        atual = {
          ID_PROMOCAO: linha.ID_PROMOCAO,
          DESCONTO_PORC: linha.DESCONTO_PORC,
          PRECO_PROMOCIONAL: linha.PRECO_PROMOCIONAL,
          DATA_INICIO: linha.DATA_INICIO,
          DATA_FIM: linha.DATA_FIM,
          EM_VIGOR: linha.EM_VIGOR == 1,
          PRODUTOS: [],
        };
        promocoes.push(atual);
      }
      atual.PRODUTOS.push({
        ID_PRODUTO: linha.ID_PRODUTO,
        NOME_PRODUTO: linha.NOME_PRODUTO,
        PRECO_VENDA: linha.PRECO_VENDA,
        PRECO_FINAL: linha.PRECO_FINAL,
      });
    }
    return promocoes;
  }

  //produtos com promocao em vigor hoje (pagina /offers do site).
  //Se o produto estiver em mais de uma, fica a de menor preco.
  async listarOfertas() {
    let banco = new Database();
    let linhas = await banco.ExecutaComando(
      "select p.ID_PRODUTO, p.NOME_PRODUTO, p.DESCRICAO, p.PRECO_VENDA, p.QNT_ESTOQUE, " +
        "c.NOME_CATEGORIA, m.NOME_MARCA, pr.DESCONTO_PORC, pr.DATA_FIM, " +
        SQL_PRECO_NA_PROMOCAO +
        " as PRECO_PROMOCIONAL " +
        "from PROMOCAO pr " +
        "inner join PROMOCAO_PRODUTO pp on pp.ID_PROMOCAO = pr.ID_PROMOCAO " +
        "inner join PRODUTOS p on p.ID_PRODUTO = pp.ID_PRODUTO " +
        "inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
        "inner join MARCA m on m.ID_MARCA = p.ID_MARCA " +
        "where pr.ATIVA = 1 and curdate() between pr.DATA_INICIO and pr.DATA_FIM " +
        "order by PRECO_PROMOCIONAL, p.NOME_PRODUTO",
    );

    //a consulta ja vem do menor preco para o maior: fica a primeira de cada produto
    let ofertas = [];
    let jaIncluidos = new Set();
    for (let i = 0; i < linhas.length; i++) {
      if (!jaIncluidos.has(linhas[i].ID_PRODUTO)) {
        jaIncluidos.add(linhas[i].ID_PRODUTO);
        ofertas.push(linhas[i]);
      }
    }
    return ofertas;
  }

  //encerra antes do fim: a promocao fica inativa e o preco volta ao normal.
  //Devolve { ok } ou { ok: false, erro }
  async encerrar(id) {
    if (!idValido(id)) {
      return { ok: false, erro: "Promoção inválida." };
    }

    let sql = "update PROMOCAO set ATIVA = 0 where ID_PROMOCAO = ? and ATIVA = 1";
    let valores = [Number(id)];

    let banco = new Database();
    let alterou = await banco.ExecutaComandoNonQuery(sql, valores);
    if (!alterou) {
      return { ok: false, erro: "Promoção não encontrada ou já encerrada." };
    }
    return { ok: true };
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
