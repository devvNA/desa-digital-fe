<script setup>
import {
    buildVisiblePages,
    clampPage,
    createInitialPaginationState,
    getNextPaginationState,
} from "@/helpers/pagination";
import { computed, ref, watch } from "vue";

const INITIAL_WINDOW_SIZE = 5;
const PROGRESSIVE_WINDOW_SIZE = 5;
const REVEAL_THRESHOLD = 1;

const props = defineProps({
    meta: {
        type: Object,
        required: true,
    },
    serverOptions: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["update:server-options"]);

const lastPage = computed(() => Math.max(1, Number(props.meta?.last_page) || 1));
const currentPage = ref(1);
const revealedState = ref(
    createInitialPaginationState({
        currentPage: 1,
        lastPage: 1,
        initialWindowSize: INITIAL_WINDOW_SIZE,
        progressiveWindowSize: PROGRESSIVE_WINDOW_SIZE,
    }),
);

const visiblePages = computed(() =>
    buildVisiblePages({
        currentPage: currentPage.value,
        lastPage: lastPage.value,
        paginationState: revealedState.value,
        initialWindowSize: INITIAL_WINDOW_SIZE,
    }),
);

watch(
    () => [props.meta?.current_page, props.meta?.last_page],
    ([nextCurrentPage, nextLastPage], previousValue = []) => {
        const [previousCurrentPage, previousLastPage] = previousValue;
        const safeLastPage = Math.max(1, Number(nextLastPage) || 1);
        const safeCurrentPage = clampPage(nextCurrentPage, safeLastPage);
        const didLastPageChange = Number(previousLastPage) !== safeLastPage;
        const didPageLeaveVisibleRange =
            safeCurrentPage < revealedState.value.start ||
            safeCurrentPage > revealedState.value.end;

        currentPage.value = safeCurrentPage;

        if (didLastPageChange || didPageLeaveVisibleRange) {
            revealedState.value = createInitialPaginationState({
                currentPage: safeCurrentPage,
                lastPage: safeLastPage,
                initialWindowSize: INITIAL_WINDOW_SIZE,
                progressiveWindowSize: PROGRESSIVE_WINDOW_SIZE,
            });

            return;
        }

        if (Number(previousCurrentPage) !== safeCurrentPage && safeCurrentPage === 1) {
            revealedState.value = createInitialPaginationState({
                currentPage: safeCurrentPage,
                lastPage: safeLastPage,
                initialWindowSize: INITIAL_WINDOW_SIZE,
                progressiveWindowSize: PROGRESSIVE_WINDOW_SIZE,
            });
        }
    },
    { immediate: true },
);

const updatePage = (page) => {
    const nextPage = clampPage(page, lastPage.value);

    if (nextPage === currentPage.value) {
        return;
    }

    currentPage.value = nextPage;
    revealedState.value = getNextPaginationState({
        targetPage: nextPage,
        lastPage: lastPage.value,
        paginationState: revealedState.value,
        initialWindowSize: INITIAL_WINDOW_SIZE,
        progressiveWindowSize: PROGRESSIVE_WINDOW_SIZE,
        revealThreshold: REVEAL_THRESHOLD,
    });

    emit("update:server-options", {
        ...props.serverOptions,
        page: nextPage,
    });
};
</script>

<template>
    <nav id="Pagination">
        <ul class="flex items-center gap-3">
            <li class="group">
                <button
                    type="button"
                    @click="updatePage(currentPage - 1)"
                    :disabled="currentPage === 1"
                    :class="{ 'cursor-not-allowed opacity-60': currentPage === 1 }"
                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green transition-setup"
                >
                    <img
                        src="@/assets/images/icons/arrow-left-dark-green.svg"
                        class="flex size-6 shrink-0 group-hover:hidden"
                        alt="icon"
                    />
                    <img
                        src="@/assets/images/icons/arrow-left-foreshadow.svg"
                        class="hidden size-6 shrink-0 group-hover:flex"
                        alt="icon"
                    />
                </button>
            </li>
            <li
                v-for="page in visiblePages"
                :key="page"
                class="group"
                :class="{ active: page === currentPage }"
            >
                <button
                    type="button"
                    @click="updatePage(page)"
                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green group-[.active]:bg-desa-dark-green group-[.active]:ring-2 group-[.active]:ring-desa-dark-green/10 transition-setup"
                >
                    <span
                        class="text-desa-dark-green font-semibold group-[.active]:text-desa-foreshadow group-hover:text-desa-foreshadow transition-setup"
                    >
                        {{ page }}
                    </span>
                </button>
            </li>
            <li class="group">
                <button
                    type="button"
                    @click="updatePage(currentPage + 1)"
                    :disabled="currentPage === lastPage"
                    :class="{ 'cursor-not-allowed opacity-60': currentPage === lastPage }"
                    class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green transition-setup"
                >
                    <img
                        src="@/assets/images/icons/arrow-left-dark-green.svg"
                        class="flex size-6 shrink-0 rotate-180 group-hover:hidden"
                        alt="icon"
                    />
                    <img
                        src="@/assets/images/icons/arrow-left-foreshadow.svg"
                        class="hidden size-6 shrink-0 rotate-180 group-hover:flex"
                        alt="icon"
                    />
                </button>
            </li>
        </ul>
    </nav>
</template>
