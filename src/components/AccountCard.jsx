import { useMemo, useState } from "react";
import { Eye, EyeOff, Copy, Pencil, Trash2 } from "lucide-react";

export const FIELD_LABELS = {
  mailProvider: "Which mail",
  email: "Email",
  socialName: "Social media",
  username: "Username",
  password: "Password",
  authenticatedEmail: "Connected email",
  pin: "Pin",
  bank: "Bank",
  numberOrUsername: "Number / username",
  applicationPin: "Application pin",
  cardPin: "Card pin",
  eshopping: "E-shopping",
  game: "Game",
  appName: "App name",
  environmentName: "Environment name",
};

const SECRET_FIELDS = new Set(["password", "pin", "applicationPin", "cardPin"]);
const NO_COPY_FIELDS = new Set(["mailProvider", "appName"]);

export const getAccountTitle = (account) => {
  if (account.category === "Email") return account.email || account.mailProvider || "Email account";
  if (account.category === "Social") return account.socialName || account.username || "Social account";
  if (account.category === "Finance") return account.bank || account.numberOrUsername || "Finance account";
  if (account.category === "Shopping") return account.eshopping || "Shopping account";
  if (account.category === "Gaming") return account.game || "Gaming account";
  if (account.category === "Other") return account.appName || "Other account";
  if (account.category === "Education") return account.environmentName || account.username || "Education account";
  if (account.category === "Entertainment") return account.appName || account.username || account.authenticatedEmail || "Entertainment account";
  return account.site || "Account";
};

export default function AccountCard({ account, onEdit, onDelete, onCopy, onOpen }) {
  const [shownSecrets, setShownSecrets] = useState({});
  const title = getAccountTitle(account);

  const fields = useMemo(() => {
    return Object.entries(FIELD_LABELS)
      .filter(([key]) => account[key])
      .map(([key, label]) => ({ key, label, value: account[key], secret: SECRET_FIELDS.has(key) }));
  }, [account]);

  const renderValue = ({ key, value, secret }) => {
    if (!secret) {
      return <span className="field-password">{value}</span>;
    }

    const visible = shownSecrets[key];
    return (
      <span className={`field-password ${visible ? "" : "hidden"}`}>
        {visible ? value : "*".repeat(Math.min(value?.length || 6, 16))}
      </span>
    );
  };

  return (
    <div className="account-card" role="button" tabIndex={0} onClick={() => onOpen(account)} onKeyDown={(e) => e.key === "Enter" && onOpen(account)}>
      <div className="card-top">
        <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:0}}>
          <div className="card-site-wrap">
            <img className="card-logo" src="/crypto-logo.svg" alt="" />
            <span className="card-site">{title}</span>
          </div>
          <span className="card-category">{account.category}</span>
        </div>
        <div className="card-actions">
          <button className="card-action" onClick={(e) => { e.stopPropagation(); onEdit(account); }} title="Edit">
            <Pencil size={13} />
          </button>
          <button className="card-action danger" onClick={(e) => { e.stopPropagation(); onDelete(account); }} title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {fields.map((field) => (
        <div className="card-field" key={field.key}>
          <span className="field-label">{field.label}</span>
          <div className="field-password-wrap">
            {renderValue(field)}
            {field.secret && (
              <button
                className="copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShownSecrets((state) => ({ ...state, [field.key]: !state[field.key] }));
                }}
                title={shownSecrets[field.key] ? "Hide" : "Reveal"}
              >
                {shownSecrets[field.key] ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            )}
            {!NO_COPY_FIELDS.has(field.key) && (
              <button className="copy-btn" onClick={(e) => { e.stopPropagation(); onCopy(field.value, field.label); }} title={`Copy ${field.label}`}>
                <Copy size={12} />
              </button>
            )}
          </div>
        </div>
      ))}

      {account.notes && (
        <p className="card-note">{account.notes}</p>
      )}
    </div>
  );
}
