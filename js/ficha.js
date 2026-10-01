const FICHA_PREFIXES = {
  nome: 'NOME COMPLETO: ',
  nascimento: 'DATA DE NASCIMENTO: ',
  pais: 'NOME DOS PAIS: ',
  telefone: 'TELEFONE / WHATSAPP: ',
  endereco: 'ENDEREÇO: ',
  custom: 'FUNÇÃO / OBSERVAÇÕES: ',
};

export function formatDateBR(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

function $(id) {
  return document.getElementById(id);
}

function esperarImagem(img) {
  if (!img || !img.src) return Promise.resolve();
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}

export function updateFichaFromInputs(fichaEl, inputs) {
  if (!fichaEl) return;

  const values = {
    nome: (inputs.name?.value || '').trim(),
    nascimento: formatDateBR(inputs.birthdate?.value || ''),
    pais: (inputs.parents?.value || '').trim(),
    telefone: (inputs.phone?.value || '').trim(),
    endereco: (inputs.address?.value || '').trim(),
    custom: (inputs.custom?.value || '').trim(),
  };

  Object.entries(FICHA_PREFIXES).forEach(([key, prefix]) => {
    const el = fichaEl.querySelector(`[data-field="${key}"]`);
    if (el) el.textContent = prefix + (values[key] || '');
  });

  const foto = fichaEl.querySelector('[data-field="foto"]');
  if (foto && inputs.photoSrc) {
    foto.src = inputs.photoSrc;
    foto.hidden = !inputs.photoSrc;
  }
}

export function populateFicha(fichaEl, member) {
  if (!fichaEl || !member) return;

  updateFichaFromInputs(fichaEl, {
    name: { value: member.name || '' },
    birthdate: { value: member.birthdate || '' },
    parents: { value: member.parents || '' },
    phone: { value: member.phone || '' },
    address: { value: member.address || '' },
    custom: { value: member.custom || '' },
    photoSrc: member.photo || '',
  });
}

export function clearFichaFields(fichaEl) {
  if (!fichaEl) return;

  Object.entries(FICHA_PREFIXES).forEach(([key, prefix]) => {
    const el = fichaEl.querySelector(`[data-field="${key}"]`);
    if (el) el.textContent = prefix;
  });

  const foto = fichaEl.querySelector('[data-field="foto"]');
  if (foto) {
    foto.src = '';
    foto.hidden = true;
  }
}

function getNomeArquivo(name) {
  const d = new Date();
  const ts =
    String(d.getDate()).padStart(2, '0') +
    String(d.getMonth() + 1).padStart(2, '0') +
    d.getFullYear();

  const slug = (name || '').trim().replace(/\s+/g, '_').toLowerCase();
  return slug ? `ficha_${slug}_${ts}.png` : `ficha_membro_${ts}.png`;
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function baixarFicha(fichaEl, memberName = '', options = {}) {
  const exportArea = $('exportArea');
  const loading = options.loadingEl || null;
  const btn = options.btnEl || null;

  if (!window.html2canvas) {
    throw new Error('html2canvas não carregou.');
  }
  if (!fichaEl) {
    throw new Error('Ficha não encontrada.');
  }
  if (!exportArea) {
    throw new Error('Área de exportação não encontrada.');
  }

  if (loading) loading.classList.remove('hidden');
  if (btn) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Gerando...';
  }

  try {
    exportArea.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'ficha-export-wrap';
    const clone = fichaEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('ficha-export');
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    wrapper.appendChild(clone);
    exportArea.appendChild(wrapper);

    const brasaoOrig = fichaEl.querySelector('[data-field="logo"]');
    const fotoOrig = fichaEl.querySelector('[data-field="foto"]');
    const brasaoClone = clone.querySelector('[data-field="logo"]');
    const fotoClone = clone.querySelector('[data-field="foto"]');

    if (brasaoClone && brasaoOrig?.src) brasaoClone.src = brasaoOrig.src;
    if (fotoClone && fotoOrig?.src) {
      fotoClone.src = fotoOrig.src;
      fotoClone.hidden = false;
    }

    await esperarImagem(brasaoClone);
    if (fotoClone?.src) await esperarImagem(fotoClone);

    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: 3,
      width: clone.offsetWidth,
      height: clone.offsetHeight,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    downloadDataUrl(canvas.toDataURL('image/png'), getNomeArquivo(memberName));
  } finally {
    exportArea.innerHTML = '';
    if (loading) loading.classList.add('hidden');
    if (btn) {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || 'Baixar ficha';
    }
  }
}
