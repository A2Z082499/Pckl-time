import { getStore } from "@netlify/blobs";
export const OPEN = 6, CLOSE = 22, MAXD = 30;
// One blob per booked hour, keyed "YYYY-MM-DD/HH". Strong consistency so reads see fresh writes.
export const slots = () => getStore({ name: "slots", consistency: "strong" });
export const price = (h) => (h >= 16 ? 230 : 180);
export const json = (d, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export const validDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + "T00:00:00Z"));
export const addDays = (d, n) => { const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export function manilaNow() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit" })
    .formatToParts(new Date()).reduce((o, x) => ((o[x.type] = x.value), o), {});
  return { today: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
}
