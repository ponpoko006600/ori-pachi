import type { Metadata } from "next";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `使い方 | ${SITE.name}`,
  description: "オリパチでオリジナルパチンコスペックを作成し、出玉期待値やシミュレーション結果を見る流れを説明します。",
};

export default function GuidePage() {
  return (
    <InfoLayout
      title="使い方"
      lead="初めて来た人向けに、オリパチで何ができるのか、どの順番で触ればよいのかをまとめています。"
    >
      <div className="info-section">
        <h2>オリパチでできること</h2>
        <p>
          オリパチは、初当たり確率、RUSH突入率、継続率、出玉振り分けなどを入力して、
          オリジナルのパチンコスペックを作れるサイトです。作成した数値から、期待出玉や規制チェック、
          出玉振り分けの円グラフ、簡易シミュレーションを確認できます。
        </p>
      </div>

      <div className="step-list">
        <div>
          <span>1</span>
          <h2>規制タイプを選ぶ</h2>
          <p>LTあり、LTなしなど、作りたいスペックに近いタイプを選びます。</p>
        </div>
        <div>
          <span>2</span>
          <h2>基本スペックを調整する</h2>
          <p>初当たり確率、RUSH突入率、継続率、初当たり出玉をスライダーで調整します。</p>
        </div>
        <div>
          <span>3</span>
          <h2>出玉振り分けを作る</h2>
          <p>300発、1500発、3000発、STリセットなど、出玉ティアと割合を設定します。</p>
        </div>
        <div>
          <span>4</span>
          <h2>結果を見る</h2>
          <p>規制内に収まっているか、期待出玉がどのくらいか、円グラフで確認します。</p>
        </div>
        <div>
          <span>5</span>
          <h2>実機プリセットから試す</h2>
          <p>実在機種のプリセットを押すと、その台に近い条件から編集できます。</p>
        </div>
      </div>

      <div className="info-note">
        <strong>ポイント</strong>
        <p>
          最初は実機プリセットを押してから、少しずつ数値を変えるのがおすすめです。
          いきなり全部を作るより、既存スペックを改造する方が挙動を理解しやすくなります。
        </p>
      </div>
    </InfoLayout>
  );
}
