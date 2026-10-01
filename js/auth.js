import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './firebase.js';

export function login(email, password) {
  const trimmedEmail = String(email || '').trim();
  const trimmedPassword = String(password || '');

  if (!trimmedEmail || !trimmedPassword) {
    return Promise.reject({ code: 'auth/missing-credentials' });
  }

  return signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
}

export function logout() {
  return signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function authErrorMessage(code) {
  const messages = {
    'auth/missing-credentials': 'Informe e-mail e senha.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Usuário desativado.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/unauthorized-domain': 'Domínio não autorizado. Adicione manarte-dev.github.io no Firebase.',
    'auth/requests-from-referer-blocked': 'API key bloqueada. Verifique restrições no Google Cloud.',
    'auth/operation-not-allowed': 'Login por e-mail/senha não está ativado no Firebase.',
    'auth/api-key-not-valid': 'Chave de API inválida. Copie a configuração novamente no Firebase Console.',
    'auth/invalid-api-key': 'Chave de API inválida. Copie a configuração novamente no Firebase Console.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
    'auth/network-request-failed': 'Sem conexão. Verifique a internet.',
  };
  return messages[code] || `Erro ao entrar (${code || 'desconhecido'}).`;
}
