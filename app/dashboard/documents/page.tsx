import type { Metadata } from "next";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";

import { PageHead } from "@/components/dashboard/PageHead";
import { DocumentVault } from "@/components/documents/DocumentVault";
import { requireUser } from "@/lib/actions/guards";
import { listUserDocuments } from "@/lib/actions/documents";
import { formatBytes } from "@/lib/documents";

export const metadata: Metadata = {
  title: "Sealed vault",
  robots: { index: false, follow: false },
};

export default async function DocumentsPage() {
  const user = await requireUser();
  const records = await listUserDocuments(user.id);

  const totalBytes = records.reduce((sum, r) => sum + r.sizeBytes, 0);

  const stats = [
    {
      icon: Lock,
      value: String(records.length),
      label: records.length === 1 ? "Document" : "Documents",
    },
    { icon: KeyRound, value: formatBytes(totalBytes), label: "Stored" },
    { icon: ShieldCheck, value: "AES-256", label: "Encryption at rest" },
  ];

  return (
    <div className="space-y-10">
      <PageHead
        kicker="Section III"
        title="Sealed Vault"
        blurb="Everything you upload is encrypted before it leaves this server, and released only to the executors you name."
      />

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border border-border bg-background p-5"
            >
              <Icon className="h-4 w-4 text-gold" />
              <dt className="mt-3 font-serif text-2xl text-navy">
                {stat.value}
              </dt>
              <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </dd>
            </div>
          );
        })}
      </dl>

      <DocumentVault records={records} />

      <section className="border-l-2 border-gold/40 bg-gold/5 px-6 py-5">
        <p className="font-serif text-[10px] uppercase tracking-[0.3em] text-gold">
          How your vault works
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-navy/80">
          <li>
            Files are encrypted with AES-256-GCM on this server before they are
            written to storage, so the storage provider only ever holds
            ciphertext.
          </li>
          <li>
            Every download re-checks the file against the checksum recorded at
            upload. If a stored file has been altered, the download fails rather
            than handing you a corrupted document.
          </li>
          <li>
            Removing a document deletes it from storage first, and only then
            removes the record.
          </li>
        </ul>
      </section>
    </div>
  );
}
