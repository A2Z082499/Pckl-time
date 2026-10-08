import { slots, json, validDate, manilaNow, OPEN, CLOSE } from "../lib/common.mjs";

export default async (req) => {
  const key = process.env.ADMIN_PASSWORD;
  if (!key || req.headers.get("x-admin-key") !== key) return json({ error: "Wrong password" }, 401);
  const store = slots();

  if (req.method === "GET") {
    const { today } = manilaNow();
    const { blobs } = await store.list();
    const rows = await Promise.all(blobs.filter((b) => b.key.split("/")[0] >= today).map(async (b) => {
      const [date, hour] = b.key.split("/");
      return { date, hour: +hour, ...(await store.get(b.key, { type: "json" })) };
    }));
    return json(rows.sort((a, c) => a.date.localeCompare(c.date) || a.hour - c.hour));
  }

  const { action, date, hour } = await req.json().catch(() => ({}));
  if (!validDate(date || "") || !(hour >= OPEN && hour < CLOSE)) return json({ error: "Invalid slot" }, 400);
  const k = `${date}/${hour}`;
  if (action === "cancel") { await store.delete(k); return json({ ok: true }); }
  if (action === "block") {
    const r = await store.setJSON(k, { status: "blocked", name: "Blocked", phone: "", ref: "-", at: new Date().toISOString() }, { onlyIfNew: true });
    return r?.modified ? json({ ok: true }) : json({ error: "That hour is already booked" }, 409);
  }
  return json({ error: "Unknown action" }, 400);
};
export const config = { path: "/api/admin" };
