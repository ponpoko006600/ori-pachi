import type { Metadata } from "next";
import { InfoLayout } from "@/components/InfoLayout";
import { MACHINE_PRESETS } from "@/lib/presets";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `実機スペック一覧 | ${SITE.name}`,
  description: "オリパチに登録されている実機プリセットのスペック一覧です。プリセットを参考にオリジナルスペックを作成できます。",
};

export default function MachinesPage() {
  return (
    <InfoLayout
      title="実機スペック一覧"
      lead="現在プリセットに登録している実機参考スペックです。客観的な数値を、オリパチ独自のUIで見やすく整理しています。"
    >
      <div className="info-section">
        <h2>このページの使い方</h2>
        <p>
          実機プリセットは、オリジナルスペックを作るための出発点です。
          そのまま眺めるだけでなく、トップページのプリセットボタンから読み込んで、
          突入率、継続率、出玉振り分けを変えると「もしこの台が別スペックだったら」を試せます。
        </p>
      </div>

      <div className="machine-list">
        {MACHINE_PRESETS.map((preset) => (
          <article key={preset.id} className="machine-card">
            <div>
              <p className="machine-kicker">{preset.input.machineType}機 / {preset.input.regulationType === "lt" ? "LTあり" : "LTなし"}</p>
              <h2>{preset.input.name}</h2>
            </div>
            <dl>
              <div>
                <dt>大当り確率</dt>
                <dd>約1/{preset.input.hitProbability}</dd>
              </div>
              <div>
                <dt>RUSH突入率</dt>
                <dd>約{preset.input.rushEntryRate}%</dd>
              </div>
              <div>
                <dt>継続率</dt>
                <dd>約{preset.input.regulationType === "lt" ? preset.input.ltContinuationRate : preset.input.rushContinuationRate}%</dd>
              </div>
              <div>
                <dt>初当たり出玉</dt>
                <dd>約{preset.input.initialPayout.toLocaleString()}発</dd>
              </div>
              <div>
                <dt>RUSH構造</dt>
                <dd>{rushModeLabel(preset.input.rushMode)}</dd>
              </div>
              <div>
                <dt>右打ち中確率</dt>
                <dd>約1/{preset.input.rightHitProbability}</dd>
              </div>
              <div>
                <dt>ST/時短回数</dt>
                <dd>約{preset.input.regulationType === "lt" ? preset.input.ltStSpins : preset.input.rushStSpins}回</dd>
              </div>
              <div>
                <dt>参考ボーダー</dt>
                <dd>{preset.input.benchmark?.borderSpins4Yen ?? "-"}回/k</dd>
              </div>
            </dl>
            <div className="machine-payout-summary">
              <strong>大当たり中の出玉振り分け</strong>
              <ul>
                {preset.input.payoutTiers.map((tier) => (
                  <li key={tier.id}>
                    <span>{tier.label}</span>
                    <span>{tier.payout.toLocaleString()}発 / {tier.rate}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <div className="info-note">
        <strong>掲載方針</strong>
        <p>
          ここに掲載している数値は、スペック再現・比較のためにオリパチ側で整理した参考値です。
          公式画像、公式図解、外部サイトの文章や表組みは掲載せず、客観的なスペック数値だけを独自の形式で表示しています。
        </p>
      </div>
    </InfoLayout>
  );
}

function rushModeLabel(mode: string) {
  if (mode === "directLt") return "直RUSH/LT";
  if (mode === "twoStage") return "2段階RUSH";
  if (mode === "threeStage") return "3段階RUSH";
  return "1段階RUSH";
}
