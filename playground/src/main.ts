import './style.css'
import { list1, list2, list3, list4 } from '../../test/fixtures'

const app = document.querySelector<HTMLDivElement>('#app')!

await Promise.all(Object.values(list1).map(i => i()))
  .then((modules) => {
    app.innerHTML += `${JSON.stringify(modules)}<br>` // [{name:'a'}, {name: 'b'}]
  })

await Promise.all(Object.values(list2).map(i => i()))
  .then((modules) => {
    app.innerHTML += `${JSON.stringify(modules)}<br>` // [{name:'a'}, {name: 'b'}]
  })

app.innerHTML += `${JSON.stringify(list3)}<br>`
app.innerHTML += JSON.stringify(list4)
