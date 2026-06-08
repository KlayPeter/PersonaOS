import Link from "next/link";

export function EmptyStatePanel({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="empty-state-panel">
      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-2xl text-[color:var(--ink)]">{title}</h3>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      </div>

      {actions && actions.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="secondary-link">
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
