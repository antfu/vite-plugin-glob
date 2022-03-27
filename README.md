# vite-plugin-glob

[![NPM version](https://img.shields.io/npm/v/vite-plugin-glob?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-glob)

The design experiment for `import.meta.glob` from Vite.

## Install

```bash
npm i -D vite-plugin-glob
```

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import GlobPlugin from 'vite-plugin-glob'

export default defineConfig({
  plugins: [
    GlobPlugin(),
  ],
})
```

## Usage

#### Basic

```ts
import.meta.importGlob('./dir/*.js')

/* {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js'),
} */
```

#### Ignore Glob

Globs start with `!` will be excluded.

```ts
import.meta.importGlob([
  './dir/*.js',
  '!**/index.js',
])
```

#### Eager

Unified interface for eager glob.

```ts
import.meta.importGlob('./dir/*.js', { eager: true })

/*
import * as __glob__0_0 from './dir/foo.js'
import * as __glob__0_1 from './dir/bar.js'
const modules = {
  './dir/foo.js': __glob__0_0,
  './dir/bar.js': __glob__0_1
}
*/
```

#### Custom Queries

```ts
import.meta.importGlob('./dir/*.js', { as: 'raw' })

/* {
  './dir/foo.js': () => import('./dir/foo.js?raw'),
  './dir/bar.js': () => import('./dir/bar.js?raw'),
} */
```

## TypeScript

Add to `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": [
      "vite-plugin-glob/client"
    ]
  }
}
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
