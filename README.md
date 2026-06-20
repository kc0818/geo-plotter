# React + TypeScript + Vite

このテンプレートは、HMR（ホットモジュールリプレースメント）といくつかのESLintルールを備えた、ViteでReactを動かすための最小限のセットアップを提供します。

現在、2つの公式プラグインが利用可能です：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) — [Oxc](https://oxc.rs) を使用
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) — [SWC](https://swc.rs/) を使用

## React Compiler

React Compilerは、開発・ビルドのパフォーマンスへの影響があるため、このテンプレートでは有効化されていません。追加する場合は、[こちらのドキュメント](https://react.dev/learn/react-compiler/installation)を参照してください。

## ESLint設定の拡張

本番アプリケーションを開発する場合は、型を考慮したLintルールを有効にするために設定を更新することをお勧めします：

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // その他の設定...

      // tseslint.configs.recommended を削除して以下に置き換える
      tseslint.configs.recommendedTypeChecked,
      // より厳格なルールを使用する場合はこちら
      tseslint.configs.strictTypeChecked,
      // スタイルに関するルールを追加する場合はこちら（任意）
      tseslint.configs.stylisticTypeChecked,

      // その他の設定...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // その他のオプション...
    },
  },
])
```

また、React固有のLintルールとして [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) と [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) をインストールすることもできます：

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // その他の設定...
      // ReactのLintルールを有効化
      reactX.configs['recommended-typescript'],
      // React DOMのLintルールを有効化
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // その他のオプション...
    },
  },
])
```

## ローカルでの起動方法

1. 依存関係をインストールします。

```bash
npm install
```

2. 開発サーバーを起動します。

```bash
npm run dev
```

3. ブラウザで `http://localhost:5173` (またはコンソールに表示されるURL) にアクセスします。
