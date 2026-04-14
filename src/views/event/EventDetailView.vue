<script setup>
import { formatDateWithDay, formatRupiah } from '@/helpers/format'
import { can } from '@/helpers/permissionHelper'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/event'
import { useEventParticipantStore } from '@/stores/eventParticipant'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const midtransSnapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL
const midtransClientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY
let midtransSnapPromise = null

const eventParticipant = ref({
    event_id: route.params.id,
    quantity: 1,
    total_price: 0
})

const eventStore = useEventStore()
const { event, success, error } = storeToRefs(eventStore)

const eventParticipantStore = useEventParticipantStore()
const { createEventParticipant } = eventParticipantStore
const {
    error: participantError,
    loading: participantLoading
} = storeToRefs(eventParticipantStore)

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const fallbackImage = new URL('@/assets/images/thumbnails/kk-event-desa-1.jpeg', import.meta.url).href
const fallbackProfilePicture = new URL('@/assets/images/photos/kk-preview.png', import.meta.url)
    .href
const data = computed(() => event.value ?? {})
const recentParticipants = computed(() => data.value.recent_participants ?? [])
const formattedTotalPrice = computed(() => formatRupiah(eventParticipant.value.total_price))
const isRegistrationClosed = computed(() => !data.value.is_active)
const isPurchaseDisabled = computed(() => participantLoading.value || isRegistrationClosed.value)

const showSuccessModal = ref(false)
const paymentError = ref(null)

function closeModal() {
    showSuccessModal.value = false
}

function syncParticipantPrice() {
    eventParticipant.value.total_price = eventParticipant.value.quantity * Number(data.value.price ?? 0)
}

function extractErrorMessage(value) {
    if (!value) {
        return null
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'object') {
        const messages = Object.values(value)
            .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
            .filter(Boolean)

        return messages[0] ?? 'Terjadi kesalahan saat memproses pembayaran.'
    }

    return 'Terjadi kesalahan saat memproses pembayaran.'
}

const paymentErrorMessage = computed(() => paymentError.value ?? extractErrorMessage(participantError.value))

function clearPaymentError() {
    paymentError.value = null
    participantError.value = null
}

function createMidtransConfigError() {
    return new Error('Konfigurasi pembayaran Midtrans belum lengkap. Periksa environment aplikasi.')
}

async function ensureMidtransSnapLoaded() {
    if (typeof window === 'undefined') {
        throw new Error('Midtrans Snap hanya tersedia di browser.')
    }

    if (window.snap) {
        return window.snap
    }

    if (!midtransSnapUrl || !midtransClientKey) {
        throw createMidtransConfigError()
    }

    if (!midtransSnapPromise) {
        midtransSnapPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-midtrans-snap="true"]')

            if (existingScript) {
                existingScript.addEventListener(
                    'load',
                    () => {
                        if (window.snap) {
                            resolve(window.snap)
                            return
                        }

                        reject(new Error('Midtrans Snap berhasil dimuat, tetapi tidak dapat digunakan.'))
                    },
                    { once: true }
                )
                existingScript.addEventListener(
                    'error',
                    () => reject(new Error('Gagal memuat Midtrans Snap. Coba lagi dalam beberapa saat.')),
                    { once: true }
                )

                return
            }

            const script = document.createElement('script')
            script.src = midtransSnapUrl
            script.dataset.clientKey = midtransClientKey
            script.dataset.midtransSnap = 'true'
            script.onload = () => {
                if (window.snap) {
                    resolve(window.snap)
                    return
                }

                reject(new Error('Midtrans Snap berhasil dimuat, tetapi tidak dapat digunakan.'))
            }
            script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap. Coba lagi dalam beberapa saat.'))

            document.head.appendChild(script)
        }).catch((loadError) => {
            midtransSnapPromise = null
            throw loadError
        })
    }

    return midtransSnapPromise
}

const fetchData = async () => {
    await eventStore.fetchEvent(route.params.id)

    eventParticipant.value.event_id = data.value.id
    syncParticipantPrice()
}

