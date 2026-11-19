const Socio = require("../models/socioModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Socio.validar)
class SocioController {
  async cadastrar(req, res) {
    let socio = new Socio(req.body.id, req.body.dataAdesao, req.body.dataVencimento);
    res.send(await socio.cadastrar());
  }

  async listar(req, res) {
    //traz os dados do cliente junto, para o gerenciamento no pageAdm
    let socios = await new Socio().listarDetalhado();

    let lista = [];
    for (let i = 0; i < socios.length; i++) {
      let socio = socios[i];
      lista.push({
        id: socio.ID_CLIENTE,
        nomeCliente: socio.NOME_CLIENTE,
        dataNascimento: socio.DATA_NASCIMENTO,
        cpfCliente: socio.CPF_CLIENTE,
        rgCliente: socio.RG_CLIENTE,
        emailCliente: socio.EMAIL_CLIENTE,
        telefone: socio.TELEFONE,
        telComercial: socio.TEL_COMERCIAL,
        cep: socio.CEP,
        cidade: socio.CIDADE,
        estado: socio.ESTADO,
        bairro: socio.BAIRRO,
        numero: socio.NUMERO,
        complemento: socio.COMPLEMENTO,
        dataAdesao: socio.DATA_ADESAO,
        dataVencimento: socio.DATA_VENCIMENTO,
      });
    }
    res.send(lista);
  }

  async alterar(req, res) {
    let socio = new Socio(req.body.id, req.body.dataAdesao, req.body.dataVencimento);
    res.send(await socio.alterar());
  }
}

module.exports = SocioController;
