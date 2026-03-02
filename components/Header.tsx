'use client';

import { Suspense, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-lg">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts, models, tags..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
        />
      </div>
    </form>
  );
}

function SearchBarFallback() {
  return (
    <div className="flex-1 max-w-lg">
      <div className="w-full h-[42px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl" />
    </div>
  );
}

export function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">
              Best<span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]">Photo</span>Prompt
            </span>
          </Link>

          {/* Search */}
          <Suspense fallback={<SearchBarFallback />}>
            <SearchBar />
          </Suspense>

          {/* Auth */}
          <div className="flex items-center gap-3 shrink-0">
            {status === 'loading' ? (
              <div className="w-24 h-9 skeleton"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-7 h-7 rounded-full border border-[var(--border)]"
                    />
                  )}
                  <span className="text-sm text-[var(--text-secondary)]">
                    {session.user?.name || session.user?.email?.split('@')[0]}
                  </span>
                </div>
                <button onClick={() => signOut()} className="btn-ghost text-xs">
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={() => signIn()} className="btn-primary text-sm">
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
