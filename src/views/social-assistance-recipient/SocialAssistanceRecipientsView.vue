<script setup>
import CardList from '@/components/social-assistance-recipient/CardList.vue'
import PaginationUI from '@/components/ui/PaginationUI.vue'
import { useSocialAssistanceRecipientStore } from '@/stores/socialAssistanceRecipient'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const socialAssistanceRecipientStore = useSocialAssistanceRecipientStore()
const { socialAssistanceRecipients, meta, loading, error } = storeToRefs(socialAssistanceRecipientStore)
const { fetchSocialAssistanceRecipientsPaginated } = socialAssistanceRecipientStore

const serverOptions = ref({
    page: 1,
    row_per_page: 10,
})

const filters = ref({
    search: null,
})
const searchDebounceDelay = 500
let searchDebounceId = null

const skeletonRows = computed(() => Math.max(4, Number(serverOptions.value.row_per_page) || 4))

const generalError = computed(() => {
    if (typeof error.value === 'string') {
        return error.value
    }

    if (error.value && typeof error.value === 'object') {
        return 'Data pengajuan bantuan sosial gagal dimuat.'
    }

    return null
})

const fetchData = async () => {
    await fetchSocialAssistanceRecipientsPaginated({
        ...serverOptions.value,
        ...filters.value,
    })
}

const handleSearch = async () => {
    serverOptions.value = {
        ...serverOptions.value,
        page: 1,
    }

    const trimmedSearch = filters.value.search?.trim()
    filters.value.search = trimmedSearch || null

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
    () => {
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
            <h1 class="font-semibold text-2xl">Pengajuan Bantuan Sosial</h1>
        </div>

        <div v-if="generalError" class="rounded-2xl border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert">
            <span class="block sm:inline">{{ generalError }}</span>
        </div>

        <section id="List-pengajuan-Bansos" class="flex flex-col gap-[14px]">
            <form id="Page-Search" class="flex items-center justify-between" @submit.prevent="handleSearch">
                <div class="flex flex-col gap-3 w-[370px] shrink-0">
                    <label class="relative group peer w-full valid">
                        <input type="text" v-model="filters.search" placeholder="Cari nama warga atau bantuan sosial"
                            class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 pl-12 pr-6 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300">
                        <div class="absolute transform -translate-y-1/2 top-1/2 left-4 flex size-6 shrink-0">
                            <img src="@/assets/images/icons/user-search-secondary-green.svg"
                                class="size-6 hidden group-has-[:placeholder-shown]:flex" alt="icon">
                            <img src="@/assets/images/icons/user-search-black.svg"
                                class="size-6 flex group-has-[:placeholder-shown]:hidden" alt="icon">
                        </div>
                    </label>
                </div>
                <div class="options flex items-center gap-4">
                    <div class="flex items-center gap-[10px]">
                        <span class="font-medium leading-5">Show</span>
                        <div class="relative">
                            <select v-model="serverOptions.row_per_page" @change="handlePerPageChange"
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
                                alt="icon">
                        </div>
                    </div>
                    <button type="button"
                        class="flex items-center gap-1 h-14 w-fit rounded-2xl border border-desa-background bg-white py-4 px-6">
                        <img src="@/assets/images/icons/filter-black.svg" class="flex size-6 shrink-0" alt="icon">
                        <span class="font-medium leading-5">Filter</span>
                    </button>
                </div>
            </form>
            <CardList :socialAssistanceRecipients="socialAssistanceRecipients" :loading="loading"
                :skeletonRows="skeletonRows" />
        </section>
        <PaginationUI v-if="!loading" :meta="meta" :server-options="serverOptions"
            @update:server-options="handleUpdateServerOptions" />
    </div>
</template>
