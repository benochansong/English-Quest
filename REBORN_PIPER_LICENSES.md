# Piper 음성 출처와 배포 범위

검토일: 2026-11-21. 이 문서는 확인한 출처와 이 프로젝트의 배포 판단을 기록합니다. 사람의 발음 평가나 모든 국가에 대한 법률 보증은 아닙니다.

## 게임에 포함되는 음성

`en_US-ljspeech-medium`으로 원래 대본 34개를 로컬 합성했습니다. WAV와 이를 내장한 HTML만 배포합니다. 배우가 새로 녹음한 음성이나 특정 인물의 참여·보증으로 표시하지 않습니다.

- [공식 모델 카드](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD): en_US, 단일 화자, medium, 22,050 Hz, LJ Speech 데이터, public domain, 처음부터 1,000 epochs 학습. 카드 본문의 22,500 Hz 표기는 실제 설정 및 생성 WAV의 22,050 Hz와 다르므로 실제 파일 정보를 기준으로 기록했습니다.
- [제작자 Bryce Beattie의 모델 배포 페이지](https://brycebeattie.com/files/tts/): 해당 모델 자체를 public domain으로 명시하고 합법적·윤리적 이용 및 재업로드를 허용합니다. Lessac에서 파생하지 않고 처음부터 학습했다고 명시합니다.
- [LJ Speech 데이터셋](https://keithito.com/LJ-Speech-Dataset/): Keith Ito가 정리한 Linda Johnson의 LibriVox 녹음. 데이터·음성·텍스트를 미국 공개 도메인으로 설명하며 이용 제한이 없다고 안내합니다. 전 세계 모든 관할의 권리를 별도로 보증한다는 뜻은 아닙니다.
- [Piper 공식 상업적 이용 목록](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/COMMERCIAL_USE.md): `en_US-ljspeech-medium`을 제한적 학습 데이터 계보가 없는 공개 도메인 모델로 열거합니다.

위의 **데이터셋과 모델 제작자 양쪽의 공개 명시**를 근거로, 자체 작성한 게임 문장의 합성 WAV를 공개 저장소에 배포 가능한 자산으로 분류했습니다. 단순히 Piper 엔진 라이선스나 모델 저장소 전체 라이선스에서 권리를 추정하지 않았습니다. 저작자와 데이터 출처는 의무 여부와 별개로 보존합니다.

## 다운로드한 버전의 식별

모델 이름만으로 승인하지 않습니다. 아래 파일과 공식 Hugging Face LFS 해시를 대조했습니다. 향후 모델이 바뀌면 다시 검토해야 합니다.

| 파일 | 크기 | SHA-256 |
|---|---:|---|
| en_US-ljspeech-medium.onnx | 63,531,379 bytes | `6f52a751e2349abe7a76735eb09dc1875298c77ea2342ffd2fef79ff81b87f22` |
| en_US-ljspeech-medium.onnx.json | 4,972 bytes | `141d612cc0a95ed7efc1ca936b845c2364967f2e9217c5dbfcf69fc4d6c65860` |

모델 카드는 [보관 사본](docs/piper/ljspeech-MODEL_CARD.txt), 공식 파일 메타데이터는 [출처 기록](docs/piper/ljspeech-source-files.json)에 있습니다. 각 WAV 옆 JSON에는 원문, 엔진 버전, 모델/설정 해시, WAV 해시와 기술 검사 결과가 있습니다. 웹 요청은 설치·모델 다운로드에만 사용했고, 생성 및 게임 실행에는 유료 API나 외부 음성 서비스를 사용하지 않았습니다.

## Lessac 시험본: 로컬 전용

요청한 `en_US-lessac-medium`을 먼저 설치하고 5개 문장을 생성했습니다. `.piper-local/lessac-samples/`의 WAV, 영수증과 보고서는 로컬 시험용이며 Git에서 제외합니다. 최종 manifest 및 HTML에는 Lessac 음성이 없습니다.

[Lessac 모델 카드](docs/piper/lessac-MODEL_CARD.txt)는 Blizzard 2013 데이터셋을 가리킵니다. [Piper 공식 라이선스 설명](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/LICENSING.md)과 [원 데이터 이용 조건](https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html)은 연구 목적 제한과 상업적 이용 제한을 설명합니다. Lessac 생성물의 공개·상업적 배포 권리는 확인하지 않았으며, 이 프로젝트에서 공개하지 않습니다.

## 엔진과 모델은 게임에 포함하지 않음

Piper 1.8.0 엔진은 GPL-3.0-or-later입니다. `.venv-piper/`의 엔진·라이브러리와 `.piper-models/`의 두 ONNX 모델은 개발용 로컬 설치이며 Git 및 게임에 포함하지 않습니다. 사용자에게는 녹음된 합성 결과물 WAV와 단일 HTML만 필요합니다. 게임 실행에 Python, Piper, 모델 다운로드, 계정, 신용카드, 네트워크가 필요하지 않습니다.

ROWAN / ANNOUNCER / CRYSTAL은 대본상의 역할입니다. 현재 모두 같은 LJSpeech 합성 화자를 사용하며 세 배우의 별도 연기를 제공했다고 주장하지 않습니다. 사람의 청취 승인 상태는 모든 항목에서 미완료입니다.
