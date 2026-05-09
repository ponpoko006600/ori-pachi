import type { Metadata } from "next";
import Link from "next/link";
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
      lead="現在プリセットに登録している実機スペックです。今後、比較ページや個別詳細ページを増やしていく予定です。"
    >
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
            </dl>
            <Link href={preset.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">
              参考スペックを見る
            </Link>
          </article>
        ))}
      </div>
      <div className="info-note">
        <strong>掲載方針</strong>
        <p>
          ここに掲載している数値は、スペック再現・比較のために簡略化している場合があります。
          正式な数値はメーカー発表やホール掲示、各機種の公式情報をご確認ください。
        </p>
      </div>
    </InfoLayout>
  );
}
