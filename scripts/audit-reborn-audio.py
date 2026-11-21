"""Read-only PCM inventory; numerical flags are not pronunciation approval."""
import array, hashlib, json, math, pathlib, wave
root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'REBORN_VOICE_MANIFEST.json').read_text(encoding='utf-8'))
rows = []
for item in manifest['utterances']:
    file = root / item['path']
    with wave.open(str(file), 'rb') as wav:
        assert wav.getsampwidth() == 2 and wav.getnchannels() == 1
        rate = wav.getframerate()
        samples = array.array('h', wav.readframes(wav.getnframes()))
    peak = max(abs(v) for v in samples) / 32768
    rms = math.sqrt(sum((v / 32768)**2 for v in samples) / len(samples))
    active = [i for i, v in enumerate(samples) if abs(v) > 327]
    run = longest = 0
    for v in samples:
        run = run + 1 if abs(v) >= 32760 else 0
        longest = max(longest, run)
    sha = hashlib.sha256(file.read_bytes()).hexdigest()
    assert sha == item['verification']['sha256']
    receipt = json.loads(file.with_suffix('.json').read_text(encoding='utf-8'))
    rows.append(dict(id=item['id'],text=item['en'],speaker=item['speaker'],model=item['voiceModel'],
        sha256=sha,duration=len(samples)/rate,peakDb=20*math.log10(peak),rmsDb=20*math.log10(rms),
        leadingSilenceMs=active[0]/rate*1000,trailingSilenceMs=(len(samples)-1-active[-1])/rate*1000,
        nearFullScaleSamples=sum(abs(v)>=32760 for v in samples),longestFullScaleRun=longest,
        redistributionAllowed=item['license']['redistributionAllowed'],humanListening='pending',receiptPresent=bool(receipt)))
report=dict(recordings=len(rows),distinctModels=len(set(x['model'] for x in rows)),humanApproved=0,
    analysis='PCM peak/RMS and -40 dBFS silence threshold; not LUFS or a listening judgment',
    regeneration='None: no confirmed pronunciation defect; preserve originals pending human review',rows=rows)
out=root/'docs/reborn-phase5/audio-audit.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(count=len(rows),rmsRangeDb=[min(x['rmsDb'] for x in rows),max(x['rmsDb'] for x in rows)],longestFullScaleRun=max(x['longestFullScaleRun'] for x in rows),maxTrailingMs=max(x['trailingSilenceMs'] for x in rows))))
