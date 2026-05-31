// src/utils/db.js
import {
  collection,
  addDoc,
  getDoc,
  getDocFromServer,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

const getUserCollection = (uid) =>
  collection(db, "users", uid, "accounts");

const MASTER_META_ID = "__vault_meta";

export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(doc(db, "users", uid, "accounts", MASTER_META_ID));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveMasterHash = async (uid, masterHash) => {
  return await setDoc(
    doc(db, "users", uid, "accounts", MASTER_META_ID),
    { masterHash, masterHashUpdatedAt: Date.now() },
    { merge: true }
  );
};

export const addAccount = async (uid, data) => {
  const ref = getUserCollection(uid);
  const docRef = await addDoc(ref, { ...data, createdAt: Date.now() });
  await getDocFromServer(docRef);
  return docRef;
};

export const getAccounts = async (uid) => {
  const ref = getUserCollection(uid);
  const snapshot = await getDocs(ref);
  return snapshot.docs
    .filter((d) => d.id !== MASTER_META_ID)
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
};

export const subscribeAccounts = (uid, onNext, onError) => {
  const ref = getUserCollection(uid);
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snapshot) => {
      const accounts = snapshot.docs
        .filter((d) => d.id !== MASTER_META_ID)
        .filter((d) => !d.metadata.hasPendingWrites)
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      onNext(accounts);
    },
    onError
  );
};

export const updateAccount = async (uid, accountId, data) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  await updateDoc(ref, { ...data, updatedAt: Date.now() });
  await getDocFromServer(ref);
};

export const deleteAccount = async (uid, accountId) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  return await deleteDoc(ref);
};
