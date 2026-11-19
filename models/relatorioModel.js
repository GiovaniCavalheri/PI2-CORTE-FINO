const Database = require("../database/database");
const Lote = require("./loteModel");
const Compra = require("./compraModel");
const { idOpcional, validarPeriodo } = require("./validacao");

//relatorios gerenciais (somente leitura).
//Filtros vazios sao ignorados. Cada relatorio valida os proprios filtros
//e devolve { ok, linhas } ou { ok: false, erro }
class Relatorio {
  //R1 - produtos mais vendidos (pedidos cancelados nao contam)
  async maisVendidos(idCategoria, idMarca, dataInicio, dataFim) {
    let periodo = validarPeriodo(dataInicio, dataFim);
    if (periodo.erro) {
      return { ok: false, erro: periodo.erro };
    }
    idCategoria = idOpcional(idCategoria);
    idMarca = idOpcional(idMarca);
    if (idCategoria === false || idMarca === false) {
      return { ok: false, erro: "Categoria ou marca inválida." };
    }

    let filtros = "";
    let valores = [];
    if (idCategoria != null) {
      filtros += " and p.ID_CATEGORIA = ?";
      valores.push(idCategoria);
    }
    if (idMarca != null) {
      filtros += " and p.ID_MARCA = ?";
      valores.push(idMarca);
    }
    if (periodo.dataInicio != null) {
      filtros += " and pe.DATA_PEDIDO >= ?";
      valores.push(periodo.dataInicio);
    }
    if (periodo.dataFim != null) {
      filtros += " and pe.DATA_PEDIDO < date_add(?, interval 1 day)";
      valores.push(periodo.dataFim);
    }

    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA, m.NOME_MARCA, " +
      "sum(i.QNT_PEDIDO) as QNT_VENDIDA, count(distinct pe.ID_PEDIDO) as NUM_PEDIDOS " +
      "from ITENS_PEDIDOS i " +
      "inner join PEDIDOS pe on pe.ID_PEDIDO = i.ID_PEDIDO " +
      "inner join PRODUTOS p on p.ID_PRODUTO = i.ID_PRODUTO " +
      "inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
      "inner join MARCA m on m.ID_MARCA = p.ID_MARCA " +
      "where pe.STATUS_PEDIDO <> 'Cancelado'" +
      filtros +
      " group by p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA, m.NOME_MARCA" +
      " order by QNT_VENDIDA desc, p.NOME_PRODUTO";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);
    return { ok: true, linhas: linhas };
  }

  //R2 - produtos descartados no periodo, com o valor perdido
  //(quantidade descartada x preco pago pelo lote na compra)
  async descartados(dataInicio, dataFim) {
    let periodo = validarPeriodo(dataInicio, dataFim);
    if (periodo.erro) {
      return { ok: false, erro: periodo.erro };
    }

    let filtros = "";
    let valores = [];
    if (periodo.dataInicio != null) {
      filtros += " and d.DATA_DESCARTE >= ?";
      valores.push(periodo.dataInicio);
    }
    if (periodo.dataFim != null) {
      filtros += " and d.DATA_DESCARTE < date_add(?, interval 1 day)";
      valores.push(periodo.dataFim);
    }

    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA, " +
      "sum(d.QNT_DESCARTADA) as QNT_DESCARTADA, count(*) as NUM_DESCARTES, " +
      "sum(d.QNT_DESCARTADA * coalesce(cl.VALOR_COMPRA, 0)) as VALOR_PERDIDO " +
      "from DESCARTE d " +
      "inner join LOTE l on l.ID_LOTE = d.ID_LOTE " +
      "inner join PRODUTOS p on p.ID_PRODUTO = l.ID_PRODUTO " +
      "inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
      "left join COMPRA_LOTE cl on cl.ID_LOTE = l.ID_LOTE " +
      "where 1 = 1" +
      filtros +
      " group by p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA" +
      " order by QNT_DESCARTADA desc, p.NOME_PRODUTO";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);
    return { ok: true, linhas: linhas };
  }

  //R3 - produtos que mais entraram em promocao.
  //Periodo opcional: conta as promocoes que tiveram algum dia dentro dele
  async maisPromocoes(dataInicio, dataFim) {
    let periodo = validarPeriodo(dataInicio, dataFim);
    if (periodo.erro) {
      return { ok: false, erro: periodo.erro };
    }

    let filtros = "";
    let valores = [];
    if (periodo.dataInicio != null) {
      filtros += " and pr.DATA_FIM >= ?";
      valores.push(periodo.dataInicio);
    }
    if (periodo.dataFim != null) {
      filtros += " and pr.DATA_INICIO <= ?";
      valores.push(periodo.dataFim);
    }

    let sql =
      "select p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA, m.NOME_MARCA, " +
      "count(*) as NUM_PROMOCOES, max(pr.DATA_INICIO) as ULTIMA_PROMOCAO " +
      "from PROMOCAO_PRODUTO pp " +
      "inner join PROMOCAO pr on pr.ID_PROMOCAO = pp.ID_PROMOCAO " +
      "inner join PRODUTOS p on p.ID_PRODUTO = pp.ID_PRODUTO " +
      "inner join CATEGORIAS_PRODUTO c on c.ID_CATEGORIA = p.ID_CATEGORIA " +
      "inner join MARCA m on m.ID_MARCA = p.ID_MARCA " +
      "where 1 = 1" +
      filtros +
      " group by p.ID_PRODUTO, p.NOME_PRODUTO, c.NOME_CATEGORIA, m.NOME_MARCA" +
      " order by NUM_PROMOCOES desc, p.NOME_PRODUTO";

    let banco = new Database();
    let linhas = await banco.ExecutaComando(sql, valores);
    return { ok: true, linhas: linhas };
  }

  //R4 - lotes proximos do vencimento (mesma consulta da tela de Promocoes)
  async proximosVencimento(dias) {
    let resultado = await new Lote().listarProximosVencimento(dias);
    if (!resultado.ok) {
      return resultado;
    }
    return { ok: true, linhas: resultado.lotes };
  }

  //R5 - historico de compras (mesma consulta da tela de Compras)
  async compras(idFornecedor, dataInicio, dataFim) {
    let resultado = await new Compra().listarDetalhado(
      idFornecedor,
      dataInicio,
      dataFim,
    );
    if (!resultado.ok) {
      return resultado;
    }
    return { ok: true, linhas: resultado.compras };
  }
}

module.exports = Relatorio;
