const Fornecedor = require("../models/fornecedorModel");

//o controller so le a requisicao e devolve a resposta:
//as regras de validacao ficam no model (Fornecedor.validar)
function fornecedorDoFormulario(id, body, senha) {
  return new Fornecedor(
    id,
    body.cnpjFornecedor,
    body.nomeFornecedor,
    body.nomeFantasia,
    body.nomeResponsavel,
    body.cpfResponsavel,
    body.emailFornecedor,
    body.telefone,
    body.celular,
    body.cep,
    body.cidade,
    body.estado,
    body.bairro,
    body.numero,
    body.formaPagamento,
    senha,
  );
}

class FornecedorController {
  async cadastrar(req, res) {
    let fornecedor = fornecedorDoFormulario(0, req.body, req.body.senhaFornecedor);
    res.send(await fornecedor.cadastrar());
  }

  async listar(req, res) {
    let fornecedores = await new Fornecedor().listar();

    //monta a lista sem a senha
    let lista = [];
    for (let i = 0; i < fornecedores.length; i++) {
      let fornecedor = fornecedores[i];
      lista.push({
        id: fornecedor.id,
        cnpjFornecedor: fornecedor.cnpjFornecedor,
        nomeFornecedor: fornecedor.nomeFornecedor,
        nomeFantasia: fornecedor.nomeFantasia,
        nomeResponsavel: fornecedor.nomeResponsavel,
        cpfResponsavel: fornecedor.cpfResponsavel,
        emailFornecedor: fornecedor.emailFornecedor,
        telefone: fornecedor.telefone,
        celular: fornecedor.celular,
        cep: fornecedor.cep,
        cidade: fornecedor.cidade,
        estado: fornecedor.estado,
        bairro: fornecedor.bairro,
        numero: fornecedor.numero,
        formaPagamento: fornecedor.formaPagamento,
      });
    }
    res.send(lista);
  }

  async alterar(req, res) {
    //na alteracao a senha nao muda
    let fornecedor = fornecedorDoFormulario(req.body.id, req.body, undefined);
    res.send(await fornecedor.alterar());
  }
}

module.exports = FornecedorController;
