import { PageHero } from "@/components/ui";
import { verifyLogin } from "../actions";

export const metadata = { title: "Sign in", robots: { index: false } };

// A button (not an automatic sign-in) so email link scanners can't use up the link.
export default async function Verify({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <PageHero eyebrow="My giving" title="Welcome back" />
      <section className="container-page mt-10 max-w-md">
        <form action={verifyLogin} className="card space-y-4 text-center">
          <input type="hidden" name="token" value={token ?? ""} />
          <p>Press the button to open your giver profile.</p>
          <button className="btn-green">Open my giver profile</button>
        </form>
      </section>
    </>
  );
}
