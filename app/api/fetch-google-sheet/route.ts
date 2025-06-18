
import { supabase } from "@/utils/supabase/client";

export async function GET() {
  try {
    console.log("📥 [API] Fetch-google-sheet route triggered");

    const res = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vR7_WrlnMA8rEukryhC3Ydv0_7L6N_DwVv9DYSpX1XD3ItSEz-eG6PpuY0Ptnl8AJZPYYS7N5I8iul6/pub?output=csv');
    const text = await res.text();

    const lines = text.split("\n").filter((line) => line.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim());
    const rows = lines.slice(1);

    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000); // ⏱ 1 minute ago

    const parsedData = rows
      .map((line) => {
        const cells = line.split(",");
        const rowObj: Record<string, string> = {};
        headers.forEach((h, i) => {
          rowObj[h] = cells[i]?.trim() || "";
        });

        // Parse timestamp
        let createdAtISO = "";
        try {
          const [day, month, yearTime] = rowObj["Timestamp"]?.split("-") || [];
          const [year, time] = yearTime?.split(" ") || [];
          createdAtISO = new Date(`${year}-${month}-${day}T${time}:00`).toISOString();
        } catch (_) {
          return null; // Skip invalid date rows
        }

        const createdAt = new Date(createdAtISO);
        if (createdAt < oneMinuteAgo) return null; // ❌ Not in last 1 minute

        return {
          name: rowObj["Full name"] || "",
          phone: rowObj["Phone Number (Country Code)"] || "",
          email: rowObj["Email"] || "",
          city: rowObj["city"] || "",
          source: rowObj["source"] || "Google Forms",
          status: "New",
          assigned_to: "",
          created_at: createdAtISO,
        };
      })
      .filter((row) => row !== null); // Remove skipped rows

    if (!parsedData.length) {
      return new Response(JSON.stringify({ message: "No new rows to insert." }), { status: 200 });
    }

    const { error } = await supabase.from("leads").insert(parsedData);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ message: "✅ New leads inserted", count: parsedData.length }), {
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), { status: 500 });
  }
}

