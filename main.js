
import { state } from "./estado.js";
import { $, mostrarMensagem, preencherCategorias, reduzirFoto } from "./utils.js";
import { iniciarLogin } from "./login.js";
import { ouvirDados, adicionarProduto, registrarVenda, registrarEntrada, trocarFoto, excluirProduto, atualizarProduto, zerarVendas } from "./dados.js";
import { render } from "./render.js";

let pararDeOuvir = null;


iniciarLogin({
  aoEntrar(uid) {
    state.uid = uid;
    $("authbox").hidden = true;
    $("app").hidden = false;
    pararDeOuvir = ouvirDados(render, () =>
      mostrarMensagem("Sem permissão para ler os dados. Confira as regras do Firestore."));
  },
  aoSair() {
    if (pararDeOuvir) pararDeOuvir();
    pararDeOuvir = null;
    Object.assign(state, { uid: null, produtos: [], vendas: [] });
    $("app").hidden = true;
    $("authbox").hidden = false;
  }
});


let editandoId = null; 

function limparFormulario() {
  ["name", "sku", "size", "color", "cost", "price", "photo"].forEach(id => { $(id).value = ""; });
  $("qty").value = "1";
  $("min").value = "2";
}

function entrarEdicao(p) {
  editandoId = p.id;
  $("name").value = p.name;
  $("sku").value = p.sku || "";
  $("cat").value = p.cat;
  $("size").value = p.size || "";
  $("color").value = p.color || "";
  $("qty").value = p.qty;
  $("cost").value = p.cost;
  $("price").value = p.price;
  $("min").value = p.min;
  $("photo").value = "";
  $("save").textContent = "Salvar alterações";
  $("cancel").hidden = false;
  $("f").scrollIntoView({ behavior: "smooth" });
  $("name").focus();
  mostrarMensagem(`Editando: ${p.name}. Para trocar a foto, escolha um arquivo novo.`);
}

function sairEdicao() {
  editandoId = null;
  limparFormulario();
  $("save").textContent = "Salvar produto";
  $("cancel").hidden = true;
}

$("cancel").addEventListener("click", () => { sairEdicao(); mostrarMensagem(""); });

$("f").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const arquivo = $("photo").files[0];
    const dados = {
      name: $("name").value.trim(), sku: $("sku").value.trim(), cat: $("cat").value,
      size: $("size").value.trim(), color: $("color").value.trim(),
      qty: parseInt($("qty").value) || 0, cost: parseFloat($("cost").value) || 0,
      price: parseFloat($("price").value) || 0, min: parseInt($("min").value) || 0
    };
    if (arquivo) dados.img = await reduzirFoto(arquivo);

    if (editandoId) {
      await atualizarProduto(editandoId, dados);
      sairEdicao();
      mostrarMensagem("Alterações salvas.");
    } else {
      await adicionarProduto({ ...dados, img: dados.img ?? null });
      limparFormulario();
      $("name").focus();
      mostrarMensagem("Produto salvo.");
    }
  } catch (erro) {
    mostrarMensagem("Não foi possível salvar o produto. Verifique a internet e as regras do Firestore.");
    console.error(erro);
  }
});


document.addEventListener("click", async e => {
  const botao = e.target.closest("button[data-a]");
  if (!botao) return;
  const produto = state.produtos.find(p => p.id === botao.dataset.id);
  if (!produto) return;

  const campo = $("q" + produto.id);
  const qtd = Math.max(1, parseInt(campo && campo.value) || 1);
  mostrarMensagem("");

  try {
    switch (botao.dataset.a) {
      case "sell":
        if (qtd > produto.qty) { mostrarMensagem(`Estoque insuficiente: ${produto.name} tem só ${produto.qty} un.`); return; }
        await registrarVenda(produto, qtd);
        break;
      case "in":
        await registrarEntrada(produto, qtd);
        break;
      case "edit":
        entrarEdicao(produto);
        return;
      case "ph":
        state.fotoId = produto.id;
        $("pickph").click();
        return;
      case "del":
        if (state.confirmandoExclusao !== produto.id) { state.confirmandoExclusao = produto.id; render(); return; }
        await excluirProduto(produto.id);
        break;
    }
    state.confirmandoExclusao = null;
  } catch (erro) {
    mostrarMensagem("Não foi possível salvar. Verifique a internet e as regras do Firestore.");
    console.error(erro);
  }
});


$("pickph").addEventListener("change", async function () {
  const arquivo = this.files[0], id = state.fotoId;
  this.value = "";
  if (!arquivo || !id) return;
  try { await trocarFoto(id, await reduzirFoto(arquivo)); }
  catch (erro) { mostrarMensagem("Não foi possível salvar a foto."); console.error(erro); }
});


["s", "fcat", "days"].forEach(id => $(id).addEventListener("input", render));

preencherCategorias($("cat"));
preencherCategorias($("fcat"), true);

let zerarArmado = false;
$("zerar").addEventListener("click", async () => {
  if (!zerarArmado) {
    zerarArmado = true;
    $("zerar").textContent = "Confirmar: apagar todas as vendas";
    setTimeout(() => { zerarArmado = false; $("zerar").textContent = "Zerar vendas"; }, 5000);
    return;
  }
  zerarArmado = false;
  $("zerar").textContent = "Zerar vendas";
  try {
    const n = await zerarVendas();
    $("zmsg").textContent = n ? `${n} venda(s) apagada(s).` : "Não havia vendas para apagar.";
  } catch (erro) {
    $("zmsg").textContent = "Não foi possível apagar as vendas. Verifique a internet e as regras do Firestore.";
    console.error(erro);
  }
});

