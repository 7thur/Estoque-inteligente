// Funções de apoio usadas pelo resto do código.
export const CATEGORIAS = ["Camiseta", "Camisa", "Blusa", "Casaco", "Calça", "Bermuda", "Vestido", "Saia", "Calçado", "Acessório", "Outros"];

export const $ = id => document.getElementById(id);

export const formatarReal = valor =>
  Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Protege o HTML contra caracteres especiais digitados nos campos.
export const escapar = texto =>
  String(texto ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const diasDesde = data => Math.floor((Date.now() - new Date(data).getTime()) / 864e5);

export const mostrarMensagem = texto => { $("msg").textContent = texto; };

export function preencherCategorias(select, comOpcaoTodas = false) {
  const opcoes = CATEGORIAS.map(c => `<option>${c}</option>`).join("");
  select.innerHTML = (comOpcaoTodas ? '<option value="">Todas</option>' : "") + opcoes;
}

// Reduz a foto (máx. 360px) para caber no documento do Firestore.
export function reduzirFoto(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = reject;
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onerror = reject;
      imagem.onload = () => {
        const escala = Math.min(1, 360 / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagem.width * escala);
        canvas.height = Math.round(imagem.height * escala);
        canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}
