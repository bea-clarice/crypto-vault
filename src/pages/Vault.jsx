import { useState, useEffect, useMemo } from "react";
import { LogOut, Plus, Search, ShieldCheck, Lock } from "lucide-react";
import { encrypt, decrypt } from "../utils/crypto";
import { addAccount, getAccounts, updateAccount, deleteAccount } from "../utils/db";
import AccountCard, { getAccountTitle } from "../components/AccountCard";
import AccountModal from "../components/AccountModal";
import Toast from "../components/Toast";

const CATEGORIES = ["Email", "Social", "Entertainment", "Finance", "Shopping", "Gaming", "Education", "Other"];
const FILTERS = ["All", ...CATEGORIES];
const ENCRYPTED_FIELDS = [
  "mailProvider",
  "email",
  "socialName",
  "username",
  "password",
  "authenticatedEmail",
  "pin",
  "bank",
  "numberOrUsername",
  "applicationPin",
  "cardPin",
  "eshopping",
  "game",
  "appName",
  "notes",
];

export default function Vault({ user, masterPassword, onLogout, onLock }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const raw = await getAccounts(user.uid);
      const decrypted = raw.map((account) => {
        const next = { ...account };
        ENCRYPTED_FIELDS.forEach((field) => {
          next[field] = account[field] ? decrypt(account[field], masterPassword) || account[field] : "";
        });
        next.category = CATEGORIES.includes(next.category) ? next.category : normalizeLegacyCategory(next.category);
        next.site = account.site || "";
        return next;
      });
      setAccounts(decrypted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (form) => {
    try {
      const payload = {
        category: CATEGORIES.includes(form.category) ? form.category : "Other",
      };

      ENCRYPTED_FIELDS.forEach((field) => {
        payload[field] = form[field] ? encrypt(form[field], masterPassword) : "";
      });

      payload.site = getAccountTitle({ ...form, category: payload.category });

      if (modal?.id) {
        await updateAccount(user.uid, modal.id, payload);
        setToast("Account updated");
      } else {
        await addAccount(user.uid, payload);
        setToast("Account added");
      }
      setModal(null);
      await loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (account) => {
    try {
      await deleteAccount(user.uid, account.id);
      setDeleteTarget(null);
      setToast("Account deleted");
      await loadAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text || "");
    setToast(`${label} copied`);
  };

  const emailOptions = useMemo(() => {
    const emails = new Set();
    if (user.email) emails.add(user.email);
    accounts.forEach((account) => {
      if (account.category === "Email" && account.email) emails.add(account.email);
      if (account.authenticatedEmail) emails.add(account.authenticatedEmail);
    });
    return [...emails];
  }, [accounts, user.email]);

  const catCounts = useMemo(() => {
    const counts = {};
    accounts.forEach((account) => {
      counts[account.category] = (counts[account.category] || 0) + 1;
    });
    return counts;
  }, [accounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchCat = category === "All" || account.category === category;
      const haystack = [
        getAccountTitle(account),
        account.category,
        ...ENCRYPTED_FIELDS.map((field) => account[field]),
      ].filter(Boolean).join(" ").toLowerCase();
      return matchCat && (!q || haystack.includes(q));
    });
  }, [accounts, search, category]);

  const totalEmailAccounts = accounts.filter((account) => account.category === "Email").length;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <img className="header-logo-img" src="/crypto-logo.svg" alt="CRYPTO" />
          <span className="header-logo">CRYPTO</span>
        </div>
        <div className="header-right">
          <div className="header-user">
            {user.photoURL
              ? <img className="header-avatar" src={user.photoURL} alt="" />
              : <div className="header-avatar-fallback">{user.displayName?.[0] || "U"}</div>}
            <span>{user.displayName?.split(" ")[0] || "User"}</span>
          </div>
          <button className="btn-icon" onClick={onLock} title="Lock vault">
            <Lock size={14} />
          </button>
          <button className="btn-icon" onClick={onLogout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-value">{accounts.length}</span>
            <span className="stat-label">Total Accounts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalEmailAccounts}</span>
            <span className="stat-label">Total Email Accounts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{CATEGORIES.length}</span>
            <span className="stat-label">Total Categories</span>
          </div>
        </div>

        <section className="profile-panel" aria-label="Profile">
          <div className="profile-main">
            {user.photoURL
              ? <img className="profile-avatar" src={user.photoURL} alt="" />
              : <div className="profile-avatar fallback">{user.displayName?.[0] || "U"}</div>}
            <div className="profile-copy">
              <span className="profile-kicker">Profile</span>
              <h2>{user.displayName || "Vault user"}</h2>
              <p>{user.email || "No email connected"}</p>
              <p>Master password: *****</p>
            </div>
          </div>
          <div className="profile-side">
            <label className="input-label">All email accounts</label>
            <select className="select-field profile-select" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)}>
              <option value="">Choose email account</option>
              {emailOptions.map((email) => <option key={email} value={email}>{email}</option>)}
            </select>
            <div className="profile-actions">
              <button className="btn-ghost" type="button" onClick={onLock}>
                <Lock size={14} />
                Lock Vault
              </button>
              <button className="btn-ghost" type="button" onClick={onLogout}>
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        </section>

        <div className="controls">
          <div className="search-wrap">
            <Search size={14} className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="Search application or website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-add" onClick={() => setModal({})}>
            <Plus size={15} />
            <span>Add Account</span>
          </button>
        </div>

        <div className="category-tabs">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`cat-tab ${category === filter ? "active" : ""}`}
              onClick={() => setCategory(filter)}
            >
              {filter} {filter !== "All" && catCounts[filter] ? `(${catCounts[filter]})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{display:"flex",justifyContent:"center",padding:"4rem"}}>
            <div className="loading-dot-wrap">
              <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
            </div>
          </div>
        ) : (
          <div className="accounts-grid">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ShieldCheck size={24} /></div>
                <p className="empty-title">{search || category !== "All" ? "No results found" : "Your vault is empty"}</p>
                <p className="empty-sub">{search || category !== "All" ? "Try a different search or category" : "Add your first account to get started"}</p>
              </div>
            ) : (
              filtered.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={(acc) => setModal(acc)}
                  onDelete={(acc) => setDeleteTarget(acc)}
                  onCopy={handleCopy}
                />
              ))
            )}
          </div>
        )}
      </main>

      {modal !== null && (
        <AccountModal
          account={Object.keys(modal).length > 0 ? modal : null}
          emailOptions={emailOptions}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal confirm-modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete Account?</h3>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>x</button>
            </div>
            <p className="confirm-text">
              You're about to delete <span className="confirm-site">{getAccountTitle(deleteTarget)}</span>.
              This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteTarget)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}

function normalizeLegacyCategory(category) {
  if (category === "Streaming") return "Entertainment";
  if (category === "Work") return "Other";
  return CATEGORIES.includes(category) ? category : "Other";
}
