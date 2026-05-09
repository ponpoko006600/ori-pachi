import type { Metadata } from "next";
import { InfoLayout } from "@/components/InfoLayout";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `免責事項 | ${SITE.name}`,
  description: "オリパチの利用に関する免責事項です。実機性能や遊技結果、勝敗を保証するものではありません。",
};

export default function DisclaimerPage() {
  return (
    <InfoLayout
      title="免責事項"
      lead="オリパチを安心して公開・運営するため、サイトの計算結果や掲載情報の扱いを明確にしています。"
    >
      <div className="info-section">
        <h2>計算結果について</h2>
        <p>
          当サイトのシミュレーション、期待出玉、ボーダー、円グラフ、規制チェックなどの結果は、
          入力された条件をもとにした独自の試算です。実機の性能、正式な型式試験、ホールでの遊技結果、
          勝敗、収支を保証するものではありません。
        </p>
      </div>
      <div className="info-section">
        <h2>掲載スペックについて</h2>
        <p>
          実機プリセットは、公開されているスペック情報をもとに、サイト上で再現しやすい形へ簡略化している場合があります。
          正確な機種情報は、メーカー公式情報、ホール掲示、各機種の公式資料をご確認ください。
        </p>
      </div>
      <div className="info-section">
        <h2>損害等について</h2>
        <p>
          当サイトの利用によって発生した損害、トラブル、遊技判断の結果について、運営者は責任を負いかねます。
          パチンコ・パチスロは余裕を持って楽しみ、のめり込みには十分ご注意ください。
        </p>
      </div>
      <div className="info-section">
        <h2>外部リンクについて</h2>
        <p>
          当サイトから外部サイトへ移動した場合、移動先サイトで提供される情報やサービスについて、
          当サイトは責任を負いません。
        </p>
      </div>
    </InfoLayout>
  );
}
