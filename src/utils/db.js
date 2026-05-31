// src/utils/db.js
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
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
  return await addDoc(ref, { ...data, createdAt: Date.now() });
};

export const getAccounts = async (uid) => {
  const ref = getUserCollection(uid);
  const q = query(ref, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .filter((d) => d.id !== MASTER_META_ID)
    .map((d) => ({ id: d.id, ...d.data() }));
};

export const updateAccount = async (uid, accountId, data) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  return await updateDoc(ref, { ...data, updatedAt: Date.now() });
};

export const deleteAccount = async (uid, accountId) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  return await deleteDoc(ref);
};
