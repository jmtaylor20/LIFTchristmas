// Netlify scheduled function: every day at 8am Central, send deadline reminders.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/reminders`, {
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  console.log("reminders", res.status, await res.text());
};

export const config = { schedule: "0 14 * * *" };
