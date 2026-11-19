document.addEventListener("DOMContentLoaded", function () {
  // ──────────────────────────────────────────────
  // API: todas as chamadas ao servidor desta tela ficam aqui.
  // O resto do arquivo so cuida da tela.
  // ──────────────────────────────────────────────
  async function requisicaoJson(url, configuracao) {
    let resposta = await fetch(url, configuracao);
    //401 = o login de fornecedor expirou: volta para o login
    if (resposta.status === 401) {
      window.location.href = "/join?voltar=" + encodeURIComponent(window.location.pathname);
      throw new Error("Entre como fornecedor para continuar.");
    }
    let corpo = await resposta.json().catch(function () {
      return {};
    });
    if (!resposta.ok) {
      throw new Error(corpo.erro || "Falha na requisição (" + resposta.status + ").");
    }
    return corpo;
  }

  function enviarJson(url, dados) {
    return requisicaoJson(url, {
      method: "POST",
      body: JSON.stringify(dados),
      headers: { "Content-Type": "application/json" },
    });
  }

  const api = {
    listarProdutos: function () {
      return requisicaoJson("/area-fornecedor/produtos/listar");
    },
    cadastrarProduto: function (produto) {
      return enviarJson("/area-fornecedor/produtos/cadastrar", produto);
    },
    cadastrarLote: function (lote) {
      return enviarJson("/area-fornecedor/lotes/cadastrar", lote);
    },
  };

  // ──────────────────────────────────────────────
  // APOIO DA TELA
  // ──────────────────────────────────────────────
  let feedback = document.querySelector("#feedback");
  let listaProdutos = document.querySelector("#listaProdutos");
  let lotesProduto = document.querySelector("#lotesProduto");
  let selectLoteProduto = document.querySelector("#loteProduto");

  function hoje() {
    let data = new Date();
    let mes = String(data.getMonth() + 1).padStart(2, "0");
    let dia = String(data.getDate()).padStart(2, "0");
    return data.getFullYear() + "-" + mes + "-" + dia;
  }

  function formatarData(data) {
    // "2026-10-08" -> "08/10/2026"
    return data ? data.split("-").reverse().join("/") : "";
  }

  function mostrarFeedback(tipo, texto) {
    feedback.className = "alert alert-" + tipo;
    feedback.textContent = texto;
    feedback.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function esconderFeedback() {
    feedback.className = "alert d-none";
    feedback.textContent = "";
  }

  function criarCelula(valor) {
    let celula = document.createElement("td");
    celula.textContent = valor == null ? "" : String(valor);
    return celula;
  }

  function criarInput(tipo, classe, atributos) {
    let input = document.createElement("input");
    input.type = tipo;
    input.className = "form-control " + classe;
    input.required = true;
    Object.keys(atributos || {}).forEach(function (nome) {
      input.setAttribute(nome, atributos[nome]);
    });
    return input;
  }

  // ──────────────────────────────────────────────
  // LISTA DE PRODUTOS
  // ──────────────────────────────────────────────
  function textoValidade(produto) {
    if (produto.DATA_VALIDADE) return formatarData(produto.DATA_VALIDADE);
    if (produto.VALIDADE_LOTE) return formatarData(produto.VALIDADE_LOTE) + " (lote)";
    return "—";
  }

  function renderizarProdutos(produtos) {
    listaProdutos.replaceChildren();
    if (produtos.length === 0) {
      let linha = document.createElement("tr");
      let celula = criarCelula("Nenhum produto cadastrado ainda.");
      celula.colSpan = 7;
      linha.appendChild(celula);
      listaProdutos.appendChild(linha);
    }
    produtos.forEach(function (produto) {
      let linha = document.createElement("tr");
      linha.append(
        criarCelula(produto.ID_PRODUTO),
        criarCelula(produto.NOME_PRODUTO),
        criarCelula(produto.NOME_CATEGORIA),
        criarCelula(produto.NOME_MARCA),
        criarCelula("R$ " + produto.PRECO_VENDA),
        criarCelula(produto.QNT_ESTOQUE),
        criarCelula(textoValidade(produto)),
      );
      listaProdutos.appendChild(linha);
    });

    //mantem o select do "novo lote" igual a lista
    let selecionado = selectLoteProduto.value;
    selectLoteProduto.replaceChildren(new Option("Selecione...", ""));
    produtos.forEach(function (produto) {
      selectLoteProduto.add(
        new Option(
          "#" + produto.ID_PRODUTO + " — " + produto.NOME_PRODUTO + " (" + produto.NOME_MARCA + ")",
          produto.ID_PRODUTO,
        ),
      );
    });
    selectLoteProduto.value = selecionado;
  }

  async function carregarProdutos() {
    try {
      renderizarProdutos(await api.listarProdutos());
    } catch (erro) {
      mostrarFeedback("danger", "Não foi possível carregar os produtos: " + erro.message);
    }
  }

  // ──────────────────────────────────────────────
  // LOTES DO NOVO PRODUTO (linhas da tabela)
  // ──────────────────────────────────────────────
  function adicionarLinhaLote() {
    let linha = document.createElement("tr");
    let numero = lotesProduto.children.length + 1;
    let campos = [
      criarInput("text", "lote-codigo", { maxlength: "20", "aria-label": "Código do lote " + numero }),
      criarInput("number", "lote-quantidade", { min: "1", step: "1", "aria-label": "Quantidade do lote " + numero }),
      criarInput("date", "lote-fabricacao", { max: hoje(), "aria-label": "Fabricação do lote " + numero }),
      criarInput("date", "lote-validade", { "aria-label": "Validade do lote " + numero }),
    ];
    campos.forEach(function (campo) {
      let celula = document.createElement("td");
      celula.appendChild(campo);
      linha.appendChild(celula);
    });

    let remover = document.createElement("button");
    remover.type = "button";
    remover.className = "btn btn-outline-danger btn-sm btnRemoverLote";
    remover.setAttribute("aria-label", "Remover lote " + numero);
    remover.innerHTML = '<i class="fa-solid fa-trash"></i>';
    let celulaRemover = document.createElement("td");
    celulaRemover.className = "text-end";
    celulaRemover.appendChild(remover);
    linha.appendChild(celulaRemover);

    lotesProduto.appendChild(linha);
  }

  function lerLotes() {
    return Array.from(lotesProduto.children).map(function (linha) {
      return {
        codigoLote: linha.querySelector(".lote-codigo").value.trim(),
        quantidade: linha.querySelector(".lote-quantidade").value,
        dataFabricacao: linha.querySelector(".lote-fabricacao").value,
        dataValidade: linha.querySelector(".lote-validade").value,
      };
    });
  }

  lotesProduto.addEventListener("click", function (evento) {
    let botao = evento.target.closest(".btnRemoverLote");
    if (!botao) return;
    //sempre deixa pelo menos uma linha
    if (lotesProduto.children.length > 1) {
      botao.closest("tr").remove();
    }
  });

  document.querySelector("#btnAdicionarLote").addEventListener("click", adicionarLinhaLote);

  // ──────────────────────────────────────────────
  // CADASTRAR PRODUTO COM LOTES
  // ──────────────────────────────────────────────
  let formProduto = document.querySelector("#formProduto");

  //limpa os campos e deixa so uma linha de lote vazia
  //(usado depois de cadastrar e pelo botao Limpar)
  function limparFormularioProduto() {
    formProduto.reset();
    lotesProduto.replaceChildren();
    adicionarLinhaLote();
  }

  document.querySelector("#btnLimparProduto").addEventListener("click", function (evento) {
    evento.preventDefault();
    limparFormularioProduto();
    esconderFeedback();
  });

  formProduto.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    esconderFeedback();

    //confere os campos obrigatorios no navegador; as regras de verdade
    //ficam no servidor (Produtos.cadastrarComLotes)
    if (!formProduto.checkValidity()) {
      formProduto.reportValidity();
      return;
    }

    let botao = document.querySelector("#btnCadastrarProduto");
    botao.disabled = true;
    try {
      let resposta = await api.cadastrarProduto({
        nome: document.querySelector("#nomeProduto").value,
        categoria: document.querySelector("#categoriaProduto").value,
        marca: document.querySelector("#marcaProduto").value,
        preco: document.querySelector("#precoProduto").value,
        descricao: document.querySelector("#descProduto").value,
        lotes: lerLotes(),
      });
      if (!resposta.ok) throw new Error(resposta.erro || "O servidor não gravou o produto.");

      limparFormularioProduto();
      await carregarProdutos();
      mostrarFeedback("success", "Produto cadastrado com sucesso! ID " + resposta.idProduto + ".");
    } catch (erro) {
      mostrarFeedback("danger", "Erro ao cadastrar o produto: " + erro.message);
    } finally {
      botao.disabled = false;
    }
  });

  // ──────────────────────────────────────────────
  // NOVO LOTE PARA PRODUTO JA CADASTRADO
  // ──────────────────────────────────────────────
  let formLote = document.querySelector("#formLote");

  formLote.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    esconderFeedback();

    if (!formLote.checkValidity()) {
      formLote.reportValidity();
      return;
    }

    let botao = document.querySelector("#btnCadastrarLote");
    botao.disabled = true;
    try {
      let resposta = await api.cadastrarLote({
        idProduto: selectLoteProduto.value,
        codigoLote: document.querySelector("#loteCodigo").value.trim(),
        quantidade: document.querySelector("#loteQuantidade").value,
        dataFabricacao: document.querySelector("#loteFabricacao").value,
        dataValidade: document.querySelector("#loteValidade").value,
      });
      if (!resposta.ok) throw new Error(resposta.erro || "O servidor não gravou o lote.");

      formLote.reset();
      await carregarProdutos();
      mostrarFeedback("success", "Lote adicionado e estoque atualizado!");
    } catch (erro) {
      mostrarFeedback("danger", "Erro ao adicionar o lote: " + erro.message);
    } finally {
      botao.disabled = false;
    }
  });

  // estado inicial
  document.querySelector("#loteFabricacao").max = hoje();
  adicionarLinhaLote();
  carregarProdutos();
});
