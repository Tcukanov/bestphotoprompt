'use client';

import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div className="space-y-3">
      <button
        onClick={() => signIn('github', { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] text-[var(--text-primary)] rounded-xl transition font-medium text-sm"
      >
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        Continue with GitHub
      </button>

      <div className="relative py-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[var(--bg-card)] text-[var(--text-muted)]">or</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = formData.get('email') as string;
          signIn('email', { email, callbackUrl });
        }}
        className="space-y-3"
      >
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
        />
        <button type="submit" className="btn-primary w-full py-3">
          Send Magic Link
        </button>
      </form>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">Sign in to vote and save your favorite prompts</p>
        </div>

        <Suspense fallback={<div className="h-40 skeleton rounded-xl" />}>
          <SignInForm />
        </Suspense>

        <p className="mt-6 text-center">
          <Link href="/" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
            Back to feed
          </Link>
        </p>
      </div>
    </div>
  );
}
