"use client";

import Link from "next/link";
import { FOOTER_LINKS, NAV_LINKS, SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="app-header">
      <Link href="/" className="brand-link" aria-label={`${SITE.name}のトップへ`} title="トップページへ戻る">
        <span className="brand-mark">オ</span>
        <span>
          <span className="brand-name">{SITE.name}</span>
          <span className="brand-sub">オリジナルパチンコスペックメーカー</span>
        </span>
      </Link>
      <nav className="site-nav" aria-label="メインメニュー">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
      <p>{SITE.name} - 数値は入力条件に基づく試算です。正式な適合判定や実機性能、遊技結果を保証するものではありません。</p>
    </footer>
  );
}
