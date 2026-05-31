// src/App.jsx
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Landing from "./pages/Landing";
import MasterPassword from "./pages/MasterPassword";
import Vault from "./pages/Vault";

export default function App() {
  const { user, loading, login, logout } = useAuth();
  const [masterPassword, setMasterPassword] = useState(null);
  const [unlockOptions, setUnlockOptions] = useState({});

  if (loading) {
    return (
      <div className="loading-screen">
        <img className="logo-image" src="/crypto-logo.svg" alt="CRYPTO" style={{width:52,height:52}} />
        <div className="loading-dot-wrap">
          <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
        </div>
        <span className="loading-text">INITIALIZING CRYPTO…</span>
      </div>
    );
  }

  if (!user) return <Landing onLogin={login} />;

  if (!masterPassword) {
    return (
      <MasterPassword
        user={user}
        onUnlock={(mp, options = {}) => {
          setUnlockOptions(options);
          setMasterPassword(mp);
        }}
        onLogout={logout}
      />
    );
  }

  return (
    <Vault
      user={user}
      masterPassword={masterPassword}
      needsHashMigration={unlockOptions.needsHashMigration}
      onLogout={() => { setMasterPassword(null); logout(); }}
      onLock={() => { setUnlockOptions({}); setMasterPassword(null); }}
    />
  );
}
