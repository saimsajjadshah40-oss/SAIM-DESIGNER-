import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-ink px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[140px]"
      />
      <div className="relative">
        <p className="font-display text-[8rem] font-extrabold leading-none text-outline sm:text-[12rem]">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">This page doesn&apos;t exist</h1>
        <p className="mt-3 text-muted">The link may be broken or the page may have moved.</p>
        <Link href="/" className="btn-primary mt-8">
          Back to the portfolio
        </Link>
      </div>
    </main>
  );
}
