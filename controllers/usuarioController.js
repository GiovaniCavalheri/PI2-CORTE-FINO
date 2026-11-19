const Cliente = require("../models/clientesModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Cliente.validar)
function clienteDoFormulario(id, body, senha) {
  return new Cliente(
    id,
    body.nomeCliente,
    body.dataNascimento,
    body.cpfCliente,
    body.rgCliente,
    body.emailCliente,
    null, //ENDERECO_CLIENTE e montado pelo model
    body.telefone,
    body.telComercial,
    body.cep,
    body.cidade,
    body.estado,
    body.bairro,
    body.numero,
    body.complemento,
    senha,
  );
}

class UsuarioController {
  async cadastrar(req, res) {
    let usuario = clienteDoFormulario(0, req.body, req.body.senhaCliente);
    //devolve { ok, id }: o cadastro de socio usa esse id
    res.send(await usuario.cadastrarComId());
  }

  async listar(req, res) {
    let usuarios = await new Cliente().listar();

    //monta a lista sem a senha
    let lista = [];
    for (let i = 0; i < usuarios.length; i++) {
      let usuario = usuarios[i];
      lista.push({
        id: usuario.id,
        nomeCliente: usuario.nomeCliente,
        dataNascimento: usuario.dataNascimento,
        cpfCliente: usuario.cpfCliente,
        rgCliente: usuario.rgCliente,
        emailCliente: usuario.emailCliente,
        enderecoCliente: usuario.enderecoCliente,
        telefone: usuario.telefone,
        telComercial: usuario.telComercial,
        cep: usuario.cep,
        cidade: usuario.cidade,
        estado: usuario.estado,
        bairro: usuario.bairro,
        numero: usuario.numero,
        complemento: usuario.complemento,
      });
    }
    res.send(lista);
  }

  async alterar(req, res) {
    //na alteracao a senha nao muda
    let usuario = clienteDoFormulario(req.body.id, req.body, undefined);
    res.send(await usuario.alterar());
  }
}

module.exports = UsuarioController;
