<script setup>
import { formatDateWithDay, formatRupiah } from '@/helpers/format'
import { useEventStore } from '@/stores/event'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const eventStore = useEventStore()
const { event, success, error } = storeToRefs(eventStore)

const fallbackImage = new URL('@/assets/images/thumbnails/kk-event-1.png', import.meta.url).href
const fallbackProfilePicture = new URL('@/assets/images/photos/kk-photo-1.png', import.meta.url).href
const detail = computed(() => event.value ?? {})
const recentParticipants = computed(() => detail.value.recent_participants ?? [])

const fetchData = async () => {
    await eventStore.fetchEvent(route.params.id)
}

function normalizeImageUrl(value, fallback) {
    if (!value) {
        return fallback
    }

    const nestedHttpIndex = value.indexOf('http', value.indexOf('http') + 1)

    if (nestedHttpIndex > 0) {
        return value.slice(nestedHttpIndex)
    }

    return value
}

function getThumbnail(value) {
    return normalizeImageUrl(value, fallbackImage)
}

function getProfilePicture(value) {
    return normalizeImageUrl(value, fallbackProfilePicture)
}

function handleImageError(event, fallback) {
    event.target.src = fallback
}

function formatAvailability(value) {
    return value ? 'Open' : 'Closed'
}

onMounted(() => {
    fetchData()
})


</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <router-link :to="{ name: 'event' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">Event
                        Desa
                    </router-link>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize ">
                        Detail Event
                        Desa</p>
                </div>
                <h1 class="font-semibold text-2xl">Detail Event Desa</h1>
            </div>
            <router-link :to="{ name: 'edit-event', params: { id: detail.id } }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black">
                <p class="font-medium text-white">Ubah Data</p>
                <img src="@/assets/images/icons/edit-white.svg" class="flex size-6 shrink-0" alt="icon">
            </router-link>
        </div>
        <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl relative"
            role="alert">
            <span class="block sm:inline">{{ success }}</span>

            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="success = null">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative"
            role="alert">
            <span class="block sm:inline">{{ error }}</span>

            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="error = null">
                <img src="@/assets/images/icons/close-circle-white.svg" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <div class="flex gap-[14px]">
            <section id="Informasi"
                class="flex flex-col shrink-0 w-[calc(525/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Event</p>
                <div class="flex items-center w-full">
                    <div class="flex w-[100px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="getThumbnail(detail.thumbnail)" class="w-full h-full object-cover" alt="photo"
                            @error="handleImageError($event, fallbackImage)" />
                    </div>
                    <div class="flex flex-col gap-[6px] w-full ml-4 mr-9">
                        <p class="font-semibold text-lg leading-[22.5px] line-clamp-1">
                            {{ detail.name }}</p>
                        <div class="flex items-center gap-1">
                            <img src="@/assets/images/icons/ticket-secondary-green.svg"
                                class="flex size-[18px] shrink-0" alt="icon">
                            <p class="font-medium text-sm text-desa-secondary">
                                Registration:
                                <span class="font-medium text-base" :class="{
                                    'text-desa-dark-green': detail.is_active,
                                    'text-desa-red': !detail.is_active,
                                }">
                                    {{
                                        formatAvailability(detail.is_active)
                                    }}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <hr class="border-desa-foreshadow">
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-red/10 items-center justify-center">
                        <img src="@/assets/images/icons/ticket-2-red.svg" class="flex size-6 shrink-0" alt="icon">
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-red">
                            {{ formatRupiah(detail.price)
                            }}
                        </p>
                        <span class="font-medium text-desa-secondary">
                            Harga Event
                        </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow">
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-blue/10 items-center justify-center">
                        <img src="@/assets/images/icons/profile-2user-blue.svg" class="flex size-6 shrink-0" alt="icon">
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-blue">
                            {{ detail.participants_count }}
                            Orang
                        </p>
                        <span class="font-medium text-desa-secondary">
                            Total Partisipasi
                        </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow">
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                        <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                            alt="icon">
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">
                            {{
                                formatDateWithDay(detail.date) }}</p>
                        <span class="font-medium text-desa-secondary">
                            Tanggal Pelaksaaan
                        </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow">
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-yellow/10 items-center justify-center">
                        <img src="@/assets/images/icons/clock-yellow.svg" class="flex size-6 shrink-0" alt="icon">
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-yellow">
                            {{
                                detail.time }} WIB
                        </p>
                        <span class="font-medium text-desa-secondary">
                            Waktu Pelaksaaan
                        </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow">
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Event</p>
                    <p class="font-medium leading-8">{{ detail.description }}</p>
                </div>
            </section>
            <section id="Participants" class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Latest Participants</p>
                <div class="flex flex-col gap-[14px]">
                    <div v-for="value in recentParticipants" :key="value.id"
                        class="flex items-center gap-3 w-[302px] shrink-0">
                        <div class="flex size-[54px] rounded-full bg-desa-foreshadow overflow-hidden">
                            <img :src="getProfilePicture(value.profile_picture)" class="w-full h-full object-cover"
                                alt="icon" @error="handleImageError($event, fallbackProfilePicture)" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5 text-desa-black">
                                {{ value.name }}</p>
                            <p class="flex items-center gap-1">
                                <img src="@/assets/images/icons/briefcase-secondary-green.svg"
                                    class="flex size-[18px] shrink-0" alt="icon">
                                <span class="font-medium text-sm text-desa-secondary">{{
                                    value.occupation }}</span>
                            </p>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                </div>
                <a href="#"
                    class="flex items-center justify-center h-14 rounded-2xl py-4 px-6 gap-[10px] bg-desa-dark-green">
                    <span class="font-medium leading-5 text-white">View All</span>
                </a>
            </section>
        </div>
    </div>
</template>
