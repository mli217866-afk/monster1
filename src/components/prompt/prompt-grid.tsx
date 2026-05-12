import { getPromptsList } from '@/api/prompts';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PromptWithMeta } from './prompt-types';
import { PromptCard } from './prompt-card';

type PromptListSort = 'hot' | 'latest' | 'likes' | 'collects';

type PromptGridQuery = {
  model?: string;
  tag?: string;
  q?: string;
  sort: PromptListSort;
  pageSize: number;
};

type RestoreState = {
  scrollY: number;
  loadedCount: number;
  updatedAt: number;
  promptId?: string;
  promptOffsetTop?: number;
  restoreKey?: string;
  routeHref?: string;
};

type FetchMoreOptions = {
  preserveScroll?: boolean;
};

const RETURN_STATE_KEY = 'prompt-grid-return-state-v3';
const DEFAULT_COLUMN_COUNT = 3;
const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

function getRestoreKey(query: PromptGridQuery) {
  return [
    'prompt-grid-v2',
    query.model ?? '',
    query.tag ?? '',
    query.q ?? '',
    query.sort,
    query.pageSize,
  ].join(':');
}

function getRouteHref() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

function readReturnState(restoreKey: string) {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(RETURN_STATE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as RestoreState;
    if (Date.now() - state.updatedAt > 1000 * 60 * 30) return null;
    if (state.loadedCount < 1) return null;
    if (state.restoreKey !== restoreKey) return null;
    if (state.routeHref !== getRouteHref()) return null;

    return state;
  } catch {
    return null;
  }
}

function writeRestoreState(key: string, state: RestoreState) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function writeReturnState(state: RestoreState) {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(RETURN_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function clearReturnState() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(RETURN_STATE_KEY);
  } catch {
    // Ignore storage quota/private mode failures.
  }
}

function findPromptElement(promptId: string) {
  return document.querySelector<HTMLElement>(`[data-prompt-id="${promptId}"]`);
}

function uniquePrompts(prompts: PromptWithMeta[]) {
  const seen = new Set<string>();

  return prompts.filter((prompt) => {
    if (seen.has(prompt.id)) return false;
    seen.add(prompt.id);
    return true;
  });
}

function getViewportColumnCount() {
  if (typeof window === 'undefined') return DEFAULT_COLUMN_COUNT;
  if (window.matchMedia('(min-width: 1280px)').matches) return 3;
  if (window.matchMedia('(min-width: 640px)').matches) return 2;
  return 1;
}

