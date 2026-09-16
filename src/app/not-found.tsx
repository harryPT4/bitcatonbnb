import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page">
      <p className="eyebrow">404</p>
      <h1>This cat wandered off.</h1>
      <p>The page you requested does not exist.</p>
      <Link className="btn-primary" href="/">
        Return home
      </Link>
    </main>
  );
}
