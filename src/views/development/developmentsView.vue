<script setup>
import CardList from '@/components/development/CardList.vue'
import PaginationUI from '@/components/ui/PaginationUI.vue'
import { can } from '@/helpers/permissionHelper'
import { useDevelopmentStore } from '@/stores/development'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const developmentStore = useDevelopmentStore()
const { developments, meta, loading, success, error } = storeToRefs(developmentStore)
const { fetchDevelopmentsPaginated } = developmentStore

const serverOptions = ref({
    page: 1,
    row_per_page: 10,
})

const filters = ref({
    search: null,
})

const searchDebounceDelay = 500
let searchDebounceId = null
let shouldSkipSearchWatcher = false

const skeletonRows = computed(() => Math.max(4, Number(serverOptions.value.row_per_page) || 4))
const hasDevelopments = computed(() => developments.value.length > 0)
const hasActiveFilters = computed(() => Boolean(filters.value.search))
const isInitialLoading = computed(() => loading.value && !hasDevelopments.value)
const isRefreshing = computed(() => loading.value && hasDevelopments.value)
const emptyStateMessage = computed(() => {
    if (hasActiveFilters.value) {
        return 'Data pembangunan desa tidak ditemukan untuk pencarian ini.'
    }

    return 'Data pembangunan desa belum tersedia.'
})
const generalError = computed(() => {
    if (typeof error.value === 'string') {
        return error.value
    }

    if (error.value && typeof error.value === 'object') {
        return 'Data pembangunan desa gagal dimuat.'
    }

    return null
})

const fetchData = async () => {
    await fetchDevelopmentsPaginated({
        ...serverOptions.value,
        ...filters.value,
    })
}

const normalizeSearch = () => {
    const trimmedSearch = filters.value.search?.trim()
    filters.value.search = trimmedSearch || null
}

const handleSearch = async () => {
    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
    }

    normalizeSearch()
    await fetchData()
}

const handleUpdateServerOptions = async (options) => {
    serverOptions.value = {
        ...serverOptions.value,
        ...options,
    }

    await fetchData()
}

const handlePerPageChange = async () => {
    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
        row_per_page: Number(serverOptions.value.row_per_page) || 10,
    }

    await fetchData()
}

const resetFilters = async () => {
    shouldSkipSearchWatcher = true

    if (searchDebounceId) {
        clearTimeout(searchDebounceId)
        searchDebounceId = null
    }

    filters.value = {
        search: null,
    }

    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
    }

    await fetchData()
}

const scheduleSearch = () => {
    if (searchDebounceId) {
        clearTimeout(searchDebounceId)
    }

    searchDebounceId = setTimeout(() => {
        handleSearch()
    }, searchDebounceDelay)
}

watch(
    () => filters.value.search,
    (value, previousValue) => {
        if (shouldSkipSearchWatcher) {
            shouldSkipSearchWatcher = false
            return
        }

        if (value === previousValue) {
            return
        }

        scheduleSearch()
    },
)

onMounted(() => {
    fetchData()
})

