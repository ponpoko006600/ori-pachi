import type { Metadata } from "next";
import Link from "next/link";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `プライバシーポリシー | ${SITE.name}`,
  description: "オリパチのプライバシーポリシーです。アクセス解析、広告配信、Cookieの利用について説明します。",
};

export default function PrivacyPage() {
  return (
    <InfoLayout
      title="プライバシーポリシー"
      lead="Google Analyticsや広告配信を利用する予定に合わせて、個人情報やCookieの扱いを整理しています。"
    >
      <div className="info-section">
        <h2>運営者情報</h2>
        <p>サイト名：{SITE.name}</p>
        <p>運営者：{SITE.operator}</p>
        <p>
          お問い合わせ：
          <Link href={SITE.contactUrl} target="_blank" rel="noopener noreferrer" className="text-link">
            {SITE.contactLabel}
          </Link>
        </p>
      </div>
      <div className="info-section">
        <h2>アクセス解析について</h2>
        <p>
          当サイトでは、利用状況の把握やサイト改善のためにGoogle Analyticsを使用する予定です。
          Google AnalyticsはCookie等を利用して、訪問ページ、滞在時間、利用環境などの情報を収集する場合があります。
          これらの情報は個人を特定する目的では使用しません。
        </p>
      </div>
      <div className="info-section">
        <h2>広告配信について</h2>
        <p>
          当サイトでは、Google AdSenseなどの第三者配信広告サービスを利用する予定です。
          第三者配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用する場合があります。
          ユーザーはGoogleの広告設定ページから、パーソナライズ広告を無効にできます。
        </p>
      </div>
      <div className="info-section">
        <h2>個人情報の利用目的</h2>
        <p>
          お問い合わせ時に提供された情報は、返信や必要な連絡のために利用します。
          法令に基づく場合を除き、本人の同意なく第三者へ提供しません。
        </p>
      </div>
      <div className="info-section">
        <h2>Cookieについて</h2>
        <p>
          Cookieは、サイトの利用状況の分析や広告配信のために使用されることがあります。
          Cookieの利用を望まない場合は、ブラウザの設定から無効にできます。
        </p>
      </div>
      <div className="info-note">
        <strong>公開前に必要な作業</strong>
        <p>
          Google AnalyticsやGoogle AdSenseを実際に導入したら、設定内容に合わせてこのページを見直してください。
          海外ユーザー向けに広告を出す場合は、地域ごとの同意管理も確認が必要です。
        </p>
      </div>
    </InfoLayout>
  );
}
