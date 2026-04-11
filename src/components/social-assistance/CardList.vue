<script setup>
import { formatRupiah, ucfirst } from '@/helpers/format'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

defineProps({
    socialAssistances: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    skeletonRows: {
        type: Number,
        default: 4,
    },
})

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const fallbackImage = new URL('@/assets/images/thumbnails/kk-bansos-1.png', import.meta.url).href

function getThumbnail(value) {
    return value || fallbackImage
}

function formatCategory(value) {
    const map = {
        cash: 'Uang Tunai',
        goods: 'Barang',
        service: 'Layanan',
    }

    return map[value] ?? ucfirst(value ?? '-')
}
</script>

<template>
    <template v-if="!loading">
        <div v-for="item in socialAssistances" :key="item.id" class="card flex flex-col gap-6 rounded-3xl bg-white p-6">
            <div class="flex items-center w-full">
                <div class="flex h-20 w-[100px] shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                    <img :src="getThumbnail(item.thumbnail)" class="w-full h-full object-cover" alt="thumbnail" />
                </div>
                <div class="ml-4 mr-9 flex w-full flex-col gap-[6px]">
                    <p class="line-clamp-1 text-lg font-semibold leading-[22.5px]">
                        {{ item.name }}
                    </p>
                    <p class="flex items-center gap-1">
                        <img src="@/assets/images/icons/briefcase-secondary-green.svg" class="flex size-[18px] shrink-0"
                            alt="icon" />
                        <span class="text-sm font-medium text-desa-secondary">{{
                            item.provider || '-'
                            }}</span>
                    </p>
                </div>
                <div class="shrink-0">
                    <RouterLink :to="{ name: 'manage-social-assistance', params: { id: item.id } }"
                        class="flex items-center shrink-0 gap-[10px] rounded-2xl py-4 px-6 bg-desa-black">
                        <span class="font-medium text-white">{{ user?.role === "admin" ? 'Manage' :
                            'View Detail' }}</span>
                    </RouterLink>
                </div>
            </div>

            <hr class="border-desa-background" />

            <div class="grid grid-cols-3 gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                        <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-dark-green">
                            {{ formatRupiah(item.amount || 0) }}
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">
                            {{ formatCategory(item.category) }}
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-blue/10 overflow-hidden">
                        <img src="@/assets/images/icons/profile-2user-blue.svg" class="flex size-6 shrink-0"
                            alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-blue">
                            {{ item.recipients_count || 0 }} Warga
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">Total Pengajuan</p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex size-[52px] rounded-2xl items-center justify-center overflow-hidden"
                        :class="item.is_available ? 'bg-desa-foreshadow' : 'bg-desa-red/10'">
                        <img v-if="item.is_available" src="@/assets/images/icons/tick-square-dark-green.svg"
                            class="flex size-6 shrink-0" alt="icon" />
                        <img v-else src="@/assets/images/icons/minus-square-red.svg" class="flex size-6 shrink-0"
                            alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5"
                            :class="item.is_available ? 'text-desa-dark-green' : 'text-desa-red'">
                            {{ item.is_available ? 'Aktif' : 'Nonaktif' }}
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">Status Bantuan</p>
                    </div>
                </div>
            </div>

            <p class="text-sm leading-6 text-desa-secondary">{{ item.description || '-' }}</p>
        </div>

        <div v-if="!socialAssistances.length" class="rounded-3xl bg-white p-8 text-center text-desa-secondary">
            Data bantuan sosial belum tersedia.
        </div>
    </template>

    <div v-else class="flex flex-col gap-[14px]">
        <div v-for="index in skeletonRows" :key="index" class="sa-skeleton-card rounded-3xl p-6"
            :style="{ '--skeleton-delay': `${index * 90}ms` }">
            <div class="flex items-center justify-between gap-6">
                <div class="flex w-[320px] items-center gap-3">
                    <div class="sa-skeleton-block h-20 w-[100px] shrink-0 rounded-2xl"></div>
                    <div class="flex flex-1 flex-col gap-[6px]">
                        <div class="sa-skeleton-block h-5 w-40 rounded-full"></div>
                        <div class="flex items-center gap-2">
                            <div class="sa-skeleton-block size-[18px] rounded-full"></div>
                            <div class="sa-skeleton-block h-4 w-36 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div class="sa-skeleton-pill flex w-[224px] shrink-0 items-center gap-2 rounded-full px-4 py-[14px]">
                    <div class="sa-skeleton-block size-[18px] rounded-full"></div>
                    <div class="sa-skeleton-block h-4 w-24 rounded-full"></div>
                </div>

                <div class="sa-skeleton-block h-12 w-[132px] shrink-0 rounded-full"></div>
            </div>

            <div class="mt-6 grid grid-cols-3 gap-3">
                <div class="flex items-center gap-3">
                    <div class="sa-skeleton-block size-[52px] rounded-2xl"></div>
                    <div class="flex flex-col gap-2">
                        <div class="sa-skeleton-block h-5 w-28 rounded-full"></div>
                        <div class="sa-skeleton-block h-4 w-20 rounded-full"></div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="sa-skeleton-block size-[52px] rounded-2xl"></div>
                    <div class="flex flex-col gap-2">
                        <div class="sa-skeleton-block h-5 w-24 rounded-full"></div>
                        <div class="sa-skeleton-block h-4 w-24 rounded-full"></div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="sa-skeleton-block size-[52px] rounded-2xl"></div>
                    <div class="flex flex-col gap-2">
                        <div class="sa-skeleton-block h-5 w-24 rounded-full"></div>
                        <div class="sa-skeleton-block h-4 w-24 rounded-full"></div>
                    </div>
                </div>
            </div>

            <div class="mt-6 sa-skeleton-block h-4 w-full rounded-full"></div>
        </div>
    </div>
</template>

<style scoped>
.sa-skeleton-card {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at top right, rgba(142, 189, 85, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 248, 0.95));
    box-shadow: 0 18px 42px rgba(38, 58, 42, 0.05);
}

.sa-skeleton-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), transparent 36%);
    pointer-events: none;
}

.sa-skeleton-block,
.sa-skeleton-pill {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(111, 132, 121, 0.16), rgba(111, 132, 121, 0.08));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.sa-skeleton-pill {
    background:
        linear-gradient(180deg, rgba(64, 140, 255, 0.14), rgba(64, 140, 255, 0.08)),
        linear-gradient(180deg, rgba(111, 132, 121, 0.08), rgba(111, 132, 121, 0.04));
}

.sa-skeleton-block::after,
.sa-skeleton-card::after,
.sa-skeleton-pill::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 12%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0.08) 88%,
            transparent 100%);
    animation: shimmer 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--skeleton-delay, 0ms);
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}

@media (prefers-reduced-motion: reduce) {

    .sa-skeleton-block::after,
    .sa-skeleton-card::after,
    .sa-skeleton-pill::after {
        animation: none;
    }
}
</style>
