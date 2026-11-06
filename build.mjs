import { readFile, writeFile } from 'node:fs/promises';
const source = name => readFile(new URL('./src/' + name, import.meta.url), 'utf8');
const styles = await Promise.all(['styles.css','ui.css','effects.css','chapter.css'].map(source));
const scripts = await Promise.all(['questions.js','engine.js','audio.js','art.js','game.js','journal.js','controls.js'].map(source));
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0c2426"><title>English Quest · The Lost Kingdom of Words</title>
<style>${styles.join('\n')}</style></head><body><main id="app"></main><dialog id="pause"></dialog><noscript>게임을 실행하려면 자바스크립트를 켜 주세요.</noscript><script>
'use strict';
${scripts.join('\n;\n')}
</script></body></html>`;
await writeFile(new URL('./EnglishQuest.html', import.meta.url), html);
console.log('EnglishQuest.html built (' + Buffer.byteLength(html) + ' bytes)');
