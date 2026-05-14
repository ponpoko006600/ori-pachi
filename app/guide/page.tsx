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

      <div className="info-section">
        <h2>最初に何をすればいい？</h2>
        <div className="guide-choice-grid">
          <article>
            <strong>実機から改造</strong>
            <p>実機プリセットを選び、突入率や出玉を少しずつ変える方法です。初めてなら一番わかりやすい触り方です。</p>
          </article>
          <article>
            <strong>かんたん作成</strong>
            <p>初当たり確率、RUSH突入率、継続率、出玉だけを先に決めて、あとから細部を調整します。</p>
          </article>
          <article>
            <strong>こだわり設定</strong>
            <p>2段階RUSH、3段階RUSH、時短引き戻し、右打ち中確率、ST回数まで使って実機に近い構成を作ります。</p>
          </article>
        </div>
      </div>

      <div className="step-list">
        <div>
          <span>1</span>
          <h2>規制タイプを選ぶ</h2>
          <p>LTあり、LTなしなど、作りたいスペックに近いタイプを選びます。迷ったら、ラッキートリガーを使う台はLTあり、昔ながらのST機や確変機はLTなしから始めます。</p>
        </div>
        <div>
          <span>2</span>
          <h2>基本スペックを調整する</h2>
          <p>初当たり確率、RUSH突入率、継続率、右打ち中確率、ST回数などを調整します。スライダーだけでなく、数値部分を押して直接入力することもできます。</p>
        </div>
        <div>
          <span>3</span>
          <h2>出玉振り分けを作る</h2>
          <p>300発、1500発、3000発、STリセットなど、出玉ティアと割合を設定します。割合の合計が100%になると計算できます。</p>
        </div>
        <div>
          <span>4</span>
          <h2>結果を見る</h2>
          <p>規制内に収まっているか、期待出玉がどのくらいか、通常時と大当たり中の円グラフで確認します。</p>
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

      <div className="info-section">
        <h2>オリパチの総量規制チェックについて</h2>
        <p>
          パチンコの正式な規制は、国が公開している技術上の規格と、業界内規として運用されているルールが組み合わさっています。
          すべての検定条件が1枚の表として公開されているわけではないため、オリパチでは公開情報と実機スペックの傾向をもとに、
          明らかに強すぎるスペックを通さないための独自チェックとして再現しています。
        </p>
        <div className="rule-summary-grid">
          <div>
            <strong>LTあり</strong>
            <p>LT期待出玉9,600発、初当たり1回あたり期待出玉6,400発、LT比率80%を目安に判定します。</p>
          </div>
          <div>
            <strong>LTなし</strong>
            <p>1回の内部大当たり1,500発、継続率81%を目安に、旧来型スペックとして判定します。</p>
          </div>
          <div>
            <strong>複数回大当たり</strong>
            <p>3,000発や7,500発は、1,500発の当たりを複数回取る実質出玉として扱います。</p>
          </div>
        </div>
      </div>

      <div className="info-note">
        <strong>注意</strong>
        <p>
          オリパチの判定は、実際の検定適合やホールでの出玉を保証するものではありません。
          釘、入賞口、電サポ中の玉減り、役物構造など、サイト上の入力だけでは再現できない条件があるためです。
        </p>
      </div>
    </InfoLayout>
  );
}
