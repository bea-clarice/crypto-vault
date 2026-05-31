import { useState } from "react";
import { Eye, EyeOff, LogOut } from "lucide-react";
import { hashMaster } from "../utils/crypto";

export default function MasterPassword({ user, onUnlock, onLogout }) {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const HASH_KEY = `crypto_master_hash_${user.uid}`;
  const isFirstTime = !localStorage.getItem(HASH_KEY);

  const strengthRules = [
    pass.length >= 12,
    /[A-Z]/.test(pass),
    /[a-z]/.test(pass),
    /\d/.test(pass),
    /[^A-Za-z0-9]/.test(pass),
  ];
  const strengthScore = strengthRules.filter(Boolean).length;
  const strongEnough = strengthScore >= 4;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pass.trim()) return;
    if (isFirstTime && !strongEnough) {
      setErr("Use a stronger master password before creating the vault.");
      return;
    }

    const stored = localStorage.getItem(HASH_KEY);
    const hash = hashMaster(pass);
    if (!stored) {
      localStorage.setItem(HASH_KEY, hash);
      onUnlock(pass);
    } else if (stored === hash) {
      onUnlock(pass);
    } else {
      setErr("Incorrect master password. Try again.");
      setPass("");
    }
  };

  return (
    <div className="master-screen">
      <form className="master-card" onSubmit={handleSubmit}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div className="master-header">
            <span className="master-label">Vault Lock</span>
            <h2 className="master-title">
              {isFirstTime ? "Create Master Password" : "Enter Master Password"}
            </h2>
          </div>
          <button type="button" className="btn-icon" onClick={onLogout} title="Sign out" style={{alignSelf:"flex-start"}}>
            <LogOut size={15} />
          </button>
        </div>

        <p className="master-sub">
          {isFirstTime
            ? "Choose a strong master password. This encrypts all your data before sync. If you forget it, your vault cannot be recovered."
            : `Welcome back, ${user.displayName?.split(" ")[0] || "agent"}. Enter your master password to decrypt your vault.`}
        </p>

        {err && <p className="error-msg">{err}</p>}

        <div className="input-wrap">
          <label className="input-label">Master Password</label>
          <div className="input-field-wrap">
            <input
              className="input-field"
              type={show ? "text" : "password"}
              placeholder={isFirstTime ? "Create a strong password..." : "Enter your master password..."}
              value={pass}
              onChange={(e) => { setPass(e.target.value); setErr(""); }}
              autoFocus
            />
            <button type="button" className="input-eye" onClick={() => setShow(!show)}>
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {isFirstTime && (
          <div className="password-strength" aria-live="polite">
            <div className="strength-track">
              <span className={strengthScore >= 1 ? "on" : ""} />
              <span className={strengthScore >= 2 ? "on" : ""} />
              <span className={strengthScore >= 3 ? "on" : ""} />
              <span className={strengthScore >= 4 ? "on" : ""} />
              <span className={strengthScore >= 5 ? "on" : ""} />
            </div>
            <span className="strength-copy">
              Use 12+ characters with upper, lower, number, and symbol.
            </span>
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={!pass.trim() || (isFirstTime && !strongEnough)}>
          {isFirstTime ? "Create Vault" : "Unlock Vault"}
        </button>

        {isFirstTime && (
          <p className="master-sub" style={{fontSize:"0.68rem", color:"var(--danger)"}}>
            Write this password down somewhere safe. There is no reset.
          </p>
        )}
      </form>
    </div>
  );
}
