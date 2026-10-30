import { ActionButton } from "@seed-design/react";
import "@seed-design/css/all.css";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  ArrowUpRight,
  Bus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Grid3X3,
  Info,
  Layers,
  LocateFixed,
  type LucideIcon,
  MapPin,
  Maximize2,
  Minus,
  MoreHorizontal,
  Navigation,
  Plus,
  Printer,
  Ruler,
  Search,
  Share2,
  Star,
  TrainFront,
  TramFront,
  UserRound,
  X,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import rawData from "./data.json";
import homeEvidence from "./home-evidence.json";
import referenceThumbnails from "./reference-thumbnails.json";
import sourceIcons from "./source-icons.json";
import "./style.css";

type Media = {
  src: string;
  original: string;
  alt: string;
  kind: string;
  width: number;
  height: number;
};
type Review = {
  id: string;
  author: string;
  avatar: Media;
  authorReviews: number;
  body: string;
  visited: string;
  created: string;
  sortDate: string;
  visitCount: number;
  originType: string;
  keywords: { name: string; icon: Media }[];
  visitCategories: string[];
  reply: { body: string; date: string } | null;
  media: Media[];
};
type Photo = Media & {
  id: string;
  category: string;
  author: string;
  caption: string;
  date: string;
  video: Media | null;
};
type Menu = {
  id: string;
  name: string;
  description: string;
  price: string;
  images: Media[];
};
type Blog = {
  id: string;
  title: string;
  author: string;
  date: string;
  preview: string;
  thumb: Media;
  text: string;
  html: string;
  images: Media[];
  videos: Media[];
};
type Data = {
  place: {
    name: string;
    category: string;
    address: string;
    jibun: string;
    road: string;
    phone: string;
    description: string;
    micro: string;
    conveniences: string[];
    keywords: string[];
    hours: { day: string; text: string }[];
  };
  topPhotos: Media[];
  menus: Menu[];
  menuBoards: Media[];
  feeds: {
    id: string;
    title: string;
    body: string;
    date: string;
    category: string;
    images: Media[];
  }[];
  reviews: Review[];
  blogs: Blog[];
  photos: Photo[];
  clip: Media;
  clipDescription: string;
  counts: { images: number; videos: number; missing: number };
};
const data = rawData as unknown as Data;
const context = createContext<{
  openMedia: (items: Media[], index?: number) => void;
  openBlog: (id: string) => void;
  notify: (text: string) => void;
  reviewTab: string;
  setReviewTab: (tab: string) => void;
  photoFilter: string;
  setPhotoFilter: (filter: string) => void;
}>({
  openMedia: () => {},
  openBlog: () => {},
  notify: () => {},
  reviewTab: "visitor",
  setReviewTab: () => {},
  photoFilter: "all",
  setPhotoFilter: () => {},
});
const useArchive = () => useContext(context);
const tabs = [
  ["/", "홈"],
  ["/feed", "소식"],
  ["/menu", "메뉴"],
  ["/review", "리뷰"],
  ["/photo", "사진"],
  ["/information", "정보"],
] as const;
const mapToolPositions: Record<string, string> = {
  테마: "-215px -149px",
  저장: "-172px -61px",
  지적편집도: "-301px -61px",
  거리뷰: "-43px -105px",
  반경: "-258px -105px",
  면적: "-210px 0px",
  거리: "-43px -61px",
  다운로드: "-344px -105px",
  인쇄: "-129px -105px",
};
const mediaName = (m: Media) => m.src.split("/").pop() || "보라곰";
type SourceIconName = keyof typeof sourceIcons;
function SourceIcon({
  name,
  className = "",
}: {
  name: SourceIconName;
  className?: string;
}) {
  const icon = sourceIcons[name];
  return (
    <svg
      aria-hidden="true"
      className={`source-icon source-${name} ${className}`}
      viewBox={icon.viewBox}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: icon.markup }}
    />
  );
}
const iconLabels: Record<string, SourceIconName> = {
  "이전 페이지": "back",
  홈으로: "back",
  "메뉴 목록으로": "back",
  저장: "save",
  "저장 해제": "save",
  "패널 닫기": "close",
  "메뉴 닫기": "close",
  "보관된 중심 위치로 돌아가기": "locate",
};
function Picture({
  media,
  className = "",
  eager = false,
  reference = false,
}: {
  media: Media | undefined;
  className?: string;
  eager?: boolean;
  reference?: boolean;
}) {
  return media?.src ? (
    <img
      className={className}
      src={
        reference
          ? referenceThumbnails.find((t) => t.original === media.original)
              ?.path || media.src
          : media.src
      }
      alt={media.alt || "보라곰 사진"}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  ) : (
    <span className={`image-unavailable ${className}`}>
      <Info size={18} />
      보관 이미지 없음
    </span>
  );
}
function IconButton({
  icon: Icon,
  label,
  onClick,
  className = "",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`icon-button ${className}`}
      onClick={onClick}
    >
      {iconLabels[label] ? (
        <SourceIcon name={iconLabels[label]} />
      ) : (
        <Icon size={23} strokeWidth={1.8} />
      )}
    </button>
  );
}
function Dialog({
  children,
  onClose,
  className = "",
  label,
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const before = document.activeElement;
    return () => {
      ref.current?.close();
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={className}
      aria-label={label}
      onCancel={onClose}
    >
      {children}
    </dialog>
  );
}
function App() {
  const [reviewTab, setReviewTab] = useState("visitor");
  const [photoFilter, setPhotoFilter] = useState("all");
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const scroller = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(
    () => localStorage.getItem("boragom-saved") === "true",
  );
  const [collapsed, setCollapsed] = useState(false);
  const [compact, setCompact] = useState(false);
  const [viewer, setViewer] = useState<{
    items: Media[];
    index: number;
  } | null>(null);
  const [blog, setBlog] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null,
  );
  useEffect(() => {
    scroller.current?.scrollTo({ top: path === "/" ? 0 : 398 });
    setCompact(path !== "/");
  }, [path]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const openMedia = (items: Media[], index = 0) => {
    if (items.length) setViewer({ items, index });
  };
  const toggleSaved = () => {
    const value = !saved;
    setSaved(value);
    localStorage.setItem("boragom-saved", String(value));
    setToast(
      value
        ? "이 기기의 보관함에 저장했습니다."
        : "이 기기의 저장을 해제했습니다.",
    );
  };
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return [
      ...data.menus
        .filter((m) => (m.name + m.description).toLowerCase().includes(q))
        .map((m) => ({
          id: m.id,
          type: "메뉴",
          text: m.name,
          path: "/menu" as const,
        })),
      ...data.reviews
        .filter((r) => (r.body + r.author).toLowerCase().includes(q))
        .slice(0, 8)
        .map((r) => ({
          id: r.id,
          type: "리뷰",
          text: r.body || r.author,
          path: "/review" as const,
        })),
      ...data.blogs
        .filter((b) => (b.title + b.text).toLowerCase().includes(q))
        .slice(0, 5)
        .map((b) => ({
          id: b.id,
          type: "블로그",
          text: b.title,
          path: "/review" as const,
        })),
    ];
  }, [search]);
  return (
    <context.Provider
      value={{
        openMedia,
        openBlog: setBlog,
        notify: setToast,
        reviewTab,
        setReviewTab,
        photoFilter,
        setPhotoFilter,
      }}
    >
      <div className="app">
        <div
          className="map-surface"
          role="img"
          aria-label="보라곰 주변에 보관한 네이버 지도. 마우스로 이동하고 확대할 수 있습니다."
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setPan({
              x: Math.max(
                -500,
                Math.min(500, drag.current.px + e.clientX - drag.current.x),
              ),
              y: Math.max(
                -350,
                Math.min(350, drag.current.py + e.clientY - drag.current.y),
              ),
            });
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          style={{ cursor: drag.current ? "grabbing" : "grab" }}
        >
          <img
            src="evidence/map-background.png"
            alt=""
            className="map-image"
            draggable={false}
            style={{
              transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            }}
          />
        </div>
        <aside className="side-nav" aria-label="지도 메뉴">
          <button
            className="nav-logo"
            type="button"
            aria-label="네이버 지도 홈"
            onClick={() => navigate({ to: "/" })}
          >
            N
          </button>
          <div className="nav-main">
            {(
              [
                [MapPin, "지도 홈"],
                [Navigation, "길찾기"],
                [Bus, "버스"],
                [TramFront, "지하철"],
                [TrainFront, "기차"],
                [Star, "저장"],
                [MoreHorizontal, "더보기"],
              ] as [LucideIcon, string][]
            ).map(([_Icon, label]) => (
              <button
                type="button"
                key={label}
                onClick={() =>
                  label === "지도 홈"
                    ? navigate({ to: "/" })
                    : label === "저장"
                      ? toggleSaved()
                      : setHelp(true)
                }
              >
                <SourceIcon
                  name={
                    (
                      {
                        "지도 홈": "mapHome",
                        길찾기: "navDirections",
                        버스: "bus",
                        지하철: "subway",
                        기차: "train",
                        저장: "navSaved",
                        더보기: "more",
                      } as Record<string, SourceIconName>
                    )[label]
                  }
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="nav-bottom">
            <IconButton
              icon={UserRound}
              label="보관본 안내"
              onClick={() => setHelp(true)}
            />
            <IconButton
              icon={Grid3X3}
              label="전체 수집 목록"
              onClick={() => {
                window.location.href = "수집목록.html";
              }}
            />
          </div>
        </aside>
        <section
          className={`place-panel ${collapsed ? "collapsed" : ""} ${compact ? "is-compact" : ""}`}
          aria-label="보라곰 플레이스"
        >
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchOpen(true);
            }}
          >
            <Search size={20} />
            <input
              aria-label="보관 자료 검색"
              placeholder="네이버지도 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => search && setSearchOpen(true)}
            />
            {search && (
              <button
                type="button"
                aria-label="검색어 지우기"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
              >
                <X size={17} />
              </button>
            )}
          </form>
          {searchOpen && search && (
            <div className="search-results">
              <div className="search-results-title">
                보관 자료 검색{" "}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="검색 결과 닫기"
                >
                  <X size={18} />
                </button>
              </div>
              {results.length ? (
                results.map((r) => (
                  <button
                    type="button"
                    key={r.type + r.id}
                    onClick={() => {
                      setSearchOpen(false);
                      if (r.type === "블로그") setBlog(r.id);
                      else navigate({ to: r.path });
                    }}
                  >
                    <small>{r.type}</small>
                    <span>{r.text}</span>
                  </button>
                ))
              ) : (
                <p>검색 결과가 없습니다.</p>
              )}
            </div>
          )}
          {compact && (
            <div className="compact-header">
              <IconButton
                icon={ChevronLeft}
                label="홈으로"
                onClick={() => navigate({ to: "/" })}
              />
              <span>{data.place.name}</span>
              <IconButton icon={Star} label="저장" onClick={toggleSaved} />
              <IconButton
                icon={X}
                label="패널 닫기"
                onClick={() => setCollapsed(true)}
              />
            </div>
          )}
          <div
            className="place-scroll"
            ref={scroller}
            onScroll={(e) => setCompact(e.currentTarget.scrollTop > 350)}
          >
            <header className="place-heading">
              <div className="place-toolbar">
                <IconButton
                  icon={ChevronLeft}
                  label="이전 페이지"
                  onClick={() => navigate({ to: "/" })}
                />
                <div>
                  <IconButton
                    icon={Star}
                    label={saved ? "저장 해제" : "저장"}
                    className={saved ? "saved" : ""}
                    onClick={toggleSaved}
                  />
                  <IconButton
                    icon={X}
                    label="패널 닫기"
                    onClick={() => setCollapsed(true)}
                  />
                </div>
              </div>
              <div className="identity">
                <h1>{data.place.name}</h1>
                <div>
                  {data.place.category}
                  <span className="dot">·</span>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/review" })}
                  >
                    리뷰 266
                  </button>
                </div>
                <p className="hours-status">
                  <strong>영업 종료</strong>
                  <span className="dot">·</span>11:00에 영업 시작
                </p>
                <div className="ai-summary">
                  {data.place.micro}
                  <button
                    type="button"
                    onClick={() =>
                      setToast(
                        "네이버 플레이스에 표시되었던 AI 요약 문구를 보관했습니다.",
                      )
                    }
                  >
                    AI 요약
                    <SourceIcon name="aiInfo" />
                  </button>
                </div>
              </div>
              <section className="hero-strip" aria-label="대표 사진">
                {data.topPhotos.map((m, i) => (
                  <button
                    type="button"
                    key={m.src}
                    onClick={() => {
                      setPhotoFilter(
                        i === 2 ? "clip" : i > 4 ? "review" : "business",
                      );
                      navigate({ to: "/photo" });
                    }}
                    aria-label={`대표 사진 ${i + 1} 사진 탭에서 보기`}
                  >
                    <Picture media={m} eager={i < 2} reference />
                  </button>
                ))}
              </section>
              <div className="actions">
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action start"
                  onClick={() =>
                    setToast(
                      "출발 위치: 보라곰 케이크 · 실시간 길찾기는 원본 서비스에서 이용할 수 있습니다.",
                    )
                  }
                >
                  출발
                </ActionButton>
                <ActionButton
                  size="small"
                  className="nav-action arrival"
                  onClick={() => {
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                    setToast("보관된 보라곰 케이크 위치입니다.");
                  }}
                >
                  도착
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() => setHelp(true)}
                >
                  <SourceIcon name="street" />
                  거리뷰
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(
                        "보라곰 주문제작&레터링케이크 · 서울 마포구 신촌로2안길 12",
                      )
                      .then(() => setToast("가게 정보를 복사했습니다."))
                      .catch(() =>
                        setToast("주소: 서울 마포구 신촌로2안길 12"),
                      );
                  }}
                >
                  <SourceIcon name="share" />
                  공유
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() =>
                    setToast(
                      "폐업 전 플레이스를 보관한 오프라인 아카이브입니다.",
                    )
                  }
                >
                  <SourceIcon name="bell" />
                  알림받기
                </ActionButton>
              </div>
            </header>
            <nav className="place-tabs" aria-label="플레이스 탭">
              {tabs.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  activeProps={{ className: "active" }}
                  activeOptions={{ exact: true }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <main>
              <Outlet />
            </main>
            <footer className="place-footer">
              <div>
                <button type="button" onClick={() => setHelp(true)}>
                  보관본 안내
                </button>
                <a href="수집목록.html">전체 수집 목록</a>
                <a href="inventory/coverage.json">수집 검증</a>
              </div>
              <span className="footer-naver">NAVER</span>
              <small>2026.10.28–29 보관</small>
            </footer>
          </div>
          {compact && (
            <div className="sticky-place-actions">
              <div className="actions">
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action start"
                  onClick={() =>
                    setToast(
                      "출발 위치: 보라곰 케이크 · 실시간 길찾기는 원본 서비스에서 이용할 수 있습니다.",
                    )
                  }
                >
                  출발
                </ActionButton>
                <ActionButton
                  size="small"
                  className="nav-action arrival"
                  onClick={() => {
                    setPan({ x: 0, y: 0 });
                    setZoom(1);
                    setToast("보관된 보라곰 케이크 위치입니다.");
                  }}
                >
                  도착
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() => setHelp(true)}
                >
                  <SourceIcon name="street" />
                  거리뷰
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(
                        "보라곰 주문제작&레터링케이크 · 서울 마포구 신촌로2안길 12",
                      )
                      .then(() => setToast("가게 정보를 복사했습니다."))
                      .catch(() =>
                        setToast("주소: 서울 마포구 신촌로2안길 12"),
                      );
                  }}
                >
                  <SourceIcon name="share" />
                  공유
                </ActionButton>
                <ActionButton
                  size="small"
                  variant="neutralWeak"
                  className="nav-action"
                  onClick={() =>
                    setToast(
                      "폐업 전 플레이스를 보관한 오프라인 아카이브입니다.",
                    )
                  }
                >
                  <SourceIcon name="bell" />
                  알림받기
                </ActionButton>
              </div>
            </div>
          )}
        </section>
        <button
          className={`collapse-handle ${collapsed ? "is-collapsed" : ""}`}
          type="button"
          aria-label={collapsed ? "플레이스 패널 펼치기" : "플레이스 패널 접기"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <div className="map-types">
          <button
            type="button"
            className="selected"
            onClick={() => setToast("보관된 일반지도입니다.")}
          >
            <span
              className="map-thumb"
              style={{ backgroundImage: "url(evidence/map-type-normal.png)" }}
            />
            일반지도
          </button>
          <button
            type="button"
            onClick={() =>
              setToast("위성지도는 이번 보관 범위에 포함되지 않았습니다.")
            }
          >
            <span
              className="map-thumb satellite"
              style={{
                backgroundImage: "url(evidence/map-type-satellite.png)",
              }}
            />
            위성지도
          </button>
          <button
            type="button"
            onClick={() =>
              setToast("지형지도는 이번 보관 범위에 포함되지 않았습니다.")
            }
          >
            <span
              className="map-thumb terrain"
              style={{ backgroundImage: "url(evidence/map-type-terrain.png)" }}
            />
            지형지도
          </button>
        </div>
        <div className="map-tools">
          {(
            [
              [Layers, "테마"],
              [Star, "저장"],
              [Grid3X3, "지적편집도"],
              [MapPin, "거리뷰"],
              [Ruler, "반경"],
              [Maximize2, "면적"],
              [Ruler, "거리"],
              [Download, "다운로드"],
              [Printer, "인쇄"],
              [Share2, "공유"],
            ] as [LucideIcon, string][]
          ).map(([Icon, label], i) => (
            <button
              type="button"
              className={i === 4 || i === 7 ? "new-group" : ""}
              key={label}
              onClick={() =>
                label === "저장"
                  ? toggleSaved()
                  : label === "인쇄"
                    ? window.print()
                    : label === "다운로드"
                      ? window.location.assign("수집목록.html")
                      : setHelp(true)
              }
            >
              {mapToolPositions[label] ? (
                <span
                  className="map-source-sprite"
                  role="img"
                  aria-label={label}
                  style={{
                    backgroundPosition: mapToolPositions[label],
                    backgroundImage: "url(assets/ui/common@2x.png)",
                  }}
                />
              ) : (
                <>
                  <Icon size={18} strokeWidth={1.3} />
                  <span>{label}</span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="zoom-tools">
          <IconButton
            icon={LocateFixed}
            label="보관된 중심 위치로 돌아가기"
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setZoom(1);
            }}
          />
          <div>
            <IconButton
              icon={Plus}
              label="지도 확대"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            />
            <IconButton
              icon={Minus}
              label="지도 축소"
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
            />
          </div>
        </div>
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
        {viewer && (
          <Gallery
            items={viewer.items}
            initial={viewer.index}
            onClose={() => setViewer(null)}
          />
        )}
        {blog && (
          <BlogDialog
            blog={data.blogs.find((b) => b.id === blog)}
            onClose={() => setBlog(null)}
          />
        )}
        {help && (
          <Dialog
            label="보관본 안내"
            className="help-dialog"
            onClose={() => setHelp(false)}
          >
            <div className="dialog-heading">
              <h2>보라곰 플레이스 보관본</h2>
              <IconButton
                icon={X}
                label="닫기"
                onClick={() => setHelp(false)}
              />
            </div>
            <p>
              가게의 사진과 리뷰, 메뉴와 소식을 인터넷 연결 없이 다시 볼 수
              있도록 보관했습니다.
            </p>
            <dl>
              <dt>보관한 기록</dt>
              <dd>
                방문자 리뷰 238개 · 블로그 원문 28개 · 메뉴 9개
                <br />
                전체 영상 15개 · 사진·GIF와 미리보기
              </dd>
              <dt>확인되지 않은 부분</dt>
              <dd>
                네이버 홈 집계 462개와 실제 방문자 이미지 432개의 차이 30개는
                원인을 확인하지 못했습니다. 블로그 외부 링크 이미지{" "}
                {data.counts.missing}개는 원본에 접근할 수 없었습니다.
              </dd>
              <dt>지도</dt>
              <dd>
                보관한 지도 범위 안에서 이동·확대할 수 있습니다. 실시간
                길찾기·위성지도·거리뷰는 보관되어 있지 않습니다.
              </dd>
            </dl>
            <a className="primary-link" href="수집목록.html">
              전체 목록과 파일 확인 <ArrowUpRight size={16} />
            </a>
          </Dialog>
        )}
      </div>
    </context.Provider>
  );
}
function Gallery({
  items,
  initial,
  onClose,
}: {
  items: Media[];
  initial: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initial);
  const [fit, setFit] = useState(true);
  const [imageZoom, setImageZoom] = useState(1);
  const item = items[index];
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [items.length]);
  return (
    <Dialog
      label="사진 및 영상 보기"
      className="gallery-dialog"
      onClose={onClose}
    >
      <header>
        <span>
          {index + 1} / {items.length}
        </span>
        <div>
          <a
            href={item.src}
            download={mediaName(item)}
            aria-label="원본 파일 저장"
          >
            <Download size={22} />
          </a>
          <IconButton
            icon={Maximize2}
            label="사진 크기 전환"
            onClick={() => setFit(!fit)}
          />
          <IconButton icon={X} label="사진 닫기" onClick={onClose} />
        </div>
      </header>
      <div
        className={`gallery-stage ${fit ? "fit" : "actual"}`}
        style={{ "--image-zoom": imageZoom } as React.CSSProperties}
      >
        {item.kind === "video" ? (
          <video
            key={item.src}
            src={item.src}
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : (
          <Picture media={item} eager />
        )}
      </div>
      {items.length > 1 && (
        <>
          <IconButton
            icon={ChevronLeft}
            label="이전 사진"
            className="gallery-prev"
            onClick={() => setIndex((index - 1 + items.length) % items.length)}
          />
          <IconButton
            icon={ChevronRight}
            label="다음 사진"
            className="gallery-next"
            onClick={() => setIndex((index + 1) % items.length)}
          />
        </>
      )}
      <div className="gallery-zoom">
        <IconButton
          icon={Plus}
          label="사진 확대"
          onClick={() => setImageZoom((z) => Math.min(4, z + 0.1))}
        />
        <IconButton
          icon={Minus}
          label="사진 축소"
          onClick={() => setImageZoom((z) => Math.max(0.5, z - 0.1))}
        />
      </div>
      <p className="gallery-caption">
        {item.alt}{" "}
        <small>{item.width > 0 ? `${item.width} × ${item.height}` : ""}</small>
      </p>
    </Dialog>
  );
}
function HomePage() {
  const { openMedia, openBlog, setReviewTab, setPhotoFilter } = useArchive();
  const navigate = useNavigate();
  const visitorPhotos = homeEvidence.homeGridPhotos.map((p) => ({
    ...p,
    kind: "image",
    alt: "방문자 사진",
    width: 0,
    height: 0,
  }));
  const homeReviews = homeEvidence.homeReviewIds
    .map((id) => data.reviews.find((r) => r.id === id))
    .filter((r): r is Review => Boolean(r));
  const clipPhoto = data.photos.find((p) => p.category === "clip");
  const homeBlogs = ["223778773681", "223739046970", "223066915610"]
    .map((id) => data.blogs.find((b) => b.id === id))
    .filter((b): b is Blog => Boolean(b));
  const [hours, setHours] = useState(false);
  const [address, setAddress] = useState(false);
  const { notify } = useArchive();
  return (
    <>
      <section className="home-details">
        <div className="info-row">
          <SourceIcon name="address" />
          <div>
            <button
              type="button"
              className="plain-info"
              onClick={() => setAddress(!address)}
            >
              {data.place.address}
              <ChevronDown size={15} />
            </button>
            {address && <p className="subtext">지번 {data.place.jibun}</p>}
            <div className="transit">
              <b>2</b>
              <b>공항</b>
              <b>경의중앙</b>
              <span>홍대입구역 5번 출구에서 77m</span>
            </div>
          </div>
        </div>
        <div className="info-row">
          <SourceIcon name="directions" />
          <span>{data.place.road}</span>
        </div>
        <div className="info-row">
          <SourceIcon name="hours" />
          <div>
            <button
              type="button"
              className="plain-info"
              onClick={() => setHours(!hours)}
            >
              영업 종료<span className="dot">·</span>11:00에 영업 시작
              <ChevronDown size={15} />
            </button>
            {hours && (
              <div className="hours-list">
                {data.place.hours.map((h) => (
                  <p key={h.day}>
                    <span>{h.day}</span>
                    {h.text}
                  </p>
                ))}
                <small>마지막픽업시간=마감시간</small>
              </div>
            )}
          </div>
        </div>
        <div className="info-row">
          <SourceIcon name="phone" />
          <div>
            {data.place.phone}
            <Info size={13} className="inline-icon" />
            <button
              className="copy"
              type="button"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(data.place.phone)
                  .then(() => notify("전화번호를 복사했습니다."))
                  .catch(() => notify(data.place.phone))
              }
            >
              복사
            </button>
          </div>
        </div>
        <div className="info-row">
          <SourceIcon name="amenities" />
          <span>{data.place.conveniences.join(", ")}</span>
        </div>
        <Link to="/information" className="more-row">
          정보 더보기
          <ChevronRight size={16} />
        </Link>
      </section>
      <section className="home-section">
        <h2>
          <Link to="/menu">
            메뉴 <span>9</span>
            <ChevronRight size={18} />
          </Link>
          <button
            type="button"
            className="menu-board-link"
            onClick={() => openMedia(data.menuBoards)}
          >
            메뉴판 이미지
          </button>
        </h2>
        <div className="home-menu-grid">
          {data.menus.slice(0, 4).map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() =>
                navigate({ to: "/menu/$menuId", params: { menuId: m.id } })
              }
            >
              <Picture media={m.images[0]} />
              <strong>{m.name}</strong>
              <span>{m.price}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="home-source-ad" aria-hidden="true" />
      <section className="home-section home-clips">
        <h2>
          <Link to="/photo" onClick={() => setPhotoFilter("clip")}>
            클립
            <ChevronRight size={18} />
          </Link>
        </h2>
        <button
          type="button"
          className="home-clip-card"
          onClick={() => openMedia([data.clip])}
        >
          <video
            src="media/videos/06b9a7f9bb9a3699771c.mp4"
            poster={(clipPhoto || data.topPhotos[2]).src}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
          />
          <span className="home-play">▶</span>
          <span className="home-clip-caption">Asha Life</span>
        </button>
        <button
          className="home-clip-promotion"
          type="button"
          onClick={() =>
            notify(
              "원본 클립 서비스의 안내 문구입니다. 보관본에서는 클립 업로드·포인트 적립을 제공하지 않습니다.",
            )
          }
        >
          클립 올리고 <b>N</b> 포인트 바로 적립
        </button>
      </section>
      <section className="home-section home-visitor-photos">
        <h2>
          <Link to="/photo" onClick={() => setPhotoFilter("review")}>
            방문자 사진·영상
            <ChevronRight size={18} />
          </Link>
        </h2>
        <div className="visitor-photo-grid">
          {visitorPhotos.map((p, i) => (
            <button
              type="button"
              key={p.src}
              onClick={() => openMedia(visitorPhotos, i)}
            >
              <Picture media={p} />
              {p.kind === "video" && <span>▶</span>}
            </button>
          ))}
        </div>
      </section>
      <section className="home-section home-visitor-reviews">
        <h2>
          <Link to="/review" onClick={() => setReviewTab("visitor")}>
            방문자 리뷰 <span>{data.reviews.length}</span>
            <ChevronRight size={18} />
          </Link>
        </h2>
        <Link
          className="home-review-keywords"
          to="/review"
          onClick={() => setReviewTab("visitor")}
        >
          {homeEvidence.votes
            .slice(0, 5)
            .map(({ displayName: name, count }) => (
              <span key={name}>
                <i
                  style={{
                    width: `${(count / homeEvidence.reviewCount) * 100}%`,
                  }}
                />
                <Picture
                  media={
                    data.reviews
                      .flatMap((r) => r.keywords)
                      .find((k) => k.name === name)?.icon
                  }
                />
                <b>&quot;{name}&quot;</b>
                <em>{count}</em>
              </span>
            ))}
        </Link>
        {homeReviews.map((r) => (
          <HomeReviewCard key={r.id} review={r} />
        ))}
      </section>
      <section className="home-section home-blogs">
        <h2>
          <Link to="/review" onClick={() => setReviewTab("blog")}>
            블로그 리뷰 <span>{data.blogs.length}</span>
            <ChevronRight size={18} />
          </Link>
        </h2>
        {homeBlogs.map((b) => {
          const card = homeEvidence.homeBlogCards.find((c) => c.id === b.id);
          return (
            <button
              type="button"
              className="home-blog-card"
              key={b.id}
              onClick={() => openBlog(b.id)}
            >
              <div className="home-blog-author">
                <img src={card?.avatar} alt="" />
                <span>
                  <strong>{card?.nickname}</strong>
                  <small>{b.author}</small>
                </span>
              </div>
              <div className="home-blog-content">
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.preview}</p>
                  <small>{card?.date}</small>
                </div>
                <span className="home-blog-thumb">
                  <img
                    src={card?.thumbnail || b.thumb.src}
                    alt="블로그 대표 사진"
                  />
                  <em>{card?.count}</em>
                </span>
              </div>
            </button>
          );
        })}
      </section>
      <section className="home-section home-related-links">
        <h2>
          관련 링크 <span>2</span>
        </h2>
        <a
          href="https://www.siksinhot.com/P/1772933"
          target="_blank"
          rel="noreferrer"
        >
          식신에서 보기 <ChevronRight size={16} />
        </a>
        <a
          href="https://diningcode.com/profile.php?rid=1LVJrBhyyXn3"
          target="_blank"
          rel="noreferrer"
        >
          다이닝코드에서 보기 <ChevronRight size={16} />
        </a>
      </section>
    </>
  );
}
function HomeReviewCard({ review: r }: { review: Review }) {
  const { openMedia } = useArchive();
  const [expanded, setExpanded] = useState(false);
  const [keywordsExpanded, setKeywordsExpanded] = useState(false);
  const avatar = homeEvidence.homeReviewAvatars.find((a) => a.id === r.id);
  return (
    <article className="home-review-card">
      <div className="home-review-author">
        <img src={avatar?.src || r.avatar.src} alt="" />
        <div>
          <strong>{r.author}</strong>
          <small>
            {r.visited.replace(/\.[가-힣]$/, "")} · {r.visitCount}번째 방문 ·{" "}
            {r.originType}
          </small>
        </div>
      </div>
      <div className="home-review-content">
        <button
          type="button"
          aria-expanded={expanded}
          className={`home-review-body ${expanded ? "expanded" : ""}`}
          onClick={() => setExpanded(!expanded)}
        >
          {r.body}
        </button>
        {r.media[0] && (
          <button
            type="button"
            className="home-review-thumb"
            onClick={() => openMedia(r.media)}
          >
            <Picture media={r.media[0]} />
            {r.media.length > 1 && <span>{r.media.length}</span>}
          </button>
        )}
      </div>
      <div className="home-review-tags">
        {r.keywords.slice(0, keywordsExpanded ? undefined : 1).map((k) => (
          <span key={k.name}>
            <Picture media={k.icon} />
            {k.name}
          </span>
        ))}
        {r.keywords.length > 1 && (
          <button
            type="button"
            aria-expanded={keywordsExpanded}
            onClick={() => setKeywordsExpanded(!keywordsExpanded)}
          >
            {keywordsExpanded ? "접기" : `+${r.keywords.length - 1}`}
          </button>
        )}
      </div>
    </article>
  );
}
function NewsPage() {
  const { openMedia } = useArchive();
  return (
    <section className="feed-list">
      {data.feeds.map((f) => (
        <article key={f.id}>
          <div className="feed-author">
            <span className="shop-avatar">B</span>
            <div>
              <strong>보라곰 주문제작&레터링케이크</strong>
              <small>{f.date}</small>
            </div>
          </div>
          <span className="green-label">{f.category}</span>
          <h2>{f.title}</h2>
          <p className="preserve">{f.body}</p>
          {f.images.map((m, i) => (
            <button
              type="button"
              className="feed-image"
              key={m.src}
              onClick={() => openMedia(f.images, i)}
            >
              <Picture media={m} />
            </button>
          ))}
        </article>
      ))}
    </section>
  );
}
function MenuPage() {
  const { openMedia, openBlog } = useArchive();
  const navigate = useNavigate();
  const menuPath = useRouterState({ select: (s) => s.location.pathname });
  const detail = data.menus.find((m) => menuPath === `/menu/${m.id}`);
  const related =
    detail?.id === "NmkLQKMzFzCq7gL79WFH"
      ? data.blogs.find((b) => b.id === "223768432873")
      : undefined;
  const closeDetail = () => navigate({ to: "/menu" });
  return (
    <>
      <div className="source-ad-space" aria-hidden="true" />
      <section className="menu-list">
        {data.menus.map((m) => (
          <button
            type="button"
            className="menu-item"
            key={m.id}
            onClick={() =>
              navigate({ to: "/menu/$menuId", params: { menuId: m.id } })
            }
          >
            <div>
              <strong>{m.name}</strong>
              <p>{m.description}</p>
              <b>{m.price}</b>
            </div>
            <Picture media={m.images[0]} />
          </button>
        ))}
      </section>
      <div className="menu-note">
        <p>
          최근 업데이트 <b>26.09.11</b>
        </p>
        <p>
          메뉴 항목과 가격은 각 매장의 사정에 따라 기재된 내용과 다를 수
          있습니다.
        </p>
      </div>
      <section className="menu-board">
        <button type="button" onClick={() => openMedia(data.menuBoards)}>
          <Picture media={data.menuBoards[0]} />
          <span>
            메뉴판 이미지로 보기 <ChevronRight size={16} />
          </span>
        </button>
      </section>
      {detail && (
        <Dialog
          label={detail.name}
          className="menu-dialog"
          onClose={closeDetail}
        >
          <div className="menu-detail-toolbar">
            <IconButton
              icon={ChevronLeft}
              label="메뉴 목록으로"
              onClick={closeDetail}
            />
            <strong>{data.place.name}</strong>
            <IconButton icon={X} label="메뉴 닫기" onClick={closeDetail} />
          </div>
          <button
            type="button"
            className="menu-main-image"
            onClick={() => openMedia(detail.images)}
          >
            <Picture media={detail.images[0]} eager />
          </button>
          <h2 className="menu-detail-title">{detail.name}</h2>
          <p className="preserve">{detail.description}</p>
          <strong>{detail.price}</strong>
          {detail.images.slice(1).map((m, i) => (
            <button
              type="button"
              className="menu-detail-image"
              key={m.src}
              onClick={() => openMedia(detail.images, i + 1)}
            >
              <Picture media={m} />
            </button>
          ))}
          {related && (
            <section className="menu-related">
              <h2>
                리뷰 <span>1</span>
              </h2>
              <button type="button" onClick={() => openBlog(related.id)}>
                <div className="related-author">
                  <b>홍순이</b>
                  <small>{related.author}</small>
                </div>
                <Picture media={related.thumb} />
                <strong>{related.title}</strong>
                <p>{related.preview}</p>
                <small>25.2.24.월</small>
              </button>
            </section>
          )}
        </Dialog>
      )}
    </>
  );
}
function ReviewCard({ review: r }: { review: Review }) {
  const { openMedia } = useArchive();
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="review-card">
      <div className="review-author">
        {r.avatar?.src ? (
          <Picture media={r.avatar} />
        ) : (
          <span className="default-avatar">
            <UserRound size={26} />
          </span>
        )}
        <div>
          <strong>{r.author}</strong>
          <small>리뷰 {r.authorReviews}</small>
        </div>
      </div>
      {r.media.length > 0 && (
        <div className="review-media">
          {r.media.slice(0, 3).map((m, i) => (
            <button
              type="button"
              key={m.src}
              onClick={() => openMedia(r.media, i)}
            >
              <Picture media={m} />
              {i === 2 && r.media.length > 3 && (
                <span>+{r.media.length - 3}</span>
              )}
            </button>
          ))}
        </div>
      )}
      {r.visitCategories.length > 0 && (
        <p className="visit-category">{r.visitCategories.join(" · ")}</p>
      )}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
        className={`review-body preserve ${expanded ? "expanded" : ""}`}
      >
        {r.body || "등록된 텍스트 없이 남긴 리뷰입니다."}
      </button>
      {(r.body.length > 85 || r.body.split("\n").length > 3) && (
        <button
          type="button"
          className="expand-text"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
      <div className="keyword-tags">
        {r.keywords.map((k) => (
          <span key={k.name}>
            <Picture media={k.icon} />
            {k.name}
          </span>
        ))}
      </div>
      <p className="review-date">
        {r.visited}
        <span>·</span>
        {r.visitCount}번째 방문<span>·</span>
        {r.originType}
      </p>
      {r.reply && (
        <div className="owner-reply">
          <strong>사장님</strong>
          <small>{r.reply.date}</small>
          <p className="preserve">{r.reply.body}</p>
        </div>
      )}
    </article>
  );
}
function ReviewsPage() {
  const { reviewTab: tab, setReviewTab: setTab } = useArchive();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("source");
  const [onlyPhotos, setOnlyPhotos] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [limit, setLimit] = useState(10);
  const { openBlog, openMedia } = useArchive();
  const previewPhotos = homeEvidence.reviewPreviewPhotos
    .map((src) =>
      data.reviews.flatMap((r) => r.media).find((m) => m.src === src),
    )
    .filter((m): m is Media => Boolean(m));
  const reviews = useMemo(() => {
    let rows = data.reviews.filter(
      (r) =>
        (!onlyPhotos || r.media.length > 0) &&
        (r.body + r.author).toLowerCase().includes(query.toLowerCase()),
    );
    if (sort === "oldest")
      rows = [...rows].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    if (sort === "newest")
      rows = [...rows].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    return rows;
  }, [query, sort, onlyPhotos]);
  const blogs = data.blogs.filter((b) =>
    (b.title + b.text + b.author).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="source-ad-space" aria-hidden="true" />
      <div className="review-tabs">
        <button
          className={tab === "visitor" ? "selected" : ""}
          type="button"
          onClick={() => {
            setTab("visitor");
            setLimit(10);
          }}
        >
          방문자 리뷰
        </button>
        <button
          type="button"
          className={tab === "blog" ? "selected" : ""}
          onClick={() => {
            setTab("blog");
            setLimit(10);
          }}
        >
          블로그 리뷰
        </button>
      </div>
      {tab === "visitor" && (
        <section className={`review-stats ${statsExpanded ? "expanded" : ""}`}>
          <h2>이런 점이 좋았어요</h2>
          <p>
            <b>✓ 237회</b> 230명 참여
          </p>
          {homeEvidence.votes
            .slice(0, statsExpanded ? undefined : 5)
            .map(({ displayName: name, count: n }) => (
              <div className="stat-bar" key={name}>
                <span
                  style={{
                    width: `${(Number(n) / homeEvidence.reviewCount) * 100}%`,
                  }}
                />
                <b>
                  <Picture
                    media={
                      data.reviews
                        .flatMap((r) => r.keywords)
                        .find((k) => k.name === name)?.icon
                    }
                  />
                  &quot;{name}&quot;
                </b>
                <strong>{n}</strong>
              </div>
            ))}
          <button
            className="stats-expand"
            type="button"
            aria-label={statsExpanded ? "통계 접기" : "통계 더보기"}
            onClick={() => setStatsExpanded(!statsExpanded)}
          >
            <ChevronDown size={18} />
          </button>
        </section>
      )}
      {tab === "visitor" && (
        <section className="review-preview">
          <h2>사진·영상 리뷰</h2>
          <div>
            {previewPhotos.map((m, i) => (
              <button
                type="button"
                key={m.src}
                onClick={() => openMedia(previewPhotos, i)}
              >
                <Picture media={m} />
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="review-controls">
        <div className="section-title">
          <h2>
            리뷰{" "}
            <span>{tab === "visitor" ? reviews.length : blogs.length}</span>
          </h2>
          {tab === "visitor" && (
            <label>
              <input
                type="checkbox"
                checked={onlyPhotos}
                onChange={(e) => {
                  setOnlyPhotos(e.target.checked);
                  setLimit(10);
                }}
              />
              사진/영상 리뷰만
            </label>
          )}
        </div>
        <details className="review-archive-search">
          <summary>보관된 리뷰 검색 · 정렬</summary>
          <div className="review-search">
            <Search size={16} />
            <input
              aria-label="리뷰 내용 또는 작성자 검색"
              placeholder="리뷰 내용, 작성자 검색"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(10);
              }}
            />
          </div>
          {tab === "visitor" && (
            <select
              aria-label="리뷰 정렬"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="source">원본 표시순</option>
              <option value="newest">방문일 최신순</option>
              <option value="oldest">방문일 오래된순</option>
            </select>
          )}
        </details>
      </div>
      {tab === "visitor"
        ? reviews
            .slice(0, limit)
            .map((r) => <ReviewCard review={r} key={r.id} />)
        : blogs.slice(0, limit).map((b) => (
            <button
              type="button"
              className="blog-card"
              key={b.id}
              onClick={() => openBlog(b.id)}
            >
              <div>
                <small>
                  {b.author} · {b.date}
                </small>
                <h3>{b.title}</h3>
                <p>{b.preview}</p>
              </div>
              <Picture media={b.thumb} />
              <span className="read-article">
                보관된 원문 읽기 <ChevronRight size={14} />
              </span>
            </button>
          ))}
      {(tab === "visitor" ? reviews.length : blogs.length) > limit && (
        <ActionButton
          size="medium"
          variant="neutralOutline"
          className="load-more"
          onClick={() => setLimit((n) => n + 20)}
        >
          펼쳐서 더보기 <ChevronDown size={16} />
        </ActionButton>
      )}
      {(tab === "visitor" ? reviews.length : blogs.length) === 0 && (
        <p className="empty-state">검색 결과가 없습니다.</p>
      )}
    </>
  );
}
function PhotosPage() {
  const { photoFilter: filter, setPhotoFilter: setFilter } = useArchive();
  const [limit, setLimit] = useState(45);
  const { openMedia } = useArchive();
  const normalize = (url: string) =>
    url.split("?")[0].replace(/\/\d+x\d+$/, "");
  const sourceOrder = data.topPhotos.map((m) => normalize(m.original));
  const allPhotos = [...data.photos].sort((a, b) => {
    const ai = sourceOrder.indexOf(normalize(a.original));
    const bi = sourceOrder.indexOf(normalize(b.original));
    return (ai < 0 ? 1000 : ai) - (bi < 0 ? 1000 : bi);
  });
  const items = (filter === "all" ? allPhotos : data.photos).filter(
    (p) => filter === "all" || p.category === filter,
  );
  return (
    <>
      <div className="source-ad-space" aria-hidden="true" />
      <div className="photo-filters">
        {[
          ["business", "업체"],
          ["clip", "클립"],
          ["review", "리뷰"],
        ].map(([f, label]) => (
          <button
            type="button"
            key={f}
            className={filter === f ? "selected" : ""}
            onClick={() => {
              setFilter(f);
              setLimit(45);
            }}
          >
            <Picture media={data.photos.find((p) => p.category === f)} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div className="photo-grid">
        {[0, 1].map((column) => (
          <div key={column}>
            {items.slice(0, limit).map(
              (p, i) =>
                i % 2 === column && (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() =>
                      openMedia(
                        items.map((p) => p.video || p),
                        i,
                      )
                    }
                  >
                    <Picture media={p} />
                    {p.video && <span className="clip-badge">▶ 클립</span>}
                    {p.video && p.author && <small>{p.author}</small>}
                  </button>
                ),
            )}
          </div>
        ))}
      </div>
      {items.length > limit && (
        <ActionButton
          variant="neutralOutline"
          className="load-more"
          onClick={() => setLimit((n) => n + 60)}
        >
          사진 더보기{" "}
          <span>
            {Math.min(limit, items.length)} / {items.length}
          </span>
        </ActionButton>
      )}
      {filter === "clip" && (
        <div className="clip-description">
          <strong>Asha Life</strong>
          <p>{data.clipDescription}</p>
          <button
            type="button"
            className="blue-link"
            onClick={() => openMedia([data.clip])}
          >
            전체 영상 재생 · 1080p
          </button>
        </div>
      )}
    </>
  );
}
function InfoPage() {
  const [extra, setExtra] = useState(false);
  return (
    <section className="information">
      <section>
        <h2>소개</h2>
        <div className="introduction">
          <img src="assets/ui/information-owner.png" alt="업주" />
          <p>{data.place.description}</p>
        </div>
      </section>
      <section>
        <h2>편의시설 및 서비스</h2>
        <div className="facilities">
          {data.place.conveniences.map((c) => (
            <span key={c}>
              <SourceIcon name={c === "포장" ? "takeout" : "reservation"} />
              {c}
            </span>
          ))}
        </div>
      </section>
      <section>
        <h2>주차</h2>
        <p className="parking-info">
          <SourceIcon name="parking" />
          주차 불가
        </p>
      </section>
      <details
        className="archive-extra"
        open={extra}
        onToggle={(e) => setExtra(e.currentTarget.open)}
      >
        <summary>보관된 추가 정보</summary>
        <h2>대표 키워드</h2>
        <div className="info-keywords">
          {data.place.keywords.map((k) => (
            <span key={k}>#{k}</span>
          ))}
        </div>
        <h2>주소</h2>
        <p>{data.place.address}</p>
        <p className="subtext">지번 {data.place.jibun}</p>
        <h2>영업시간</h2>
        <div className="hours-list">
          {data.place.hours.map((h) => (
            <p key={h.day}>
              <strong>{h.day}</strong>
              {h.text}
            </p>
          ))}
        </div>
        <h2>전화번호</h2>
        <p>{data.place.phone}</p>
      </details>
    </section>
  );
}
function BlogDialog({
  blog,
  onClose,
}: {
  blog: Blog | undefined;
  onClose: () => void;
}) {
  const { openMedia } = useArchive();
  if (!blog) return null;
  return (
    <Dialog label={blog.title} className="blog-dialog" onClose={onClose}>
      <div className="dialog-heading">
        <span>
          <b className="blog-brand">blog</b> 보관된 원문
        </span>
        <IconButton icon={X} label="블로그 닫기" onClick={onClose} />
      </div>
      <article className="blog-article">
        <header>
          <small>
            {blog.author} · {blog.date}
          </small>
          <h1>{blog.title}</h1>
        </header>
        {blog.html ? (
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: blog.html }}
          />
        ) : (
          <p className="preserve">{blog.text}</p>
        )}
        {blog.videos.length > 0 && (
          <section className="blog-full-videos">
            <h2>이 글의 원본 영상</h2>
            {blog.videos.map((v) => (
              <video
                key={v.src}
                src={v.src}
                controls
                preload="none"
                playsInline
              />
            ))}
          </section>
        )}
        <ActionButton
          variant="neutralOutline"
          onClick={() => openMedia(blog.images.filter((m) => m.src))}
        >
          이 글의 사진 모두 보기 ({blog.images.filter((m) => m.src).length})
        </ActionButton>
      </article>
    </Dialog>
  );
}
const rootRoute = createRootRoute({ component: App });
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/feed",
  component: NewsPage,
});
const menuRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu",
  component: MenuPage,
});
const menuDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/menu/$menuId",
  component: MenuPage,
});
const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/review",
  component: ReviewsPage,
});
const photoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/photo",
  component: PhotosPage,
});
const informationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/information",
  component: InfoPage,
});
const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute,
    feedRoute,
    menuRoute,
    menuDetailRoute,
    reviewRoute,
    photoRoute,
    informationRoute,
  ]),
  history: createHashHistory(),
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
const mount = document.getElementById("root");
if (mount) createRoot(mount).render(<RouterProvider router={router} />);