const handleSubmitEventParticipant = async () => {
    clearPaymentError()

    if (isRegistrationClosed.value) {
        paymentError.value = 'Registrasi event sudah ditutup.'
        return
    }

    let snap

    try {
        snap = await ensureMidtransSnapLoaded()
    } catch (loadError) {
        paymentError.value = loadError.message
        return
    }

    const response = await createEventParticipant(eventParticipant.value)

    const snapToken = response?.data?.snap_token
    if (!snapToken) {
        paymentError.value = 'Token pembayaran Midtrans tidak tersedia. Silakan coba lagi.'
        return
    }

    snap.pay(snapToken, {
        onSuccess() {
            paymentError.value = null
            showSuccessModal.value = true

            eventParticipant.value.quantity = 1
            syncParticipantPrice()
            fetchData()
        },
        onPending() {
            paymentError.value = 'Pembayaran masih menunggu penyelesaian. Silakan cek kembali status transaksi Anda.'
        },
        onError(result) {
            paymentError.value = result?.status_message ?? 'Pembayaran gagal diproses. Silakan coba lagi.'
        },
        onClose() {
            paymentError.value = 'Popup pembayaran ditutup sebelum transaksi selesai.'
        }
    })
}

function incrementQuantity() {
    eventParticipant.value.quantity++

    syncParticipantPrice()
}

