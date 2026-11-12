// Desenha na tela: resumo, reposição, encalhados, mais vendidos e tabela de produtos.
import { state } from "./estado.js";
import { $, formatarReal as R, escapar as esc, diasDesde } from "./utils.js";

const SEM_VENDAS = { qtd: 0, valor: 0, ult30: 0 };

// Soma as vendas de cada produto (total, valor e últimos 30 dias) e a data da última venda.
function resumirVendas() {
  const porProduto = {}, ultimaVenda = {};
  state.vendas.forEach(v => {
    const a = porProduto[v.id] || (porProduto[v.id] = { qtd: 0, valor: 0, ult30: 0 });
    a.qtd += v.q;
    a.valor += v.q * v.price;
    if (diasDesde(v.d) <= 30) a.ult30 += v.q;
    if (!ultimaVenda[v.id] || v.d > ultimaVenda[v.id]) ultimaVenda[v.id] = v.d;
  });
  return { porProduto, ultimaVenda };
}

function renderResumo() {
  let pecas = 0, custo = 0, valor = 0, noMinimo = 0;
  state.produtos.forEach(p => {
    pecas += p.qty; custo += p.qty * p.cost; valor += p.qty * p.price;
    if (p.qty <= p.min) noMinimo++;
  });
  let vendidas = 0, totalVendido = 0, receita30 = 0, lucro30 = 0;
  state.vendas.forEach(v => {
    vendidas += v.q; totalVendido += v.q * v.price;
    if (diasDesde(v.d) <= 30) { receita30 += v.q * v.price; lucro30 += v.q * (v.price - v.cost); }
  });
  $("stats").innerHTML = [
    [pecas, "peças no estoque"], [vendidas, "peças vendidas"],
    [R(valor), "valor do estoque"], [R(totalVendido), "total vendido"],
    [R(custo), "custo do estoque"], [noMinimo, "no estoque mínimo"],
    [R(receita30), "vendido em 30 dias"], [R(lucro30), "lucro em 30 dias"]
  ].map(([numero, rotulo]) => `<div class="stat"><b>${numero}</b><span>${rotulo}</span></div>`).join("");
}

// Repor: está no mínimo ou não dura 30 dias no ritmo atual. Sugere cobrir ~2 meses de venda.
function renderReposicao({ porProduto }) {
  const itens = [];
  state.produtos.forEach(p => {
    const vendido30 = (porProduto[p.id] || SEM_VENDAS).ult30;
    if (p.qty <= p.min || (vendido30 > 0 && p.qty < vendido30)) {
      const meta = Math.max(p.min, vendido30 * 2);
      itens.push({ p, vendido30, comprar: Math.max(1, meta - p.qty) });
    }
  });
  $("rep").innerHTML = itens.length ? itens.map(({ p, vendido30, comprar }) => `
    <div class="it"><b>${esc(p.name)}</b><span class="meta">${esc(p.size)} ${esc(p.color)}</span><br>
    Estoque: <span class="low">${p.qty}</span> (mín. ${p.min})<br>Vendeu ${vendido30} em 30 dias<br>
    <b>Comprar cerca de ${comprar} un.</b><span class="meta">Custo estimado: ${R(comprar * p.cost)}</span></div>`).join("")
    : '<div class="empty">Nada para repor agora.</div>';
}

// Encalhados: tem estoque e está sem vender há X dias (ou nunca vendeu desde o cadastro).
function renderEncalhados({ ultimaVenda }) {
  const limite = parseInt($("days").value) || 45;
  const itens = [];
  state.produtos.forEach(p => {
    if (p.qty > 0) {
      const dias = diasDesde(ultimaVenda[p.id] || p.added);
      if (dias >= limite) itens.push({ p, dias, jaVendeu: !!ultimaVenda[p.id] });
    }
  });
  itens.sort((a, b) => b.dias - a.dias);
  $("idle").innerHTML = itens.length ? itens.map(({ p, dias, jaVendeu }) => `
    <div class="it"><b>${esc(p.name)}</b><span class="meta">${esc(p.size)} ${esc(p.color)}</span><br>
    ${p.qty} un. paradas há ${dias} dias${jaVendeu ? "" : " (nunca vendeu)"}<br>
    <span class="meta">Dinheiro parado: ${R(p.qty * p.cost)}. Considere uma promoção.</span></div>`).join("")
    : '<div class="empty">Nenhum produto encalhado.</div>';
}

function renderMaisVendidos() {
  const grupos = {};
  state.vendas.forEach(v => {
    if (diasDesde(v.d) <= 30) {
      const g = grupos[v.id] || (grupos[v.id] = { nome: v.n, qtd: 0, lucro: 0 });
      g.qtd += v.q;
      g.lucro += v.q * (v.price - v.cost);
    }
  });
  const top = Object.values(grupos).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  $("top").innerHTML = top.length
    ? top.map(g => `<div class="it"><b>${esc(g.nome)}</b>${g.qtd} un. · lucro ${R(g.lucro)}</div>`).join("")
    : '<div class="empty">Ainda não há vendas registradas.</div>';
}

function renderTabela({ porProduto }) {
  const busca = $("s").value.toLowerCase(), categoria = $("fcat").value;
  const lista = state.produtos.filter(p =>
    (!categoria || p.cat === categoria) &&
    (!busca || [p.name, p.sku, p.color, p.size].join(" ").toLowerCase().includes(busca)));

  $("tb").innerHTML = lista.map(p => {
    const v = porProduto[p.id] || SEM_VENDAS;
    const foto = p.img ? `<img class="ph" src="${p.img}" alt="${esc(p.name)}">` : '<div class="ph none">Sem foto</div>';
    const detalhes = esc([p.size, p.color, p.sku].filter(Boolean).join(" · "));
    return `<tr>
      <td>${foto}</td>
      <td>${esc(p.name)}<br><span class="meta">${detalhes}</span></td>
      <td>${R(p.price)}<br><span class="meta">custo ${R(p.cost)}</span></td>
      <td class="${p.qty <= p.min ? "low" : ""}">${p.qty}</td>
      <td>${v.qtd}</td>
      <td>${R(p.qty * p.price)}</td>
      <td>${R(v.valor)}</td>
      <td><div class="acts">
        <input class="q" type="number" min="1" value="1" id="q${p.id}" aria-label="Quantidade">
        <button class="sm" data-a="sell" data-id="${p.id}">Vender</button>
        <button class="sm ghost" data-a="in" data-id="${p.id}">Entrada</button>
        <button class="sm ghost" data-a="ph" data-id="${p.id}">Foto</button>
        <button class="sm ghost" data-a="edit" data-id="${p.id}">Editar</button>
        <button class="sm ghost" data-a="del" data-id="${p.id}">${state.confirmandoExclusao === p.id ? "Confirmar?" : "Excluir"}</button>
      </div></td></tr>`;
  }).join("");

  $("none").textContent = lista.length ? ""
    : (state.produtos.length ? "Nada encontrado com esses filtros." : "Nenhum produto ainda. Cadastre o primeiro acima.");
}

export function render() {
  const vendas = resumirVendas();
  renderResumo();
  renderReposicao(vendas);
  renderEncalhados(vendas);
  renderMaisVendidos();
  renderTabela(vendas);
}
