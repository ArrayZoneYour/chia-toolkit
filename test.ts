// let str = `Starting plotting progress into temporary dirs: /media/chia-miner/SanDisk-2 and /media/chia-miner/SanDisk-2
//   ID: fd383e9ebfba9570602de9aefb0cc7008d8f8533c5fda4e57142c29344e0972f
//   Plot size is: 32
//   Buffer size is: 4608MiB
//   Using 128 buckets
//   Using 6 threads of stripe size 65536`

import { MultiBar, Presets } from 'cli-progress'
import { cyan } from 'colors'

// let result = str.match(/ID: ([a-z|0-9]+)/)

const multibar = new MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format:
      `{name} |` +
      cyan('{bar}') +
      `| {percentage}% || {value}/{total} Chunks || ID: {id}`
  },
  Presets.shades_grey
)

const b1 = multibar.create(50, 0, { name: 'test', id: 'test_id' })
let bn = 0

const b = setInterval(() => {
  b1.increment()
  bn += 1
  if (bn === 50) {
    b1.stop()
    clearInterval(b)
  }
}, 1000)

const c1 = multibar.create(50, 0, { name: 'test', id: 'test_id' })
let cn = 0

const c = setInterval(() => {
  c1.increment()
  cn += 1
  if (cn === 50) {
    c1.stop()
    clearInterval(c)
  }
}, 200)

setTimeout(() => {
  const d1 = multibar.create(50, 0, { name: 'test', id: 'test_id' })
  let dn = 0

  const d = setInterval(() => {
    d1.increment()
    dn += 1
    if (dn === 50) {
      d1.stop()
      clearInterval(d)
    }
  }, 200)
})
