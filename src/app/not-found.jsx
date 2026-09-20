import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-ink">404</h1>
        <p className="mt-4 text-xl font-semibold text-ink">Page not found</p>
        <p className="mt-2 text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
