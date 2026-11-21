"""Local production tests, including the installed engine/model; no network or generation."""
import importlib.util
import importlib.metadata
import json
from pathlib import Path
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('production', ROOT / 'scripts/generate-reborn-voices.py')
production = importlib.util.module_from_spec(spec)
spec.loader.exec_module(production)


class PiperProductionTests(unittest.TestCase):
    def test_local_engine_and_reviewed_model(self):
        from piper import PiperVoice
        self.assertEqual(importlib.metadata.version('piper-tts'), '1.8.0')
        model = ROOT / '.piper-models/en_US-ljspeech-medium.onnx'
        source = json.loads((ROOT / 'docs/piper/ljspeech-source-files.json').read_text(encoding='utf-8-sig'))
        expected = next(x['lfs']['oid'] for x in source if x['path'].endswith('.onnx'))
        self.assertEqual(production.digest(model), expected)
        self.assertEqual(PiperVoice.load(str(model)).config.sample_rate, 22050)

    def test_every_asset_decodes_and_matches_receipt(self):
        manifest = json.loads((ROOT / 'REBORN_VOICE_MANIFEST.json').read_text(encoding='utf-8'))
        self.assertEqual(len(manifest['utterances']), 34)
        for row in manifest['utterances']:
            with self.subTest(id=row['id']):
                file = ROOT / row['path']
                actual = production.inspect_wav(file)
                self.assertEqual(actual, row['verification'])
                receipt = json.loads(file.with_suffix('.json').read_text(encoding='utf-8'))
                self.assertEqual(receipt['en'], row['en'])
                self.assertEqual(receipt['sha256'], actual['sha256'])

    def test_missing_invalid_silent_and_truncated_files_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / 'bad.wav'
            with self.assertRaises(FileNotFoundError):
                production.inspect_wav(file)
            file.write_bytes(b'not audio')
            with self.assertRaises((wave.Error, EOFError)):
                production.inspect_wav(file)
            with wave.open(str(file), 'wb') as wav:
                wav.setparams((1, 2, 22050, 0, 'NONE', ''))
                wav.writeframes(b'\0' * 44100)
            with self.assertRaisesRegex(ValueError, 'Silent'):
                production.inspect_wav(file)
            file.write_bytes(file.read_bytes()[:100])
            with self.assertRaisesRegex(ValueError, 'Truncated'):
                production.inspect_wav(file)


if __name__ == '__main__':
    unittest.main()
