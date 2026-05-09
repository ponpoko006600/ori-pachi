import Link from "next/link";
import { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

export function InfoLayout({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen app-bg">
      <SiteHeader />
      <section className="info-shell">
        <div className="info-hero">
          <p className="info-kicker">ORIPACHI GUIDE</p>
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        <div className="info-card">{children}</div>
        <div className="info-bottom-action">
          <Link href="/" className="primary-action info-action">
            スペック作成に戻る
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
