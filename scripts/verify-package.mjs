// Type-checks a consumer against the packed tarball.
//
// vite-plugin-dts reports declaration errors but still exits 0, and
// `vue-tsc --noEmit` type-checks the source rather than the emitted .d.ts —
// so a release can ship declarations nobody can use. Compiling a real
// consumer against the tarball is the only check that sees what users see.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '..')
const work = mkdtempSync(join(tmpdir(), 'swiftvue-pkg-'))
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' })

try {
  console.log('packing…')
  const tarball = run('npm', ['pack', '--pack-destination', work], repo).trim().split('\n').pop()
  run('tar', ['-xzf', join(work, tarball), '-C', work], repo)

  const pkg = join(work, 'package')
  console.log('packed:', tarball, '→', readdirSync(pkg).join(' '))

  writeFileSync(join(work, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      skipLibCheck: false, // the point is to check OUR declarations
      types: [],
      paths: {
        // resolve the package by name, exactly as a consumer would
        swiftvue: [join(pkg, 'dist/index.d.ts')],
        vue: [join(repo, 'node_modules/vue/dist/vue.d.mts')],
        '@vue/*': [join(repo, 'node_modules/@vue/*')],
      },
    },
    files: [join(repo, 'tests/types/consumer.ts')],
  }, null, 2))

  console.log('type-checking a consumer against the tarball…')
  run(join(repo, 'node_modules/.bin/tsc'), ['-p', join(work, 'tsconfig.json')], work)
  console.log('✓ published types compile')
} catch (error) {
  const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim()
  console.error(output || error.message)
  console.error('\n✗ the packaged types do not compile for a consumer')
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
