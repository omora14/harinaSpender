import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, category, note, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }

  const header = ["id", "created_at", "category", "amount", "note", "type"];
  const lines = [header.join(",")];

  for (const row of data ?? []) {
    const type =
      String(row.category).trim().toLowerCase() === "income"
        ? "income"
        : "expense";
    lines.push(
      [
        csvEscape(String(row.id)),
        csvEscape(String(row.created_at)),
        csvEscape(String(row.category)),
        csvEscape(String(row.amount)),
        csvEscape(row.note == null ? "" : String(row.note)),
        type,
      ].join(",")
    );
  }

  const body = lines.join("\n");
  const filename = `harina-spender-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
