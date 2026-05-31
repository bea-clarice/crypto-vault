// src/utils/crypto.js
import CryptoJS from "crypto-js";

export const encrypt = (plainText, masterPassword) => {
  return CryptoJS.AES.encrypt(plainText, masterPassword).toString();
};

export const decrypt = (cipherText, masterPassword) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, masterPassword);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    return result || null;
  } catch {
    return null;
  }
};

export const hashMaster = (masterPassword) => {
  return CryptoJS.SHA256(masterPassword).toString();
};
