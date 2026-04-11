const DEFAULT_INITIAL_WINDOW_SIZE = 5
const DEFAULT_PROGRESSIVE_WINDOW_SIZE = 5
const DEFAULT_REVEAL_THRESHOLD = 1

const toSafeNumber = (value, fallback = 1) => {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue)) {
        return fallback
    }

    return Math.trunc(numericValue)
}

export const clampPage = (page, lastPage) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safePage = toSafeNumber(page)

    return Math.min(Math.max(safePage, 1), safeLastPage)
}

const createPageRange = (start, end) => {
    const safeStart = Math.max(1, toSafeNumber(start))
    const safeEnd = Math.max(safeStart, toSafeNumber(end, safeStart))

    return Array.from({ length: safeEnd - safeStart + 1 }, (_, index) => safeStart + index)
}

const getForwardWindow = (page, lastPage, windowSize) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safeWindowSize = Math.max(1, toSafeNumber(windowSize, DEFAULT_PROGRESSIVE_WINDOW_SIZE))

    if (safeLastPage <= safeWindowSize) {
        return {
            start: 1,
            end: safeLastPage,
        }
    }

    const safePage = clampPage(page, safeLastPage)
    const maxStart = Math.max(1, safeLastPage - safeWindowSize + 1)
    const start = Math.min(safePage, maxStart)

    return {
        start,
        end: Math.min(safeLastPage, start + safeWindowSize - 1),
    }
}

const getTrailingWindow = (page, lastPage, windowSize) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safeWindowSize = Math.max(1, toSafeNumber(windowSize, DEFAULT_PROGRESSIVE_WINDOW_SIZE))
    const safePage = clampPage(page, safeLastPage)
    const end = safePage
    const start = Math.max(1, end - safeWindowSize + 1)

    return {
        start,
        end,
    }
}

const createMilestonePages = (lastPage) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))

    if (safeLastPage <= DEFAULT_INITIAL_WINDOW_SIZE + 1) {
        return []
    }

    const milestones = [Math.ceil(safeLastPage / 3), Math.ceil((safeLastPage * 2) / 3)]

    return [...new Set(milestones)]
        .filter((page) => page > 1 && page < safeLastPage)
        .sort((firstPage, secondPage) => firstPage - secondPage)
}

const normalizePages = (pages, lastPage) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))

    return [...new Set(pages)]
        .map((page) => clampPage(page, safeLastPage))
        .filter((page) => page >= 1 && page <= safeLastPage)
        .sort((firstPage, secondPage) => firstPage - secondPage)
}

export const createInitialPaginationState = ({
    currentPage,
    lastPage,
    initialWindowSize = DEFAULT_INITIAL_WINDOW_SIZE,
    progressiveWindowSize = DEFAULT_PROGRESSIVE_WINDOW_SIZE,
} = {}) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safeCurrentPage = clampPage(currentPage, safeLastPage)
    const safeInitialWindowSize = Math.max(
        1,
        toSafeNumber(initialWindowSize, DEFAULT_INITIAL_WINDOW_SIZE),
    )

    if (safeCurrentPage <= safeInitialWindowSize) {
        return {
            start: 1,
            end: Math.min(safeLastPage, safeInitialWindowSize),
            hasInteracted: false,
        }
    }

    return {
        ...getForwardWindow(safeCurrentPage, safeLastPage, progressiveWindowSize),
        hasInteracted: true,
    }
}

export const getNextPaginationState = ({
    targetPage,
    lastPage,
    paginationState,
    initialWindowSize = DEFAULT_INITIAL_WINDOW_SIZE,
    progressiveWindowSize = DEFAULT_PROGRESSIVE_WINDOW_SIZE,
    revealThreshold = DEFAULT_REVEAL_THRESHOLD,
} = {}) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safeTargetPage = clampPage(targetPage, safeLastPage)
    const safeInitialWindowSize = Math.max(
        1,
        toSafeNumber(initialWindowSize, DEFAULT_INITIAL_WINDOW_SIZE),
    )
    const safeWindowSize = Math.max(
        1,
        toSafeNumber(progressiveWindowSize, DEFAULT_PROGRESSIVE_WINDOW_SIZE),
    )
    const safeRevealThreshold = Math.max(0, toSafeNumber(revealThreshold, DEFAULT_REVEAL_THRESHOLD))
    const safeState =
        paginationState ??
        createInitialPaginationState({
            currentPage: safeTargetPage,
            lastPage: safeLastPage,
            initialWindowSize: safeInitialWindowSize,
            progressiveWindowSize: safeWindowSize,
        })

    if (safeTargetPage <= safeInitialWindowSize) {
        return createInitialPaginationState({
            currentPage: safeTargetPage,
            lastPage: safeLastPage,
            initialWindowSize: safeInitialWindowSize,
            progressiveWindowSize: safeWindowSize,
        })
    }

    if (safeTargetPage >= safeState.end - safeRevealThreshold) {
        return {
            ...getForwardWindow(safeTargetPage, safeLastPage, safeWindowSize),
            hasInteracted: true,
        }
    }

    if (safeTargetPage <= safeState.start && safeState.start > 1) {
        return {
            ...getTrailingWindow(safeTargetPage, safeLastPage, safeWindowSize),
            hasInteracted: true,
        }
    }

    return {
        ...safeState,
        hasInteracted: safeState.hasInteracted,
    }
}

export const buildVisiblePages = ({
    currentPage,
    lastPage,
    paginationState,
    initialWindowSize = DEFAULT_INITIAL_WINDOW_SIZE,
} = {}) => {
    const safeLastPage = Math.max(1, toSafeNumber(lastPage))
    const safeCurrentPage = clampPage(currentPage, safeLastPage)
    const safeInitialWindowSize = Math.max(
        1,
        toSafeNumber(initialWindowSize, DEFAULT_INITIAL_WINDOW_SIZE),
    )
    const safeState =
        paginationState ??
        createInitialPaginationState({
            currentPage: safeCurrentPage,
            lastPage: safeLastPage,
            initialWindowSize: safeInitialWindowSize,
        })

    if (safeLastPage <= safeInitialWindowSize + 1) {
        return createPageRange(1, safeLastPage)
    }

    const visiblePages = [
        1,
        ...createPageRange(safeState.start, safeState.end),
        safeCurrentPage,
        safeLastPage,
    ]

    if (safeState.hasInteracted || safeCurrentPage > safeInitialWindowSize) {
        visiblePages.push(...createMilestonePages(safeLastPage))
    }

    return normalizePages(visiblePages, safeLastPage)
}
