import Link from "next/link";

const navigation = [
  { href: "/", label: "总览" },
  { href: "/onboarding", label: "画像" },
  { href: "/inbox", label: "素材箱" },
  { href: "/proposals", label: "提案" },
  { href: "/rulebase", label: "规则库" },
  { href: "/artifacts", label: "资产" },
  { href: "/playground", label: "测试场" },
  { href: "/changelog", label: "变更" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--line)] bg-[color:var(--panel-strong)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-10">
          <div>
            <p className="eyebrow">PersonaOS / MVP Build</p>
            <Link href="/" className="font-serif text-3xl tracking-[0.12em] text-[color:var(--ink)]">
              PERSONAOS
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-3">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="nav-pill">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-10 lg:px-10">
        {children}
      </main>
    </div>
  );
}
