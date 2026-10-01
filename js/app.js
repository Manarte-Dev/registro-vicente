import {
  getAllMembers,
  getMember,
  addMember,
  updateMember,
  deleteMember,
  compressImage,
  dbErrorMessage,
} from './db.js';
import { login, logout, watchAuth, authErrorMessage } from './auth.js';
import {
  updateFichaFromInputs,
  populateFicha,
  clearFichaFields,
  baixarFicha,
} from './ficha.js';

const screenLogin = document.getElementById('screen-login');
const appContainer = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogin = document.getElementById('btn-login');

const screens = {
  list: document.getElementById('screen-list'),
  form: document.getElementById('screen-form'),
  detail: document.getElementById('screen-detail'),
};

const membersList = document.getElementById('members-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const menuPanel = document.getElementById('menu-panel');
const toast = document.getElementById('toast');

const memberForm = document.getElementById('member-form');
const formTitle = document.getElementById('form-title');
const photoError = document.getElementById('photo-error');
const inputName = document.getElementById('input-name');
const inputPhone = document.getElementById('input-phone');
const inputBirthdate = document.getElementById('input-birthdate');
const inputParents = document.getElementById('input-parents');
const inputAddress = document.getElementById('input-address');
const inputCustom = document.getElementById('input-custom');
const inputPhoto = document.getElementById('input-photo');
const fichaForm = document.getElementById('ficha');
const fichaDetail = document.getElementById('ficha-detail');

const formInputs = [inputName, inputPhone, inputBirthdate, inputParents, inputAddress, inputCustom];

let allMembers = [];
let currentMemberId = null;
let currentMemberName = '';
let editingId = null;
let currentPhoto = null;

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
  menuPanel.classList.add('hidden');
}

function showLogin() {
  screenLogin.classList.add('active');
  appContainer.classList.add('hidden');
  allMembers = [];
  membersList.innerHTML = '';
  loginError.classList.add('hidden');
  loginError.textContent = '';
}

