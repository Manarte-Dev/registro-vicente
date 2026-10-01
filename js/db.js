import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';

const MEMBERS = 'members';

function membersCol() {
  return collection(db, MEMBERS);
}

function memberDoc(id) {
  return doc(db, MEMBERS, String(id));
}

function mapDoc(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.name || '',
    phone: data.phone || '',
    birthdate: data.birthdate || '',
    parents: data.parents || '',
    address: data.address || '',
    custom: data.custom || '',
    photo: data.photo || '',
    createdAt: data.createdAt || '',
  };
}

function memberFields(member) {
  return {
    name: member.name || '',
    phone: member.phone || '',
    birthdate: member.birthdate || '',
    parents: member.parents || '',
    address: member.address || '',
    custom: member.custom || '',
    photo: member.photo || '',
    createdAt: member.createdAt || new Date().toISOString(),
  };
}

export async function getAllMembers() {
  const snapshot = await getDocs(membersCol());
  const members = snapshot.docs.map(mapDoc);
  return members.sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
}

export async function getMember(id) {
  const snapshot = await getDoc(memberDoc(id));
  if (!snapshot.exists()) return null;
  return mapDoc(snapshot);
}

export async function addMember(member) {
  const docRef = doc(membersCol());
  await setDoc(docRef, memberFields(member));
  return docRef.id;
}

export async function updateMember(member) {
  const id = String(member.id);
  const existing = await getMember(id);
  if (!existing) throw new Error('Membro não encontrado.');

  await setDoc(memberDoc(id), memberFields(member), { merge: true });
  return id;
}

export async function deleteMember(id) {
  await deleteDoc(memberDoc(id));
}

export async function clearAllMembers() {
  const snapshot = await getDocs(membersCol());
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}

export async function bulkImportMembers(members) {
  for (const member of members) {
    const docRef = doc(membersCol());
    await setDoc(docRef, memberFields(member));
  }
}

export function compressImage(file, maxWidth = 600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function dbErrorMessage(code) {
  const messages = {
    'permission-denied':
      'Sem permissão. Publique as regras do Firestore: firebase deploy --only firestore:rules',
    'unavailable': 'Firestore indisponível. Verifique se o banco foi criado no Firebase Console.',
    'not-found': 'Firestore não encontrado. Crie o banco de dados no Firebase Console.',
  };
  return messages[code] || null;
}
