"""Offline Piper production. Uses exact manifest text; never downloads at generation time."""
import argparse
import array
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import sys
import wave

ROOT = Path(__file__).resolve().parent.parent
SAMPLES = ['VO_HELLO', 'VO_MOVE_LEFT', 'VO_WATCH_OUT', 'VO_ATTACK_CRYSTAL', 'VO_NEED_FIRE']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inspect_wav(path):
    with wave.open(str(path), 'rb') as wav:
        channels, width, rate, frames = wav.getnchannels(), wav.getsampwidth(), wav.getframerate(), wav.getnframes()
        if channels != 1 or width != 2 or rate != 22050 or wav.getcomptype() != 'NONE':
            raise ValueError('Expected mono 16-bit PCM WAV at 22050 Hz')
        data = wav.readframes(frames)
        if len(data) != frames * width:
            raise ValueError('Truncated PCM data')
    values = array.array('h', data)
    if sys.byteorder != 'little':
        values.byteswap()
    duration = frames / rate
    if not 0.2 <= duration <= 12 or not values:
        raise ValueError('Unreasonable utterance duration')
    peak = max(abs(v) for v in values) / 32768
    rms = math.sqrt(sum(v * v for v in values) / len(values)) / 32768
    active = sum(abs(v) > 164 for v in values) / len(values)
    if rms < 0.001 or active < 0.01:
        raise ValueError('Silent or near-silent audio')
    return dict(format='PCM WAV', sampleRate=rate, channels=channels, bits=16,
                durationSeconds=round(duration, 6), bytes=path.stat().st_size,
                peak=round(peak, 6), rms=round(rms, 6), activeFraction=round(active, 6),
                sha256=digest(path), status='Technically verified', humanListening='Needs listening review')


