# 외부 링크 썸네일 재검증 결과

기존 실패 19개 URL 중 **17개 URL을 복구**했습니다. 이 17개는 서로 다른 그림이 아니라, 같은 인스타그램 프로필 이미지에 붙은 서로 다른 만료 주소였습니다. 남은 **2개 URL은 미복구** 상태입니다.

| 대상 | URL 수 | 본문 참조 수 | 결과 | 근거 |
|---|---:|---:|---|---|
| 인스타그램 프로필 | 17 | 17 | 복구 | 과거/현재 파일명에 포함된 세 숫자 이미지 ID가 모두 일치. 현재 공개 프로필/OG 주소에서 HTTP 200 확인. |
| modoo 로고 | 1 | 15 | 미복구 | 원본 호스트 DNS 실패, 기존 네이버 썸네일 404, 공개 캐시에서 동일 파일 미확보. |
| boragomcake.com 로고 | 1 | 1 | 미복구 | apex/www DNS 실패, 기존 네이버 썸네일 404, 동일 파일 계보 확인 불가. |

## 복구 파일

- `https://ik.imagekit.io/validation-only/tr:orig-true/boragom-archive/media/recovered/instagram-original-profile-0.jpg`: 150×150, 6,573바이트. 기존 참조는 100×100이므로 확보한 공개 표시본이 더 큽니다.
- `https://ik.imagekit.io/validation-only/tr:orig-true/boragom-archive/media/recovered/instagram-original-profile-1.jpg`: 공개 OG의 100×100, 3,699바이트. 함께 보존했습니다.
- 원문 동일성은 정확히 일치하는 `294355572_479730100637979_3237889373688027522_n.jpg` 이미지 식별자로 확인했습니다. 현재 다른 프로필 그림으로 대체하지 않았습니다.

## 미복구 자료 추가 추적

[modoo 원문 주소](https://boragomcake.modoo.at/)는 공식 종료 안내를 반환합니다. [네이버 공식 공지](https://ads.naver.com/notice/18201)는 데이터 이전이 없으며 종료 전에 사용자가 백업해야 한다고 설명합니다. 실제 파일의 공개 이관·미러 근거는 찾지 못했습니다.

두 URL의 Wayback CDX 정확 경로 조회는 빈 결과였습니다. 별도 availability API는 429를 반환하여 추가 재시도를 중단했습니다. Common Crawl 최신 인덱스는 modoo 사이트 조회 404, 나머지 두 검색 504로 완전한 부재를 입증하지 못했습니다.

공개 [boragom-admin 저장소](https://github.com/ta09472/boragom-admin)에서 1378×1372 브랜드 로고 PNG를 발견했습니다. `https://ik.imagekit.io/validation-only/tr:orig-true/boragom-archive/media/recovered/github-brand-logo-unverified.png`로 별도 보존했지만, 두 실패 URL의 과거 이미지와 같은 파일이라는 증거는 없습니다. **복구 수량에 넣거나 기존 썸네일을 대체하지 않았습니다.** 이 파일은 2023-08-27 커밋에서 추가된 Next.js 관리 화면의 이미지이며, 기록된 Vercel 배포의 해당 파일은 현재 404입니다. 공개 legacy 저장소의 현재/직전 커밋에도 대응 PNG가 없었습니다.

원본 웹사이트 소스·과거 배포 파일 또는 종료 전 modoo 백업이 있으면 남은 두 파일을 추가 대조할 수 있습니다.

## 통합 안내

`thumbnail-recovery-v2.json`의 `manifest_patches` 17개를 기존 목록에 병합하면 됩니다. 기존 원본 URL을 유지하고 `set` 필드를 반영하며 `error`를 제거합니다. 17개 레코드는 같은 로컬 파일을 참조하므로 URL 수와 물리 파일 수를 구분해야 합니다. 이 조사에서는 기존 공유 manifest를 수정하지 않았습니다.

원문 공개 메타데이터, 직접/캐시/아카이브 응답 기록은 `raw/recovery-v2/`에 있습니다. 전체 쿠키, 로그인 토큰, 비공개 API 응답은 수집하지 않았습니다.
