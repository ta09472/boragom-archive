# 보라곰 아카이브 호스팅

GitHub Pages에 정적 화면을, ImageKit Free에 미디어를 배포합니다.
원본 오프라인 아카이브와 2026-10-30 백업/ZIP은 이 배포 사본과 별도로 유지합니다.

## 구성

- `app/`: React, TypeScript, TanStack Router, SEED Design, Biome 기반 원본 소스.
- `template/`: 검증된 오프라인 화면과 수집 목록. 미디어 경로는 아직 로컬 경로입니다.
- `media-inventory.json`: 업로드할 모든 미디어의 상대 경로, 바이트 수, SHA-256.
- `scripts/build.mjs`: 미디어 경로를 ImageKit `orig-true` 주소로 바꿔 `site/`를 생성합니다.
- `.github/workflows/pages.yml`: 미디어 검증 후 수동 실행하여 GitHub Pages에 배포합니다.

## 배포 순서

1. ImageKit 무료 계정의 기존 저장 공간과 사용량을 확인합니다.
2. 미디어를 `boragom-archive/media/` 아래에 원래 폴더와 파일명을 유지하여 업로드합니다.
3. 다운로드한 원본과 `media-inventory.json`의 SHA-256을 비교합니다.
4. `hosting.json`에 실제 계정의 공개 URL endpoint와 폴더를 기록합니다. API 키는 넣지 않습니다.
5. `node scripts/build.mjs`로 정적 배포본을 생성합니다.
6. GitHub 공개 저장소에 소스/템플릿을 게시하고 Pages Source를 GitHub Actions로 설정합니다.
7. Actions의 Publish archive 워크플로를 main 브랜치에서 실행합니다.
8. 배포된 홈·메뉴·리뷰·사진·정보와 영상 재생, 원본 다운로드를 확인합니다.

`hosting.json` 형식:

```json
{
  "imagekitEndpoint": "실제 ImageKit URL endpoint",
  "imagekitFolder": "boragom-archive"
}
```

정적 배포에는 원시 브라우저 응답 폴더 `raw/`와 MHTML 캡처를 포함하지 않습니다.
이 파일들은 전체 오프라인 원본 및 백업에 보존되어 있습니다.

## 보관 범위

호스팅은 현재 수집본을 공개하는 작업입니다. 원본에서 확인되지 않은 집계 차이 30개 및 추후 받을 로고 2개를 해결한 것으로 간주하지 않습니다. 상세 범위는 사이트의 수집 목록과 재검증결과를 참고하세요.

## 비용

ImageKit Free는 저장 3GB, 월 전송 20GB이며 무료 한도 초과 시 해당 기능이 중단됩니다.
현재 미디어는 약 2.51GB입니다. ZIP 백업은 함께 업로드하지 않습니다.
이미지·영상 URL에 `orig-true`를 사용하여 자동 변환 없이 원본을 제공합니다.
