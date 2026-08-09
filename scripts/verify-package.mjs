// Type-checks a consumer against the packed tarball.
//
// vite-plugin-dts reports declaration errors but still exits 0, and
// `vue-tsc --noEmit` type-checks the source rather than the emitted .d.ts —
// so a release can ship declarations nobody can use. Compiling a real
// consumer against the tarball is the only check that sees what users see.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const repo = resolve(import.meta.dirname, '..')
const work = mkdtempSync(join(tmpdir(), 'swiftvue-pkg-'))
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' })

/**
 * Types are only half of what a consumer needs. This builds a real app
 * against the tarball, which is what catches an export map pointing at a
 * file that was never emitted — `swiftvue/styles` did exactly that once,
 * and every type check passed while `import 'swiftvue/styles'` failed on
 * install.
 *
 * The dependencies are symlinked rather than installed: nothing here needs
 * a registry, and a verification step that needs the network is one that
 * fails for reasons of its own.
 */
function buildConsumerApp(pkg) {
  const app = join(work, 'app')
  mkdirSync(join(app, 'src'), { recursive: true })
  mkdirSync(join(app, 'node_modules'), { recursive: true })
  // Copied, not linked: a bundler resolves a symlink to its real path, and
  // swiftvue's own `import 'vue'` would then be looked up next to the
  // tarball rather than next to the app — which is not where an install
  // puts it.
  cpSync(pkg, join(app, 'node_modules/swiftvue'), { recursive: true })
  symlinkSync(join(repo, 'node_modules/vue'), join(app, 'node_modules/vue'), 'dir')

  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }))
  writeFileSync(join(app, 'index.html'),
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>')
  writeFileSync(join(app, 'src/main.ts'), [
    "import { createApp, h } from 'vue'",
    "import { SwiftVuePlugin, VStack, Text, Button, NavigationStack, useAppStorage } from 'swiftvue'",
    "import 'swiftvue/styles'",
    '',
    '// the plugin path and the named-import path, since apps use both',
    'const app = createApp({',
    '  setup() {',
    "    const name = useAppStorage('consumer-name', 'world')",
    '    return () => h(NavigationStack, { title: name.value }, () => [',
    "      h(VStack, { spacing: 12, foregroundColor: 'red' }, () => [",
    "        h(Text, { font: 'largeTitle' }, () => 'Hello'),",
    "        h(Button, { buttonStyle: 'borderedProminent' }, () => 'Tap'),",
    '      ]),',
    '    ])',
    '  },',
    '})',
    'app.use(SwiftVuePlugin)',
    "app.mount('#app')",
  ].join('\n'))

  console.log('building a consumer app against the tarball…')
  run(join(repo, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error'], app)

  const dist = join(app, 'dist/assets')
  const files = readdirSync(dist)
  const css = files.filter(f => f.endsWith('.css')).map(f => readFileSync(join(dist, f), 'utf8')).join('')
  const js = files.filter(f => f.endsWith('.js')).map(f => readFileSync(join(dist, f), 'utf8')).join('')

  if (!css.includes('--swift-')) throw new Error('swiftvue/styles produced no theme tokens')
  if (!js.includes('swift-list') && !js.includes('nav-pane')) throw new Error('no component markup reached the bundle')
  console.log('✓ a consumer app builds, styles and all')
}

/**
 * Half the ecosystem still requires(). Run from inside the consumer app and
 * by package name, so the export map picks the build and `vue` resolves the
 * way it would for a real dependent.
 */
function loadInCommonJS() {
  const app = join(work, 'app')
  const probe = join(app, 'cjs-probe.cjs')
  writeFileSync(probe, [
    "const sv = require('swiftvue')",
    "if (typeof sv.SwiftVuePlugin?.install !== 'function') throw new Error('the plugin did not survive the CommonJS build')",
    "if (!sv.VStack) throw new Error('components missing from the CommonJS build')",
  ].join('\n'))
  run(process.execPath, [probe], app)
  console.log('✓ the CommonJS build loads')
}

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

  buildConsumerApp(pkg)
  loadInCommonJS()
} catch (error) {
  const output = [error.stdout, error.stderr].filter(Boolean).join('\n').trim()
  console.error(output || error.message)
  console.error('\n✗ the package does not work for a consumer')
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
