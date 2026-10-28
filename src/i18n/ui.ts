// Every locale the site can render. Adding a locale: add it here, in astro.config.mjs,
// add a src/pages/<locale>/ tree and a src/content/*/<locale>/ folder.
export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = 'ko' satisfies Locale;

export const localeMeta: Record<Locale, { label: string; ogLocale: string; dir: 'ltr' | 'rtl' }> = {
  ko: { label: '한국어', ogLocale: 'ko_KR', dir: 'ltr' },
  en: { label: 'English', ogLocale: 'en_US', dir: 'ltr' },
};

const ko = {
  'site.title': 'Personal OS',
  'site.description': '백엔드 개발자의 포트폴리오와 기술 블로그',
  'nav.home': '홈',
  'nav.about': '소개',
  'nav.projects': '프로젝트',
  'nav.writing': '글',
  'nav.contact': '연락',
  'nav.theme': '테마 전환',
  'nav.language': '언어',
  'nav.skipToContent': '본문으로 건너뛰기',
  'home.heading': '운영 경험 위에 AI 백엔드를 쌓는 개발자',
  'home.lead':
    'Java/Spring 기반 서비스 운영 경험에 Python/FastAPI, 검색, RAG, 관측 가능성을 더해 신뢰할 수 있는 AI 백엔드를 만듭니다.',
  'home.recentProjects': '최근 프로젝트',
  'home.recentWriting': '최근 글',
  'home.viewAll': '전체 보기',
  'about.heading': '소개',
  'about.body':
    '백엔드 개발자입니다. 대규모 문서 처리 시스템을 운영하며 비동기 처리, 데이터 파이프라인, 성능 개선을 다뤘고, 지금은 개인 지식 시스템 Personal OS를 Python으로 만들며 AI 백엔드 역량을 넓히고 있습니다.',
  'about.skills': '기술',
  'projects.heading': '프로젝트',
  'projects.lead': '설계 결정과 측정 결과가 있는 프로젝트만 올립니다.',
  'projects.stack': '기술 스택',
  'projects.role': '역할',
  'projects.period': '기간',
  'projects.repo': '저장소',
  'writing.heading': '글',
  'writing.lead': '직접 겪고 측정한 것만 씁니다.',
  'writing.published': '작성일',
  'writing.updated': '수정일',
  'writing.tags': '태그',
  'contact.heading': '연락',
  'contact.body': '이메일과 프로필 링크는 공개 검토 후 추가됩니다.',
  'contact.email': '이메일',
  'contact.github': 'GitHub',
  'contact.linkedin': 'LinkedIn',
  'common.empty': '아직 게시된 항목이 없습니다.',
  'common.readMore': '더 읽기',
  'footer.builtWith': 'Astro로 만들었습니다. 콘텐츠는 각 글에 표시된 라이선스를 따릅니다.',
  'footer.source': '이 사이트의 소스',
} as const;

export type UIKey = keyof typeof ko;

const en: Record<UIKey, string> = {
  'site.title': 'Personal OS',
  'site.description': 'Portfolio and technical blog of a backend engineer',
  'nav.home': 'Home',
  'nav.about': 'About',
  'nav.projects': 'Projects',
  'nav.writing': 'Writing',
  'nav.contact': 'Contact',
  'nav.theme': 'Toggle theme',
  'nav.language': 'Language',
  'nav.skipToContent': 'Skip to content',
  'home.heading': 'Building AI backends on top of operations experience',
  'home.lead':
    'Java/Spring service operations experience, extended with Python/FastAPI, search, RAG and observability to ship AI backends you can trust.',
  'home.recentProjects': 'Recent projects',
  'home.recentWriting': 'Recent writing',
  'home.viewAll': 'View all',
  'about.heading': 'About',
  'about.body':
    'Backend engineer. I have operated large-scale document processing systems, working on asynchronous processing, data pipelines and performance, and I am now building Personal OS, a personal knowledge system in Python, to grow into AI backend engineering.',
  'about.skills': 'Skills',
  'projects.heading': 'Projects',
  'projects.lead': 'Only projects with design decisions and measured results are listed.',
  'projects.stack': 'Stack',
  'projects.role': 'Role',
  'projects.period': 'Period',
  'projects.repo': 'Repository',
  'writing.heading': 'Writing',
  'writing.lead': 'Only what I have done and measured myself.',
  'writing.published': 'Published',
  'writing.updated': 'Updated',
  'writing.tags': 'Tags',
  'contact.heading': 'Contact',
  'contact.body': 'Email and profile links will be added after public review.',
  'contact.email': 'Email',
  'contact.github': 'GitHub',
  'contact.linkedin': 'LinkedIn',
  'common.empty': 'Nothing published yet.',
  'common.readMore': 'Read more',
  'footer.builtWith': 'Built with Astro. Content is licensed as stated on each post.',
  'footer.source': 'Source of this site',
};

export const ui: Record<Locale, Record<UIKey, string>> = { ko, en };
