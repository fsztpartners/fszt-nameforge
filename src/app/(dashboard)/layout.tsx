import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            NameForge
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/evaluate" className="text-muted-foreground hover:text-foreground transition-colors">
              Evaluate
            </Link>
            <Link href="/generate" className="text-muted-foreground hover:text-foreground transition-colors">
              Generate
            </Link>
            <Link href="/favorites" className="text-muted-foreground hover:text-foreground transition-colors">
              Favorites
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
