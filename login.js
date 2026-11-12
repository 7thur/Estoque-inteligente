import { $ } from "./utils.js";
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Mensagens de erro em português
const ERROS = {
  "auth/invalid-credential": "E-mail ou senha incorretos",
  "auth/invalid-email": "E-mail inválido",
  "auth/email-already-in-use": "E-mail já cadastrado. Use a aba Entrar",
  "auth/weak-password": "Senha fraca. Use no mínimo 6 caracteres",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde"
};
const textoErro = erro => ERROS[erro.code] || "Não foi possível concluir. Confira os dados.";

// Mostra o nome da loja no título (ou o título padrão, se não tiver nome)
function mostrarNomeDaLoja(nome) {
  $("titulo").textContent = nome || "Estoque da loja";
  document.title = nome ? `Estoque · ${nome}` : "Estoque da loja";
}

// Troca entre a aba "Entrar" e a aba "Cadastro"
function mostrarAba(nome) {
  const cadastro = nome === "cadastro";
  $("painel-entrar").hidden = cadastro;
  $("painel-cadastro").hidden = !cadastro;
  $("atab-entrar").classList.toggle("on", !cadastro);
  $("atab-cadastro").classList.toggle("on", cadastro);
}

// O main.js chama esta função quando o site abre
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
    }
  });

  // Criar cadastro (depois de criado, a pessoa já entra sozinha)
  $("rf").addEventListener("submit", async e => {
    e.preventDefault();

    if ($("rpw").value !== $("rpw2").value) {
      $("rmsg").textContent = "As senhas não são iguais";
      return;
    }

    const loja = $("rloja").value.trim();

    try {
      const conta = await createUserWithEmailAndPassword(auth, $("rem").value.trim(), $("rpw").value);
      await updateProfile(conta.user, { displayName: loja });
      mostrarNomeDaLoja(loja);
    } catch (erro) {
      $("rmsg").textContent = textoErro(erro);
    }
  });

  // Sair
  $("out").addEventListener("click", async () => {
    await signOut(auth);
  });

  // Descobre se tem alguém logado
  onAuthStateChanged(auth, usuario => {
    if (usuario) {
      mostrarNomeDaLoja(usuario.displayName);
      aoEntrar(usuario.uid);
    } else {
      $("pw").value = "";
      mostrarNomeDaLoja(null);
      aoSair();
    }
  });
}