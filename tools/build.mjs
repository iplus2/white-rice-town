import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFile(path.join(root, file), 'utf8');
const modules = 'core materials nature architecture character town details water audio optics interface exhibit game'.split(' ');
const sky = await readFile(path.join(root, 'assets/skybake.webp'));
const pieces = await Promise.all(modules.map(async name => {
  const source = await read('src/' + name + '.js');
  return name === 'nature' ? source.replace('__BELL_SKY__', sky.toString('base64')) : source;
}));
const qa = process.argv.includes('--qa');
if (qa) pieces.push(await read('tests/qa-hook.js'));
const result = await build({
  stdin: {contents: pieces.join('\n'), resolveDir: root, sourcefile: 'entry.mjs'},
  alias: {three: path.join(root, 'node_modules/three/build/three.module.js')},
  bundle: true, minify: true, format: 'iife', target: 'es2020', legalComments: 'inline', write: false
});
const script = result.outputFiles[0].text.replaceAll('</script', '<\\/script');
const license = await read('node_modules/three/LICENSE');
const html = (await read('src/shell.html')).replace('__ENGINE__', () => '/*! ' + license + ' */\n' + script);
if (qa) await mkdir(path.join(root, '.qa'), {recursive:true});
await writeFile(path.join(root, qa ? '.qa/game.html' : '白饭小镇.html'), html);
