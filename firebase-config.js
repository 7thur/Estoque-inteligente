// Conexão com o Firebase.
// Cole aqui a configuração do seu projeto (Firebase > Configurações do projeto > Seus apps).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCplXG4UDueC4RgK42Wrf6BJ4sK1TRDRj0",
  authDomain: "estoque-inteligente-29c72.firebaseapp.com",
  projectId: "estoque-inteligente-29c72",
  appId: "1:29353494787:web:8d78f687a4e8aa84ab8136"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