function useMasonryColumnCount() {
  const [columnCount, setColumnCount] = useState(DEFAULT_COLUMN_COUNT);

  useIsomorphicLayoutEffect(() => {
    const updateColumnCount = () => {
      setColumnCount(getViewportColumnCount());
    };

    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);

    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  return columnCount;
}

function getPromptHeightScore(prompt: PromptWithMeta) {
  const image = prompt.images[0];
  const width = image?.width ?? 0;
  const height = image?.height ?? 0;
  const imageRatio = width > 0 && height > 0 ? height / width : 1.25;

  return imageRatio * 100 + 36;
}

function distributePrompts(prompts: PromptWithMeta[], columnCount: number) {
  const columns = Array.from({ length: columnCount }, () => ({
    height: 0,
    prompts: [] as PromptWithMeta[],
  }));

  for (const prompt of prompts) {
    const target = columns.reduce((shortest, column) =>
      column.height < shortest.height ? column : shortest
    );

    target.prompts.push(prompt);
    target.height += getPromptHeightScore(prompt);
  }

  return columns.map((column) => column.prompts);
}

function restoreScrollPosition(scrollY: number) {
  window.requestAnimationFrame(() => {
    instantScrollTo(scrollY);
    window.requestAnimationFrame(() => instantScrollTo(scrollY));
  });
}

function instantScrollTo(top: number) {
  window.scrollTo({
    top,
    left: 0,
    behavior: 'instant' as ScrollBehavior,
  });
}

function scrollToRestoreTarget(target: RestoreState) {
  const element = target.promptId ? findPromptElement(target.promptId) : null;

  if (element) {
    const offsetTop = target.promptOffsetTop ?? 120;
    const top =
      window.scrollY + element.getBoundingClientRect().top - offsetTop;
    instantScrollTo(Math.max(0, top));
    return;
  }

  instantScrollTo(target.scrollY);
}

export function PromptGrid({
  prompts: initialPrompts,
  total = initialPrompts.length,
  query,
}: {
  prompts: PromptWithMeta[];
  total?: number;
  query?: PromptGridQuery;
}) {
  const restoreKey = query ? getRestoreKey(query) : null;
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const fetchLockRef = useRef(false);
  const loadedCountRef = useRef(initialPrompts.length);
  const pendingAnchorRef = useRef<Pick<
    RestoreState,
    'promptId' | 'promptOffsetTop'
  > | null>(null);
  const restoreTargetRef = useRef<RestoreState | null>(
    restoreKey ? readReturnState(restoreKey) : null
  );
  const restoreKeyRef = useRef(restoreKey);

  if (restoreKeyRef.current !== restoreKey) {
    restoreKeyRef.current = restoreKey;
    restoreTargetRef.current = restoreKey ? readReturnState(restoreKey) : null;
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: query
        ? ['prompts', 'infinite', query]
        : ['prompts', 'static', initialPrompts.map((prompt) => prompt.id)],
      queryFn: ({ pageParam }) =>
        getPromptsList({
          data: {
            pageIndex: pageParam,
            pageSize: query?.pageSize ?? initialPrompts.length,
            model: query?.model,
            tag: query?.tag,
            q: query?.q,
            sort: query?.sort ?? 'hot',
          },
        }),
      enabled: Boolean(query),
      initialPageParam: 0,
      initialData: {
        pages: [{ items: initialPrompts, total }],
        pageParams: [0],
      },
      getNextPageParam: (lastPage, pages) => {
        const loaded = uniquePrompts(
          pages.flatMap((page) => page.items)
        ).length;
        return loaded < lastPage.total ? pages.length : undefined;
      },
    });

  const prompts = uniquePrompts(
    data?.pages.flatMap((page) => page.items) ?? initialPrompts
  );
  const columnCount = useMasonryColumnCount();
  const promptColumns = useMemo(
    () => distributePrompts(prompts, columnCount),
    [columnCount, prompts]
  );
  const loadedCount = prompts.length;
  const needsRestorePages = Boolean(
    restoreTargetRef.current &&
      loadedCount < restoreTargetRef.current.loadedCount &&
      hasNextPage
  );

  useEffect(() => {
    loadedCountRef.current = loadedCount;
  }, [loadedCount]);

  const saveRestoreState = ({
    anchor,
    markReturn = false,
  }: {
    anchor?: Pick<RestoreState, 'promptId' | 'promptOffsetTop'>;
    markReturn?: boolean;
  } = {}) => {
    if (!restoreKey) return;

    const pendingAnchor = anchor ?? pendingAnchorRef.current ?? undefined;
    const state = {
      scrollY: window.scrollY,
      loadedCount: loadedCountRef.current,
      updatedAt: Date.now(),
      promptId: pendingAnchor?.promptId,
      promptOffsetTop: pendingAnchor?.promptOffsetTop,
      restoreKey,
      routeHref: getRouteHref(),
    };

    writeRestoreState(restoreKey, state);

    if (markReturn) writeReturnState(state);
  };

  const handleOpenPrompt = (promptId: string, element: HTMLElement) => {
    if (!restoreKey) return;

    pendingAnchorRef.current = {
      promptId,
      promptOffsetTop: element.getBoundingClientRect().top,
    };
    saveRestoreState({
      anchor: pendingAnchorRef.current,
      markReturn: true,
    });
  };

  const fetchMore = useCallback(
    async (options: FetchMoreOptions = {}) => {
      if (!(hasNextPage && !isFetchingNextPage) || fetchLockRef.current) return;

      const scrollY = options.preserveScroll ? window.scrollY : null;

      fetchLockRef.current = true;
      try {
        await fetchNextPage();
      } finally {
        fetchLockRef.current = false;

        if (scrollY !== null) restoreScrollPosition(scrollY);
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    if (!restoreKey) return;

    const save = () => saveRestoreState();

    let frame = 0;
    const scheduleSave = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(save);
    };

    window.addEventListener('scroll', scheduleSave, { passive: true });
    window.addEventListener('pagehide', save);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleSave);
      window.removeEventListener('pagehide', save);

      if (!restoreTargetRef.current) save();
    };
  }, [restoreKey]);

  useIsomorphicLayoutEffect(() => {
    const target = restoreTargetRef.current;
    if (!(restoreKey && target)) return;

    if (loadedCount < target.loadedCount && hasNextPage) {
      fetchMore({ preserveScroll: false });
      return;
    }

    restoreTargetRef.current = null;
    clearReturnState();

    const timers: number[] = [];
    const restore = () => scrollToRestoreTarget(target);

    for (const delay of [0, 16, 50, 120, 250, 500, 900, 1400, 2200]) {
      timers.push(window.setTimeout(restore, delay));
    }

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, loadedCount, restoreKey]);

  useEffect(() => {
    if (!(query && hasNextPage) || isFetchingNextPage || needsRestorePages) {
      return;
    }

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchMore({ preserveScroll: true });
        }
      },
      { rootMargin: '720px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchMore, hasNextPage, isFetchingNextPage, query]);

  if (prompts.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/55 p-12 text-center shadow-[0_24px_80px_rgba(93,64,35,0.12)] dark:border-white/12 dark:bg-white/[0.035] dark:shadow-none">
        <h2 className="font-medium">暂无提示词</h2>
        <p className="mt-2 text-neutral-500 text-sm dark:text-white/45">
          换一个筛选条件，或先在后台录入内容。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {promptColumns.map((column, index) => (
          <div
            key={`prompt-column-${index}`}
            className="flex min-w-0 flex-col gap-8"
          >
            {column.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onOpen={query ? handleOpenPrompt : undefined}
              />
            ))}
          </div>
        ))}
      </div>

      {query && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center gap-3 [overflow-anchor:none]"
        >
          <p className="text-neutral-500 text-sm dark:text-white/38">
            已显示 {loadedCount} / {total} 条
          </p>

          {hasNextPage ? (
            <button
              type="button"
              onClick={() => fetchMore({ preserveScroll: true })}
              disabled={isFetchingNextPage}
              className="rounded-full border border-black/10 bg-neutral-950 px-7 py-3 font-medium text-sm text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/14 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {isFetchingNextPage ? '加载中...' : '继续浏览更多'}
            </button>
          ) : (
            <p className="rounded-full border border-black/10 bg-white/35 px-5 py-2 text-neutral-500 text-sm dark:border-white/10 dark:bg-transparent dark:text-white/42">
              已经到底了
            </p>
          )}
        </div>
      )}
    </div>
  );
}
