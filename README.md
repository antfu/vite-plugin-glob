# vite-plugin-glob

[![NPM version](https://img.shields.io/npm/v/vite-plugin-glob?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-glob)

The design experiment for [`import.meta.glob` from Vite](https://vitejs.dev/guide/features.html#glob-import).

## Why

There are quite some scenarios that `import.meta.glob` wasn't considered when it's been implemented at the beginning. And we received several PRs to improve it.

However, some design considerataions might conflict with each other. For example, [`#2495 support ignore option for glob import`](https://github.com/vitejs/vite/pull/2495) supports the ignore glob as a second argument, while in [`#6953 import.meta.glob support ?raw`](https://github.com/vitejs/vite/pull/6953) we uses the second argument to specify glob query (and later been changed to `{ as }` via [`#7215 deprecate { assert: { type: raw }} in favor of { as: raw }`](https://github.com/vitejs/vite/pull/7215)).

There are many other PRs that touches it's design as well:

- [`#7209 support custom modifiers for glob imports`](https://github.com/vitejs/vite/pull/7209)
- [`#7482 add ignore option to import.meta.glob`](https://github.com/vitejs/vite/pull/7482)

With these two TC39 proposals ([`import-reflection`](https://github.com/tc39/proposal-import-reflection) and [`import-assertions`](https://github.com/tc39/proposal-import-assertions)) not settled yet, combining with different needs and design tradeoffs in each PR, making the good API design for `import.meta.glob` directly in Vite core becoming harder and more and more complex than it could be.

Thus I propose to experiment with the `import.meta.glob` as an external plugin so we could introduce breaking change more easier and ships the implementation much faster (in Vite it takes days for a change to be meraged, and weeks to months for it to be landed in stable release). And when we feel the new design is able to cover most of the use cases, then we could embed it into Vite core as a one-time breaking change in v3.0.

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

> The API is named as `import.meta.importGlob` to avoid conflict with Vite's `import.meta.glob` in this implementation.

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
