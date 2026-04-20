"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { importGamesCsv, type ImportResult } from "./actions";

const initialState: ImportResult | null = null;

async function action(
  _prev: ImportResult | null,
  formData: FormData,
): Promise<ImportResult | null> {
  return importGamesCsv(formData);
}

export default function ImportPage() {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Bulk import games</h1>
      <p className="text-sm text-gray-600">
        Upload a CSV. The file is parsed in the server action; rows that
        can&apos;t be mapped are reported instead of failing the whole batch.
      </p>
      <p className="text-sm">
        Need a starting point?{" "}
        <a
          href="/collection-template.csv"
          download
          className="underline font-medium"
        >
          Download the template CSV
        </a>{" "}
        — 4 example rows showing all required columns.
      </p>
      <details className="text-sm text-gray-700">
        <summary className="cursor-pointer font-medium">Columns reference</summary>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><code>title</code> — game name (required)</li>
          <li><code>console</code> — one of: PS2, MD, Genesis, Saturn, SFC, SNES (required)</li>
          <li><code>region</code> — JP, US, EU, Other (defaults to JP)</li>
          <li><code>condition</code> — Loose, CIB, New (defaults to CIB)</li>
          <li><code>purchase_price</code> — what you paid, in USD (required)</li>
          <li><code>current_market_price</code> — leave 0 if unknown; we&apos;ll fill it from PriceCharting later</li>
          <li><code>notes</code> — optional free text (damage, manual missing, etc.)</li>
        </ul>
      </details>

      <form action={formAction} className="space-y-4">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm"
        />
        <SubmitButton />
      </form>

      {state && (
        <section className="rounded border border-gray-200 p-4 text-sm">
          <p>
            <strong>Inserted:</strong> {state.inserted} &nbsp;
            <strong>Skipped:</strong> {state.skipped} &nbsp;
            <strong>Errors:</strong> {state.errors.length}
          </p>
          {state.errors.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-red-700">
              {state.errors.slice(0, 20).map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.reason}
                </li>
              ))}
              {state.errors.length > 20 && (
                <li>…and {state.errors.length - 20} more</li>
              )}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Importing…" : "Import CSV"}
    </button>
  );
}
