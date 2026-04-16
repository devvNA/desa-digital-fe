<script setup>
import CardList from "@/components/head-of-family/CardList.vue";
import PaginationUI from "@/components/ui/PaginationUI.vue";
import { useHeadOfFamilyStore } from "@/stores/headOfFamily";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";

const headOfFamilyStore = useHeadOfFamilyStore();
const { headOfFamilies, meta, loading, success, error } = storeToRefs(headOfFamilyStore);
const { fetchHeadOfFamiliesPaginated } = headOfFamilyStore;

const serverOptions = ref({
    page: 1,
    row_per_page: 5,
});

const filters = ref({
    search: null,
});
const searchDebounceDelay = 500;
let searchDebounceId = null;

const skeletonRows = computed(() => Math.max(4, Number(serverOptions.value.row_per_page) || 4));

const fetchData = async () => {
    await fetchHeadOfFamiliesPaginated({
        ...serverOptions.value,
        ...filters.value,
    });
};

const handleSearch = async () => {
    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
    };

    const trimmedSearch = filters.value.search?.trim();
    filters.value.search = trimmedSearch || null;

    await fetchData();
};

const handleUpdateServerOptions = async (options) => {
    serverOptions.value = {
        ...serverOptions.value,
        ...options,
    };

    await fetchData();
};

const scheduleSearch = () => {
    if (searchDebounceId) {
        clearTimeout(searchDebounceId);
    }

    searchDebounceId = setTimeout(() => {
        handleSearch();
    }, searchDebounceDelay);
};

watch(
    () => filters.value.search,
    () => {
        scheduleSearch();
    },
);

onMounted(() => {
    fetchData();
});

