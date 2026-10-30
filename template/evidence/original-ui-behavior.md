# 원본 UI/UX 관측

2026-10-29 네이버 지도/플레이스 공개 화면을 별도 조사 탭 p4에서 관측했습니다. 보존 기준 홈 화면은 기존 `naver-map-original.png`(1440×764)입니다. 아래 자료는 브라우저 관측이며, 후속 REA 픽셀 비교와 구분합니다.

| 상태/동작 | 관측 | 근거 |
|---|---|---|
| 지도 안 장소 패널 | x63, y76, 폭390px. 홈 사진210×210, 간격6px, radius16px | original-place-layout.json |
| 홈 상호/본문 | 상호600 24px/32px; 업종·영업·AI요약15px/20px. 시스템 글꼴/Apple SD Gothic Neo | original-place-type.json |
| 메뉴 탭 | 메뉴 선택 후 목록 위치로 자동 스크롤. 고정50px 상단헤더와46px 탭. 목록 오른쪽104×104 썸네일, 왼쪽 메뉴명·설명·가격 | original-menu-panel.png, original-menu-layout.json |
| 메뉴 상세 | /menu/<id>로 이동. 상단 사진384×246, 그 위 흰색 뒤로/상호. 제목600 22px, 가격20px. 해당 메뉴 관련 리뷰 표시 | original-menu-detail.png, original-menu-detail-state.json |
| 긴 리뷰 | 기본3줄 줄임, 본문과 더보기 클릭으로 인라인 확장. 더보기→접기, aria-expanded false→true, URL 유지 | original-review-expand.json, original-review-collapsed.png, original-review-expanded.png |
| 사진 뷰어 | 지도 전체 fixed overlay rgba(0,0,0,.8), 하단300px 그라데이션. 중앙 이미지. 좌우100×100 이전/다음, 우상단100×100 닫기, 우하단 +/- | original-photo-viewer.png, original-photo-viewer-state.json, original-photo-viewer.css |
| 사진 키보드/확대 | ArrowRight로 다음 사진, +1회 이미지460→506px(1.1배), Esc로 닫힘 | original-photo-viewer-actions.json |
| 메뉴판 사진 | 동일한 전체 뷰어. 1장이라 이전/다음 없음. 닫기/확대/축소만 표시 | original-menu-board-viewer.png, original-menu-board-viewer.txt |

원본 메뉴/사진 목록의 광고는 관측 시점별로 바뀌었습니다. 광고 콘텐츠 차이는 가게 아카이브 본문과 구분해야 합니다. 직접 연 플레이스 문서는 지도 부모창에 사진 열기 메시지를 보내므로, 전체 사진 뷰어 동작은 원래 지도 안에서 별도로 확인했습니다.

`original-place-layout.json`의 좌표는 패널 문서390×688 기준입니다. 전체 지도 좌표로 읽을 때 x에63, y에76을 더합니다. 다른 원본 상태도 각각 기록한 viewport/scroll 상태를 따라야 하며, 다른 상태의 픽셀 점수를 혼합하면 안 됩니다.
