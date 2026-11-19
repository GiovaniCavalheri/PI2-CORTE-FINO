const Administrador = require("../models/administradorModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Administrador)
class AdministradorController {
  async cadastrar(req, res) {
    let administrador = new Administrador(
      0,
      req.body.nomeAdm,
      req.body.emailAdm,
      req.body.senhaAdm,
    );
    res.send(await administrador.cadastrar());
  }

  async listar(req, res) {
    let administradores = await new Administrador().listar();

    //monta a lista sem a senha
    let lista = [];
    for (let i = 0; i < administradores.length; i++) {
      lista.push({
        id: administradores[i].id,
        nomeAdm: administradores[i].nomeAdm,
        emailAdm: administradores[i].emailAdm,
      });
    }
    res.send(lista);
  }

  //altera nome/e-mail, a senha, ou os dois (depende do que vier no body)
  async alterar(req, res) {
    let alterarDados =
      req.body.nomeAdm !== undefined || req.body.emailAdm !== undefined;
    let alterarSenha =
      req.body.senhaAdm !== undefined && req.body.senhaAdm !== "";

    if (!alterarDados && !alterarSenha) {
      res.send({ ok: false, erro: "Nada para alterar." });
      return;
    }

    let administrador = new Administrador(
      req.body.id,
      req.body.nomeAdm,
      req.body.emailAdm,
      req.body.senhaAdm,
    );

    if (alterarDados) {
      let resultado = await administrador.alterar();
      if (!resultado.ok) {
        res.send(resultado);
        return;
      }
    }
    if (alterarSenha) {
      let resultado = await administrador.alterarSenha();
      if (!resultado.ok) {
        res.send(resultado);
        return;
      }
    }
    res.send({ ok: true });
  }
}

module.exports = AdministradorController;
