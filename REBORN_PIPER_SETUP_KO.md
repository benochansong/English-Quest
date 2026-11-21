# 무료 오프라인 영어 음성 실행·재생·재생성

## 지금 게임 실행하기

1. 탐색기에서 `E:\Documents\ChatGPT\English Quest`를 엽니다.
2. `EnglishQuest_REBORN.html`을 오른쪽 클릭 → **연결 프로그램 → Google Chrome 또는 Microsoft Edge**를 선택합니다.
3. 게임 아래의 **영어 음성 테스트 → 영어 음성 듣기**를 누릅니다. `Hello!`를 재생합니다. 브라우저 정책상 첫 클릭 전 자동 소리는 나지 않습니다.
4. **34개 표현 미리 듣기·복습**을 펼치고 문장을 누르면 해당 영어 음성이 나옵니다. **다시 듣기**, **보통 속도**, **느리게 듣기**, **음성 정지**를 사용할 수 있습니다.
5. 소리·화면 설정에서 **전체 / 영어 음성** 음량을 조절합니다. **전체 음소거**는 해제합니다. Windows 볼륨 믹서에서 해당 브라우저와 출력 장치의 음소거도 확인합니다.

34개 WAV가 HTML 내부에 포함되어 있어 HTML 하나만 복사해도 인터넷 없이 재생됩니다. 플레이에는 Python 설치가 필요 없습니다. 처음부터 배우기 / 바로 시작으로 전투에 들어갈 수 있고, 영어 원문·한국어 뜻은 선택할 수 있습니다. 음성 테스트와 표현 목록은 진행 중인 전투를 안전하게 일시정지합니다. **기기 음성 대안**은 기본 꺼짐이며 Piper 파일 재생에 필요하지 않습니다.

## 첫 5개 문장을 바로 듣기

Windows에서 아래 파일을 더블 클릭해 기본 미디어 플레이어로 듣거나, 게임의 표현 목록에서 같은 문장을 누르세요.

- [Hello!](assets/reborn/voice/VO_HELLO.wav)
- [Move left!](assets/reborn/voice/VO_MOVE_LEFT.wav)
- [Watch out!](assets/reborn/voice/VO_WATCH_OUT.wav)
- [Attack the crystal!](assets/reborn/voice/VO_ATTACK_CRYSTAL.wav)
- [I need fire.](assets/reborn/voice/VO_NEED_FIRE.wav)

Lessac으로 먼저 만든 동일 5개 시험본은 `.piper-local/lessac-samples/`에만 있습니다. 배포 게임에는 공개 도메인 LJSpeech 음성을 넣었습니다. 모델을 선택한 근거는 음질 우열 청취 결과가 아니라 [확인한 배포 조건](REBORN_PIPER_LICENSES.md)입니다.

## 설치된 개발 환경

- Windows NT 10.0, build 26200, x64. 설치 당시 C: 약 25.9 GB, E: 약 1.16 TB 여유.
- 기존 Python **3.14.3** 사용. 전역 Python을 재설치하거나 보안 설정을 해제하지 않았습니다.
- 프로젝트 전용 `.venv-piper\Scripts\python.exe` / pip 25.3 / Piper **1.8.0** / ONNX Runtime **1.32.0**, CPU 추론.
- 모델: `.piper-models/en_US-ljspeech-medium.onnx` + `.onnx.json`. 별도로 요청한 Lessac 시험 모델도 같은 디렉터리에 있습니다.
- 개발 의존성 고정 목록: [piper-requirements.txt](scripts/piper-requirements.txt).

## 다른 Windows 개발 환경에서 설치

[공식 Piper CLI 문서](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/CLI.md)를 확인한 뒤, 프로젝트 디렉터리에서 실행합니다. Python이 없다면 python.org의 공식 설치 방법을 사용하세요. 현재 프로젝트는 기존 Python을 재사용했습니다.

```powershell
py -3.14 -m venv .venv-piper
& '.\.venv-piper\Scripts\python.exe' -m pip install -r scripts/piper-requirements.txt
& '.\.venv-piper\Scripts\python.exe' -m pip check
& '.\.venv-piper\Scripts\python.exe' -m piper --help
& '.\.venv-piper\Scripts\python.exe' -m piper.download_voices en_US-ljspeech-medium --data-dir .piper-models
```