onBeforeUnmount(() => {
    if (searchDebounceId) {
        clearTimeout(searchDebounceId)
    }
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">Pembangunan Desa</h1>
            <RouterLink v-if="can('development-create')" :to="{ name: 'create-development' }"
                class="flex items-center gap-[10px] rounded-2xl bg-desa-dark-green px-6 py-4">
                <img src="@/assets/images/icons/add-square-white.svg" class="flex size-6 shrink-0" alt="add icon" />
                <p class="font-medium text-white">Add New</p>
            </RouterLink>
        </div>

        <section id="List-Pembangunan-Desa" class="flex flex-col gap-[14px]">
            <div v-if="success"
                class="relative mb-4 rounded-2xl border border-green-400 bg-green-100 px-4 py-3 text-green-700"
                role="alert">
                <span class="block sm:inline">{{ success }}</span>
                <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2" @click="success = null">
                    <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                        alt="close success alert" />
                </button>
            </div>

            <div v-if="generalError"
                class="relative mb-4 rounded-2xl border border-red-400 bg-red-100 px-4 py-3 text-red-700" role="alert">
                <span class="block sm:inline">{{ generalError }}</span>
                <div class="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                    <button type="button" class="text-sm font-semibold text-red-700 underline" @click="fetchData">
                        Coba lagi
                    </button>
                    <button type="button" @click="error = null">
                        <img src="@/assets/images/icons/close-circle-white.svg" class="flex size-6 shrink-0"
                            alt="close error alert" />
                    </button>
                </div>
            </div>

            <form id="Page-Search" class="flex items-center justify-between" @submit.prevent="handleSearch">
                <div class="flex w-[370px] shrink-0 flex-col gap-3">
                    <label class="relative group peer w-full valid">
                        <input v-model="filters.search" type="text" placeholder="Cari nama pembangunan desa"
                            class="h-14 w-full appearance-none rounded-2xl py-4 pl-12 pr-6 font-medium outline-none ring-[1.5px] ring-desa-background transition-all duration-300 placeholder:text-desa-secondary focus:ring-desa-black" />
                        <div class="absolute left-4 top-1/2 flex size-6 shrink-0 -translate-y-1/2 transform">
                            <img src="@/assets/images/icons/box-search-secondary-green.svg"
                                class="hidden size-6 group-has-[:placeholder-shown]:flex" alt="search icon inactive" />
                            <img src="@/assets/images/icons/box-search-black.svg"
                                class="flex size-6 group-has-[:placeholder-shown]:hidden" alt="search icon active" />
                        </div>
                    </label>
                </div>
                <div class="options flex items-center gap-4">
                    <div class="flex items-center gap-[10px]">
                        <span class="font-medium leading-5">Show</span>
                        <div class="relative">
                            <select v-model="serverOptions.row_per_page" @change="handlePerPageChange"
                                class="h-14 w-full appearance-none rounded-2xl px-6 py-4 pr-[52px] font-medium outline-none ring-[1.5px] ring-desa-background transition-all duration-300 placeholder:text-desa-secondary focus:ring-desa-black">
                                <option :value="5">5 Entries</option>
                                <option :value="10">10 Entries</option>
                                <option :value="20">20 Entries</option>
                                <option :value="30">30 Entries</option>
                                <option :value="40">40 Entries</option>
                                <option :value="50">50 Entries</option>
                            </select>
                            <img src="@/assets/images/icons/arrow-down-black.svg"
                                class="absolute right-6 top-1/2 flex size-6 shrink-0 -translate-y-1/2 transform"
                                alt="dropdown icon" />
                        </div>
                    </div>
                    <button type="button" @click="resetFilters"
                        class="flex h-14 w-fit items-center gap-1 rounded-2xl border border-desa-background bg-white px-6 py-4">
                        <img src="@/assets/images/icons/filter-black.svg" class="flex size-6 shrink-0"
                            alt="reset filter icon" />
                        <span class="font-medium leading-5">Reset</span>
                    </button>
                </div>
            </form>

            <div v-if="isRefreshing"
                class="inline-flex w-fit items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary">
                <span class="loading-dot size-2 rounded-full bg-desa-soft-green"></span>
                Memuat ulang data pembangunan desa
            </div>

            <CardList :developments="developments" :loading="isInitialLoading" :skeleton-rows="skeletonRows"
                :empty-message="emptyStateMessage" />

            <div v-if="!isInitialLoading && !hasDevelopments && hasActiveFilters" class="flex justify-center">
                <button type="button" @click="resetFilters"
                    class="inline-flex items-center rounded-2xl bg-desa-black px-5 py-3 text-sm font-medium text-white">
                    Reset pencarian
                </button>
            </div>

            <PaginationUI v-if="!isInitialLoading && hasDevelopments" :meta="meta" :server-options="serverOptions"
                @update:server-options="handleUpdateServerOptions" />
        </section>
    </div>
</template>

<style scoped>
.loading-dot {
    animation: pulse 1.2s ease-in-out infinite;
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
    .loading-dot {
        animation: none;
    }
}
</style>
