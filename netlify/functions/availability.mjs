import { slots, json, validDate } from "../lib/common.mjs";
// Public: returns only which hours are taken, never customer details.
export default async (req) => {
  const date = new URL(req.url).searchParams.get("date") || "";
  if (!validDate(date)) return json({ error: "Invalid date" }, 400);
  const { blobs } = await slots().list({ prefix: date + "/" });
  return json({ hours: blobs.map((b) => +b.key.split("/")[1]) });
};
export const config = { path: "/api/availability" };
