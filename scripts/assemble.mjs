import { readFileSync, writeFileSync } from 'node:fs'

const targets = [
  ['src/data/curated.ts', 3],
]

for (const [target, count] of targets) {
  let content = ''
  for (let i = 1; i <= count; i += 1) {
    content += readFileSync(`${target}.part${i}`, 'utf8')
  }
  writeFileSync(target, content)
}
