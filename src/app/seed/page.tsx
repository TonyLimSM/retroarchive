import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { seedDemoData } from "./actions";

export default async function SeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Seed demo data</h1>
      <p className="mt-2 text-sm text-stone-600">
        Inserts the 29 famous-rare-CIB cartridges from the demo into your
        account so you have something to look at while you set up your real
        collection. You can delete them anytime, or import a CSV instead.
      </p>
      <form action={seedDemoData} className="mt-6">
        <button
          type="submit"
          className="w-full rounded bg-stone-900 px-4 py-2 text-sm font-medium text-white"
        >
          Seed my account
        </button>
      </form>
    </div>
  );
}
