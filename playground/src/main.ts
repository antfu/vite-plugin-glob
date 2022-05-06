import './style.css'
import * as fixtures from '../../src/__tests__/fixture-a'

const app = document.getElementById('app')!

const settled = Object.fromEntries(
  await Promise.all(Object.entries(fixtures)
    .map(async ([key, value]) => {
      return [key, Object.fromEntries(
        await Promise.all(Object.entries(value)
          .map(async ([k, v]) => [k, await (typeof v === 'function' ? v() : v)]),
        ),
      )]
    }),
  ),
)

app.textContent = JSON.stringify(settled, null, 2)