def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', default='docs/piper/production-report.json', help='Production report path relative to repository')
    parser.add_argument('--manifest', default='REBORN_VOICE_MANIFEST.json', help='Existing manifest or a separate quest extension manifest')
    parser.add_argument('--model', choices=['en_US-ljspeech-medium', 'en_US-lessac-medium'], default='en_US-ljspeech-medium')
    parser.add_argument('--ids', nargs='+', help='Generate/retry only these manifest IDs')
    parser.add_argument('--samples', action='store_true', help='Generate the five initial samples')
    parser.add_argument('--force', action='store_true', help='Regenerate selected files')
    parser.add_argument('--verify-only', action='store_true')
    parser.add_argument('--update-manifest', action='store_true')
    args = parser.parse_args()
    manifest_path = (ROOT / args.manifest).resolve()
    if manifest_path.parent != ROOT:
        raise ValueError('Manifest must be in the repository root')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
    rows = manifest['utterances']
    if not rows or (manifest_path.name == 'REBORN_VOICE_MANIFEST.json' and len(rows) < 34) or len({x['id'] for x in rows}) != len(rows):
        raise ValueError('Expected the original 34 entries plus unique extension entries')
    selected = args.ids or (SAMPLES if args.samples else [x['id'] for x in rows])
    if set(selected) - {x['id'] for x in rows}:
        raise ValueError('Unknown voice ID')
    local_only = args.model == 'en_US-lessac-medium'
    if local_only and args.update_manifest:
        raise ValueError('Lessac is local-only: cannot publish it in the game manifest')
    output = ROOT / ('.piper-local/lessac-samples' if local_only else 'assets/reborn/voice')
    output.mkdir(parents=True, exist_ok=True)
    model = ROOT / '.piper-models' / (args.model + '.onnx')
    config = Path(str(model) + '.json')
    if not model.is_file() or not config.is_file():
        raise FileNotFoundError('Download the model and config first with piper.download_voices')
    cfg = json.loads(config.read_text(encoding='utf-8'))
    if cfg['audio']['sample_rate'] != 22050 or cfg['num_speakers'] != 1:
        raise ValueError('Unexpected voice model configuration')
    fingerprint = dict(model=args.model, modelSha256=digest(model), configSha256=digest(config),
                       piperVersion=importlib.metadata.version('piper-tts'), synthesis='model defaults')
    if not local_only:
        reviewed = json.loads((ROOT / 'docs/piper/ljspeech-source-files.json').read_text(encoding='utf-8-sig'))
        expected_model = next(x['lfs']['oid'] for x in reviewed if x['path'].endswith('.onnx'))
        if fingerprint['modelSha256'] != expected_model or fingerprint['configSha256'] != '141d612cc0a95ed7efc1ca936b845c2364967f2e9217c5dbfcf69fc4d6c65860':
            raise ValueError('Model/config differs from the reviewed version; review provenance and licensing before generation')
    voice = None
    results, errors = [], []
    for row in rows:
        if row['id'] not in selected:
            continue
        path = output / (row['id'] + '.wav')
        receipt = path.with_suffix('.json')
        expected = dict(**fingerprint, id=row['id'], en=row['en'])
        temp = path.with_suffix('.tmp.wav')
        try:
            reusable = False
            if path.exists() and receipt.exists() and not args.force:
                prior = json.loads(receipt.read_text(encoding='utf-8'))
                reusable = all(prior.get(k) == v for k, v in expected.items()) and prior.get('sha256') == digest(path)
            if not reusable:
                if args.verify_only:
                    raise ValueError('Missing, altered, or stale audio/provenance receipt')
                if voice is None:
                    from piper import PiperVoice
                    voice = PiperVoice.load(str(model), use_cuda=False)
                with wave.open(str(temp), 'wb') as wav:
                    voice.synthesize_wav(row['en'], wav)
                inspect_wav(temp)
                os.replace(temp, path)
            info = dict(**expected, **inspect_wav(path), path=path.relative_to(ROOT).as_posix(),
                        licensing='local research only; not approved for redistribution' if local_only else 'Public-domain model and dataset; see REBORN_PIPER_LICENSES.md')
            save_json(receipt, info)
            results.append(dict(info, action='verified existing' if reusable else 'generated'))
            print(f"{row['id']}: {info['durationSeconds']:.3f}s, {info['bytes']} bytes ({'existing' if reusable else 'generated'})", flush=True)
        except Exception as error:
            errors.append(dict(id=row['id'], error=str(error)))
            print(f"FAILED {row['id']}: {error}", file=sys.stderr, flush=True)
        finally:
            temp.unlink(missing_ok=True)
    # Re-check every asset before updating availability; never trust old manifest flags.
    verified = {}
    for row in rows:
        path = output / (row['id'] + '.wav')
        try:
            receipt = json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
            info = inspect_wav(path)
            if not all(receipt.get(k) == v for k, v in dict(**fingerprint, id=row['id'], en=row['en'], sha256=info['sha256']).items()):
                raise ValueError('Stale receipt')
            verified[row['id']] = info
        except (OSError, ValueError, wave.Error, EOFError):
            pass
    missing = [r['id'] for r in rows if r['id'] not in verified]
    report = dict(required=len(rows), selected=len(selected), successful=len(results), failed=errors,
                  totalVerified=len(verified), missing=missing, totalBytes=sum(x['bytes'] for x in verified.values()),
                  **fingerprint, modelBytes=model.stat().st_size, localOnly=local_only,
                  manualListening='Needs listening review', results=results)
    report_path = output / 'production-report.json' if local_only else ROOT / args.report
    save_json(report_path, report)
    if args.update_manifest:
        for row in rows:
            row['path'] = row['normalSpeedAsset'] = f"assets/reborn/voice/{row['id']}.wav"
            row['available'] = row['id'] in verified
            row['slowSpeedAsset'] = None
            row['durationSeconds'] = verified.get(row['id'], {}).get('durationSeconds')
            row['audioSource'] = 'Locally generated Piper synthetic English speech.' if row['available'] else None
            row['audioFormat'] = 'PCM WAV'
            row['voiceModel'] = args.model
            row['accent'] = 'en-US model; pronunciation awaits human listening review'
            row['verification'] = verified.get(row['id'])
            row['license'] = dict(type='Public-domain model and dataset',
                source='https://brycebeattie.com/files/tts/', performerOrModel=args.model,
                redistributionAllowed=row['available'], status='Reviewed published model and dataset terms; see REBORN_PIPER_LICENSES.md',
                dataset='https://keithito.com/LJ-Speech-Dataset/', modelSha256=fingerprint['modelSha256'])
            # Existing human approval is retained only for the exact approved bytes.
            old_review = row.get('qualityReview', {})
            if old_review.get('approvedSha256') != verified.get(row['id'], {}).get('sha256') or not old_review.get('reviewer'):
                row['qualityReview'] = dict(status='Needs listening review', pronunciation=None, intelligibility=None, normalAndSlowListening=None, reviewer=None)
        manifest['status'] = f"{len(verified)}/{len(rows)} Piper synthetic speech assets technically verified; human listening pending"
        manifest['primary'] = 'Bundled Piper synthetic English speech (en_US-ljspeech-medium)'
        for speaker in manifest['speakers'].values():
            speaker['status'] = 'Uses the same LJSpeech synthetic voice; distinct character acting is not delivered'
        save_json(manifest_path, manifest)
    print(json.dumps({k:v for k,v in report.items() if k != 'results'}, indent=2))
    return 1 if errors or (not args.ids and not args.samples and missing) else 0


if __name__ == '__main__':
    sys.exit(main())
