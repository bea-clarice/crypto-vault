# CRYPTO — A hidden space built for your memory

A password manager with Google sign-in, AES-256 encryption, and Firebase cloud sync.

---

## Quick Setup (5 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Create a Firebase project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `crypto-vault`)
3. Disable Google Analytics → **Create project**
4. Go to **Authentication** → **Get started** → enable **Google** sign-in
5. Go to **Firestore Database** → **Create database** → Production mode → choose region (e.g. `asia-southeast1`)
6. Go to **Hosting** → **Get started** (click through)
7. Go to **Project Settings** (⚙️) → **Your apps** → click `</>` → register app → copy the config

### 3. Paste your Firebase config
Open `src/firebase.js` and replace the placeholder values with your actual Firebase config:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

Also update `.firebaserc`:
```json
{ "projects": { "default": "your-project-id" } }
```

### 4. Deploy Firestore rules & app
```bash
npm install -g firebase-tools   # only once
firebase login
firebase deploy --only firestore:rules
npm run build
firebase deploy --only hosting
```

### 5. Open your app
Your app is live at: `https://your-project-id.web.app`

---

## Running locally
```bash
npm run dev
```
App opens at http://localhost:5173

---

## Security model
- **Master password** is never stored or sent anywhere
- **Passwords are encrypted with AES-256** on your device before being written to Firestore
- **Master password hash** (SHA-256) is stored in localStorage only, for verification
- **Firestore rules** ensure only your Google account can read/write your data

---

## Tech Stack
- React + Vite
- Firebase Auth (Google OAuth)
- Firebase Firestore
- Firebase Hosting
- CryptoJS (AES-256 encryption)
- Lucide React (icons)
