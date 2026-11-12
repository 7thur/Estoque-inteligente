
import { db } from "./firebase-config.js";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, getDocs, writeBatch, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { state } from "./estado.js";

const colProdutos = () => collection(db, "users", state.uid, "produtos");
const colVendas = () => collection(db, "users", state.uid, "vendas");


export function ouvirDados(aoMudar, aoErro) {
  const pararProdutos = onSnapshot(colProdutos(), snap => {
    state.produtos = snap.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .sort((a, b) => (b.added || "").localeCompare(a.added || ""));
    aoMudar();
  }, aoErro);

  const pararVendas = onSnapshot(colVendas(), snap => {
    state.vendas = snap.docs.map(d => d.data());
    aoMudar();
  }, aoErro);

  return () => { pararProdutos(); pararVendas(); };
}

export const adicionarProduto = dados =>
  addDoc(colProdutos(), { ...dados, added: new Date().toISOString() });


export function registrarVenda(produto, qtd) {
  const lote = writeBatch(db);
  lote.update(doc(colProdutos(), produto.id), { qty: increment(-qtd) });
  lote.set(doc(colVendas()), {
    id: produto.id, n: produto.name, d: new Date().toISOString(),
    q: qtd, price: produto.price, cost: produto.cost
  });
  return lote.commit();
}

export const registrarEntrada = (produto, qtd) =>
  updateDoc(doc(colProdutos(), produto.id), { qty: increment(qtd) });

export const trocarFoto = (id, img) => updateDoc(doc(colProdutos(), id), { img });

export const excluirProduto = id => deleteDoc(doc(colProdutos(), id));

export const atualizarProduto = (id, dados) => updateDoc(doc(colProdutos(), id), dados);


export async function zerarVendas() {
  const snap = await getDocs(colVendas());
  let lote = writeBatch(db), n = 0;
  for (const d of snap.docs) {
    lote.delete(d.ref);
    if (++n % 400 === 0) { await lote.commit(); lote = writeBatch(db); }
  }
  await lote.commit();
  return snap.size;
}