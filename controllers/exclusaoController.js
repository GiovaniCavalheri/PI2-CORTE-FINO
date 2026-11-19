const Cliente = require("../models/clientesModel");
const Administrador = require("../models/administradorModel");
const Fornecedor = require("../models/fornecedorModel");
const Socio = require("../models/socioModel");

//o controller so le o id da URL e devolve a resposta:
//as regras de exclusao (pedidos em aberto, compras...) ficam nos models
class ExclusaoController {
  async excluirUsuario(req, res) {
    res.send(await new Cliente().excluir(req.params.id));
  }

  async excluirAdministrador(req, res) {
    res.send(await new Administrador().excluir(req.params.id));
  }

  async excluirFornecedor(req, res) {
    res.send(await new Fornecedor().excluir(req.params.id));
  }

  async excluirSocio(req, res) {
    res.send(await new Socio().excluir(req.params.id));
  }
}

module.exports = ExclusaoController;
