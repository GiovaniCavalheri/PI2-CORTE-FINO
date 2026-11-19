const Database = require("../database/database");
const Promocao = require("./promocaoModel");
const { idValido } = require("./validacao");

//status inicial: o pagamento e feito na entrega
const STATUS_INICIAL = "Aguardando Separação";

//TIPO_PEDIDO e um enum ('Bovino','Suino','Ave','Kit'): converte o nome da categoria

function tipoDaCategoria(nomeCategoria) {
  const nome = String(nomeCategoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (nome.startsWith("bovin")) return "Bovino";
  if (nome.startsWith("suin")) return "Suino";
  if (nome.startsWith("ave")) return "Ave";
  return "Kit";
}

//valores aceitos pela coluna STATUS_PEDIDO (enum do banco)
const STATUS_PEDIDO = [
  "Aguardando Separação",
  "Em Andamento",
  "Aguardando Pagamento",
  "Aguardando Retirada",
  "Em Rota de Entrega",
  "Entregue",
  "Cancelado",
];

//regras dos itens do carrinho: cada item com produto e quantidade inteira
//maior que zero; o mesmo produto repetido vira um item so (soma).
//Devolve { itens, totalItens } ou { erro }
function validarItens(itens) {
  if (!Array.isArray(itens) || itens.length == 0) {
    return { erro: "O carrinho está vazio." };
  }

  let lista = [];
  let totalItens = 0;
  for (let i = 0; i < itens.length; i++) {
    let item = itens[i];
    if (item == null || !idValido(item.idProduto)) {
      return { erro: "Item inválido no carrinho." };
    }
    let idProduto = Number(item.idProduto);
    let quantidade = Number(item.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return { erro: "Item inválido no carrinho." };
    }

    let itemExistente = lista.find((existente) => existente.idProduto == idProduto);
    if (itemExistente != null) {
      itemExistente.quantidade += quantidade;
    } else {
      lista.push({ idProduto: idProduto, quantidade: quantidade });
    }
    totalItens += quantidade;
  }
  return { itens: lista, totalItens: totalItens };
}

function erroEstoque(idProduto) {
  const erro = new Error("Estoque insuficiente");
  erro.code = "ESTOQUE_INSUFICIENTE";
  erro.idProduto = idProduto;
  return erro;
}

class Pedidos {
  #id;
  #idCliente;
  #valorPedido;
  #dataPedido;
  #tipoPedido;
  #statusPedido;

  constructor(
    id,
    idCliente,
    valorPedido,
    dataPedido,
    tipoPedido,
    statusPedido,
  ) {
    this.#id = id;
    this.#idCliente = idCliente;
    this.#valorPedido = valorPedido;
    this.#dataPedido = dataPedido;
    this.#tipoPedido = tipoPedido;
    this.#statusPedido = statusPedido;
  }

  get id() {
    return this.#id;
  }
  set id(valor) {
    this.#id = valor;
  }

  get idCliente() {
    return this.#idCliente;
  }
  set idCliente(valor) {
    this.#idCliente = valor;
  }

  get valorPedido() {
    return this.#valorPedido;
  }
  set valorPedido(valor) {
    this.#valorPedido = valor;
  }

  get dataPedido() {
    return this.#dataPedido;
  }
  set dataPedido(valor) {
    this.#dataPedido = valor;
  }

  get tipoPedido() {
    return this.#tipoPedido;
  }
  set tipoPedido(valor) {
    this.#tipoPedido = valor;
  }

  get statusPedido() {
    return this.#statusPedido;
  }
  set statusPedido(valor) {
    this.#statusPedido = valor;
  }

  async cadastrar() {
    let sql =
      "insert into PEDIDOS (ID_CLIENTE, VALOR_PEDIDO, TIPO_PEDIDO, STATUS_PEDIDO) values (?,?,?,?)";
    let valores = [
      this.#idCliente,
      this.#valorPedido,
      this.#tipoPedido,
      this.#statusPedido,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  //finaliza o pedido do carrinho: confere o cliente e os itens e grava.
  //itens: [{ idProduto, quantidade }] como vieram do carrinho.
  //Devolve { ok, idPedido, valor, totalItens } ou { ok: false, erro }
  //(precisaLogin: true quando falta o cliente; idProduto quando falta estoque)
  async finalizar(idCliente, itens) {
    if (!idValido(idCliente)) {
      return {
        ok: false,
        precisaLogin: true,
        erro: "Entre com sua conta de sócio para finalizar o pedido.",
      };
    }
    let validacao = validarItens(itens);
    if (validacao.erro) {
      return { ok: false, erro: validacao.erro };
    }

    let resultado = await this.#gravar(Number(idCliente), validacao.itens);
    if (!resultado.ok) {
      return {
        ok: false,
        idProduto: resultado.idProduto,
        erro: "Estoque insuficiente para um dos produtos.",
      };
    }
    return {
      ok: true,
      idPedido: resultado.idPedido,
      valor: resultado.valor,
      totalItens: validacao.totalItens,
    };
  }

  //grava o pedido numa transacao (tudo ou nada): confere e baixa o estoque,
  //grava PEDIDOS e ITENS_PEDIDOS. itens ja validados e sem produto repetido
  async #gravar(idCliente, itens) {
    let banco = new Database();
    try {
      return await banco.ExecutaTransacao(async (executar) => {
        //"for update" trava as linhas dos produtos ate o fim da transacao
        //PRECO_ATUAL ja vem com o desconto da promocao em vigor, se houver
        let produtos = await executar(
          "select p.ID_PRODUTO, " +
            Promocao.SQL_PRECO_ATUAL +
            " as PRECO_ATUAL, p.QNT_ESTOQUE, c.NOME_CATEGORIA " +
            "from PRODUTOS p inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
            "where p.ID_PRODUTO in (?) for update",
          [itens.map((item) => item.idProduto)],
        );
        let porId = new Map(produtos.map((p) => [p.ID_PRODUTO, p]));

        //valor calculado com o preco do banco (em centavos para nao perder precisao)
        let centavos = 0;
        let tipos = new Set();
        for (let item of itens) {
          let produto = porId.get(item.idProduto);
          if (!produto || produto.QNT_ESTOQUE < item.quantidade) {
            throw erroEstoque(item.idProduto);
          }
          centavos += Math.round(Number(produto.PRECO_ATUAL) * 100) * item.quantidade;
          tipos.add(tipoDaCategoria(produto.NOME_CATEGORIA));
        }
        //pedido com tipos diferentes de carne e registrado como Kit
        let tipo = tipos.size === 1 ? [...tipos][0] : "Kit";
        let valor = centavos / 100;

        //de qual lote saiu cada quantidade: gravado em ITENS_PEDIDO_LOTE para
        //o cancelamento devolver ao lote certo
        let baixasLote = [];

        for (let item of itens) {
          await executar(
            "update PRODUTOS set QNT_ESTOQUE = QNT_ESTOQUE - ? where ID_PRODUTO = ?",
            [item.quantidade, item.idProduto],
          );

          //baixa tambem dos lotes, primeiro os que vencem antes (lotes vencidos
          //ficam para o descarte). Estoque antigo, de antes dos lotes, nao tem
          //lote: nesse caso a baixa fica so no produto.
          let lotes = await executar(
            "select ID_LOTE, QNT_LOTE from LOTE " +
              "where ID_PRODUTO = ? and QNT_LOTE > 0 and DATA_VALIDADE >= curdate() " +
              "order by DATA_VALIDADE, ID_LOTE for update",
            [item.idProduto],
          );
          let restante = item.quantidade;
          for (let lote of lotes) {
            if (restante == 0) break;
            let baixa = Math.min(restante, lote.QNT_LOTE);
            await executar(
              "update LOTE set QNT_LOTE = QNT_LOTE - ? where ID_LOTE = ?",
              [baixa, lote.ID_LOTE],
            );
            baixasLote.push({
              idProduto: item.idProduto,
              idLote: lote.ID_LOTE,
              quantidade: baixa,
            });
            restante -= baixa;
          }
        }

        let pedido = await executar(
          "insert into PEDIDOS (ID_CLIENTE, VALOR_PEDIDO, TIPO_PEDIDO, STATUS_PEDIDO) values (?,?,?,?)",
          [idCliente, valor, tipo, STATUS_INICIAL],
        );
        for (let item of itens) {
          await executar(
            "insert into ITENS_PEDIDOS (ID_PRODUTO, ID_PEDIDO, QNT_PEDIDO) values (?,?,?)",
            [item.idProduto, pedido.insertId, item.quantidade],
          );
        }
        //depois dos itens (a tabela de lotes aponta para ITENS_PEDIDOS)
        for (let baixa of baixasLote) {
          await executar(
            "insert into ITENS_PEDIDO_LOTE (ID_PEDIDO, ID_PRODUTO, ID_LOTE, QNT) values (?,?,?,?)",
            [pedido.insertId, baixa.idProduto, baixa.idLote, baixa.quantidade],
          );
        }

        return { ok: true, idPedido: pedido.insertId, valor, tipo };
      });
    } catch (erro) {
      if (erro.code === "ESTOQUE_INSUFICIENTE") {
        return { ok: false, idProduto: erro.idProduto };
      }
      throw erro;
    }
  }

  //pedidos com o nome do cliente e os itens (nome do produto e quantidade)
  async listarDetalhado() {
    let banco = new Database();
    let pedidos = await banco.ExecutaComando(
      "select p.ID_PEDIDO, p.ID_CLIENTE, c.NOME_CLIENTE, p.VALOR_PEDIDO, p.DATA_PEDIDO, " +
        "p.TIPO_PEDIDO, p.STATUS_PEDIDO " +
        "from PEDIDOS p inner join CLIENTE c on c.ID_CLIENTE = p.ID_CLIENTE " +
        "order by p.ID_PEDIDO desc",
    );
    let itens = await banco.ExecutaComando(
      "select i.ID_PEDIDO, i.ID_PRODUTO, pr.NOME_PRODUTO, i.QNT_PEDIDO " +
        "from ITENS_PEDIDOS i inner join PRODUTOS pr on pr.ID_PRODUTO = i.ID_PRODUTO",
    );

    return pedidos.map((pedido) => ({
      ...pedido,
      ITENS: itens.filter((item) => item.ID_PEDIDO === pedido.ID_PEDIDO),
    }));
  }

  //muda o status do pedido (tela de Pedidos do admin), numa transacao.
  //pedido Entregue ou Cancelado esta encerrado e nao muda mais.
  //Cancelado devolve as quantidades dos itens ao estoque do produto e
  //a cada lote de onde saiu (ITENS_PEDIDO_LOTE).
  async alterarStatus(id, novoStatus) {
    if (!idValido(id) || !STATUS_PEDIDO.includes(novoStatus)) {
      return { ok: false, erro: "Status inválido." };
    }

    let banco = new Database();
    return await banco.ExecutaTransacao(async function (executar) {
      let pedidos = await executar(
        "select STATUS_PEDIDO from PEDIDOS where ID_PEDIDO = ? for update",
        [id],
      );
      if (pedidos.length == 0) {
        return { ok: false, erro: "Pedido não encontrado." };
      }

      let statusAtual = pedidos[0]["STATUS_PEDIDO"];
      if (statusAtual == "Entregue" || statusAtual == "Cancelado") {
        return {
          ok: false,
          erro: "Este pedido já está " + statusAtual + " e não pode mudar de status.",
        };
      }

      if (novoStatus == "Cancelado") {
        let itens = await executar(
          "select ID_PRODUTO, QNT_PEDIDO from ITENS_PEDIDOS where ID_PEDIDO = ?",
          [id],
        );
        for (let i = 0; i < itens.length; i++) {
          await executar(
            "update PRODUTOS set QNT_ESTOQUE = QNT_ESTOQUE + ? where ID_PRODUTO = ?",
            [itens[i]["QNT_PEDIDO"], itens[i]["ID_PRODUTO"]],
          );
        }

        //devolve a cada lote exatamente o que saiu dele. Pedidos antigos
        //(de antes desse controle) nao tem linhas aqui: voltam so ao produto
        let lotes = await executar(
          "select ID_LOTE, QNT from ITENS_PEDIDO_LOTE where ID_PEDIDO = ?",
          [id],
        );
        for (let i = 0; i < lotes.length; i++) {
          await executar(
            "update LOTE set QNT_LOTE = QNT_LOTE + ? where ID_LOTE = ?",
            [lotes[i]["QNT"], lotes[i]["ID_LOTE"]],
          );
        }
      }

      await executar(
        "update PEDIDOS set STATUS_PEDIDO = ? where ID_PEDIDO = ?",
        [novoStatus, id],
      );
      return { ok: true };
    });
  }

  async excluir(id) {
    let sql = "delete from PEDIDOS where ID_PEDIDO = ?";
    let valores = [id];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }

  async listar() {
    let sql = "select * from PEDIDOS";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql);

    let lista = [];
    for (let i = 0; i < linhas.length; i++) {
      let linha = linhas[i];
      let pedido = new Pedidos(
        linha["ID_PEDIDO"],
        linha["ID_CLIENTE"],
        linha["VALOR_PEDIDO"],
        linha["DATA_PEDIDO"],
        linha["TIPO_PEDIDO"],
        linha["STATUS_PEDIDO"],
      );

      lista.push(pedido);
    }
    return lista;
  }

  async alterar() {
    let sql =
      "update PEDIDOS set ID_CLIENTE = ?, VALOR_PEDIDO = ?, DATA_PEDIDO = ?, TIPO_PEDIDO = ?, STATUS_PEDIDO = ? where ID_PEDIDO = ?";
    let valores = [
      this.#idCliente,
      this.#valorPedido,
      this.#dataPedido,
      this.#tipoPedido,
      this.#statusPedido,
      this.#id,
    ];

    let banco = new Database();
    let result = await banco.ExecutaComandoNonQuery(sql, valores);

    return result;
  }
}

module.exports = Pedidos;
