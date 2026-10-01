import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';
import { db, storage } from './firebase.js';

const MEMBERS = 'members';

function membersCol() {
  return collection(db, MEMBERS);
}

function memberDoc(id) {
  return doc(db, MEMBERS, String(id));
}

function photoPath(memberId) {
  return `photos/${memberId}.jpg`;
}

function isDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:');
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function uploadPhoto(memberId, dataUrl) {
  const path = photoPath(memberId);
  const blob = await dataUrlToBlob(dataUrl);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

async function deletePhoto(memberId) {
  try {
    await deleteObject(ref(storage, photoPath(memberId)));
  } catch {
    // Foto pode não existir no Storage.
  }
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
  const id = docRef.id;
  let photo = member.photo || '';

  if (isDataUrl(photo)) {
    photo = await uploadPhoto(id, photo);
  }

  await setDoc(docRef, memberFields({ ...member, photo }));
  return id;
}

export async function updateMember(member) {
  const id = String(member.id);
  const existing = await getMember(id);
  if (!existing) throw new Error('Membro não encontrado.');

  let photo = member.photo || '';

  if (isDataUrl(photo)) {
    photo = await uploadPhoto(id, photo);
  }

  await setDoc(memberDoc(id), memberFields({ ...member, photo }), { merge: true });
  return id;
}

export async function deleteMember(id) {
  await deletePhoto(String(id));
  await deleteDoc(memberDoc(id));
}

export async function clearAllMembers() {
  const snapshot = await getDocs(membersCol());
  await Promise.all(
    snapshot.docs.map(async (item) => {
      await deletePhoto(item.id);
      await deleteDoc(item.ref);
    })
  );
}

export async function bulkImportMembers(members) {
  for (const member of members) {
    const docRef = doc(membersCol());
    const id = docRef.id;
    let photo = member.photo || '';

    if (isDataUrl(photo)) {
      photo = await uploadPhoto(id, photo);
    }

    await setDoc(docRef, memberFields({ ...member, photo }));
  }
}

export function compressImage(file, maxWidth = 800, quality = 0.8) {
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
