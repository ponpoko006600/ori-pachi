import type { Metadata } from "next";
import Link from "next/link";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `お問い合わせ | ${SITE.name}`,
  description: "オリパチへのお問い合わせ方法です。機能要望、誤表記、掲載内容の相談はXのDMからご連絡ください。",
};

export default function ContactPage() {
  return (
    <InfoLayout
      title="お問い合わせ"
      lead="機能要望、実機スペックの追加希望、誤表記の連絡などはこちらからお願いします。"
    >
      <div className="contact-panel">
        <h2>お問い合わせ先</h2>
        <p>
          現在のお問い合わせ窓口は、運営者「{SITE.operator}」のXアカウントDMです。
        </p>
        <Link href={SITE.contactUrl} target="_blank" rel="noopener noreferrer" className="primary-action info-action">
          XのDMで問い合わせる
        </Link>
      </div>
      <div className="info-section">
        <h2>送ってほしい内容</h2>
        <ul className="plain-list">
          <li>不具合が起きたページや操作内容</li>
          <li>追加してほしい実機スペックの機種名</li>
          <li>数値が違っていそうな箇所</li>
          <li>あると嬉しい機能や改善案</li>
        </ul>
      </div>
    </InfoLayout>
  );
}
