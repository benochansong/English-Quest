# REBORN Piper 영어 음성 제작 보고서

검증일: 2026-11-21. **기술 구현 완료: 34/34개 실제 Piper 영어 합성 WAV가 오프라인 게임에서 재생됩니다.** 생성 실패·누락은 0개입니다. 사람의 청취 승인과 원어민 수준 품질 인증은 하지 않았습니다.

## 결과

- 기존 Python 3.14.3을 재사용하여 프로젝트 전용 가상환경에 Piper 1.8.0을 설치했습니다. pip check, CLI, 실제 CPU 합성, ONNX 모델 로딩이 성공했습니다.
- 요청한 Lessac으로 먼저 5개를 만들었고 연구용 로컬 폴더에 보존했습니다. 상업적 이용 제한 때문에 배포본에는 넣지 않았습니다.
- 최종 게임용 모델은 **en_US-ljspeech-medium**입니다. 제작자의 모델 자체 공개 도메인 명시, 데이터셋 출처와 처음부터 학습한 계보를 확인했습니다. [라이선스 검토](REBORN_PIPER_LICENSES.md).
- 34개 영문·한국어·ID를 변경하지 않았습니다. 모든 화자 역할은 현재 같은 모델을 사용합니다. 기본 합성 파라미터를 사용했고 인위적인 속도 증가·잔향·노이즈 제거를 적용하지 않았습니다.
- 전체 WAV: **1,517,016 bytes**, mono 16-bit PCM 22,050 Hz. 길이 0.534–1.683초. 모든 파일을 디코딩하여 비무음 신호·합리적 길이·해시·원문 영수증을 검사했습니다.
- 최종 단일 HTML: **2,207,690 bytes**. SHA-256: `32efdd50a9e434750d1ab3b6e8ce28424f8da5322252224901f8f4ce6cd87899`.
- 게임에 내장한 것은 WAV 데이터입니다. Python/Piper/ONNX/가상환경은 배포에 포함하지 않습니다. 정상 플레이는 인터넷·API 키·계정·구독이 필요 없습니다. 유료 API 사용은 0건입니다.

## 첫 5개 청취 샘플

| ID | 정확한 영문 | 최종 WAV 길이 | 크기 | 파일 |
|---|---|---:|---:|---|
| VO_HELLO | Hello! | 0.569s | 25,132 bytes | [듣기](assets/reborn/voice/VO_HELLO.wav) |
| VO_MOVE_LEFT | Move left! | 0.940s | 41,516 bytes | [듣기](assets/reborn/voice/VO_MOVE_LEFT.wav) |
| VO_WATCH_OUT | Watch out! | 0.755s | 33,324 bytes | [듣기](assets/reborn/voice/VO_WATCH_OUT.wav) |
| VO_ATTACK_CRYSTAL | Attack the crystal! | 1.161s | 51,244 bytes | [듣기](assets/reborn/voice/VO_ATTACK_CRYSTAL.wav) |
| VO_NEED_FIRE | I need fire. | 1.173s | 51,756 bytes | [듣기](assets/reborn/voice/VO_NEED_FIRE.wav) |

위 표는 게임에 포함한 LJSpeech 파일입니다. Lessac 5개 WAV는 `.piper-local/lessac-samples/`에만 있으며 총 208,604 bytes입니다. 파형 신호가 존재한다는 사실만으로 발음이 정확하거나 자연스럽다고 판정하지 않았습니다.

## 실제 실행한 검사

| 검사 | 결과 / 근거 |
|---|---|
| 수정 전 기존 검사 | 165/165 통과, 종료코드 0. 작업 시작 시 실행. |
| 최종 Node 검사 | **171/171 통과**, 실패/skip 0, 종료코드 0. [로그](docs/piper/unit-tests.log) |
| Python 로컬 생산 검사 | **3/3 통과**, 종료코드 0. 실제 Piper 설치/모델 로딩, 34 WAV 검사, 누락/비오디오/무음/잘린 파일 거부. [로그](docs/piper/python-tests.log) |
| 전체 파일 재검증 | `--verify-only`로 기존 34개를 재생성 없이 검사, 종료코드 0. 개별 ID 재사용도 확인. [생산 보고서](docs/piper/production-report.json), [로그](docs/piper/verification.log) |
| 처음 5개 Chrome·Edge | 5개 각각 실제 게임 UI 정상·반복·느린 재생, 모두 종료코드 0. [Chrome](docs/piper/chrome-samples.json), [Edge](docs/piper/msedge-samples.json) |
| 전체 34개 chrome 157.0.8103.79 | **34/34**, 각 문장 정상·반복·0.75배속, 종료코드 0. 실제 내장 resource 일치, native playing/currentTime 진행/ended, pitch 보존, 양수 음량 확인. [결과](docs/piper/chrome-full.json) |
| 전체 34개 msedge 157.0.4341.60 | **34/34**, 각 문장 정상·반복·0.75배속, 종료코드 0. 실제 내장 resource 일치, native playing/currentTime 진행/ended, pitch 보존, 양수 음량 확인. [결과](docs/piper/msedge-full.json) |
| Chrome·Edge 학습 통합 | 실제 입력으로 첫 듣기 과제 도달. 들음+도움 없음 → independent 1, 음소거+텍스트 → 0, 강제 재생 거부+텍스트 → 0. 모두 전투로 복귀. [Chrome](docs/piper/chrome-learning.json), [Edge](docs/piper/msedge-learning.json) |
| Chrome·Edge 전투 회귀 | 전체 실제 키/마우스/터치 경로, 보스 승리, 패배·재시작, 5개 화면 크기, 원본 500개 Academy smoke 통과, 종료코드 0. [Chrome](docs/piper/chrome-combat.log), [Edge](docs/piper/msedge-combat.log) |
| 저장/원본 보호 | 기존 v0.8과 Phase 1 HTML 해시 동일. 기존 전투·학습·믹서 소스 변경 없음. 브라우저의 격리 프로필에 넣은 기존 저장 문자열 불변. 사용자의 실제 브라우저 저장소를 읽거나 초기화하지 않음. |
| 오프라인 | 실제 file:// 실행 및 Playwright 네트워크 차단. 최종 음성 검사와 전체 회귀 경로에서 HTTP(S) 요청 0, uncaught pageerror 0. |
| 빌드 보호 | 다른 바이트로 변경된 WAV 및 배포 미승인 파일의 내장 거부. 실제 누락 파일은 available false 및 embedded null로 빌드. |