onBeforeUnmount(() => {
    if (searchDebounceId) {
        clearTimeout(searchDebounceId);
    }
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <h1 class="font-semibold text-2xl">Kepala Rumah</h1>
            <RouterLink
                :to="{ name: 'create-head-of-family' }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-dark-green"
            >
                <img
                    src="@/assets/images/icons/add-square-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
                <p class="font-medium text-white">Add New</p>
            </RouterLink>
        </div>
        <section id="List-Kepala-Rumah" class="flex flex-col gap-[14px]">
            <div
                v-if="success"
                class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl relative mb-4"
                role="alert"
            >
                <span class="block sm:inline">{{ success }}</span>

                <button
                    type="button"
                    class="absolute top-1/2 -translate-y-1/2 right-4"
                    @click="success = null"
                >
                    <img
                        src="@/assets/images/icons/close-circle-secondary-green.svg"
                        class="flex size-6 shrink-0"
                        alt="icon"
                    />
                </button>
            </div>

            <div
                v-if="error"
                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative mb-4"
                role="alert"
            >
                <span class="block sm:inline">{{ error }}</span>

                <button
                    type="button"
                    class="absolute top-1/2 -translate-y-1/2 right-4"
                    @click="error = null"
                >
                    <img
                        src="@/assets/images/icons/close-circle-white.svg"
                        class="flex size-6 shrink-0"
                        alt="icon"
                    />
                </button>
            </div>
            <form
                id="Page-Search"
                class="flex items-center justify-between"
                @submit.prevent="handleSearch"
            >
                <div class="flex flex-col gap-3 w-[370px] shrink-0">
                    <label class="relative group peer w-full valid">
                        <input
                            v-model="filters.search"
                            type="text"
                            placeholder="Cari nama Kepala Rumah atau NIK"
                            class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 pl-12 pr-6 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        />
                        <div
                            class="absolute transform -translate-y-1/2 top-1/2 left-4 flex size-6 shrink-0"
                        >
                            <img
                                src="@/assets/images/icons/user-search-secondary-green.svg"
                                class="size-6 hidden group-has-[:placeholder-shown]:flex"
                                alt="icon"
                            />
                            <img
                                src="@/assets/images/icons/user-search-black.svg"
                                class="size-6 flex group-has-[:placeholder-shown]:hidden"
                                alt="icon"
                            />
                        </div>
                    </label>
                </div>
                <div class="options flex items-center gap-4">
                    <span class="font-medium leading-5">Show</span>
                    <div class="relative">
                        <select
                            v-model="serverOptions.row_per_page"
                            @change="handleSearch()"
                            name=""
                            id=""
                            class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-6 pr-[52px] gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        >
                            <option value="5" selected>5 Entries</option>
                            <option value="10">10 Entries</option>
                            <option value="20">20 Entries</option>
                            <option value="30">30 Entries</option>
                            <option value="40">40 Entries</option>
                            <option value="50">50 Entries</option>
                        </select>
                        <img
                            src="@/assets/images/icons/arrow-down-black.svg"
                            class="flex size-6 shrink-0 absolute transform -translate-y-1/2 top-1/2 right-6"
                            alt="icon"
                        />
                    </div>
                    <button
                        type="button"
                        class="flex items-center gap-1 h-14 w-fit rounded-2xl border border-desa-background bg-white py-4 px-6"
                    >
                        <img
                            src="@/assets/images/icons/filter-black.svg"
                            class="flex size-6 shrink-0"
                            alt="icon"
                        />
                        <span class="font-medium leading-5">Filter</span>
                    </button>
                </div>
            </form>

            <div
                v-if="loading && headOfFamilies.length"
                class="inline-flex w-fit items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary"
            >
                <span class="loading-dot size-2 rounded-full bg-desa-soft-green"></span>
                Memuat ulang data kepala rumah
            </div>

            <template v-if="!loading">
                <CardList
                    v-for="headOfFamily in headOfFamilies"
                    :key="headOfFamily.id"
                    :item="headOfFamily"
                />
            </template>

            <div v-else class="flex flex-col gap-[14px]">
                <div
                    v-for="index in skeletonRows"
                    :key="index"
                    class="hof-skeleton-card rounded-3xl p-6"
                    :style="{ '--skeleton-delay': `${index * 90}ms` }"
                >
                    <div class="flex items-center justify-between gap-6">
                        <div class="flex w-[260px] items-center gap-3">
                            <div
                                class="hof-skeleton-block hof-skeleton-avatar size-16 shrink-0 rounded-full"
                            ></div>
                            <div class="flex flex-1 flex-col gap-[6px]">
                                <div class="hof-skeleton-block h-5 w-40 rounded-full"></div>
                                <div class="flex items-center gap-2">
                                    <div class="hof-skeleton-block size-[18px] rounded-full"></div>
                                    <div class="hof-skeleton-block h-4 w-24 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        <div class="flex w-[180px] shrink-0 flex-col gap-2">
                            <div class="flex items-center gap-2">
                                <div class="hof-skeleton-block size-[18px] rounded-full"></div>
                                <div class="hof-skeleton-block h-4 w-10 rounded-full"></div>
                            </div>
                            <div class="hof-skeleton-block h-5 w-32 rounded-full"></div>
                        </div>

                        <div
                            class="hof-skeleton-pill flex w-[224px] shrink-0 items-center gap-2 rounded-full px-4 py-[14px]"
                        >
                            <div class="hof-skeleton-block size-[18px] rounded-full"></div>
                            <div class="hof-skeleton-block h-4 w-28 rounded-full"></div>
                        </div>

                        <div class="hof-skeleton-block h-14 w-[116px] shrink-0 rounded-2xl"></div>
                    </div>
                </div>

                <div class="hof-skeleton-pagination rounded-3xl p-5">
                    <div class="flex items-center justify-between gap-4">
                        <div class="hof-skeleton-block h-4 w-44 rounded-full"></div>
                        <div class="flex items-center gap-3">
                            <div class="hof-skeleton-block size-11 rounded-2xl"></div>
                            <div class="hof-skeleton-block h-11 w-28 rounded-2xl"></div>
                            <div class="hof-skeleton-block size-11 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            <PaginationUI
                v-if="!loading"
                :meta="meta"
                :server-options="serverOptions"
                @update:server-options="handleUpdateServerOptions"
            />
        </section>
    </div>
</template>

<style scoped>
.hof-skeleton-card,
.hof-skeleton-pagination {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at top right, rgba(142, 189, 85, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 248, 0.95));
    box-shadow: 0 18px 42px rgba(38, 58, 42, 0.05);
}

.hof-skeleton-card::before,
.hof-skeleton-pagination::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), transparent 36%);
    pointer-events: none;
}

.hof-skeleton-block,
.hof-skeleton-pill {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(111, 132, 121, 0.16), rgba(111, 132, 121, 0.08));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.hof-skeleton-avatar {
    background:
        radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.45), transparent 38%),
        linear-gradient(180deg, rgba(111, 132, 121, 0.18), rgba(111, 132, 121, 0.09));
}

.hof-skeleton-pill {
    background:
        linear-gradient(180deg, rgba(64, 140, 255, 0.14), rgba(64, 140, 255, 0.08)),
        linear-gradient(180deg, rgba(111, 132, 121, 0.08), rgba(111, 132, 121, 0.04));
}

.hof-skeleton-block::after,
.hof-skeleton-card::after,
.hof-skeleton-pagination::after,
.hof-skeleton-pill::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.08) 12%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0.08) 88%,
        transparent 100%
    );
    animation: shimmer 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--skeleton-delay, 0ms);
}

.loading-dot {
    animation: pulse 1.2s ease-in-out infinite;
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.4;
    }

    50% {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .hof-skeleton-block::after,
    .hof-skeleton-card::after,
    .hof-skeleton-pagination::after,
    .hof-skeleton-pill::after,
    .loading-dot {
        animation: none;
    }
}
</style>
