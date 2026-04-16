<script setup>
import searchActiveIcon from '@/assets/images/icons/search-normal-dark-green.svg'
import searchInactiveIcon from '@/assets/images/icons/search-normal-secondary-green.svg'
import ModalLogout from '@/components/ui/ModalLogout.vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({
    name: 'TopbarLayout',
})

const defaultSearchTab = 'socialAssistance'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { user } = storeToRefs(authStore)

const searchQuery = ref('')
const showLogoutModal = ref(false)
const isLoggingOut = ref(false)

const trimmedSearchQuery = computed(() => searchQuery.value.trim())

const syncSearchQueryFromRoute = () => {
    searchQuery.value =
        route.name === 'search' ? String(route.query.q ?? route.query.keyword ?? '') : ''
}

const handleSearchSubmit = () => {
    const keyword = trimmedSearchQuery.value

    if (!keyword) {
        return
    }

    const activeTab =
        route.name === 'search' && typeof route.query.tab === 'string'
            ? route.query.tab
            : defaultSearchTab

    router.push({
        name: 'search',
        query: {
            q: keyword,
            tab: activeTab,
        },
    })
}

const handleLogout = async () => {
    isLoggingOut.value = true
    try {
        await authStore.logout()
    } finally {
        isLoggingOut.value = false
        showLogoutModal.value = false
    }
}

watch(() => [route.name, route.query.q, route.query.keyword], syncSearchQueryFromRoute, {
    immediate: true,
})
</script>

<template>
    <div id="Top-Bar" class="relative flex h-[116px] shrink-0">
        <div
            class="fixed top-0 flex h-[116px] w-[-webkit-fill-available] items-center gap-4 border-l border-desa-background bg-white px-6 py-[30px] z-30">
            <form action="#" class="flex w-full" @submit.prevent="handleSearchSubmit">
                <label
                    class="group flex w-full items-center gap-2 rounded-full border border-desa-background bg-white px-6 py-4 transition-setup hover:border-desa-dark-green focus-within:border-desa-dark-green">
                    <button type="submit" class="relative flex size-6 shrink-0">
                        <img :src="searchActiveIcon"
                            class="absolute flex size-6 shrink-0 opacity-0 transition-setup group-focus-within:opacity-100"
                            alt="icon" />
                        <img :src="searchInactiveIcon"
                            class="absolute flex size-6 shrink-0 opacity-100 transition-setup group-focus-within:opacity-0"
                            alt="icon" />
                    </button>
                    <input v-model="searchQuery" type="text"
                        class="w-full appearance-none font-medium leading-5 text-desa-black outline-none placeholder:placeholder-shown:text-desa-secondary"
                        placeholder="Cari nama penduduk, pengajuan, events, dll" />
                </label>
            </form>
            <a href="#"
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-desa-background transition-setup hover:border-desa-secondary">
                <img src="@/assets/images/icons/notification-secondary-green.svg" class="size-6" alt="icon" />
            </a>
            <a href="#"
                class="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-desa-background transition-setup hover:border-desa-secondary">
                <img src="@/assets/images/icons/setting-2-secondary-green.svg" class="size-6" alt="icon" />
            </a>
            <div class="flex items-center gap-4">
                <div class="flex size-14 shrink-0 overflow-hidden rounded-full bg-desa-foreshadow">
                    <img src="@/assets/images/photos/photo-1.png" class="h-full w-full object-cover" alt="photo"
                        v-if="user?.role === 'admin'" />
                    <img :src="user?.profile_picture" class="h-full w-full object-cover" alt="photo"
                        v-if="user?.role === 'head-of-family'" />
                </div>
                <div class="flex w-[120px] shrink-0 flex-col gap-[6px]">
                    <p class="w-[120px] truncate font-semibold leading-5">{{ user?.name }}</p>
                    <p class="text-sm font-medium text-desa-secondary" v-if="user?.role === 'admin'">
                        Admin
                    </p>
                    <p class="text-sm font-medium text-desa-secondary" v-if="user?.role === 'head-of-family'">
                        Kepala Keluarga
                    </p>
                </div>
                <button type="button" @click="showLogoutModal = true" class="flex size-6 shrink-0">
                    <img src="@/assets/images/icons/logout-red.svg" class="size-6" alt="logout" />
                </button>
            </div>
        </div>

        <ModalLogout :show="showLogoutModal" :loading="isLoggingOut" @close="showLogoutModal = false"
            @confirm="handleLogout" />
    </div>
</template>