모든 브라우저는 설치된 Chrome/Edge를 임시 격리 프로필에서 사용했습니다. 첫 5개 검사 JSON의 HTML 해시는 중간 5개 내장본이고, full JSON은 위 최종 34개 내장본의 해시입니다. 처음 작성한 듣기 전용 자동 조작기가 검 공격 뒤 다음 키를 너무 일찍 보내 과제에 답해버린 실패가 있었습니다. 테스트가 한 번의 검격을 마칠 때까지 기다리도록 수정한 후 두 브라우저 모두 위의 학습 결과를 통과했습니다. 전투 규칙은 변경하지 않았습니다.

## 재생과 학습 동작

- 한국어 **영어 음성 테스트**: 현재 출처, 실제 내장 파일 수, 영어·전체 음량, 음소거, 보통/느린 속도, 현재 상태 표시. 테스트·재생·반복·정지 버튼 제공.
- 정상 파일이 최우선. 명시적으로 체크한 경우에만 로컬 브라우저 음성으로 대체합니다. 실패해도 원문/한국어 도움으로 계속할 수 있습니다.
- 실제 playing 이벤트가 시작된 뒤에만 heard를 기록합니다. 같은 파일의 buffering 재개를 중복 heard로 기록하지 않고, 취소된 재생의 늦은 이벤트를 무시합니다. 진단 패널이 학습 정답 문장을 자동 노출하지 않습니다.
- 음량 슬라이더는 재생 중인 파일에도 적용됩니다. 0 음량과 음소거는 정지하며 소리 없는 독립 듣기 증거를 만들지 않습니다. 재생 교체·정지·장면 전환 시 이전 파일을 중지합니다.
- 기존 mixer는 음성 재생 중 음악 0.16배, 효과음 0.35배, UI 0.45배로 낮추고 완료·중단 시 설정값으로 복원합니다. 기존 전투 효과음과 난이도는 그대로입니다.
- 느린 재생은 원본 WAV를 preservesPitch=true, playbackRate=0.75로 재생합니다. 별도로 녹음한 느린 take라고 표시하지 않습니다.

## 남은 사람 검토

**34개 모두 Needs listening review, 승인 0개.** 발음·억양·음량의 편안함·자연스러움·학습자 이해도를 사람이 듣고 확인해야 합니다. 자동 브라우저 재생은 실제 스피커의 소리, 특정 출력 장치, 원어민 품질을 증명하지 않습니다. [34개 수동 체크리스트](REBORN_PIPER_LISTENING_CHECKLIST.md). 세 역할의 별도 연기와 초보자 플레이 평가는 미완료입니다.

## 실행 및 Git 전달

탐색기에서 `E:\Documents\ChatGPT\English Quest\EnglishQuest_REBORN.html`을 오른쪽 클릭 → **연결 프로그램 → Chrome 또는 Edge**. 게임의 **영어 음성 테스트 → 영어 음성 듣기**를 누르세요. 전체 표현은 **34개 표현 미리 듣기·복습**에서 들을 수 있습니다. [자세한 실행/재생성 안내](REBORN_PIPER_SETUP_KO.md).

전용 브랜치: `feature/reborn-piper-voice`, 기준 Phase 2 `f9f676363372f3d93a25dafe8c9d542ecc943f17`. 기존 PR을 보존하고 별도 Draft PR로 전달합니다. 자동 병합·force push 없음. `.venv-piper/`, `.piper-models/`, `.piper-local/`은 Git 제외. 배포 가능한 LJSpeech WAV와 코드·문서·검사만 전달합니다.
