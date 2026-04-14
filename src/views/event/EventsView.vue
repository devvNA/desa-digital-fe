<script setup>
import CardList from '@/components/event/CardList.vue'
import PaginationUI from '@/components/ui/PaginationUI.vue'
import { can } from '@/helpers/permissionHelper'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const eventStore = useEventStore()
const { events, meta, loading, success, error } = storeToRefs(eventStore)
const { fetchEventsPaginated } = eventStore

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const serverOptions = ref({
    page: 1,
    row_per_page: 10,
})

const filters = ref({
    search: null,
    status: null
})

const searchDebounceDelay = 500
let searchDebounceId = null
let shouldSkipSearchWatcher = false

const skeletonRows = computed(() => Math.max(4, Number(serverOptions.value.row_per_page) || 4))
const hasEvents = computed(() => events.value.length > 0)
const hasActiveFilters = computed(() => Boolean(filters.value.search))
const hasCreateEventRoute = computed(() => router.hasRoute('create-event'))
const isInitialLoading = computed(() => loading.value && !hasEvents.value)
const isRefreshing = computed(() => loading.value && hasEvents.value)
const emptyStateMessage = computed(() => {
    if (hasActiveFilters.value) {
        return 'Data event desa tidak ditemukan untuk pencarian ini.'
    }

    return 'Data event desa belum tersedia.'
})
const generalError = computed(() => {
    if (typeof error.value === 'string') {
        return error.value
    }

    if (error.value && typeof error.value === 'object') {
        return 'Data event desa gagal dimuat.'
    }

    return null
})

const handleStatusTabChange = async (status) => {
    if (filters.value.status === status) {
        return
    }

    filters.value.status = status
    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
    }

    await fetchData()
}

const fetchData = async () => {
    await fetchEventsPaginated({
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
            <h1 class="font-semibold text-2xl">Events Desa</h1>
            <RouterLink v-if="hasCreateEventRoute && can('event-create')" :to="{ name: 'create-event' }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-dark-green">
                <img src="@/assets/images/icons/add-square-white.svg" class="flex size-6 shrink-0" alt="icon" />
                <p class="font-medium text-white">Add New</p>
            </RouterLink>
        </div>
        <section id="List-Event-Desa" class="flex flex-col gap-[14px]">
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

            <section id="TabButtons" v-if="user?.role === 'head-of-family'"
                class="w-full p-1 bg-desa-foreshadow rounded-full grid grid-cols-2 gap-3">
                <button type="button" data-content="All" :class="['tab-btn', 'group', { active: !filters.status }]">
                    <div class="group-[.active]:bg-desa-dark-green group-[.active]:text-white rounded-full py-[18px] flex justify-center items-center text-center text-desa-dark-green font-medium leading-5 transition-all duration-300"
                        @click="handleStatusTabChange(null)">
                        <span>Semua Event</span>
                    </div>
                </button>
                <button type="button" data-content="Joined"
                    :class="['tab-btn', 'group', { active: filters.status === 'joined' }]">
                    <div class="group-[.active]:bg-desa-dark-green group-[.active]:text-white rounded-full py-[18px] flex justify-center items-center text-center text-desa-dark-green font-medium leading-5 transition-all duration-300"
                        @click="handleStatusTabChange('joined')">
                        <span>Joined</span>
                    </div>
                </button>
            </section>

            <form id="Page-Search" class="flex items-center justify-between" @submit.prevent="handleSearch">
                <div class="flex flex-col gap-3 w-[370px] shrink-0">
                    <label class="relative group peer w-full valid">
                        <input v-model="filters.search" type="text" placeholder="Cari nama event desa"
                            class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 pl-12 pr-6 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300" />
                        <div class="absolute transform -translate-y-1/2 top-1/2 left-4 flex size-6 shrink-0">
                            <img src="@/assets/images/icons/calendar-search-secondary-green.svg"
                                class="size-6 hidden group-has-[:placeholder-shown]:flex" alt="icon" />
                            <img src="@/assets/images/icons/calendar-search-black.svg"
                                class="size-6 flex group-has-[:placeholder-shown]:hidden" alt="icon" />
                        </div>
                    </label>
                </div>
                <div class="options flex items-center gap-4">
                    <div class="flex items-center gap-[10px]">
                        <span class="font-medium leading-5">Show</span>
                        <div class="relative">
                            <select v-model="serverOptions.row_per_page" @change="handlePerPageChange" name="" id=""
                                class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-6 pr-[52px] gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300">
                                <option value="5" selected>5 Entries</option>
                                <option value="10">10 Entries</option>
                                <option value="20">20 Entries</option>
                                <option value="30">30 Entries</option>
                                <option value="40">40 Entries</option>
                                <option value="50">50 Entries</option>
                            </select>
                            <img src="@/assets/images/icons/arrow-down-black.svg"
                                class="flex size-6 shrink-0 absolute transform -translate-y-1/2 top-1/2 right-6"
                                alt="icon" />
                        </div>
                        <div v-if="!isInitialLoading && !hasEvents && hasActiveFilters" class="flex justify-center">
                            <button type="button" @click="resetFilters"
                                class="inline-flex items-center rounded-2xl bg-desa-black px-5 py-3 text-sm font-medium text-white">
                                Reset pencarian
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            <div v-if="isRefreshing"
                class="inline-flex w-fit items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary">
                <span class="loading-dot size-2 rounded-full bg-desa-soft-green"></span>
                Memuat ulang data pembangunan desa
            </div>

            <CardList :events="events" :loading="isInitialLoading" :skeleton-rows="skeletonRows"
                :empty-message="emptyStateMessage" />

            <div v-if="!isInitialLoading && !hasEvents && hasActiveFilters" class="flex justify-center">
                <button type="button" @click="resetFilters"
                    class="inline-flex items-center rounded-2xl bg-desa-black px-5 py-3 text-sm font-medium text-white">
                    Reset pencarian
                </button>
            </div>

            <PaginationUI v-if="!isInitialLoading && hasEvents" :meta="meta" :server-options="serverOptions"
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
