// Netlify scheduled function: hourly on January 15–17, email last year's giving
// statements in small batches until everyone has one.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/giving-statements`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log("giving statements", res.status, await res.text());
};

export const config = { schedule: "0 * 15-17 1 *" };
