# vite-plugin-glob

[![NPM version](https://img.shields.io/npm/v/vite-plugin-glob?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-glob)


```ts
import.meta.globNext('./fixtures/*.ts')

import.meta.globNext([
  './fixtures/*.ts',
  '!**/index.ts',
], {
  as: 'raw',
  eager: true,
})
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2021 [Anthony Fu](https://github.com/antfu)