function showApp() {
  screenLogin.classList.remove('active');
  appContainer.classList.remove('hidden');
  showScreen('list');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatDateTimeBR(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR');
}

function syncFormFicha() {
  updateFichaFromInputs(fichaForm, {
    name: inputName,
    phone: inputPhone,
    birthdate: inputBirthdate,
    parents: inputParents,
    address: inputAddress,
    custom: inputCustom,
    photoSrc: currentPhoto || '',
  });
}

async function loadMembers() {
  allMembers = await getAllMembers();
  renderList(searchInput.value);
}

function renderList(filter = '') {
  const term = filter.trim().toLowerCase();
  const filtered = term
    ? allMembers.filter((m) => m.name.toLowerCase().includes(term))
    : allMembers;

  membersList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.querySelector('p:first-child').textContent = term
      ? 'Nenhum membro encontrado.'
      : 'Nenhum membro cadastrado ainda.';
  } else {
    emptyState.classList.add('hidden');
  }

  filtered.forEach((member) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'member-card';
    card.dataset.id = member.id;

    if (member.photo) {
      const img = document.createElement('img');
      img.src = member.photo;
      img.alt = member.name;
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'avatar-placeholder';
      placeholder.textContent = '👤';
      card.appendChild(placeholder);
    }

    const info = document.createElement('div');
    info.className = 'member-info';
    info.innerHTML = `
      <div class="name">${escapeHtml(member.name)}</div>
      <div class="phone">${escapeHtml(member.phone || 'Sem telefone')}</div>
    `;
    card.appendChild(info);

    card.addEventListener('click', () => openDetail(member.id));
    membersList.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function resetPhotoPreview() {
  currentPhoto = null;
  photoError.classList.add('hidden');
  inputPhoto.value = '';
  syncFormFicha();
}

function setPhotoPreview(base64) {
  currentPhoto = base64;
  photoError.classList.add('hidden');
  syncFormFicha();
}

async function handlePhotoInput(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Selecione um arquivo de imagem.');
    return;
  }

  try {
    const compressed = await compressImage(file);
    setPhotoPreview(compressed);
  } catch {
    showToast('Não foi possível processar a foto.');
  }
}

function clearForm() {
  if (!confirm('Limpar todos os campos deste cadastro?')) return;

  memberForm.reset();
  resetPhotoPreview();
  clearFichaFields(fichaForm);
}

function openNewForm() {
  editingId = null;
  formTitle.textContent = 'Novo cadastro';
  memberForm.reset();
  resetPhotoPreview();
  clearFichaFields(fichaForm);
  showScreen('form');
}

async function openEditForm(id) {
  const member = await getMember(id);
  if (!member) {
    showToast('Membro não encontrado.');
    return;
  }

  editingId = id;
  formTitle.textContent = 'Editar cadastro';
  memberForm.reset();
  inputName.value = member.name;
  inputPhone.value = member.phone || '';
  inputBirthdate.value = member.birthdate || '';
  inputParents.value = member.parents || '';
  inputAddress.value = member.address || '';
  inputCustom.value = member.custom || '';

  if (member.photo) {
    currentPhoto = member.photo;
    inputPhoto.value = '';
    photoError.classList.add('hidden');
  } else {
    resetPhotoPreview();
  }

  syncFormFicha();
  showScreen('form');
}

async function openDetail(id) {
  const member = await getMember(id);
  if (!member) {
    showToast('Membro não encontrado.');
    return;
  }

  currentMemberId = id;
  currentMemberName = member.name || '';
  populateFicha(fichaDetail, member);
  document.getElementById('detail-created').textContent = formatDateTimeBR(member.createdAt);

  showScreen('detail');
}

async function handleFormSubmit(event) {
  event.preventDefault();

  const name = inputName.value.trim();
  if (!name) {
    inputName.focus();
    return;
  }

  if (!currentPhoto) {
    photoError.classList.remove('hidden');
    fichaForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const memberData = {
    name,
    phone: inputPhone.value.trim(),
    birthdate: inputBirthdate.value,
    parents: inputParents.value.trim(),
    address: inputAddress.value.trim(),
    custom: inputCustom.value.trim(),
    photo: currentPhoto,
  };

  try {
    if (editingId) {
      const existing = await getMember(editingId);
      await updateMember({
        ...existing,
        ...memberData,
      });
      showToast('Cadastro atualizado!');
    } else {
      await addMember({
        ...memberData,
        createdAt: new Date().toISOString(),
      });
      showToast('Membro cadastrado!');
    }

    await loadMembers();
    showScreen('list');
  } catch (err) {
    showToast(
      dbErrorMessage(err.code) ||
        err.message ||
        'Erro ao salvar. Verifique se o Firestore está ativo no Firebase Console.'
    );
  }
}

async function handleDelete() {
  if (!currentMemberId) return;

  const member = await getMember(currentMemberId);
  if (!member) return;

  const confirmed = confirm(`Excluir o cadastro de "${member.name}"? Esta ação não pode ser desfeita.`);
  if (!confirmed) return;

  try {
    await deleteMember(currentMemberId);
    currentMemberId = null;
    currentMemberName = '';
    await loadMembers();
    showScreen('list');
    showToast('Cadastro excluído.');
  } catch {
    showToast('Erro ao excluir.');
  }
}

async function handleDownloadForm() {
  if (!currentPhoto) {
    photoError.classList.remove('hidden');
    showToast('Adicione uma foto antes de baixar a ficha.');
    return;
  }

  syncFormFicha();

  const btn = document.getElementById('btn-download-form');
  const loading = document.getElementById('ficha-loading');

  try {
    await baixarFicha(fichaForm, inputName.value.trim(), { loadingEl: loading, btnEl: btn });
    showToast('Ficha baixada!');
  } catch (err) {
    showToast(err.message || 'Erro ao gerar ficha.');
  }
}

async function handleDownloadDetail() {
  const btn = document.getElementById('btn-download-detail');
  const loading = document.getElementById('ficha-loading-detail');

  try {
    await baixarFicha(fichaDetail, currentMemberName, { loadingEl: loading, btnEl: btn });
    showToast('Ficha baixada!');
  } catch (err) {
    showToast(err.message || 'Erro ao gerar ficha.');
  }
}

document.getElementById('btn-new').addEventListener('click', openNewForm);
document.getElementById('btn-back-form').addEventListener('click', () => showScreen('list'));
document.getElementById('btn-cancel-form').addEventListener('click', () => showScreen('list'));
document.getElementById('btn-back-detail').addEventListener('click', () => showScreen('list'));
document.getElementById('btn-edit').addEventListener('click', () => {
  if (currentMemberId) openEditForm(currentMemberId);
});
document.getElementById('btn-delete').addEventListener('click', handleDelete);
document.getElementById('btn-clear-form').addEventListener('click', clearForm);
document.getElementById('btn-download-form').addEventListener('click', handleDownloadForm);
document.getElementById('btn-download-detail').addEventListener('click', handleDownloadDetail);

document.getElementById('btn-menu').addEventListener('click', () => {
  menuPanel.classList.toggle('hidden');
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  menuPanel.classList.add('hidden');
  try {
    await logout();
    showToast('Sessão encerrada.');
  } catch {
    showToast('Erro ao sair.');
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.classList.add('hidden');
  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  const email = document.getElementById('input-login-email').value;
  const password = document.getElementById('input-login-password').value;

  try {
    await login(email, password);
  } catch (err) {
    loginError.textContent = authErrorMessage(err.code);
    loginError.classList.remove('hidden');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
});

searchInput.addEventListener('input', (e) => renderList(e.target.value));

inputPhone.addEventListener('input', (e) => {
  e.target.value = formatPhone(e.target.value);
  syncFormFicha();
});

inputPhoto.addEventListener('change', handlePhotoInput);
memberForm.addEventListener('submit', handleFormSubmit);

formInputs.forEach((input) => {
  input.addEventListener('input', syncFormFicha);
  input.addEventListener('change', syncFormFicha);
});

watchAuth(async (user) => {
  if (user) {
    showApp();
    try {
      await loadMembers();
    } catch {
      showToast('Erro ao carregar cadastros. Verifique a conexão.');
    }
  } else {
    showLogin();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
