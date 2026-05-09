import type { Metadata } from "next";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `収益化ロードマップ | ${SITE.name}`,
  description: "オリパチを無料公開し、将来の収益化につなげるためのロードマップと追加機能案です。",
};

const revenueSteps = [
  {
    title: "無料公開で使われる状態を作る",
    body: "まずは広告なしでも使いやすい状態にして、検索流入とXからの流入を集めます。使い方、用語解説、実機スペック一覧を増やすほど入口が増えます。",
  },
  {
    title: "アクセス解析で需要を見る",
    body: "Google Analyticsで、どの機種、どの用語、どの機能が見られているか確認します。伸びているページから優先して改善します。",
  },
  {
    title: "広告を入れる",
    body: "一定のページ数とアクセスが出てきたら、Google AdSenseなどの広告を導入します。最初は邪魔になりにくい位置から始めます。",
  },
  {
    title: "プレミアム機能を検討する",
    body: "保存数の増加、詳細シミュレーション、比較表、共有URL、PDF出力など、熱量の高いユーザー向け機能を有料化候補にします。",
  },
  {
    title: "直接広告・タイアップを狙う",
    body: "アクセスと利用者層が見えてきたら、パチンコ関連メディア、ホール向けサービス、周辺ツールとの直接広告やタイアップを検討します。",
  },
];

const futureFeatures = [
  "作成したスペックの保存・再編集",
  "スペック比較表",
  "共有URLの発行",
  "ボーダー計算の詳細化",
  "1000回転、2000回転、10000回転のシミュレーション切り替え",
  "実機スペックの個別詳細ページ",
  "人気プリセットランキング",
  "ユーザー投稿スペック",
  "作成スペックの画像出力",
  "収支・スランプグラフの詳細分析",
];

export default function RoadmapPage() {
  return (
    <InfoLayout
      title="収益化ロードマップ"
      lead="オリパチをまず無料公開し、検索・SNS・実機プリセットを育てながら収益化につなげる流れです。"
    >
      <div className="info-section">
        <h2>基本方針</h2>
        <p>
          オリパチは「スペック作成・比較・シミュレーションサイト」として無料で使える価値を先に作ります。
          そのうえで、広告、プレミアム機能、直接広告、タイアップの順に収益化の選択肢を広げます。
        </p>
      </div>
      <div className="roadmap-list">
        {revenueSteps.map((step, index) => (
          <article key={step.title}>
            <span>{index + 1}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="info-section">
        <h2>Xアカウント運用</h2>
        <p>
          AIで作ったサイトやソフトを配信するキャラクターアカウントから、開発中の画面、実機スペックの再現、
          シミュレーション結果、追加機能の投票を投稿します。サイト単体ではなく「作っている過程」もコンテンツにすると、
          公開前から見に来る理由を作れます。
        </p>
      </div>
      <div className="info-section">
        <h2>あったら嬉しい機能</h2>
        <ul className="plain-list two-column">
          {futureFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
      <div className="info-note">
        <strong>最初の目標</strong>
        <p>
          無料公開直後は、収益よりも「使われること」「検索に載ること」「Xで反応が取れること」を優先します。
          月間アクセス、よく使われるプリセット、離脱されるページが見えてから広告や有料機能を入れる方が失敗しにくいです。
        </p>
      </div>
    </InfoLayout>
  );
}
