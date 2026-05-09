import type { Metadata } from "next";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `パチンコ用語解説 | ${SITE.name}`,
  description: "LT、RUSH、継続率、期待出玉、ボーダーなど、パチンコスペック作成で使う用語をわかりやすく解説します。",
};

const terms = [
  {
    title: "LT（ラッキートリガー）",
    body: "一定条件を満たすと突入する、通常のRUSHより強い上位モードのことです。高継続率や高出玉振り分けを持つことが多く、近年のスマパチ・パチンコで重要な要素です。",
  },
  {
    title: "RUSH突入率",
    body: "初当たり後にRUSHへ入る割合です。50%なら、初当たり2回に1回くらいRUSHへ入るイメージです。",
  },
  {
    title: "継続率",
    body: "RUSH中に次の当たりや継続を取れる割合です。80%継続なら、1回ごとに約80%で続く想定になります。",
  },
  {
    title: "期待出玉",
    body: "平均するとどれくらいの出玉が見込めるかを表す数値です。実際の1回の遊技結果では大きく上下します。",
  },
  {
    title: "初当たり確率",
    body: "通常時に大当りを引く確率です。1/319なら、平均319回転に1回当たるという意味です。",
  },
  {
    title: "出玉振り分け",
    body: "当たりごとの出玉パターンと割合です。例として、1500発が70%、3000発が30%のように設定します。",
  },
  {
    title: "ST",
    body: "決められた回転数内に当たりを目指すタイプのRUSHです。ST回数と当たり確率によって継続率が変わります。",
  },
  {
    title: "時短",
    body: "通常より少ない玉減りで回せるサポート状態です。機種によっては引き戻しや上位RUSHへの入口になります。",
  },
  {
    title: "遊タイム",
    body: "一定回転数まで当たらなかったときに発動する救済機能です。搭載されていない機種もあります。",
  },
  {
    title: "ボーダー",
    body: "長期的に見て損益が釣り合う回転率の目安です。交換率、出玉、削り、持ち玉比率などで変わります。",
  },
];

export default function GlossaryPage() {
  return (
    <InfoLayout
      title="パチンコ用語解説"
      lead="スペック作成やシミュレーションでよく出てくる言葉を、初めての人にもわかるように整理しています。"
    >
      <div className="glossary-grid">
        {terms.map((term) => (
          <article key={term.title} className="mini-card">
            <h2>{term.title}</h2>
            <p>{term.body}</p>
          </article>
        ))}
      </div>
    </InfoLayout>
  );
}
