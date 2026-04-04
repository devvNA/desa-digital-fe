<script setup>
import ModalDelete from '@/components/ui/ModalDelete.vue'
import { formatRupiah, formatToClientTimezone, ucfirst } from '@/helpers/format'
import router from '@/router'
import { useSocialAssistanceStore } from '@/stores/socialAssistance'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const socialAssistanceStore = useSocialAssistanceStore()
const { socialAssistance, loading, error, success } = storeToRefs(socialAssistanceStore)
const { deleteSocialAssistance } = socialAssistanceStore

const fallbackImage = new URL('@/assets/images/thumbnails/kk-bansos-1.png', import.meta.url).href
const fallbackProfilePicture = new URL('@/assets/images/photos/kk-photo-1.png', import.meta.url).href
const showModalDelete = ref(false)
const deleteId = computed(() => route.params.id)
const detail = computed(() => socialAssistance.value ?? {})
const recentRecipients = computed(() => detail.value.recent_recipients ?? [])

const fetchData = async () => {
    await socialAssistanceStore.fetchSocialAssistance(route.params.id)
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

function formatCategory(value) {
    const map = {
        cash: 'Uang Tunai',
        goods: 'Barang',
        service: 'Layanan',
        health: 'Kesehatan',
        education: 'Pendidikan',
        food: 'Pangan',
    }

    return map[value] ?? ucfirst(value ?? '-')
}

function formatAvailability(value) {
    return value ? 'Tersedia' : 'Tidak Tersedia'
}

function formatRecipientsCount(value) {
    const count = Number(value ?? 0)

    return `${new Intl.NumberFormat('id-ID').format(count)} Warga`
}

function getStatusConfig(status) {
    const map = {
        pending: {
            label: 'Menunggu',
            className: 'bg-desa-yellow',
        },
        approved: {
            label: 'Disetujui',
            className: 'bg-desa-green',
        },
        rejected: {
            label: 'Ditolak',
            className: 'bg-desa-red',
        },
    }

    return map[status] ?? {
        label: ucfirst(status ?? 'Unknown'),
        className: 'bg-desa-black',
    }
}

async function handleDelete() {
    const isDeleted = await deleteSocialAssistance(deleteId.value)

    if (!isDeleted) {
        return
    }

    showModalDelete.value = false
    await router.replace({ path: '/social-assistance' })
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
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Bantuan
                        sosial</p>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Manage
                        bantuan sosial</p>
                </div>
                <h1 class="font-semibold text-2xl">Manage Bantuan Sosial</h1>
            </div>
            <div class="flex items-center gap-3">
                <button data-modal="Modal-Delete" class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-red"
                    @click="showModalDelete = true">
                    <p class="font-medium text-white">Hapus Data</p>
                    <img src="@/assets/images/icons/trash-white.svg" class="flex size-6 shrink-0" alt="icon" />
                </button>
                <router-link :to="{ name: 'edit-social-assistance', params: { id: route.params.id } }"
                    class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black cursor-pointer">
                    <p class="font-medium text-white">Ubah Data</p>
                    <img src="@/assets/images/icons/edit-white.svg" class="flex size-6 shrink-0" alt="icon" />
                </router-link>
            </div>
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
            <section id="Informasi-Bantuan-Sosial"
                class="flex flex-col shrink-0 w-[calc(545/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Bantuan Sosial
                </p>
                <div class="flex items-center justify-between gap-4">
                    <div class="flex w-[120px] h-[100px] shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="getThumbnail(detail.thumbnail)" class="w-full h-full object-cover" alt="photo"
                            @error="handleImageError($event, fallbackImage)" />
                    </div>
                    <div class="badge rounded-full p-3 gap-2 flex min-w-[120px] justify-center shrink-0"
                        :class="detail.is_available ? 'bg-desa-soft-green' : 'bg-desa-red'">
                        <span class="font-semibold text-xs text-white uppercase">{{
                            formatAvailability(detail.is_available)
                        }}</span>
                    </div>
                </div>
                <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-xl">{{ detail.name ?? '-' }}</p>
                    <p class="flex items-center gap-1">
                        <img src="@/assets/images/icons/briefcase-secondary-green.svg" class="flex size-[18px] shrink-0"
                            alt="icon" />
                        <span class="font-medium text-sm text-desa-secondary">{{
                            detail.provider || '-' }}</span>
                    </p>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                        <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">
                            {{
                                formatRupiah(detail.amount) }}</p>
                        <span class="font-medium text-desa-secondary">Nominal
                            Bantuan</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-blue/10 items-center justify-center">
                        <img src="@/assets/images/icons/profile-2user-blue.svg" class="flex size-6 shrink-0"
                            alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-blue">
                            {{
                                formatRecipientsCount(detail.recipients_count) }}
                        </p>
                        <span class="font-medium text-desa-secondary">Total
                            Penerima</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-yellow/10 items-center justify-center">
                        <img src="@/assets/images/icons/clock-yellow.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-black">
                            {{
                                formatCategory(detail.category) }}</p>
                        <span class="font-medium text-desa-secondary">Kategori
                            Bantuan</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Bantuan</p>
                    <p class="font-medium leading-8">{{ detail.description || 'Tidak ada deskripsi bantuan sosial.'
                        }}</p>
                </div>
            </section>
            <section id="Penerima-Bansos-Terakhir"
                class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Penerima Bansos Terakhir
                </p>
                <div id="List-Bansos-Terkahir" class="flex flex-col gap-6">
                    <div v-for="recipient in recentRecipients" :key="recipient.id"
                        class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-sm text-desa-secondary">
                                {{
                                    formatToClientTimezone(recipient.created_at)
                                }}</p>
                            <img src="@/assets/images/icons/calendar-2-secondary-green.svg"
                                class="flex size-[18px] shrink-0" alt="icon" />
                        </div>
                        <hr class="border-desa-background" />
                        <div class="flex items-center gap-3">
                            <div class="flex flex-col gap-[6px] w-full">
                                <p class="font-semibold text-lg leading-5">
                                    {{
                                        formatRupiah(recipient.amount)
                                    }}
                                </p>
                                <p class="font-medium text-sm text-desa-secondary">
                                    Nominal Pengajuan</p>
                            </div>
                            <div class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0"
                                :class="getStatusConfig(recipient.status).className">
                                <span class="font-semibold text-xs text-white uppercase">{{
                                    getStatusConfig(recipient.status).label
                                }}</span>
                            </div>
                        </div>
                        <hr class="border-desa-background" />
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-0.5">
                                <img src="@/assets/images/icons/profile-secondary-green.svg"
                                    class="flex size-[18px] shrink-0" alt="icon" />
                                <p class="font-medium text-sm text-desa-secondary">
                                    Diberikan Kepada:</p>
                            </div>
                            <div class="flex items-center gap-1">
                                <p class="font-medium leading-5">{{
                                    recipient.recipient_name ||
                                    '-' }}</p>
                                <div class="flex size-8 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden">
                                    <img :src="getProfilePicture(recipient.recipient_profile_picture)"
                                        class="w-full h-full object-cover" alt="photo"
                                        @error="handleImageError($event, fallbackProfilePicture)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="!recentRecipients.length && !loading"
                        class="rounded-2xl border border-dashed border-desa-background px-5 py-6 text-center text-desa-secondary">
                        Belum ada data penerima bantuan sosial terbaru.
                    </div>
                </div>
            </section>
        </div>
    </div>
    <ModalDelete :show="showModalDelete" :title="'Hapus Bantuan Sosial?'" :loading="loading"
        @close="showModalDelete = false" @confirm="handleDelete" />
</template>
