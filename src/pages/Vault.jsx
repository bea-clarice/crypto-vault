import { useState, useEffect, useMemo } from "react";
import { Copy, LogOut, Plus, Search, ShieldCheck, Lock } from "lucide-react";
import { encrypt, decrypt, hashMaster } from "../utils/crypto";
import { addAccount, subscribeAccounts, updateAccount, deleteAccount, saveMasterHash } from "../utils/db";
import AccountCard, { FIELD_LABELS, getAccountTitle } from "../components/AccountCard";
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

export default function Vault({ user, masterPassword, needsHashMigration, onLogout, onLock }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decryptError, setDecryptError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [applicationFilter, setApplicationFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLoading(true);
    setDecryptError("");

    const unsubscribe = subscribeAccounts(
      user.uid,
      async (raw) => {
        const { decrypted, failedCount } = decryptAccounts(raw, masterPassword);

        if (needsHashMigration && failedCount === 0) {
          await saveMasterHash(user.uid, hashMaster(masterPassword));
        }

        setAccounts(decrypted);
        setDecryptError(
          failedCount
            ? `${failedCount} saved item${failedCount === 1 ? "" : "s"} could not be decrypted with this master password. Items that decrypt successfully are still shown.`
            : ""
        );
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setDecryptError(getLoadErrorMessage(error));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [masterPassword, needsHashMigration, user.uid]);

  const decryptAccounts = (raw, password) => {
    let failedCount = 0;
    const decrypted = raw.flatMap((account) => {
        const next = { ...account };
        let accountFailed = false;

        ENCRYPTED_FIELDS.forEach((field) => {
          if (!account[field]) {
            next[field] = "";
            return;
          }

          const value = decrypt(account[field], password);
          if (value === null) {
            accountFailed = true;
            return;
          }
          next[field] = value || "";
        });

        if (accountFailed) {
          failedCount += 1;
          return [];
        }

        next.category = CATEGORIES.includes(next.category) ? next.category : normalizeLegacyCategory(next.category);
        next.site = account.site || "";
        return [next];
      });

    return { decrypted, failedCount };
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
    } catch (e) {
      console.error(e);
      setToast("Save failed");
      throw new Error(getSaveErrorMessage(e));
    }
  };

  const handleDelete = async (account) => {
    try {
      await deleteAccount(user.uid, account.id);
      setDeleteTarget(null);
      setToast("Account deleted");
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
    return [...emails].sort((a, b) => a.localeCompare(b));
  }, [accounts, user.email]);

  const applicationOptions = useMemo(() => {
    const names = new Set();
    accounts.forEach((account) => names.add(getAccountTitle(account)));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [accounts]);

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
      const matchApplication = applicationFilter === "All" || getAccountTitle(account) === applicationFilter;
      const haystack = [
        getAccountTitle(account),
        account.category,
        ...ENCRYPTED_FIELDS.map((field) => account[field]),
      ].filter(Boolean).join(" ").toLowerCase();
      return matchCat && matchApplication && (!q || haystack.includes(q));
    }).sort((a, b) => getAccountTitle(a).localeCompare(getAccountTitle(b)));
  }, [accounts, search, category, applicationFilter]);

  const totalEmailAccounts = accounts.filter((account) => account.category === "Email").length;
  const emailDetails = useMemo(() => {
    return emailOptions.map((email) => ({
      email,
      accounts: accounts
        .filter((account) => account.email === email || account.authenticatedEmail === email)
        .sort((a, b) => getAccountTitle(a).localeCompare(getAccountTitle(b))),
    }));
  }, [accounts, emailOptions]);

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
            <div className="profile-actions">
              <button className="btn-ghost" type="button" onClick={() => setEmailModalOpen(true)}>
                All Emails
              </button>
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

        <div className="filter-row">
          <label className="input-label" htmlFor="application-filter">Application</label>
          <select
            id="application-filter"
            className="select-field application-filter"
            value={applicationFilter}
            onChange={(e) => setApplicationFilter(e.target.value)}
          >
            <option value="All">All applications</option>
            {applicationOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
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
            {decryptError && (
              <div className="decrypt-warning">
                ⚠️ {decryptError}
              </div>
            )}
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
                  onOpen={(acc) => setSelectedAccount(acc)}
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

      {emailModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEmailModalOpen(false)}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <h3 className="modal-title">Email Information</h3>
              <button className="modal-close" onClick={() => setEmailModalOpen(false)}>x</button>
            </div>
            <div className="email-info-list">
              {emailDetails.length === 0 ? (
                <p className="empty-sub">No email accounts saved yet.</p>
              ) : (
                emailDetails.map(({ email, accounts: connectedAccounts }) => (
                  <section className="email-info-card" key={email}>
                    <div className="email-info-header">
                      <div>
                        <span className="detail-kicker">Email</span>
                        <h4>{email}</h4>
                      </div>
                      <button className="detail-copy" type="button" onClick={() => handleCopy(email, "Email")} title="Copy email">
                        <Copy size={13} />
                      </button>
                    </div>
                    {connectedAccounts.length === 0 ? (
                      <p className="empty-sub">No connected account details for this email.</p>
                    ) : (
                      <div className="detail-list">
                        {connectedAccounts.map((account) => (
                          <button className="detail-row" key={account.id} onClick={() => { setEmailModalOpen(false); setSelectedAccount(account); }}>
                            <span>{getAccountTitle(account)}</span>
                            <small>{account.category}</small>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAccount && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedAccount(null)}>
          <div className="modal detail-modal">
            <div className="modal-header">
              <div>
                <span className="detail-kicker">{selectedAccount.category}</span>
                <h3 className="modal-title">{getAccountTitle(selectedAccount)}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedAccount(null)}>x</button>
            </div>
            <div className="detail-grid">
              {Object.entries(FIELD_LABELS)
                .filter(([key]) => selectedAccount[key])
                .map(([key, label]) => (
                  <div className="detail-field" key={key}>
                    <span>{label}</span>
                    <div className="detail-value-row">
                      <strong>{selectedAccount[key]}</strong>
                      <button className="detail-copy" type="button" onClick={() => handleCopy(selectedAccount[key], label)} title={`Copy ${label}`}>
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              {selectedAccount.notes && (
                <div className="detail-field full">
                  <span>Notes</span>
                  <div className="detail-value-row">
                    <strong>{selectedAccount.notes}</strong>
                    <button className="detail-copy" type="button" onClick={() => handleCopy(selectedAccount.notes, "Notes")} title="Copy Notes">
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setSelectedAccount(null); setModal(selectedAccount); }}>Edit</button>
              <button className="btn-primary" onClick={() => setSelectedAccount(null)}>Done</button>
            </div>
          </div>
        </div>
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

function getSaveErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firestore blocked this save. Deploy the latest firestore.rules, then try again.";
  }
  if (error?.code === "unavailable") {
    return "Firestore is unavailable right now. Check your connection and try again.";
  }
  return "Could not save this account. Please try again.";
}

function getLoadErrorMessage(error) {
  if (error?.code === "permission-denied") {
    return "Firestore blocked vault sync. Deploy the latest firestore.rules, then try again.";
  }
  if (error?.code === "unavailable") {
    return "Vault sync is unavailable right now. Check your connection and try again.";
  }
  return "Could not sync your vault. Please try again.";
}
