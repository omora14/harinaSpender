import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  return body as Record<string, unknown>;
}

function getField(
  record: Record<string, unknown>,
  ...keys: string[]
): unknown {
  const lowerMap = new Map(
    Object.entries(record).map(([k, v]) => [k.toLowerCase(), v])
  );
  for (const key of keys) {
    if (key in record) return record[key];
    const lower = key.toLowerCase();
    if (lowerMap.has(lower)) return lowerMap.get(lower);
  }
  return undefined;
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    // Strip currency symbols / spaces / thousand separators: "$58.90", "58,90"
    const cleaned = value
      .trim()
      .replace(/[^0-9.,-]/g, "")
      .replace(/,/g, (match, offset, full) =>
        // If comma is decimal separator (e.g. 58,9) keep as dot; if thousands, drop
        full.includes(".") ? "" : match === "," ? "." : ""
      );

    return Number(cleaned);
  }

  return NaN;
}

function validateBody(body: unknown): {
  amount: number;
  category: string;
  note: string | null;
} | { error: string; debug?: Record<string, unknown> } {
  // Shortcuts sometimes double-encodes JSON as a string.
  let parsed: unknown = body;
  if (typeof body === "string") {
    try {
      parsed = JSON.parse(body);
    } catch {
      return { error: "Request body must be a JSON object" };
    }
  }

  const rawRecord = asRecord(parsed);
  if (!rawRecord) {
    return {
      error: "Request body must be a JSON object",
      debug: { receivedType: typeof body },
    };
  }

  // Shortcuts sometimes adds trailing spaces to JSON keys ("category ").
  const record: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawRecord)) {
    record[key.trim()] = value;
  }

  const amountRaw = getField(record, "amount", "Amount", "value", "Value");
  const categoryRaw = getField(record, "category", "Category");
  const noteRaw = getField(record, "note", "Note", "notes", "Notes");

  const parsedAmount = parseAmount(amountRaw);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return {
      error: "amount must be a finite number greater than 0",
      debug: {
        amountType: amountRaw === null ? "null" : typeof amountRaw,
        amountValue: amountRaw,
        keysReceived: Object.keys(record),
      },
    };
  }

  if (typeof categoryRaw !== "string" || categoryRaw.trim().length === 0) {
    return {
      error: "category must be a non-empty string",
      debug: {
        categoryType: categoryRaw === null ? "null" : typeof categoryRaw,
        categoryValue: categoryRaw,
        keysReceived: Object.keys(record),
      },
    };
  }

  if (categoryRaw.trim().length > 100) {
    return { error: "category must be 100 characters or fewer" };
  }

  if (
    noteRaw !== undefined &&
    noteRaw !== null &&
    typeof noteRaw !== "string"
  ) {
    return { error: "note must be a string or null" };
  }

  if (typeof noteRaw === "string" && noteRaw.length > 500) {
    return { error: "note must be 500 characters or fewer" };
  }

  return {
    amount: Math.round(parsedAmount * 100) / 100,
    category: categoryRaw.trim(),
    note:
      typeof noteRaw === "string" && noteRaw.trim().length > 0
        ? noteRaw.trim()
        : null,
  };
}

async function readBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    const obj: Record<string, unknown> = {};
    form.forEach((value, key) => {
      obj[key] = typeof value === "string" ? value : value.name;
    });
    return obj;
  }

  // Fallback: try JSON text, then form.
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.EXPENSE_API_KEY;
  const ingestUserId = process.env.INGEST_USER_ID;

  if (!apiKey || !ingestUserId) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const providedKey = request.headers.get("x-api-key");
  if (!providedKey || !safeEqual(providedKey, apiKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await readBody(request);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  console.log("[/api/expenses] body:", JSON.stringify(json));

  const validated = validateBody(json);
  if ("error" in validated) {
    return NextResponse.json(
      { error: validated.error, debug: validated.debug },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("transactions")
      .insert({
        user_id: ingestUserId,
        amount: validated.amount,
        category: validated.category,
        note: validated.note,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Expense insert failed:", error?.message);
      return NextResponse.json(
        { error: "Failed to insert expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Expense insert error:", err);
    return NextResponse.json(
      { error: "Failed to insert expense" },
      { status: 500 }
    );
  }
}
