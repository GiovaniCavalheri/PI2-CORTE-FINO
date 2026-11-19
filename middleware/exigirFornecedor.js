const Fornecedor = require("../models/fornecedorModel");

//cookie assinado gravado no login do fornecedor (loginController).
//Assinado = o navegador nao consegue trocar o id por outro sem a chave
const COOKIE_FORNECEDOR = "fornecedor_corte_fino";

const OPCOES_COOKIE = {
  signed: true,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 8 * 60 * 60 * 1000, //8 horas
};

//so deixa passar quem entrou como fornecedor. Guarda o fornecedor em
//req.fornecedor para o controller usar.
//Sem login: a pagina manda para o login e o fetch recebe 401 com { ok, erro }
async function exigirFornecedor(req, res, next) {
  let id = req.signedCookies ? req.signedCookies[COOKIE_FORNECEDOR] : null;
  let fornecedor = id ? await new Fornecedor().buscarPorId(id) : null;

  if (fornecedor == null) {
    res.clearCookie(COOKIE_FORNECEDOR);
    //navegador abrindo a pagina pede text/html; o fetch manda */* (vira json)
    if (req.method == "GET" && req.accepts(["json", "html"]) == "html") {
      res.redirect("/join?voltar=" + encodeURIComponent(req.originalUrl));
    } else {
      res.status(401).send({ ok: false, erro: "Entre como fornecedor para continuar." });
    }
    return;
  }

  req.fornecedor = fornecedor;
  next();
}

module.exports = { exigirFornecedor, COOKIE_FORNECEDOR, OPCOES_COOKIE };
