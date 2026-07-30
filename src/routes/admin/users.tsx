import { createFileRoute } from "@tanstack/react-router";
import { PageHead } from "@/components/dashboard/PageHead";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Clients — Castle eWill Admin" },
      {
        name: "description",
        content:
          "Browse registered Castle clients, their plans, progress and verification status.",
      },
      { property: "og:title", content: "Clients — Castle eWill Admin" },
      { property: "og:description", content: "Registered client register." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminUsers,
});

const users = [
  ["Ada Okafor", "ada.okafor@example.com", "Family", "Verified", "33%"],
  ["Tunde Bakare", "t.bakare@example.com", "Estate", "Verified", "78%"],
  ["Ngozi Eze", "ngozi.e@example.com", "Essential", "Pending", "100%"],
  ["Samuel Ojo", "s.ojo@example.com", "Family", "Verified", "56%"],
  ["Halima Yusuf", "h.yusuf@example.com", "Essential", "Verified", "12%"],
];

function AdminUsers() {
  return (
    <>
      <PageHead
        kicker="Registry · Section II"
        title="Clients"
        blurb="Every testator on the platform, with plan, identity status and drafting progress."
      />

      {/* Desktop table */}
      <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-background md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border">
            <tr className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(([name, email, plan, id, pct]) => (
              <tr key={email}>
                <td className="px-6 py-4 font-medium text-navy">{name}</td>
                <td className="px-6 py-4 text-muted-foreground">{email}</td>
                <td className="px-6 py-4 text-navy">{plan}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] ${
                      id === "Verified" ? "bg-gold/15 text-navy" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {id}
                  </span>
                </td>
                <td className="px-6 py-4 text-navy">{pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="mt-8 space-y-3 md:hidden">
        {users.map(([name, email, plan, id, pct]) => (
          <li key={email} className="rounded-2xl border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] ${
                  id === "Verified" ? "bg-gold/15 text-navy" : "bg-muted text-muted-foreground"
                }`}
              >
                {id}
              </span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {plan} · {pct} complete
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
