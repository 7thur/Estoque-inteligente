import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { $ } from "./utils.js";

const ERROS = {
  "auth/invalid-credential": "Email ou senha inválidos",
  "auth/invalid-email": "Email inválido",
  "auth/email-already-in-use": "Email já cadastrado. Use a aba Entrar",
  "auth/weak-password": "Senha fraca. Use no mínimo 6 caracteres",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde",
};
const textoErro = erro => ERROS[erro.code] || "Não foi possível concluir. Confira os dados e a configuração do Firebase.";

// Alterna entre as abas "Entrar" e "Cadastro".
function mostrarAba(nome) {
  const cadastro = nome === "cadastro";
  $("painel-entrar").hidden = cadastro;
  $("painel-cadastro").hidden = !cadastro;
  $("atab-entrar").classList.toggle("on", !cadastro);
  $("atab-cadastro").classList.toggle("on", cadastro);
  $("amsg").textContent = "";
  $("rmsg").textContent = "";
}

export function iniciarLogin({ aoEntrar, aoSair }) {
  $("atab-entrar").addEventListener("click", () => mostrarAba("entrar"));
  $("atab-cadastro").addEventListener("click", () => mostrarAba("cadastro"));

  // Entrar
  $("af").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, $("em").value.trim(), $("pw").value);
    } catch (erro) {
      $("amsg").textContent = textoErro(erro);
      console.error(erro);
    }
  });

  // Criar cadastro (depois de criado, a pessoa já entra sozinha)
  $("rf").addEventListener("submit", async e => {
    e.preventDefault();
    if ($("rpw").value !== $("rpw2").value) {
      $("rmsg").textContent = "As senhas não são iguais";
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, $("rem").value.trim(), $("rpw").value);
    } catch (erro) {
      $("rmsg").textContent = textoErro(erro);
      console.error(erro);
    }
  });

  // Sair
  $("out").addEventListener("click", async () => {
    await signOut(auth);
  });

  // Descobre se tem alguém logado
  onAuthStateChanged(auth, usuario => {
    if (usuario) {
      aoEntrar(usuario.uid);
    } else {
      ["pw", "rpw", "rpw2"].forEach(id => { $(id).value = ""; });
      mostrarAba("entrar");
      aoSair();
    }
  });
}