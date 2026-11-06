import { readFile, writeFile, rename, rm } from 'node:fs/promises';
const source = name => readFile(new URL('./src/' + name, import.meta.url), 'utf8');
const styles = await Promise.all(['styles.css','ui.css','effects.css','chapter.css','village-effects.css','village.css','spoken-effects.css','voice.css'].map(source));
const scripts = await Promise.all(['questions.js','village-data.js','voice-data.js','voice-learning.js','engine.js','village-engine.js','audio.js','speech.js','art.js','village-art.js','game.js','journal.js','village-ui.js','village-controls.js','voice-ui.js','voice-controls.js','controls.js'].map(source));
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0c2426"><title>English Quest · The Lost Kingdom of Words</title>
<style>${styles.join('\n')}</style></head><body><main id="app"></main><div id="voice-live" class="sr-only" role="status" aria-live="polite"></div><dialog id="pause"></dialog><noscript>게임을 실행하려면 자바스크립트를 켜 주세요.</noscript><script>
'use strict';
${scripts.join('\n;\n')}
</script></body></html>`;
// Replace the complete bundle in one operation; a failed write leaves the previous game usable.
const output = new URL('./EnglishQuest.html', import.meta.url);
const temporary = new URL('./.EnglishQuest.' + process.pid + '.tmp', import.meta.url);
try {
  await writeFile(temporary, html, {flag:'wx'});
  await rename(temporary, output);
} finally {
  await rm(temporary, {force:true});
}
console.log('EnglishQuest.html built (' + Buffer.byteLength(html) + ' bytes)');
