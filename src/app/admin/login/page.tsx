import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { Star } from "@/components/SiteChrome";
import { adminLogin } from "../actions";

export const metadata = { title: "Ministry login", robots: { index: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-dusk-600 to-dusk-500 px-4">
      <form action={adminLogin} className="card w-full max-w-sm space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-gold-500" />
          <h1 className="text-xl font-bold">LIFT Ministry Admin</h1>
        </div>
        {error && <p className="rounded-lg bg-copper-50 px-3 py-2 text-sm text-copper-800">Incorrect password.</p>}
        <label className="block">
          <span className="label">Password</span>
          <input name="password" type="password" required autoFocus className="input" />
        </label>
        <button className="btn-green w-full">Sign in</button>
      </form>
    </main>
  );
}
