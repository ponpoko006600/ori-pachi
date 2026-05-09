# オリパチ公開手順

このメモは、オリパチを無料公開して、Google検索・アクセス解析・広告審査へ進めるための手順です。

## 使うアカウント

- GitHub: 既存アカウント
- Google: `gatimuggle@gmail.com`
- Vercel: GitHub連携で作成

## 1. GitHubへ反映

ローカルの変更をGitHubへ保存します。

```bash
git add .
git commit -m "feat: prepare Oripachi for public launch"
git push origin main
```

今後の修正公開は、下の1コマンドでまとめて実行できます。

```bash
npm run publish -- "修正内容のメモ"
```

このコマンドで、チェック、ビルド、Git保存、GitHubへの送信までまとめて行います。
GitHubに送信されると、Vercelが自動で公開サイトを更新します。

## 2. Vercelで無料公開

1. https://vercel.com にアクセス
2. GitHubでログイン
3. `Add New...` から `Project` を選ぶ
4. `ori-pachi` を選ぶ
5. Framework Preset が `Next.js` になっていることを確認
6. Root Directory が `pachispec` になるように設定
7. `Deploy` を押す

公開後、`https://xxxxx.vercel.app` のようなURLが発行されます。

## 3. Vercelの環境変数

VercelのProject Settingsから、必要に応じて以下を設定します。

```bash
NEXT_PUBLIC_SITE_URL=https://公開されたURL
NEXT_PUBLIC_GA_ID=Google Analyticsの測定ID
NEXT_PUBLIC_ADSENSE_CLIENT=AdSenseのサイトコード
```

最初の無料公開だけなら、`NEXT_PUBLIC_SITE_URL` だけでも大丈夫です。

## 4. Google Analytics

1. `gatimuggle@gmail.com` でGoogle Analyticsへログイン
2. GA4プロパティを作成
3. Webストリームを作成
4. `G-` から始まる測定IDをコピー
5. Vercelの環境変数 `NEXT_PUBLIC_GA_ID` に入れる
6. Vercelで再デプロイ

## 5. Google Search Console

1. `gatimuggle@gmail.com` でSearch Consoleへログイン
2. URLプレフィックスで公開URLを登録
3. 所有権確認を行う
4. サイトマップに `https://公開されたURL/sitemap.xml` を送信

## 6. AdSense申請前チェック

- 使い方ページがある
- 用語解説ページがある
- 実機スペック一覧ページがある
- 免責事項がある
- プライバシーポリシーがある
- お問い合わせがある
- サイトの目的がわかる
- コピーだけの薄いページになっていない

## 7. 収益化後の注意

Vercelの無料Hobbyプランは個人・非商用向けです。
広告収益を本格的に入れる段階では、有料プランや別ホスティングも検討してください。