이 PC의 Python 원본 경로는 `C:\Users\Beno Chan\AppData\Local\Python\pythoncore-3.14-64\python.exe`입니다. 활성화 스크립트 없이 가상환경 실행 파일을 직접 사용합니다. 설치와 모델 다운로드에는 인터넷이 필요하고, 이후 생성은 로컬 작업입니다. 엔진과 모델은 Git에 추가하지 마세요.

## 재생성

```powershell
# 먼저 5개만 생성하고 manifest 갱신
& '.\.venv-piper\Scripts\python.exe' scripts/generate-reborn-voices.py --samples --update-manifest

# 34개 전체: 유효한 기존 파일은 재사용, 누락/변조/대본 변경 항목만 생성
& '.\.venv-piper\Scripts\python.exe' scripts/generate-reborn-voices.py --update-manifest

# 한 항목만 강제 재생성
& '.\.venv-piper\Scripts\python.exe' scripts/generate-reborn-voices.py --ids VO_HELLO --force --update-manifest

# 합성 없이 파일·대본·해시·모델·음성 신호 검사
& '.\.venv-piper\Scripts\python.exe' scripts/generate-reborn-voices.py --verify-only

# 단일 HTML 빌드 및 원본 보호 검사
node build-reborn.mjs
node scripts/validate-reborn.mjs
```

기본 모델의 합성 설정 그대로 사용합니다. 0.75배속은 브라우저의 pitch-preserving 재생이며 별도 느린 녹음이 아닙니다. 이름만 MP3로 바꾸거나 외부 인코더를 설치하지 않았습니다. WAV 전체가 약 1.52 MB여서 압축 변환 없이도 충분히 작습니다.

개별 오류는 보고하고 다른 문장은 계속 처리합니다. 실패 시 종료코드 1이며, 보고서 `failed`/`missing`을 확인한 뒤 `--ids`로 재시도하세요. `--verify-only`는 모델/원문/파일 해시가 맞지 않으면 기존 파일을 완료로 인정하지 않습니다. `--update-manifest`는 실제 검증된 항목만 available로 설정합니다. 새로 만든 파일은 사람 청취 승인을 다시 받아야 합니다.

## 검사 실행

```powershell
node --test tests/*.test.cjs
& '.\.venv-piper\Scripts\python.exe' tests/piper-production.py
```

브라우저 검사는 Playwright 패키지와 설치된 Chrome·Edge가 있는 개발 환경에서 실행합니다. 여기서는 Codex에 이미 포함된 Playwright를 사용했습니다. `NODE_PATH`는 해당 Playwright 패키지의 부모 node_modules 경로로 설정하세요.

```powershell
$env:REBORN_BROWSER='chrome' # Edge는 'msedge'
node tests/piper-browser.cjs
node tests/piper-learning-browser.cjs
$env:REBORN_QA_OUT='docs/piper'
node tests/reborn-browser.cjs
```

## 오류 해결

- **음량이 0이거나 음소거 상태**: 전체·영어 음량과 음소거를 확인한 뒤 다시 듣기를 누르세요.
- **브라우저에서 재생 거부**: 페이지의 듣기 버튼을 직접 누르세요. 파일 오류를 기기 음성으로 몰래 대체하지 않습니다.
- **음성 파일 미포함**: manifest가 가리키는 WAV를 생성하고 HTML을 다시 빌드하세요. 파일 누락 상태를 34/34로 표시하지 않습니다.
- **Piper asset is unverified or modified**: 해당 ID를 다시 생성·검증하여 manifest의 해시를 갱신하세요. 빌더는 다른 바이트를 검증된 음성으로 포장하지 않습니다.
- 모델 해시가 다르면 새 버전의 출처·라이선스를 재검토해야 합니다. 모델을 최종 사용자에게 배포할 필요는 없습니다.

기술 검증은 발음·억양·자연스러움 승인이 아닙니다. [수동 청취 체크리스트](REBORN_PIPER_LISTENING_CHECKLIST.md)로 실제 스피커/헤드폰에서 확인하세요.
