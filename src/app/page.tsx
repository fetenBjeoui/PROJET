"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

type Status = "Commande passée" | "En préparation" | "En transit" | "Dédouanement" | "Livré";
type ImportCase = {
  id: number;
  caseNumber: string;
  supplier: string;
  country: string;
  countryCode: string;
  product: string;
  status: Status;
  transportMode: string;
  incoterm: string;
  etd: string | null;
  eta: string | null;
  arrivedAt: string | null;
  invoice: boolean;
  billOfLading: boolean;
  originCertificate: boolean;
  importPermit: boolean;
  insurance: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type DocumentKey = "invoice" | "billOfLading" | "originCertificate" | "importPermit" | "insurance";
type MainView = "Vue d’ensemble" | "Dossiers" | "Documents" | "Échéances";
type FilterTab = "Tous" | "En cours" | "À surveiller" | "Terminés";
type IconName =
  | "overview"
  | "cases"
  | "documents"
  | "calendar"
  | "search"
  | "bell"
  | "plus"
  | "download"
  | "arrow"
  | "ship"
  | "box"
  | "file"
  | "clock"
  | "check"
  | "close"
  | "globe"
  | "truck"
  | "plane"
  | "more"
  | "refresh"
  | "alert"
  | "chevron";

const statuses: Status[] = ["Commande passée", "En préparation", "En transit", "Dédouanement", "Livré"];
const mainViews: { name: MainView; icon: IconName }[] = [
  { name: "Vue d’ensemble", icon: "overview" },
  { name: "Dossiers", icon: "cases" },
  { name: "Documents", icon: "documents" },
  { name: "Échéances", icon: "calendar" },
];
const tabs: FilterTab[] = ["Tous", "En cours", "À surveiller", "Terminés"];
const documents: { key: DocumentKey; name: string; short: string; description: string }[] = [
  { key: "invoice", name: "Facture commerciale", short: "Facture", description: "Émise par le fournisseur" },
  { key: "billOfLading", name: "Connaissement", short: "Connaissement", description: "Document de transport" },
  { key: "originCertificate", name: "Certificat d’origine", short: "Origine", description: "Pays de fabrication certifié" },
];
const clearances: { key: DocumentKey; name: string; short: string }[] = [
  { key: "importPermit", name: "Autorisation d’importation", short: "Autorisation" },
  { key: "insurance", name: "Assurance transport", short: "Assurance" },
];
const countries = [
  ["Chine", "CN"],
  ["Vietnam", "VN"],
  ["Turquie", "TR"],
  ["Maroc", "MA"],
  ["Japon", "JP"],
  ["Brésil", "BR"],
  ["États-Unis", "US"],
  ["Inde", "IN"],
  ["Royaume-Uni", "GB"],
  ["Allemagne", "DE"],
  ["Espagne", "ES"],
  ["Italie", "IT"],
  ["Autre", "XX"],
];
const flagMap: Record<string, string> = {
  CN: "🇨🇳",
  VN: "🇻🇳",
  TR: "🇹🇷",
  MA: "🇲🇦",
  JP: "🇯🇵",
  BR: "🇧🇷",
  US: "🇺🇸",
  IN: "🇮🇳",
  GB: "🇬🇧",
  DE: "🇩🇪",
  ES: "🇪🇸",
  IT: "🇮🇹",
  XX: "🌍",
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  return (
    <svg {...shared}>
      {name === "overview" && <><rect x="3.4" y="3.4" width="7" height="7" rx="1.3" /><rect x="13.6" y="3.4" width="7" height="4.6" rx="1.3" /><rect x="13.6" y="10.8" width="7" height="9.8" rx="1.3" /><rect x="3.4" y="13.2" width="7" height="7.4" rx="1.3" /></>}
      {name === "cases" && <><path d="M4 7.5h16a1.6 1.6 0 0 1 1.6 1.6v9.2a1.7 1.7 0 0 1-1.7 1.7H4.1a1.7 1.7 0 0 1-1.7-1.7V9.2A1.7 1.7 0 0 1 4 7.5Z" /><path d="M8.2 7.4V5.8a1.8 1.8 0 0 1 1.8-1.8h4a1.8 1.8 0 0 1 1.8 1.8v1.6M2.7 12h18.6M10 12v2h4v-2" /></>}
      {name === "documents" && <><path d="M13 3.5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3.5V10h7M8 14h8m-8 3.5h8" /></>}
      {name === "calendar" && <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h3" /></>}
      {name === "search" && <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.4 4.4" /></>}
      {name === "bell" && <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>}
      {name === "plus" && <><path d="M12 5v14M5 12h14" /></>}
      {name === "download" && <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>}
      {name === "arrow" && <><path d="M5 12h14m-6-6 6 6-6 6" /></>}
      {name === "ship" && <><path d="m3 13 1.4 5.2a2 2 0 0 0 1.9 1.5h11.4a2 2 0 0 0 1.9-1.5L21 13l-9 4-9-4Z" /><path d="M5 13V6h6v7m0-7h5v3h3v4M8 9h3M2.5 21c1.2 0 1.8-.8 3-.8s1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8 1.8-.8 3-.8 1.8.8 3 .8" /></>}
      {name === "box" && <><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" /><path d="m3.5 8.2 8.5 4.7 8.5-4.7M12 13v8M7.5 5.5l9 5" /></>}
      {name === "file" && <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3v7h7m-12 4h8m-8 4h6" /></>}
      {name === "clock" && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.3 2" /></>}
      {name === "check" && <><path d="m5 12.5 4.2 4.2L19.5 6.8" /></>}
      {name === "close" && <><path d="m18 6-12 12M6 6l12 12" /></>}
      {name === "globe" && <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>}
      {name === "truck" && <><path d="M2.5 6.5h12v11h-12zM14.5 10h4l3 3v4.5h-7z" /><circle cx="7" cy="19" r="1.8" /><circle cx="18" cy="19" r="1.8" /></>}
      {name === "plane" && <><path d="m2.5 15.5 7.3-2.1 4.7 6.1 2-.6-2.5-7.1 5.1-1.5a2 2 0 0 0 1.4-2.5l-.1-.2a2 2 0 0 0-2.4-1.2l-5.2 1.6-5.9-4.6-2.2.6 3.4 6.3-7.2 2.2 1.6 3Z" /></>}
      {name === "more" && <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>}
      {name === "refresh" && <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.7 9A7 7 0 0 1 18 6.4L20 8M4 16l2 1.6A7 7 0 0 0 18.3 15" /></>}
      {name === "alert" && <><path d="M10.3 4.4 2.8 17.5a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L13.7 4.4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>}
      {name === "chevron" && <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

function dayDifference(dateValue: string | null) {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day);
  const today = new Date();
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - current) / 86_400_000);
}

function isDelayed(item: ImportCase) {
  return Boolean(item.eta && !item.arrivedAt && item.status !== "Livré" && (dayDifference(item.eta) ?? 0) < 0);
}

function isDueSoon(item: ImportCase) {
  const days = dayDifference(item.eta);
  return Boolean(item.eta && !item.arrivedAt && item.status !== "Livré" && days !== null && days >= 0 && days <= 7);
}

function missingDocuments(item: ImportCase) {
  return documents.filter((document) => !item[document.key]);
}

function formatDate(value: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "À confirmer";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("fr-FR", options ?? { day: "2-digit", month: "short" }).format(date).replace(".", "");
}

function etaLabel(item: ImportCase) {
  if (item.arrivedAt || item.status === "Livré") return `Reçu le ${formatDate(item.arrivedAt ?? item.eta)}`;
  const days = dayDifference(item.eta);
  if (days === null) return "À confirmer";
  if (days < 0) return `En retard de ${Math.abs(days)} j`;
  if (days === 0) return "Aujourd’hui";
  if (days === 1) return "Demain";
  return `Dans ${days} jours`;
}

function statusClass(status: Status) {
  const classes: Record<Status, string> = {
    "Commande passée": "status-order",
    "En préparation": "status-prep",
    "En transit": "status-transit",
    "Dédouanement": "status-customs",
    "Livré": "status-delivered",
  };
  return classes[status];
}

function StepBar({ status }: { status: Status }) {
  const current = Math.max(0, statuses.indexOf(status));
  return (
    <div className="stepbar" aria-label={`Étape : ${status}`}>
      {statuses.map((step, index) => (
        <span key={step} className={`stepbar-dot ${index < current ? "stepbar-done" : ""} ${index === current ? "stepbar-current" : ""}`} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [cases, setCases] = useState<ImportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [activeView, setActiveView] = useState<MainView>("Vue d’ensemble");
  const [activeTab, setActiveTab] = useState<FilterTab>("Tous");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/imports", { cache: "no-store" });
      if (!response.ok) throw new Error("Le chargement des dossiers a échoué.");
      setCases((await response.json()) as ImportCase[]);
      setPageError("");
    } catch {
      setPageError("Impossible de récupérer les dossiers. Vérifiez votre connexion puis réessayez.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  const selectedCase = useMemo(() => cases.find((item) => item.id === selectedId) ?? null, [cases, selectedId]);
  const activeCases = useMemo(() => cases.filter((item) => item.status !== "Livré"), [cases]);
  const delayedCases = useMemo(() => cases.filter(isDelayed), [cases]);
  const incompleteCases = useMemo(() => cases.filter((item) => missingDocuments(item).length > 0), [cases]);
  const upcomingArrivals = useMemo(() => activeCases.filter((item) => isDueSoon(item)).length, [activeCases]);

  const visibleCases = useMemo(() => {
    let filtered = [...cases];
    const normalQuery = query.trim().toLocaleLowerCase("fr");
    if (normalQuery) {
      filtered = filtered.filter((item) =>
        [item.caseNumber, item.supplier, item.country, item.product, item.status]
          .some((value) => value.toLocaleLowerCase("fr").includes(normalQuery)),
      );
    }
    if (activeView === "Documents") filtered = filtered.filter((item) => missingDocuments(item).length > 0);
    if (activeView === "Échéances") filtered = filtered.filter((item) => isDelayed(item) || isDueSoon(item));
    if (activeTab === "En cours") filtered = filtered.filter((item) => item.status !== "Livré");
    if (activeTab === "À surveiller") filtered = filtered.filter((item) => isDelayed(item) || isDueSoon(item) || missingDocuments(item).length > 0);
    if (activeTab === "Terminés") filtered = filtered.filter((item) => item.status === "Livré");
    return filtered.sort((left, right) => {
      if (isDelayed(left) !== isDelayed(right)) return isDelayed(left) ? -1 : 1;
      if (!left.eta) return 1;
      if (!right.eta) return -1;
      return left.eta.localeCompare(right.eta);
    });
  }, [cases, query, activeTab, activeView]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const updateCase = async (id: number, patch: Partial<ImportCase>, successMessage?: string) => {
    setDetailSaving(true);
    try {
      const response = await fetch(`/api/imports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const result = (await response.json()) as ImportCase | { error?: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Mise à jour impossible.");
      }
      setCases((current) => current.map((item) => (item.id === id ? (result as ImportCase) : item)));
      if (successMessage) flash(successMessage);
      return true;
    } catch (error) {
      flash(error instanceof Error ? error.message : "Une erreur est survenue.");
      return false;
    } finally {
      setDetailSaving(false);
    }
  };

  const openNewCase = () => {
    setNewCaseNumber(`IMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`);
    setNewSupplierName(`Fournisseur ${cases.length + 1}`);
    setIsNewOpen(true);
  };

  const createCase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const [countryCode, country] = String(form.get("country") ?? "XX|Autre").split("|");
    const newItem = {
      caseNumber: String(form.get("caseNumber") ?? ""),
      supplier: String(form.get("supplier") ?? ""),
      country,
      countryCode,
      product: String(form.get("product") ?? ""),
      status: String(form.get("status") ?? "Commande passée"),
      transportMode: String(form.get("transportMode") ?? "Maritime"),
      incoterm: String(form.get("incoterm") ?? "FOB"),
      etd: String(form.get("etd") ?? "") || null,
      eta: String(form.get("eta") ?? "") || null,
      invoice: form.get("invoice") === "on",
      billOfLading: form.get("billOfLading") === "on",
      originCertificate: form.get("originCertificate") === "on",
      importPermit: form.get("importPermit") === "on",
      insurance: form.get("insurance") === "on",
      notes: String(form.get("notes") ?? ""),
    };

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      const result = (await response.json()) as ImportCase | { error?: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Impossible de créer ce dossier.");
      }
      setCases((current) => [result as ImportCase, ...current]);
      setActiveView("Dossiers");
      setActiveTab("Tous");
      setQuery("");
      setIsNewOpen(false);
      flash("Le nouveau dossier a bien été créé.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Impossible de créer ce dossier.");
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    if (!visibleCases.length) {
      flash("Aucun dossier à exporter.");
      return;
    }
    const header = ["N° de dossier", "Fournisseur", "Pays", "Marchandise", "Statut", "Transport", "ETD", "ETA", "Facture", "Connaissement", "Certificat d’origine", "Autorisation", "Assurance"];
    const rows = visibleCases.map((item) => [
      item.caseNumber,
      item.supplier,
      item.country,
      item.product,
      item.status,
      item.transportMode,
      item.etd ?? "",
      item.eta ?? "",
      item.invoice ? "Oui" : "Non",
      item.billOfLading ? "Oui" : "Non",
      item.originCertificate ? "Oui" : "Non",
      item.importPermit ? "Oui" : "Non",
      item.insurance ? "Oui" : "Non",
    ]);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `suivi-importations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    flash("Votre export CSV est prêt.");
  };

  const getCurrentTitle = () => {
    if (activeView === "Vue d’ensemble") return "Vos opérations, en un coup d’œil.";
    if (activeView === "Dossiers") return "Tous vos dossiers.";
    if (activeView === "Documents") return "Des dossiers complets, sans surprise.";
    return "Gardez une longueur d’avance.";
  };

  const getCurrentDescription = () => {
    if (activeView === "Vue d’ensemble") return "La vue claire et actualisée de votre chaîne d’approvisionnement.";
    if (activeView === "Dossiers") return "Retrouvez et gérez chaque expédition, de la commande à la réception.";
    if (activeView === "Documents") return "Repérez immédiatement les pièces et autorisations qu’il vous reste à obtenir.";
    return "Les prochaines arrivées et les retards à suivre de près.";
  };

  const notifications = [
    ...delayedCases.map((item) => ({ id: `late-${item.id}`, title: `${item.caseNumber} · arrivée en retard`, detail: `${item.supplier} — ${etaLabel(item)}`, caseId: item.id, tone: "warning" })),
    ...incompleteCases.filter((item) => !delayedCases.some((late) => late.id === item.id)).slice(0, 3).map((item) => ({ id: `doc-${item.id}`, title: `${item.caseNumber} · document manquant`, detail: `${item.supplier} — ${missingDocuments(item)[0]?.short}`, caseId: item.id, tone: "neutral" })),
  ];
  const nextArrival = [...cases].filter((item) => item.status !== "Livré" && item.eta && !isDelayed(item)).sort((a, b) => (a.eta ?? "").localeCompare(b.eta ?? ""))[0] ?? delayedCases[0];

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none"><path d="M3.3 12.4 12.4 3.3l9.3 9.3-9.3 9.1-9.1-9.3Z" stroke="currentColor" strokeWidth="1.6"/><path d="m8.3 12.5 4.1-4.1 4.2 4.2-4.2 4.1-4.1-4.2Z" fill="currentColor" opacity=".85"/><path d="M3.5 12.5h5m8 0h5" stroke="currentColor" strokeWidth="1.5"/></svg>
          </div>
          <div><span className="brand-name">transit<span>o</span></span><span className="brand-caption">IMPORT OPERATIONS</span></div>
          <button className="mobile-sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Fermer le menu"><Icon name="close" /></button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">M</div>
          <div className="workspace-copy"><span>Mon espace</span><strong>Maison Orbe</strong></div>
          <Icon name="chevron" size={15} />
        </div>

        <div className="nav-heading">ESPACE DE TRAVAIL</div>
        <nav className="side-nav" aria-label="Navigation principale">
          {mainViews.map(({ name, icon }) => (
            <button key={name} className={`nav-link ${activeView === name ? "nav-link-active" : ""}`} onClick={() => { setActiveView(name); setActiveTab("Tous"); setMobileNavOpen(false); }}>
              <Icon name={icon} size={18} /><span>{name}</span>
              {name === "Échéances" && delayedCases.length > 0 && <span className="nav-count">{delayedCases.length}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <div className="nav-heading">À SUIVRE</div>
        <div className="sidebar-followup">
          <div className="followup-icon"><Icon name="ship" size={17} /></div>
          <div className="followup-copy"><span>Prochaine arrivée</span><strong>{nextArrival ? formatDate(nextArrival.eta) : "Aucune prévue"}</strong><small>{nextArrival?.supplier ?? "Vos dossiers sont à jour"}</small></div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-help"><div className="help-sparkle">✳</div><strong>Un coup de main ?</strong><span>Retrouvez vos repères sur les formalités douanières.</span><button onClick={() => flash("Votre espace d’aide arrive bientôt.")}>Centre d’aide <Icon name="arrow" size={14} /></button></div>
          <div className="profile-row"><div className="profile-avatar">CL</div><div className="profile-copy"><strong>Claire Laurent</strong><span>Responsable achats</span></div><button className="icon-button profile-more" aria-label="Options du profil" onClick={() => flash("Connecté en tant que Claire Laurent.")}><Icon name="more" /></button></div>
        </div>
      </aside>

      <main className="main-area">
        <div className="topbar">
          <button className="mobile-menu-toggle" onClick={() => setMobileNavOpen(true)} aria-label="Ouvrir le menu"><span /><span /><span /></button>
          <div className="breadcrumb"><span>Maison Orbe</span><Icon name="chevron" size={13} /><strong>{activeView}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Icon name="search" size={17} /><input aria-label="Rechercher un dossier" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un dossier…" /><kbd>⌘ K</kbd></label>
            <div className="notification-wrap">
              <button className={`icon-button notification-button ${notificationOpen ? "icon-button-open" : ""}`} aria-label="Notifications" onClick={() => setNotificationOpen((open) => !open)}><Icon name="bell" size={19} />{notifications.length > 0 && <span className="notification-dot" />}</button>
              {notificationOpen && <div className="notification-popover"><div className="notification-popover-head"><div><strong>À surveiller</strong><span>{notifications.length} point{notifications.length === 1 ? "" : "s"} à vérifier</span></div><button onClick={() => setNotificationOpen(false)} aria-label="Fermer"><Icon name="close" size={16} /></button></div>{notifications.length === 0 ? <div className="notification-empty"><span>✓</span>Tout est en ordre pour le moment.</div> : notifications.map((item) => <button key={item.id} className="notification-item" onClick={() => { setSelectedId(item.caseId); setNotificationOpen(false); }}><span className={`notification-marker ${item.tone}`}><Icon name={item.tone === "warning" ? "alert" : "file"} size={15} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><Icon name="chevron" size={15} /></button>)}<button className="notification-footer" onClick={() => { setActiveView("Échéances"); setNotificationOpen(false); }}>Voir toutes les échéances <Icon name="arrow" size={14} /></button></div>}
            </div>
            <div className="topbar-avatar">CL</div>
          </div>
        </div>

        <div className="page-content">
          <div className="page-heading">
            <div className="heading-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> VOTRE TOUR DE CONTRÔLE IMPORT</div>
              <h1>{getCurrentTitle()}</h1>
              <p>{getCurrentDescription()}</p>
            </div>
            <div className="heading-actions"><button className="button button-secondary" onClick={exportCsv}><Icon name="download" size={16} /><span>Exporter</span></button><button className="button button-primary" onClick={openNewCase}><Icon name="plus" size={17} />Nouveau dossier</button></div>
          </div>

          {pageError && <div className="error-banner"><Icon name="alert" size={18} /><span>{pageError}</span><button onClick={() => void loadCases()}>Réessayer <Icon name="refresh" size={14} /></button></div>}

          <section className="metric-grid" aria-label="Indicateurs d’activité">
            <button className="metric-card" onClick={() => { setActiveView("Dossiers"); setActiveTab("En cours"); }}>
              <div className="metric-top"><span className="metric-icon metric-icon-green"><Icon name="box" size={18} /></span><span className="metric-context metric-context-green"><span className="context-dot" />Actifs</span></div>
              <div className="metric-number">{loading ? "—" : activeCases.length.toString().padStart(2, "0")}</div>
              <div className="metric-label">Dossiers en cours</div>
              <div className="metric-foot">À travers <strong>{cases.length} importations</strong> suivies</div>
            </button>
            <button className={`metric-card ${delayedCases.length ? "metric-card-alert" : ""}`} onClick={() => { setActiveView("Échéances"); setActiveTab("Tous"); }}>
              <div className="metric-top"><span className="metric-icon metric-icon-orange"><Icon name="clock" size={18} /></span><span className={`metric-context ${delayedCases.length ? "metric-context-orange" : "metric-context-green"}`}><span className="context-dot" />{delayedCases.length ? "À traiter" : "À jour"}</span></div>
              <div className="metric-number">{loading ? "—" : delayedCases.length.toString().padStart(2, "0")}</div>
              <div className="metric-label">Arrivées en retard</div>
              <div className="metric-foot">{delayedCases.length ? "Une action est peut-être nécessaire" : "Aucun retard d’acheminement"}</div>
            </button>
            <button className="metric-card" onClick={() => { setActiveView("Documents"); setActiveTab("Tous"); }}>
              <div className="metric-top"><span className="metric-icon metric-icon-blue"><Icon name="file" size={18} /></span><span className="metric-context metric-context-blue"><span className="context-dot" />Documents</span></div>
              <div className="metric-number">{loading ? "—" : incompleteCases.length.toString().padStart(2, "0")}</div>
              <div className="metric-label">Dossiers à compléter</div>
              <div className="metric-foot">Facture, connaissement ou origine</div>
            </button>
            <button className="metric-card" onClick={() => { setActiveView("Échéances"); setActiveTab("Tous"); }}>
              <div className="metric-top"><span className="metric-icon metric-icon-violet"><Icon name="calendar" size={18} /></span><span className="metric-context metric-context-violet">Prochainement</span></div>
              <div className="metric-number">{loading ? "—" : upcomingArrivals.toString().padStart(2, "0")}</div>
              <div className="metric-label">Arrivées sous 7 jours</div>
              <div className="metric-foot">{upcomingArrivals ? "Expéditions à réceptionner" : "Aucune arrivée imminente"}</div>
            </button>
          </section>

          {delayedCases.length > 0 && activeView === "Vue d’ensemble" && (
            <div className="alert-strip">
              <div className="alert-strip-icon"><Icon name="alert" size={18} /></div>
              <div className="alert-strip-copy"><strong>{delayedCases.length === 1 ? "Une expédition nécessite votre attention" : `${delayedCases.length} expéditions nécessitent votre attention`}</strong><span>{delayedCases.slice(0, 2).map((item) => `${item.supplier} · ${etaLabel(item)}`).join("  /  ")}</span></div>
              <button onClick={() => { setActiveView("Échéances"); setActiveTab("Tous"); }}>Voir les retards <Icon name="arrow" size={15} /></button>
            </div>
          )}

          <section className="tracking-panel">
            <div className="panel-header">
              <div className="panel-title-group"><div className="panel-title-row"><h2>{activeView === "Documents" ? "Documents à compléter" : activeView === "Échéances" ? "Arrivées à suivre" : activeView === "Dossiers" ? "Registre des importations" : "Vos importations"}</h2><span className="result-count">{loading ? "…" : visibleCases.length}</span></div><p>{activeView === "Documents" ? "Chaque pièce manquante identifiée, chaque formalité sous contrôle." : activeView === "Échéances" ? "Dates prévues, retards et prochaines échéances." : "Un suivi précis, du bon de commande jusqu’à la livraison."}</p></div>
              <div className="panel-header-actions"><span className="live-status"><span />Actualisé à l’instant</span><button className="refresh-button" onClick={() => void loadCases()} aria-label="Actualiser les données"><Icon name="refresh" size={16} /></button><button className="view-all-button" onClick={() => { setActiveView("Dossiers"); setActiveTab("Tous"); }}>Voir tout <Icon name="arrow" size={15} /></button></div>
            </div>

            <div className="table-toolbar">
              <div className="filter-tabs" role="tablist" aria-label="Filtrer les dossiers">
                {tabs.map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`filter-tab ${activeTab === tab ? "filter-tab-active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}{tab === "À surveiller" && delayedCases.length > 0 && <span className="filter-tab-count">{delayedCases.length}</span>}</button>)}
              </div>
              <div className="table-toolbar-right"><span className="sort-hint"><Icon name="calendar" size={14} /> Triées par arrivée prévue</span><button className="mobile-export" onClick={exportCsv}><Icon name="download" size={15} />Exporter</button></div>
            </div>

            <div className="table-scroller">
              <table className="case-table">
                <thead><tr><th>DOSSIER / MARCHANDISE</th><th>FOURNISSEUR · PAYS</th><th>ACHEMINEMENT</th><th>ARRIVÉE PRÉVUE</th><th>DOCUMENTS</th><th>STATUT</th><th><span className="visually-hidden">Ouvrir le dossier</span></th></tr></thead>
                <tbody>
                  {loading ? Array.from({ length: 4 }, (_, index) => <tr className="skeleton-row" key={index}><td colSpan={7}><div className="skeleton-line" style={{ width: `${74 - index * 8}%` }} /></td></tr>) : visibleCases.map((item) => {
                    const missing = missingDocuments(item);
                    const checkedDocs = documents.length - missing.length;
                    const delayed = isDelayed(item);
                    const dueSoon = isDueSoon(item);
                    return (
                      <tr className={`case-row ${delayed ? "case-row-delayed" : ""}`} key={item.id} onClick={() => setSelectedId(item.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedId(item.id); }}>
                        <td className="case-primary-cell"><div className="case-number-line"><span className="case-ref">{item.caseNumber}</span>{delayed && <span className="tiny-alert-dot" title="En retard" />}</div><span className="case-product">{item.product}</span></td>
                        <td><div className="supplier-cell"><span className="country-flag" aria-label={item.country}>{flagMap[item.countryCode] ?? "🌍"}</span><span className="supplier-info"><strong>{item.supplier}</strong><small>{item.country}</small></span></div></td>
                        <td><div className="route-cell"><span className="transport-icon"><Icon name={item.transportMode === "Aérien" ? "plane" : item.transportMode === "Routier" ? "truck" : "ship"} size={16} /></span><span><strong>{item.transportMode}</strong><small>{item.incoterm}</small></span></div></td>
                        <td><div className={`eta-cell ${delayed ? "eta-cell-late" : dueSoon ? "eta-cell-soon" : item.status === "Livré" ? "eta-cell-done" : ""}`}><strong>{formatDate(item.arrivedAt ?? item.eta, { day: "2-digit", month: "short", year: item.status === "Livré" ? undefined : undefined })}</strong><small>{etaLabel(item)}</small></div></td>
                        <td><div className="docs-progress-wrap"><div className="docs-progress-label"><span className={missing.length ? "docs-incomplete" : "docs-complete"}>{checkedDocs}/{documents.length}</span><small>{missing.length ? "à compléter" : "complet"}</small></div><div className="docs-progress-track"><span className={missing.length ? "docs-progress-partial" : "docs-progress-full"} style={{ width: `${(checkedDocs / documents.length) * 100}%` }} /></div></div></td>
                        <td><span className={`status-badge ${statusClass(item.status)}`}><span className="status-dot" />{item.status}</span></td>
                        <td><button className="row-open-button" tabIndex={-1} aria-label={`Ouvrir le dossier ${item.caseNumber}`}><Icon name="chevron" size={16} /></button></td>
                      </tr>
                    );
                  })}
                  {!loading && visibleCases.length === 0 && <tr><td colSpan={7}><div className="empty-state"><span className="empty-state-icon"><Icon name={activeView === "Documents" ? "check" : "box"} size={21} /></span><strong>{query ? "Aucun dossier trouvé" : activeView === "Documents" ? "Tout est en ordre" : activeView === "Échéances" ? "Aucune arrivée à signaler" : "Aucun dossier dans cette vue"}</strong><span>{query ? "Essayez un autre fournisseur, numéro ou pays." : activeView === "Documents" ? "Les dossiers actifs ont tous leurs pièces principales." : "Créez votre premier dossier d’importation pour commencer."}</span>{!query && <button className="button button-primary" onClick={activeView === "Documents" ? () => { setActiveView("Dossiers"); setActiveTab("Tous"); } : openNewCase}>{activeView === "Documents" ? "Voir les dossiers" : "Nouveau dossier"}<Icon name="arrow" size={15} /></button>}</div></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="panel-footer"><span>Affichage de <strong>{visibleCases.length}</strong> dossier{visibleCases.length === 1 ? "" : "s"}{activeView === "Documents" ? " avec des pièces à compléter" : ""}</span><span className="footer-secure"><Icon name="check" size={13} /> Données synchronisées</span></div>
          </section>

          {activeView === "Vue d’ensemble" && <div className="dashboard-footnote"><div className="footnote-icon"><Icon name="globe" size={18} /></div><div><strong>Chaque détail compte.</strong><span>Suivez vos fournisseurs, anticipez les formalités et gardez vos marchandises en mouvement.</span></div><span className="footnote-decoration">DE LA COMMANDE À L’ARRIVÉE <span>↗</span></span></div>}
        </div>
      </main>

      {selectedCase && <div className="detail-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-heading">
        <div className="drawer-topbar"><div className="drawer-kicker"><span className="drawer-kicker-dot" /> FICHE D’IMPORTATION</div><button className="icon-button drawer-close" aria-label="Fermer le dossier" onClick={() => setSelectedId(null)}><Icon name="close" /></button></div>
        <div className="drawer-scroll">
          <div className="drawer-intro"><span className="drawer-case-ref">{selectedCase.caseNumber}</span><span className={`status-badge ${statusClass(selectedCase.status)}`}><span className="status-dot" />{selectedCase.status}</span></div>
          <h2 id="detail-heading">{selectedCase.supplier}</h2><p className="drawer-product"><span>{flagMap[selectedCase.countryCode] ?? "🌍"}</span>{selectedCase.product}</p>
          <div className="drawer-country-line"><span><Icon name="globe" size={15} /> Origine</span><strong>{selectedCase.country}</strong><span className="drawer-country-separator" /><span><Icon name={selectedCase.transportMode === "Aérien" ? "plane" : selectedCase.transportMode === "Routier" ? "truck" : "ship"} size={15} />{selectedCase.transportMode}</span><strong>{selectedCase.incoterm}</strong></div>

          <section className="drawer-section"><div className="drawer-section-heading"><div><span className="section-overline">SUIVI DE L’EXPÉDITION</span><h3>De la commande à l’arrivée</h3></div><span className="progress-caption">{selectedCase.status === "Livré" ? "Terminé" : `${Math.round(((statuses.indexOf(selectedCase.status) + 1) / statuses.length) * 100)} %`}</span></div>
            <div className="milestone-list">{statuses.map((step, index) => { const activeStep = statuses.indexOf(selectedCase.status); const complete = index < activeStep || selectedCase.status === "Livré"; const current = index === activeStep; const icon = index === 0 ? "file" : index === 1 ? "box" : index === 2 ? "ship" : index === 3 ? "documents" : "check"; return <div className={`milestone ${complete ? "milestone-complete" : current ? "milestone-current" : ""}`} key={step}><div className="milestone-rail"><span className="milestone-icon"><Icon name={complete ? "check" : icon} size={15} /></span>{index < statuses.length - 1 && <span className="milestone-line" />}</div><div className="milestone-copy"><strong>{step}</strong><small>{current ? "Étape actuelle" : complete ? "Étape validée" : "À venir"}</small></div>{current && <span className="milestone-live">EN COURS</span>}</div>; })}</div>
            <label className="detail-field-label" htmlFor="status-select">Modifier l’étape du dossier</label><select id="status-select" className="form-input drawer-status-select" value={selectedCase.status} disabled={detailSaving} onChange={(event) => { void updateCase(selectedCase.id, { status: event.target.value as Status }, "Le statut a été mis à jour."); }}><option value="Commande passée">Commande passée</option><option value="En préparation">En préparation</option><option value="En transit">En transit</option><option value="Dédouanement">Dédouanement</option><option value="Livré">Livré</option></select>
          </section>

          <section className="drawer-section"><div className="drawer-section-heading"><div><span className="section-overline">CALENDRIER LOGISTIQUE</span><h3>Dates de transport</h3></div></div><div className="date-fields-grid"><label className="form-field"><span>Départ estimé · ETD</span><input className="form-input" type="date" value={selectedCase.etd ?? ""} disabled={detailSaving} onChange={(event) => { void updateCase(selectedCase.id, { etd: event.target.value || null }); }} /></label><label className="form-field"><span>Arrivée estimée · ETA</span><input className="form-input" type="date" value={selectedCase.eta ?? ""} disabled={detailSaving} onChange={(event) => { void updateCase(selectedCase.id, { eta: event.target.value || null }, "La date d’arrivée a été actualisée."); }} /></label></div>
            <div className={`eta-detail-note ${isDelayed(selectedCase) ? "eta-detail-late" : isDueSoon(selectedCase) ? "eta-detail-soon" : ""}`}><span className="eta-detail-icon"><Icon name={isDelayed(selectedCase) ? "alert" : "calendar"} size={16} /></span><span><strong>{etaLabel(selectedCase)}</strong><small>{selectedCase.status === "Livré" ? "Réception confirmée" : `Date prévue : ${formatDate(selectedCase.eta, { day: "numeric", month: "long", year: "numeric" })}`}</small></span></div>
          </section>

          <section className="drawer-section"><div className="drawer-section-heading"><div><span className="section-overline">CONTRÔLE DES PIÈCES</span><h3>Documents & formalités</h3></div><span className={`doc-drawer-count ${documents.every((document) => selectedCase[document.key]) ? "doc-drawer-count-ok" : ""}`}>{documents.filter((document) => selectedCase[document.key]).length}/{documents.length}</span></div>
            <div className="document-checklist">{documents.map((document) => <label className="checklist-row" key={document.key}><span className={`checklist-icon ${selectedCase[document.key] ? "checklist-yes" : "checklist-missing"}`}><Icon name={selectedCase[document.key] ? "check" : "file"} size={15} /></span><span className="checklist-copy"><strong>{document.name}</strong><small>{document.description}</small></span><span className={`checklist-state ${selectedCase[document.key] ? "checklist-state-yes" : "checklist-state-no"}`}>{selectedCase[document.key] ? "Reçu" : "Manquant"}</span><input type="checkbox" checked={selectedCase[document.key]} disabled={detailSaving} onChange={(event) => { void updateCase(selectedCase.id, { [document.key]: event.target.checked }, event.target.checked ? `${document.name} ajouté.` : `${document.name} signalé comme manquant.`); }} aria-label={`${document.name} reçu`} /></label>)}</div>
            <div className="clearance-heading">Autorisations & couvertures</div><div className="clearance-checklist">{clearances.map((item) => <label className="clearance-item" key={item.key}><span className={`checklist-icon ${selectedCase[item.key] ? "checklist-yes" : "checklist-missing"}`}><Icon name={selectedCase[item.key] ? "check" : "clock"} size={14} /></span><span>{item.name}</span><input type="checkbox" checked={selectedCase[item.key]} disabled={detailSaving} onChange={(event) => { void updateCase(selectedCase.id, { [item.key]: event.target.checked }, `${item.name} mis à jour.`); }} aria-label={`${item.name} obtenue`} /></label>)}</div>
          </section>

          <section className="drawer-section"><label className="form-field notes-field"><span>Notes internes</span><textarea className="form-input notes-input" defaultValue={selectedCase.notes} placeholder="Ajouter une note de suivi…" onBlur={(event) => { if (event.target.value !== selectedCase.notes) void updateCase(selectedCase.id, { notes: event.target.value }, "La note a été enregistrée."); }} /></label></section>
        </div>
        <div className="drawer-bottom"><span><span className="drawer-sync-dot" /> Modifications synchronisées</span><button className="button button-primary" onClick={() => setSelectedId(null)}>Terminé <Icon name="check" size={16} /></button></div>
      </aside></div>}

      {isNewOpen && <div className="modal-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget && !saving) setIsNewOpen(false); }}><section className="new-case-modal" role="dialog" aria-modal="true" aria-labelledby="new-case-heading"><form onSubmit={createCase}>
        <div className="modal-header"><div><span className="section-overline">ESPACE IMPORT · NOUVELLE ENTRÉE</span><h2 id="new-case-heading">Ouvrir un dossier</h2><p>Centralisez les informations de votre prochaine importation.</p></div><button className="icon-button modal-close" type="button" onClick={() => setIsNewOpen(false)} aria-label="Fermer"><Icon name="close" /></button></div>
        <div className="modal-body"><div className="form-grid"><label className="form-field"><span>N° de dossier <i>*</i></span><input className="form-input" name="caseNumber" required value={newCaseNumber} onChange={(event) => setNewCaseNumber(event.target.value)} /></label><label className="form-field"><span>Fournisseur <i>*</i></span><input className="form-input" name="supplier" required value={newSupplierName} onChange={(event) => setNewSupplierName(event.target.value)} placeholder="Fournisseur 1" /></label><label className="form-field"><span>Pays d’origine <i>*</i></span><select name="country" className="form-input" defaultValue="CN|Chine">{countries.map(([country, code]) => <option key={code} value={`${code}|${country}`}>{flagMap[code] ?? "🌍"} &nbsp;{country}</option>)}</select></label><label className="form-field"><span>Marchandise <i>*</i></span><input className="form-input" name="product" required placeholder="Description des marchandises" /></label><label className="form-field"><span>Mode de transport</span><select className="form-input" name="transportMode" defaultValue="Maritime"><option>Maritime</option><option>Aérien</option><option>Routier</option><option>Ferroviaire</option></select></label><label className="form-field"><span>Incoterm</span><select className="form-input" name="incoterm" defaultValue="FOB"><option>FOB</option><option>CIF</option><option>FCA</option><option>DAP</option><option>DDP</option><option>CIP</option><option>EXW</option><option>CFR</option></select></label><label className="form-field"><span>Départ prévu · ETD</span><input className="form-input" type="date" name="etd" /></label><label className="form-field"><span>Arrivée prévue · ETA</span><input className="form-input" type="date" name="eta" /></label><label className="form-field"><span>Étape actuelle</span><select className="form-input" name="status" defaultValue="Commande passée">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div>
          <div className="modal-document-heading"><div><strong>Documents déjà disponibles</strong><span>Vous pourrez les actualiser à tout moment.</span></div><Icon name="documents" size={18} /></div>
          <div className="modal-document-grid">{[...documents.map(({ key, short }) => ({ key, short })), ...clearances.map(({ key, short }) => ({ key, short }))].map((document) => <label className="modal-checkbox" key={document.key}><input type="checkbox" name={document.key} /><span className="modal-checkbox-visual"><Icon name="check" size={12} /></span><span>{document.short}</span></label>)}</div>
          <label className="form-field modal-notes"><span>Note de suivi <small>· facultatif</small></span><textarea className="form-input notes-input" name="notes" placeholder="Une information utile pour votre équipe…" /></label>
        </div>
        <div className="modal-footer"><span><span className="required-marker">*</span> Champs obligatoires</span><div><button className="button button-secondary" type="button" disabled={saving} onClick={() => setIsNewOpen(false)}>Annuler</button><button className="button button-primary" type="submit" disabled={saving}><Icon name="plus" size={16} />{saving ? "Création en cours…" : "Créer le dossier"}</button></div></div>
      </form></section></div>}

      {toast && <div className="toast-message" role="status"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}<button onClick={() => setToast("")} aria-label="Fermer"><Icon name="close" size={14} /></button></div>}
    </div>
  );
}
