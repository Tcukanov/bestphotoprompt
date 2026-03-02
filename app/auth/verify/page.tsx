import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h1 className="text-xl font-bold mb-2">Check your email</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          We sent you a magic link. Click the link in your email to sign in.
        </p>
        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border)]">
          The link expires in 24 hours. Check your spam folder too.
        </div>
        <Link href="/" className="inline-block mt-6 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
          Back to feed
        </Link>
      </div>
    </div>
  );
}
