import './style.css'
import { list1, list2 } from '../../test/fixtures'

const app = document.querySelector<HTMLDivElement>('#app')!

await Promise.all(Object.values(list1).map(i => i()))
  .then((modules) => {
    app.textContent += JSON.stringify(modules) // [{name:'a'}, {name: 'b'}]
  })

await Promise.all(Object.values(list2).map(i => i()))
  .then((modules) => {
    app.textContent += JSON.stringify(modules) // [{name:'a'}, {name: 'b'}]
  })