function decrementQuantity() {
    if (eventParticipant.value.quantity > 1) {
        eventParticipant.value.quantity--
    }

    syncParticipantPrice()
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

    if (user.value?.role === 'head-of-family') {
        ensureMidtransSnapLoaded().catch((loadError) => {
            paymentError.value = loadError.message
        })
    }
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <router-link :to="{ name: 'event' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">Event Desa
                    </router-link>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Detail Event Desa
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Detail Event Desa</h1>
            </div>
            <router-link :to="{ name: 'edit-event', params: { id: data.id } }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black" v-if="can('event-edit')">
                <p class="font-medium text-white">Ubah Data</p>
                <img src="@/assets/images/icons/edit-white.svg" class="flex size-6 shrink-0" alt="icon" />
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
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div v-if="paymentErrorMessage"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ paymentErrorMessage }}</span>

            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="clearPaymentError">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div class="flex gap-[14px]">
            <section id="Informasi"
                class="flex flex-col shrink-0 w-[calc(525/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Event</p>
                <div class="flex items-center w-full">
                    <div class="flex w-[100px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="getThumbnail(data.thumbnail)" class="w-full h-full object-cover" alt="photo"
                            @error="handleImageError($event, fallbackImage)" />
                    </div>
                    <div class="flex flex-col gap-[6px] w-full ml-4 mr-9">
                        <p class="font-semibold text-lg leading-[22.5px] line-clamp-1">
                            {{ data.name }}
                        </p>
                        <div class="flex items-center gap-1">
                            <img src="@/assets/images/icons/ticket-secondary-green.svg"
                                class="flex size-[18px] shrink-0" alt="icon" />
                            <p class="font-medium text-sm text-desa-secondary">
                                Registration:
                                <span class="font-medium text-base" :class="{
                                    'text-desa-dark-green': data.is_active,
                                    'text-desa-red': !data.is_active,
                                }">
                                    {{ formatAvailability(data.is_active) }}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-red/10 items-center justify-center">
                        <img src="@/assets/images/icons/ticket-2-red.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-red">
                            {{ formatRupiah(data.price) }}
                        </p>
                        <span class="font-medium text-desa-secondary"> Harga Event </span>
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
                            {{ data.participants_count }}
                            Orang
                        </p>
                        <span class="font-medium text-desa-secondary"> Total Partisipasi </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                        <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                            alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">
                            {{ formatDateWithDay(data.date) }}
                        </p>
                        <span class="font-medium text-desa-secondary"> Tanggal Pelaksaaan </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-yellow/10 items-center justify-center">
                        <img src="@/assets/images/icons/clock-yellow.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-yellow">
                            {{ data.time }} WIB
                        </p>
                        <span class="font-medium text-desa-secondary"> Waktu Pelaksaaan </span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Event</p>
                    <p class="font-medium leading-8">{{ data.description }}</p>
                </div>
            </section>
            <section id="Participants" class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white"
                v-if="user?.role === 'admin'">
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
                                {{ value.name }}
                            </p>
                            <p class="flex items-center gap-1">
                                <img src="@/assets/images/icons/briefcase-secondary-green.svg"
                                    class="flex size-[18px] shrink-0" alt="icon" />
                                <span class="font-medium text-sm text-desa-secondary">{{
                                    value.occupation
                                }}</span>
                            </p>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                </div>
                <a href="#"
                    class="flex items-center justify-center h-14 rounded-2xl py-4 px-6 gap-[10px] bg-desa-dark-green">
                    <span class="font-medium leading-5 text-white">View All</span>
                </a>
            </section>


            <form @submit.prevent="handleSubmitEventParticipant" class="flex-1" v-if="user?.role === 'head-of-family'">
                <div class="flex flex-col h-fit gap-6 rounded-2xl bg-white py-6 flex-1">
                    <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary px-6">Detail Pembayaran</h2>
                    <section id="Harga-Event" class="flex items-center justify-between px-6">
                        <div class="point flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-[#FF507017] rounded-2xl">
                                <img src="@/assets/images/icons/ticket-2-red.svg" alt="icon" class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px] text-desa-red"> {{
                                    formatRupiah(data.price) }}</p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Harga Event</h3>
                            </div>
                        </div>
                        <div id="CountButton"
                            class="py-3 px-4 rounded-2xl border border-desa-background flex items-center gap-3">
                            <button type="button" id="decrementBtn" @click="decrementQuantity"
                                :disabled="isRegistrationClosed">
                                <img src="@/assets/images/icons/minus-square-secondary-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                            </button>
                            <p id="counterValue"
                                class="font-medium text-[22px] leading-[27.5px] text-center text-[#000000]">{{
                                    eventParticipant.quantity }}</p>
                            <button type="button" id="incrementBtn" @click="incrementQuantity"
                                :disabled="isRegistrationClosed">
                                <img src="@/assets/images/icons/add-square-secondary-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                            </button>
                        </div>
                    </section>
                    <hr class="border-desa-background" />
                    <section id="Detail-Payment" class="flex flex-col gap-6 px-6">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-[6px]">
                                <img src="@/assets/images/icons/receipt-2-secondary-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                                <h4 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Metode Pembayaran
                                </h4>
                            </div>
                            <img src="@/assets/images/icons/midtrans.svg" alt="icon" class="w-[108px] shrink-0" />
                        </div>
                        <!-- <hr class="border-desa-background" />
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-[6px]">
                                <img src="@/assets/images/icons/receipt-2-secondary-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                                <h4 class="font-medium text-sm leading-[17.5px] text-desa-secondary">PPN 12%</h4>
                            </div>
                            <p class="font-semibold text-lg leading-[22.5px]">Rp119.760</p>
                        </div> -->
                        <hr class="border-desa-background" />
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-[6px]">
                                <img src="@/assets/images/icons/profile-2user-secondary-green-bold.svg" alt="icon"
                                    class="size-6 shrink-0" />
                                <h4 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Quanity</h4>
                            </div>
                            <p class="font-semibold text-lg leading-[22.5px]">{{ eventParticipant.quantity }}x warga</p>
                        </div>
                        <hr class="border-desa-background" />
                        <label class="flex items-center justify-between">
                            <div class="flex items-center gap-[6px]">
                                <img src="@/assets/images/icons/money-secondary-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                                <h4 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Harga Total</h4>
                            </div>
                            <input type="text" name="harga_total" :value="formattedTotalPrice"
                                class="font-semibold text-lg leading-[22.5px] text-right focus:outline-none" readonly />
                        </label>
                        <hr class="border-desa-background" />
                    </section>
                    <button type="submit" :disabled="isPurchaseDisabled"
                        class="bg-desa-dark-green mx-6 rounded-2xl py-[18px] flex justify-center items-center text-center text-white font-medium leading-5">{{
                            participantLoading ? 'Purchase Ticket...' : 'Purchase Ticket' }}</button>
                </div>
            </form>
        </div>
    </div>

    <div id="modal" v-if="showSuccessModal" class="fixed inset-0 flex items-center justify-center bg-[#001B1ACC] z-50">
        <div class="bg-white rounded-2xl p-4 w-[320px] flex flex-col items-center gap-6">
            <div class="flex flex-col items-center gap-4">
                <h3 class="font-semibold text-2xl leading-8 text-desa-secondary">Pembayaran Berhasil</h3>
                <p class="font-medium text-base leading-5 text-desa-secondary text-center">
                    Terima kasih telah berpartisipasi dalam acara ini.
                </p>
            </div>
            <button type="button"
                class="bg-desa-dark-green rounded-2xl py-[18px] flex justify-center items-center text-center text-white font-medium leading-5 w-full"
                @click="closeModal">Tutup</button>
        </div>
    </div>
</template>
