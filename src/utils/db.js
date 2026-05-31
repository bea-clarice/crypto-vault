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

const getUserDoc = (uid) => doc(db, "users", uid);

export const getUserProfile = async (uid) => {
  const snapshot = await getDoc(getUserDoc(uid));
  return snapshot.exists() ? snapshot.data() : null;
};

export const saveMasterHash = async (uid, masterHash) => {
  return await setDoc(
    getUserDoc(uid),
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
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const updateAccount = async (uid, accountId, data) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  return await updateDoc(ref, { ...data, updatedAt: Date.now() });
};

export const deleteAccount = async (uid, accountId) => {
  const ref = doc(db, "users", uid, "accounts", accountId);
  return await deleteDoc(ref);
};
