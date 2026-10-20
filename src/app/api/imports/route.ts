import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { importCases } from "@/db/schema";

export const dynamic = "force-dynamic";

function dayOffset(offset: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

const starterCases = [
  {
    caseNumber: "IMP-2026-041",
    supplier: "Fournisseur 1",
    country: "Chine",
    countryCode: "CN",
    product: "Modules électroniques · série X4",
    status: "En transit",
    transportMode: "Maritime",
    incoterm: "FOB",
    etd: dayOffset(-18),
    eta: dayOffset(-2),
    invoice: true,
    billOfLading: true,
    originCertificate: false,
    importPermit: true,
    insurance: true,
    notes: "Le certificat d’origine est attendu du fournisseur. Relance envoyée mardi.",
  },
  {
    caseNumber: "IMP-2026-039",
    supplier: "Fournisseur 2",
    country: "Vietnam",
    countryCode: "VN",
    product: "Éclairage LED professionnel",
    status: "Dédouanement",
    transportMode: "Maritime",
    incoterm: "CIF",
    etd: dayOffset(-28),
    eta: dayOffset(2),
    invoice: true,
    billOfLading: true,
    originCertificate: true,
    importPermit: false,
    insurance: true,
    notes: "Dossier transmis au transitaire. Autorisation de mise sur le marché à confirmer.",
  },
  {
    caseNumber: "IMP-2026-044",
    supplier: "Fournisseur 3",
    country: "Turquie",
    countryCode: "TR",
    product: "Tissus techniques · coton bio",
    status: "En préparation",
    transportMode: "Routier",
    incoterm: "FCA",
    etd: dayOffset(4),
    eta: dayOffset(12),
    invoice: true,
    billOfLading: false,
    originCertificate: true,
    importPermit: true,
    insurance: false,
    notes: "En attente de la confirmation de prise en charge et de l’attestation d’assurance.",
  },
  {
    caseNumber: "IMP-2026-037",
    supplier: "Fournisseur 4",
    country: "Maroc",
    countryCode: "MA",
    product: "Zelliges artisanaux · collection Ocre",
    status: "En transit",
    transportMode: "Routier",
    incoterm: "DAP",
    etd: dayOffset(-6),
    eta: dayOffset(1),
    invoice: true,
    billOfLading: true,
    originCertificate: true,
    importPermit: true,
    insurance: false,
    notes: "Arrivée prévue au dépôt de Lyon. Certificat d’assurance à classer.",
  },
  {
    caseNumber: "IMP-2026-031",
    supplier: "Fournisseur 5",
    country: "Japon",
    countryCode: "JP",
    product: "Composants de précision CNC",
    status: "Livré",
    transportMode: "Aérien",
    incoterm: "CIP",
    etd: dayOffset(-33),
    eta: dayOffset(-19),
    arrivedAt: dayOffset(-18),
    invoice: true,
    billOfLading: true,
    originCertificate: true,
    importPermit: true,
    insurance: true,
    notes: "Réception validée et dossier archivé.",
  },
  {
    caseNumber: "IMP-2026-046",
    supplier: "Fournisseur 6",
    country: "Brésil",
    countryCode: "BR",
    product: "Café arabica en grains · 18 t",
    status: "Commande passée",
    transportMode: "Maritime",
    incoterm: "FOB",
    etd: dayOffset(7),
    eta: dayOffset(35),
    invoice: true,
    billOfLading: false,
    originCertificate: true,
    importPermit: false,
    insurance: true,
    notes: "Date de mise à bord à confirmer par le fournisseur.",
  },
];

export async function GET() {
  try {
    const [existing] = await db.select({ value: count() }).from(importCases);
    if (Number(existing?.value ?? 0) === 0) {
      await db.insert(importCases).values(starterCases);
    }
    const cases = await db.select().from(importCases).orderBy(asc(importCases.eta));
    return Response.json(cases);
  } catch (error) {
    console.error("Unable to load import cases:", error);
    return Response.json({ error: "Impossible de charger les dossiers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const requiredFields = ["supplier", "country", "product"] as const;
    if (requiredFields.some((field) => typeof body[field] !== "string" || !body[field]?.toString().trim())) {
      return Response.json({ error: "Le fournisseur, le pays et la marchandise sont obligatoires." }, { status: 400 });
    }

    const requestedCaseNumber = typeof body.caseNumber === "string" ? body.caseNumber.trim() : "";
    const caseNumber = requestedCaseNumber || `IMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    const asDate = (value: unknown) =>
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;

    const [created] = await db
      .insert(importCases)
      .values({
        caseNumber,
        supplier: String(body.supplier).trim(),
        country: String(body.country).trim(),
        countryCode: typeof body.countryCode === "string" ? body.countryCode.slice(0, 3).toUpperCase() : "XX",
        product: String(body.product).trim(),
        status: typeof body.status === "string" ? body.status : "Commande passée",
        transportMode: typeof body.transportMode === "string" ? body.transportMode : "Maritime",
        incoterm: typeof body.incoterm === "string" ? body.incoterm : "FOB",
        etd: asDate(body.etd),
        eta: asDate(body.eta),
        invoice: body.invoice === true,
        billOfLading: body.billOfLading === true,
        originCertificate: body.originCertificate === true,
        importPermit: body.importPermit === true,
        insurance: body.insurance === true,
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
      })
      .returning();

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error("Unable to create import case:", error);
    return Response.json({ error: "Le dossier n’a pas pu être créé. Vérifiez son numéro." }, { status: 500 });
  }
}
