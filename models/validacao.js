//funcoes de apoio para as regras de validacao dos models
//(compra, descarte, lote, promocao e relatorios)

//inteiro maior que zero (aceita texto vindo da URL ou do formulario)
function idValido(valor) {
  let numero = Number(valor);
  return valor !== "" && valor !== null && Number.isInteger(numero) && numero > 0;
}

//id opcional de filtro: null se nao veio, o numero se valido, false se invalido
function idOpcional(valor) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }
  return idValido(valor) ? Number(valor) : false;
}

//data no formato "AAAA-MM-DD" e que existe no calendario (rejeita 2026-02-30)
function dataValida(valor) {
  if (typeof valor != "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  let data = new Date(valor + "T00:00:00Z");
  return !isNaN(data) && data.toISOString().substring(0, 10) == valor;
}

//data de hoje no formato "AAAA-MM-DD" (horario local do servidor)
function hoje() {
  let data = new Date();
  let mes = String(data.getMonth() + 1).padStart(2, "0");
  let dia = String(data.getDate()).padStart(2, "0");
  return data.getFullYear() + "-" + mes + "-" + dia;
}

//periodo opcional de filtro (datas vazias = sem filtro).
//Devolve { dataInicio, dataFim } (null quando nao informado) ou { erro }
function validarPeriodo(dataInicio, dataFim) {
  dataInicio = dataInicio || null;
  dataFim = dataFim || null;

  if (dataInicio != null && !dataValida(dataInicio)) {
    return { erro: "Data inicial inválida." };
  }
  if (dataFim != null && !dataValida(dataFim)) {
    return { erro: "Data final inválida." };
  }
  if (dataInicio != null && dataFim != null && dataInicio > dataFim) {
    return { erro: "A data inicial não pode ser depois da data final." };
  }
  return { dataInicio: dataInicio, dataFim: dataFim };
}

//quantidade de dias para "proximo do vencimento" (0 a 365).
//Vazio usa o padrao. Devolve o numero ou null se for invalido
function diasValidos(valor, padrao) {
  if (valor === undefined || valor === null || valor === "") {
    return padrao;
  }
  let dias = Number(valor);
  if (!Number.isInteger(dias) || dias < 0 || dias > 365) {
    return null;
  }
  return dias;
}

module.exports = {
  idValido,
  idOpcional,
  dataValida,
  hoje,
  validarPeriodo,
  diasValidos,
};
