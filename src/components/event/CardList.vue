<script setup>
import { formatDate, formatRupiah } from '@/helpers/format';
import { fallbackThumbnail, handleImageError, normalizeImageUrl } from '@/helpers/socialAssistance';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const props = defineProps({
    events: {
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
    emptyMessage: {
        type: String,
        default: 'Data event desa belum tersedia.',
    },
})

function getThumbnail(value) {
    return normalizeImageUrl(value, fallbackThumbnail)
}

function getParticipantCountLabel(value) {
    return `${Number(value) || 0} Warga`
}

function getExecutionDateLabel(value) {
    if (!value) {
        return '-'
    }

    return formatDate(value)
}

const hasEvents = computed(() => props.events.length > 0)
</script>
<template>
    <template v-if="!loading">
        <div v-for="item in events" :key="item.id" class="card flex flex-col gap-6 rounded-3xl p-6 bg-white">
            <div class="flex items-center w-full">
                <div class="flex w-[100px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                    <img :src="getThumbnail(item.thumbnail)" class="h-full w-full object-cover"
                        alt="development thumbnail" @error="handleImageError($event, fallbackThumbnail)">
                </div>
                <div class="flex flex-col gap-[6px] w-full ml-4 mr-9">
                    <p class="font-semibold text-lg leading-[22.5px] line-clamp-1">{{ item.name }}</p>
                    <div class="flex items-center gap-1">
                        <img src="@/assets/images/icons/ticket-secondary-green.svg" class="flex size-[18px] shrink-0"
                            alt="icon">
                        <p class="font-medium text-sm text-desa-secondary">
                            Registration:
                            <span class="font-medium text-base text-desa-dark-green" v-if="item.is_active === true">
                                Open
                            </span>
                            <span class="font-medium text-base text-desa-dark-red" v-else-if="item.is_active === false">
                                Closed
                            </span>
                            <span class="font-medium text-base text-desa-dark-red" v-else>
                                -
                            </span>
                        </p>
                    </div>
                </div>
                <RouterLink :to="{ name: 'manage-event', params: { id: item.id } }"
                    class="flex items-center shrink-0 gap-[10px] rounded-2xl py-4 px-6 bg-desa-black">
                    <span class="font-medium text-white" v-if="user?.role === 'admin'">Manage</span>
                    <span class="font-medium text-white" v-else>View Details</span>
                </RouterLink>
            </div>
            <hr class="border-desa-background">
            <div class="grid grid-cols-3 gap-3">
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-red/10 overflow-hidden">
                        <img src="@/assets/images/icons/wallet-3-red.svg" class="flex size-6 shrink-0" alt="icon">
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-red">{{ formatRupiah(item.price) }}</p>
                        <p class="font-medium text-sm text-desa-secondary">Harga Event</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-blue/10 overflow-hidden">
                        <img src="@/assets/images/icons/profile-2user-blue.svg" class="flex size-6 shrink-0" alt="icon">
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-blue">{{
                            getParticipantCountLabel(item.participants_count) }}</p>
                        <p class="font-medium text-sm text-desa-secondary">Total Partisipasi</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                        <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                            alt="icon">
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-dark-green">{{
                            getExecutionDateLabel(item.date)
                        }}
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">Tanggal Pelaksanaan</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="!hasEvents" class="rounded-3xl bg-white p-8 text-center text-desa-secondary">
            {{ emptyMessage }}
        </div>
    </template>
    <div v-else class="flex flex-col gap-[14px]">
        <div v-for="index in skeletonRows" :key="index"
            class="rounded-3xl bg-white p-6 shadow-[0_18px_42px_rgba(38,58,42,0.05)]">
            <div class="animate-pulse">
                <div class="flex items-center gap-4">
                    <div class="h-20 w-[100px] shrink-0 rounded-2xl bg-desa-foreshadow"></div>
                    <div class="flex flex-1 flex-col gap-3">
                        <div class="h-5 w-52 rounded-full bg-desa-foreshadow"></div>
                        <div class="h-4 w-40 rounded-full bg-desa-foreshadow"></div>
                    </div>
                    <div class="h-14 w-32 rounded-2xl bg-desa-foreshadow"></div>
                </div>
                <div class="my-6 h-px bg-desa-background"></div>
                <div class="grid grid-cols-3 gap-3">
                    <div v-for="metricIndex in 3" :key="metricIndex" class="flex items-center gap-3">
                        <div class="size-[52px] rounded-2xl bg-desa-foreshadow"></div>
                        <div class="flex flex-col gap-2">
                            <div class="h-5 w-28 rounded-full bg-desa-foreshadow"></div>
                            <div class="h-4 w-24 rounded-full bg-desa-foreshadow"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
