import { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";

const CATEGORIES = ["Email", "Social", "Entertainment", "Finance", "Shopping", "Gaming", "Education", "Other"];

const FIELD_SETS = {
  Email: [
    ["mailProvider", "Which mail", "e.g. Google, Outlook, Microsoft"],
    ["email", "Email", "name@example.com"],
    ["password", "Password", "Password", "password"],
    ["authenticatedEmail", "Authenticated email", "", "emailSelect"],
  ],
  Social: [
    ["socialName", "Social media name", "e.g. Instagram"],
    ["username", "Username", "Username"],
    ["password", "Password", "Password", "password"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["pin", "Pin", "PIN", "password"],
  ],
  Entertainment: [
    ["appName", "App name", "Application name"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["username", "Username", "Username"],
    ["password", "Password", "Password", "password"],
  ],
  Finance: [
    ["bank", "Bank", "Bank name"],
    ["numberOrUsername", "Number or username", "Account number or username"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["applicationPin", "Application pin", "Application PIN", "password"],
    ["cardPin", "Card pin", "Card PIN", "password"],
  ],
  Shopping: [
    ["eshopping", "E-shopping", "e.g. Shopee, Amazon"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["password", "Password", "Password", "password"],
  ],
  Gaming: [
    ["game", "Game", "Game name"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["password", "Password", "Password", "password"],
  ],
  Education: [
    ["environmentName", "Environment name", "Environment name"],
    ["username", "Username", "Username"],
    ["password", "Password", "Password", "password"],
  ],
  Other: [
    ["appName", "App name", "Application name"],
    ["authenticatedEmail", "Connected Google mail", "", "emailSelect"],
    ["password", "Password", "Password", "password"],
  ],
};

const emptyForm = {
  category: "Email",
  notes: "",
  mailProvider: "",
  email: "",
  socialName: "",
  username: "",
  password: "",
  authenticatedEmail: "",
  pin: "",
  bank: "",
  numberOrUsername: "",
  applicationPin: "",
  cardPin: "",
  eshopping: "",
  game: "",
  appName: "",
  environmentName: "",
  site: "",
};

export default function AccountModal({ account, emailOptions, onSave, onClose }) {
  const isEdit = !!account;
  const [form, setForm] = useState(emptyForm);
  const [visibleSecrets, setVisibleSecrets] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (account) setForm({ ...emptyForm, ...account, category: account.category || "Email" });
  }, [account]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const currentFields = FIELD_SETS[form.category] || FIELD_SETS.Other;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      console.error(error);
      setErr(error?.message || "Could not save this account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderField = ([key, label, placeholder, type = "text"]) => {
    if (type === "emailSelect") {
      return (
        <div className="input-wrap" key={key}>
          <label className="input-label">{label}</label>
          <select className="select-field" value={form[key] || ""} onChange={(e) => set(key, e.target.value)}>
            <option value="">Choose email</option>
            {emailOptions.map((email) => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "password") {
      return (
        <div className="input-wrap" key={key}>
          <label className="input-label">{label}</label>
          <div className="input-field-wrap">
            <input
              className="input-field"
              type={visibleSecrets[key] ? "text" : "password"}
              placeholder={placeholder}
              value={form[key] || ""}
              onChange={(e) => set(key, e.target.value)}
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setVisibleSecrets((state) => ({ ...state, [key]: !state[key] }))}
              title={visibleSecrets[key] ? "Hide" : "Reveal"}
            >
              {visibleSecrets[key] ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="input-wrap" key={key}>
        <label className="input-label">{label}</label>
        <input
          className="input-field"
          type="text"
          placeholder={placeholder}
          value={form[key] || ""}
          onChange={(e) => set(key, e.target.value)}
          style={{paddingRight:"14px"}}
        />
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? "Edit Account" : "Add Account"}</h3>
          <button type="button" className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        {err && <p className="error-msg">{err}</p>}

        <div className="modal-grid">
          <div className="input-wrap full">
            <label className="input-label">Category</label>
            <select className="select-field" value={form.category} onChange={(e) => set("category", e.target.value)} autoFocus>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {currentFields.map(renderField)}

          <div className="input-wrap full">
            <label className="input-label">Notes</label>
            <textarea
              className="textarea-field"
              placeholder="Any extra info..."
              value={form.notes || ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit" disabled={saving} style={{minWidth:100}}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
