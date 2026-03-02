import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center">
          <span className="text-4xl font-bold text-[var(--accent)]">404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
          The page you are looking for does not exist or has been removed.
        </p>
        <Link href="/" className="btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}
