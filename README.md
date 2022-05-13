# vite-plugin-glob

[![NPM version](https://img.shields.io/npm/v/vite-plugin-glob?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-glob)

The design experiment for [`import.meta.glob` from Vite](https://vitejs.dev/guide/features.html#glob-import).

> **Update**: This plugin has be [ported to Vite v3.0 alpha](https://github.com/vitejs/vite/pull/7537).

## Motivations

There are quite some scenarios that `import.meta.glob` wasn't considered when it's been implemented at the beginning. So we received quite a few PRs to improve it.

However, some design considerations might conflict with each other. For example, [`#2495 support ignore option for glob import`](https://github.com/vitejs/vite/pull/2495) supports the ignore glob as a second argument, while in [`#6953 import.meta.glob support ?raw`](https://github.com/vitejs/vite/pull/6953) we uses the second argument to specify glob query (and later been changed to `{ as }` via [`#7215 deprecate { assert: { type: raw }} in favor of { as: raw }`](https://github.com/vitejs/vite/pull/7215)).

There are several other PRs that touches it's design as well:

- [`#7209 support custom modifiers for glob imports`](https://github.com/vitejs/vite/pull/7209)
- [`#7482 add ignore option to import.meta.glob`](https://github.com/vitejs/vite/pull/7482)

With these two TC39 proposals ([`import-reflection`](https://github.com/tc39/proposal-import-reflection) and [`import-assertions`](https://github.com/tc39/proposal-import-assertions)) not settled yet, combining with different needs and design tradeoffs in each PR, making the good API design for `import.meta.glob` directly in Vite core becoming harder and more and more complex than it could be (with the cautions to not break existing usages).

On top of that, in Vite we are having multiple macros for different options:

- `import.meta.glob`
- `import.meta.globEager`
- `import.meta.globEagerDefault` (undocumented)

That results in a quite large API surface to maintain and make the future extension harder. For example, if we want `import.meta.globNamed` we might also need to add `import.meta.globEagerNamed`, making the counts to 5.

Thus I propose to experiment with the `import.meta.glob` as an external plugin so we could introduce breaking change more easier and ships the implementation much faster (in Vite it takes days for a change to be meraged, and weeks to months for it to be landed in stable release). And when we feel the new design is able to cover most of the use cases, then we could embed it into Vite core as a one-time breaking change in v3.0.

## Features

- Globing for multiple patterns
- Globing ignore
- HMR on file modification / addition / deletion
- Ability to provide custom queries
- Ability to only import default / named export
- An unified API for different options
- Vite alias
- (Optional) Takeover Vite's `import.meta.glob`
- [Experiments](#experiments)

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
    GlobPlugin({
      // enable to let this plugin interpret `import.meta.glob`
      // takeover: true,
    }),
  ],
})
```

## Usage

> The API is named as `import.meta.importGlob` to avoid conflict with Vite's `import.meta.glob` in this implementation.

```ts
const modules = import.meta.importGlob('./dir/*.js')

/* {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js'),
} */
```

#### Multiple Globs

```ts
const modules = import.meta.importGlob([
  './dir/*.js',
  './another/dir/*.js',
])

/* {
  './dir/foo.js': () => import('./dir/foo.js'),
  './dir/bar.js': () => import('./dir/bar.js'),
  './another/dir/index.js': () => import('./another/dir/index.js'),
} */
```

#### Ignore Glob

Globs start with `!` will be matched to exclude.

```ts
const modules = import.meta.importGlob([
  './dir/*.js',
  '!**/index.js',
])
```

#### Eager

Import the modules as static imports.

```ts
const modules = import.meta.importGlob('./dir/*.js', { eager: true })

/*
import * as __glob__0_0 from './dir/foo.js'
import * as __glob__0_1 from './dir/bar.js'
const modules = {
  './dir/foo.js': __glob__0_0,
  './dir/bar.js': __glob__0_1
}
*/
```

#### Import As

```ts
const modules = import.meta.importGlob('./dir/*.js', { as: 'raw' })

/* {
  './dir/foo.js': () => import('./dir/foo.js?raw'),
  './dir/bar.js': () => import('./dir/bar.js?raw'),
} */
```

#### Named Imports

It's possible to only import parts of the modules with the `import` options.

```ts
const setups = import.meta.importGlob('./dir/*.js', { import: 'setup' })

/* {
  './dir/foo.js': () => import('./dir/foo.js').then(m => m.setup),
  './dir/bar.js': () => import('./dir/bar.js').then(m => m.setup),
} */
```

Combining with `eager`, it's even possible to have tree-shaking enable for those modules.

```ts
const setups = import.meta.importGlob('./dir/*.js', { import: 'setup', eager: true })

/*
import { setup as __glob__0_0 } from './dir/foo.js'
import { setup as __glob__0_1 } from './dir/bar.js'
const setups = {
  './dir/foo.js': __glob__0_0,
  './dir/bar.js': __glob__0_1
}
*/
```

Set `export` to `default` to import the default export.

```ts
const modules = import.meta.importGlob('./dir/*.js', { import: 'default', eager: true })

/*
import __glob__0_0 from './dir/foo.js'
import __glob__0_1 from './dir/bar.js'
const modules = {
  './dir/foo.js': __glob__0_0,
  './dir/bar.js': __glob__0_1
}
*/
```

#### Custom Queries

```ts
const setups = import.meta.importGlob('./dir/*.js', { query: { foo: 'bar', bar: true } })

/* {
  './dir/foo.js': () => import('./dir/foo.js?foo=bar&bar=true&lang.js').then(m => m.setup),
  './dir/bar.js': () => import('./dir/bar.js?foo=bar&bar=true&lang.js').then(m => m.setup),
} */
```

## Experiments

The following features are in experiments, feedbacks are greatly welcome!

### Restore file extension when query is specified

Append fake `&lang.(ext)` when queries are specified, to preseve the file extension for following plugins to process.

Learn more at [Discussions](https://github.com/antfu/vite-plugin-glob/pull/10)

This is disabled by default since v0.3.0. To enable it, pass `restoreQueryExtension: true` to plugin options.

## TypeScript

Add to `tsconfig.json`

<!-- eslint-skip -->

```jsonc
{
  "compilerOptions": {
    "types": [
      "vite-plugin-glob/client",
      // with takeover enabled
      // "vite-plugin-glob/takeover"
    ]
  }
}
```

You can use generic to specify the type of the modules.

```ts
interface SomeModule {
  name: string
  default: { /* ... */ }
}

import.meta.importGlob<SomeModule>('./dir/*.js')
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
