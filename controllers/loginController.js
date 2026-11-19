const Administrador = require("../models/administradorModel");
const Cliente = require("../models/clientesModel");
const Fornecedor = require("../models/fornecedorModel");
const {
  COOKIE_FORNECEDOR,
  OPCOES_COOKIE,
} = require("../middleware/exigirFornecedor");

//TEMPORARIO: compara a senha em texto puro; o login do site so grava os
//dados no navegador para o header mostrar o nome (nao e uma sessao segura).
//O fornecedor tambem recebe um cookie assinado, conferido pelo servidor nas
//rotas da area do fornecedor (middleware/exigirFornecedor).
//A conferencia de e-mail e senha fica nos models (autenticar)
class LoginController {
  async loginAdministrador(req, res) {
    let administrador = await new Administrador().autenticar(
      req.body.email,
      req.body.senha,
    );
    if (administrador != null) {
      res.send({ ok: true, id: administrador.id, nome: administrador.nomeAdm });
    } else {
      res.send({ ok: false });
    }
  }

  //login do site: procura o e-mail em CLIENTE (socio) e depois em FORNECEDOR
  async login(req, res) {
    let email = req.body.email;
    let senha = req.body.senha;

    //um login novo sempre apaga o acesso de fornecedor anterior
    res.clearCookie(COOKIE_FORNECEDOR);

    let cliente = await new Cliente().autenticar(email, senha);
    if (cliente != null) {
      res.send({ ok: true, id: cliente.id, nome: cliente.nomeCliente, tipo: "socio" });
      return;
    }

    let fornecedor = await new Fornecedor().autenticar(email, senha);
    if (fornecedor != null) {
      res.cookie(COOKIE_FORNECEDOR, String(fornecedor.id), OPCOES_COOKIE);
      res.send({
        ok: true,
        id: fornecedor.id,
        nome: fornecedor.nomeFornecedor,
        tipo: "fornecedor",
      });
      return;
    }

    res.send({ ok: false });
  }

  //botao Sair do site: apaga o cookie do fornecedor (o navegador apaga o resto)
  async logout(req, res) {
    res.clearCookie(COOKIE_FORNECEDOR);
    res.send({ ok: true });
  }
}

module.exports = LoginController;
