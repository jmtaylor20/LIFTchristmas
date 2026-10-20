// Netlify scheduled function: hourly December 27–31, email each giver a
// "thank you for Community Christmas" note (in small batches until all are sent).
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/season-thanks`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log("season thanks", res.status, await res.text());
};

export const config = { schedule: "15 * 27-31 12 *" };
