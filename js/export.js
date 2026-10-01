import { getAllMembers, clearAllMembers, bulkImportMembers } from './db.js';

const EXPORT_VERSION = 1;

export async function exportBackup() {
  const members = await getAllMembers();
  const backup = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Registro Igreja',
    members,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `registro-igreja-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return members.length;
}

export async function importBackup(file) {
  const text = await file.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Arquivo inválido. Selecione um backup .json exportado pelo app.');
  }

  if (!data || !Array.isArray(data.members)) {
    throw new Error('Formato de backup inválido.');
  }

  const members = data.members.map((m) => ({
    id: m.id,
    name: m.name || '',
    phone: m.phone || '',
    birthdate: m.birthdate || '',
    parents: m.parents || '',
    address: m.address || '',
    custom: m.custom || '',
    photo: m.photo || '',
    createdAt: m.createdAt || new Date().toISOString(),
  }));

  await clearAllMembers();
  await bulkImportMembers(members);

  return members.length;
}
