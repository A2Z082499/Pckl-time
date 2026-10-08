import { slots, json, validDate, price, manilaNow, addDays, OPEN, CLOSE, MAXD } from "../lib/common.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let b; try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }

  const name = String(b.name || "").trim().slice(0, 60);
  const phone = String(b.phone || "").trim();
  const date = String(b.date || "");
  const hours = Array.isArray(b.hours) ? [...new Set(b.hours.map(Number))].sort((x, y) => x - y) : [];
  const { today, hour: nowH } = manilaNow();

  if (name.length < 2) return json({ error: "Please enter your name." }, 400);
  if (!/^[\d+\-\s()]{7,20}$/.test(phone)) return json({ error: "Please enter a valid phone number." }, 400);
  if (!validDate(date) || date < today || date > addDays(today, MAXD)) return json({ error: "Pick a date within the next 30 days." }, 400);
  if (!hours.length || hours.length > 6) return json({ error: "Choose 1 to 6 hours." }, 400);
  if (hours.some((h) => !Number.isInteger(h) || h < OPEN || h >= CLOSE || (date === today && h < nowH)))
    return json({ error: "One of those hours is closed or has passed." }, 400);

  const store = slots(), made = [];
  const ref = crypto.randomUUID().slice(0, 8).toUpperCase();
  for (const h of hours) {
    const key = `${date}/${h}`;
    // onlyIfNew makes the write atomic: if two people race for an hour, exactly one wins.
    const r = await store.setJSON(key, { status: "booked", name, phone, ref, at: new Date().toISOString() }, { onlyIfNew: true });
    if (!r?.modified) {
      await Promise.all(made.map((k) => store.delete(k))); // undo any hours we already took
      return json({ error: "Sorry, one of those hours was just booked. Please pick again." }, 409);
    }
    made.push(key);
  }
  return json({ ref, total: hours.reduce((s, h) => s + price(h), 0) });
};
export const config = { path: "/api/book" };
