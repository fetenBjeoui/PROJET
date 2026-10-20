import { eq } from "drizzle-orm";
import { db } from "@/db";
import { importCases } from "@/db/schema";

export const dynamic = "force-dynamic";

const allowedStatuses = [
  "Commande passée",
  "En préparation",
  "En transit",
  "Dédouanement",
  "Livré",
];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseId = Number.parseInt(id, 10);
  if (!Number.isInteger(caseId) || caseId < 1) {
    return Response.json({ error: "Identifiant de dossier invalide." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const updates: Partial<typeof importCases.$inferInsert> = { updatedAt: new Date() };

    if ("status" in body) {
      if (typeof body.status !== "string" || !allowedStatuses.includes(body.status)) {
        return Response.json({ error: "État de dossier non reconnu." }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === "Livré" && !("arrivedAt" in body)) {
        updates.arrivedAt = new Date().toISOString().slice(0, 10);
      }
    }

    const textFields = ["supplier", "country", "countryCode", "product", "transportMode", "incoterm", "notes"] as const;
    for (const field of textFields) {
      if (typeof body[field] === "string") {
        Object.assign(updates, { [field]: field === "notes" ? body[field] : body[field].toString().trim() });
      }
    }

    const booleanFields = ["invoice", "billOfLading", "originCertificate", "importPermit", "insurance"] as const;
    for (const field of booleanFields) {
      if (typeof body[field] === "boolean") Object.assign(updates, { [field]: body[field] });
    }

    for (const field of ["etd", "eta", "arrivedAt"] as const) {
      if (field in body) {
        const value = body[field];
        if (value === null || value === "") {
          updates[field] = null;
        } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          updates[field] = value;
        } else {
          return Response.json({ error: "Format de date invalide." }, { status: 400 });
        }
      }
    }

    if (Object.keys(updates).length === 1) {
      return Response.json({ error: "Aucune modification valide fournie." }, { status: 400 });
    }

    const [updated] = await db
      .update(importCases)
      .set(updates)
      .where(eq(importCases.id, caseId))
      .returning();

    if (!updated) return Response.json({ error: "Dossier introuvable." }, { status: 404 });
    return Response.json(updated);
  } catch (error) {
    console.error("Unable to update import case:", error);
    return Response.json({ error: "Le dossier n’a pas pu être mis à jour." }, { status: 500 });
  }
}
