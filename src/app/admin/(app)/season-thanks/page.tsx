import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { layout } from "@/lib/email";
import { seasonGivers, seasonImpact, seasonThanksHtml, seasonThanksStartDate } from "@/lib/thanks";
import { AdminTitle } from "@/components/admin";
import { Notice } from "@/components/ui";
import { sendSeasonThanksNow } from "../../actions";

export const metadata = { title: "Christmas thank-you email" };

export default async function SeasonThanks({ searchParams }: { searchParams: Promise<{ sent?: string; remaining?: string }> }) {
  const sp = await searchParams;
  const season = (await getAdminSeason())!;
  const [givers, impact, sentCount] = await Promise.all([
    seasonGivers(season.id),
    seasonImpact(season.id),
    db.emailLog.count({ where: { kind: "SEASON_THANKS", refId: { startsWith: `${season.id}:` } } }),
  ]);
  const remaining = Math.max(0, givers.length - sentCount);

  return (
    <>
      <AdminTitle title="Christmas thank-you email" />
      <div className="mb-4 space-y-3">
        <Notice>
          Every giver whose gift you&rsquo;ve confirmed this season gets this thank-you <strong>automatically starting {seasonThanksStartDate(season.year)}</strong>,
          once each. The numbers come from your records as they stand when it&rsquo;s sent. Other thank-yous go out on their own as you
          work: when a sponsor&rsquo;s gifts are all received, when an Amazon or drop-off gift is marked received, and when a business
          partner&rsquo;s logo goes live.
        </Notice>
        {sp.sent && (
          <Notice tone={Number(sp.remaining) > 0 ? "warn" : "success"}>
            Sent {sp.sent}. {Number(sp.remaining) > 0 && <strong>{sp.remaining} still to send. Press the button again for the next batch.</strong>}
          </Notice>
        )}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="card h-fit space-y-3">
          <p className="text-sm">
            <strong className="font-display text-3xl text-dusk-700">{givers.length}</strong> givers this season · {sentCount} already thanked ·{" "}
            {remaining} to go
          </p>
          <ul className="text-sm text-black/65">
            <li>{impact.children} children in {impact.families} families</li>
            <li>{impact.giftsGiven} gifts given</li>
          </ul>
          <form action={sendSeasonThanksNow}>
            <button className="btn-primary" disabled={remaining === 0}>Send now instead of waiting</button>
          </form>
        </div>
        <div className="card p-0">
          <p className="border-b border-dusk-100 px-5 py-3 text-sm font-semibold text-black/60">Preview</p>
          <iframe
            title="Email preview"
            className="h-[640px] w-full rounded-b-2xl"
            sandbox=""
            srcDoc={layout(seasonThanksHtml("Friend", season.year, impact))}
          />
        </div>
      </div>
    </>
  );
}
