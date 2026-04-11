<script setup>
import InfoRow from '@/components/ui/InfoRow.vue'
import { formatRupiah, formatToClientTimezone, parseRupiah } from '@/helpers/format'
import {
    fallbackProfilePicture,
    fallbackThumbnail,
    formatAvailability,
    formatCategory,
    formatCreatedAt,
    formatRecipientsCount,
    getAvailabilityConfig,
    getBankLogo,
    getProfilePicture,
    getStatusConfig,
    getThumbnail,
    handleImageError,
    proofPlaceholder
} from '@/helpers/socialAssistance'
import { useSocialAssistanceRecipientStore } from '@/stores/socialAssistanceRecipient'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import iconBriefcase from '@/assets/images/icons/briefcase-secondary-green.svg'
import iconCalendar from '@/assets/images/icons/calendar-2-dark-green.svg'
import iconCloseGreen from '@/assets/images/icons/close-circle-secondary-green.svg'
import iconCloseWhite from '@/assets/images/icons/close-circle-white.svg'
import iconCopy from '@/assets/images/icons/document-copy-dark-green.svg'
import iconKeyboard from '@/assets/images/icons/keyboard-dark-green.svg'
import iconMinusSquare from '@/assets/images/icons/minus-square-red.svg'
import iconMoney from '@/assets/images/icons/money-dark-green.svg'
import iconProfile2User from '@/assets/images/icons/profile-2user-blue.svg'
import iconProfile2UserDark from '@/assets/images/icons/profile-2user-dark-green.svg'
import iconReceiveSquare from '@/assets/images/icons/receive-square-2-dark-green.svg'
import iconSendSquare from '@/assets/images/icons/send-square-white.svg'

// ── Store & route ────────────────────────────────────────────────
const route = useRoute()
const store = useSocialAssistanceRecipientStore()
const authStore = useAuthStore()
const { socialAssistanceRecipient, loading, error, success } = storeToRefs(store)
const { user } = storeToRefs(authStore)
// ── Refs ─────────────────────────────────────────────────────────
const proofFileInput = ref(null)
const uploadedProofPreview = ref('')

const recipientRequest = ref({
    social_assistance_id: null,
    head_of_family_id: null,
    bank: null,
    amount: null,
    reason: null,
    account_number: null,
    proof: null,
    status: null,
})

// ── Computed ─────────────────────────────────────────────────────
const detail = computed(() => socialAssistanceRecipient.value ?? {})
const socialAssistance = computed(() => detail.value.social_assistance ?? {})
const headOfFamily = computed(() => detail.value.head_of_family ?? {})
const headOfFamilyUser = computed(() => headOfFamily.value.user ?? {})
const statusConfig = computed(() => getStatusConfig(detail.value.status))
const availabilityConfig = computed(() => getAvailabilityConfig(socialAssistance.value.is_available))
const bankLogo = computed(() => getBankLogo(detail.value.bank))
const isHeadOfFamily = computed(() => authStore.user?.role === 'head_of_family')


const proofImage = computed(() => {
    if (uploadedProofPreview.value) return uploadedProofPreview.value
    if (detail.value.proof) return getThumbnail(detail.value.proof)
    return proofPlaceholder
})

const recipientProofImage = computed(() => {
    return detail.value.proof ? getThumbnail(detail.value.proof) : null
})

// ── Methods ──────────────────────────────────────────────────────
function syncRecipientRequest(recipient = detail.value) {
    recipientRequest.value = {
        social_assistance_id: recipient?.social_assistance?.id ?? null,
        head_of_family_id: recipient?.head_of_family?.id ?? null,
        bank: recipient?.bank ?? null,
        amount: recipient?.amount ?? null,
        reason: recipient?.reason ?? null,
        account_number: recipient?.account_number ?? null,
        proof: null,
        status: recipient?.status ?? null,
    }
}

async function fetchData() {
    const recipient = await store.fetchSocialAssistanceRecipient(route.params.id)
    if (recipient) syncRecipientRequest(recipient)
}

function openProofFilePicker() {
    proofFileInput.value?.click()
}

function handleProofFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (uploadedProofPreview.value) URL.revokeObjectURL(uploadedProofPreview.value)

    recipientRequest.value.proof = file
    uploadedProofPreview.value = URL.createObjectURL(file)
    event.target.value = ''
}

function handleProofImageError(event) {
    event.target.src = proofPlaceholder
}

async function handleSubmit() {
    const req = recipientRequest.value
    const payload = {
        ...req,
        amount: typeof req.amount === 'number' ? req.amount : parseRupiah(req.amount),
    }

    if (import.meta.env.DEV) {
        console.debug('[RecipientDetail] submit', {
            id: route.params.id,
            status: payload.status,
            hasProof: payload.proof instanceof File,
        })
    }

    const updated = await store.updateSocialAssistanceRecipient(route.params.id, payload)
    if (updated) {
        if (uploadedProofPreview.value) {
            URL.revokeObjectURL(uploadedProofPreview.value)
            uploadedProofPreview.value = ''
        }
        syncRecipientRequest(updated)
    }
}

async function handleStatusUpdate(status) {
    recipientRequest.value.status = status
    await handleSubmit()
}

// ── Lifecycle ────────────────────────────────────────────────────
onMounted(fetchData)
onBeforeUnmount(() => {
    if (uploadedProofPreview.value) URL.revokeObjectURL(uploadedProofPreview.value)
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Header -->
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <RouterLink :to="{ name: 'social-assistance-recipient' }" class="
                            last-of-type:text-desa-dark-green
                            last-of-type:font-semibold
                            capitalize
                            hover:text-desa-dark-green
                            transition-colors
                        ">
                        Pengajuan Bantuan sosial
                    </RouterLink>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Detail Pengajuan
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Detail Pengajuan Bansos</h1>
            </div>
        </div>

        <!-- Alerts: Success -->
        <div v-if="success" role="alert" class="
                bg-green-100
                border border-green-400
                text-green-700
                px-4 py-3
                rounded-2xl
                relative
                mb-4
            ">
            <span class="block sm:inline">{{ success }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="success = null">
                <img :src="iconCloseGreen" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <!-- Alerts: Error -->
        <div v-if="error" role="alert" class="
                bg-red-100
                border border-red-400
                text-red-700
                px-4 py-3
                rounded-2xl
                relative
                mb-4
            ">
            <span class="block sm:inline">{{ error }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="error = null">
                <img :src="iconCloseWhite" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="rounded-3xl bg-white p-6 text-desa-secondary">
            Memuat detail pengajuan bantuan sosial...
        </div>

        <!-- Content -->
        <div v-else class="flex gap-[14px]">
            <!-- Left: Social Assistance Info -->
            <section id="Detail"
                class="flex flex-col shrink-0 w-[calc(545/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Detail Bantuan Sosial</p>

                <div class="flex items-center justify-between gap-4">
                    <div class="flex w-[120px] h-[100px] shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="getThumbnail(socialAssistance.thumbnail)" class="w-full h-full object-cover"
                            alt="photo" @error="handleImageError($event, fallbackThumbnail)">
                    </div>
                    <div class="
                            badge
                            rounded-full
                            p-3
                            gap-2
                            flex
                            min-w-[110px]
                            justify-center
                            shrink-0
                        " :class="[availabilityConfig.className, 'border']"
                        :style="{ borderColor: socialAssistance.is_available ? '#89B854' : '#FF5070' }">
                        <span class="font-semibold text-xs uppercase" :class="availabilityConfig.textClassName">
                            {{ formatAvailability(socialAssistance.is_available) }}
                        </span>
                    </div>
                </div>

                <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-xl line-clamp-1">{{ socialAssistance.name || '-' }}</p>
                    <p class="flex items-center gap-1">
                        <img :src="iconBriefcase" class="flex size-[18px] shrink-0" alt="icon">
                        <span class="font-medium text-sm text-desa-secondary">
                            {{ socialAssistance.provider || '-' }}
                        </span>
                    </p>
                </div>

                <hr class="border-desa-foreshadow">
                <InfoRow :icon="iconMoney" :value="formatRupiah(socialAssistance.amount)"
                    :label="formatCategory(socialAssistance.category)"
                    value-class="text-desa-dark-green leading-[22.5px]" />

                <hr class="border-desa-foreshadow">
                <InfoRow :icon="iconMinusSquare" :value="formatRupiah(9200000)" label="Sisa Bansos"
                    value-class="text-desa-red leading-[22.5px]" icon-box-class="bg-desa-red/10" />

                <hr class="border-desa-foreshadow">
                <InfoRow :icon="iconProfile2User" :value="formatRecipientsCount(socialAssistance.recipients_count)"
                    label="Total Penerima" value-class="text-desa-blue leading-[22.5px]"
                    icon-box-class="bg-desa-blue/10" />

                <hr class="border-desa-foreshadow">
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Bantuan</p>
                    <p class="font-medium leading-8">{{ socialAssistance.description || '-' }}</p>
                </div>
            </section>

            <!-- Right: Submission Detail -->
            <div v-if="isHeadOfFamily" class="flex-1 flex flex-col h-fit gap-[14px] w-[418px]">
                <div class="rounded-2xl bg-white p-6 flex flex-col gap-6">
                    <section id="Status-Pengajuan" class="flex items-center justify-between">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Status Pengajuan</h2>
                        <div class="
                            badge
                            rounded-full
                            p-3
                            gap-2
                            flex
                            min-w-[110px]
                            justify-center
                            shrink-0
                        " :class="statusConfig.className">
                            <span class="font-semibold text-xs text-white uppercase">
                                {{ statusConfig.label }}
                            </span>
                        </div>
                    </section>
                    <hr class="border-desa-background" />
                    <section id="Bukti-Menerima-Bansos" class="flex flex-col gap-4">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Bukti Menerima Bansos</h2>
                        <div
                            class="relative flex justify-center items-center w-full h-[230px] overflow-hidden rounded-2xl">
                            <div v-if="!recipientProofImage"
                                class="square-dashed w-full h-[230px] flex justify-center items-center">
                                <p class="text-center w-[240px] font-medium text-xs leading-[19.2px] text-[#ACB9BB]">
                                    Gambar akan muncul jika status pengajuan sudah berhasil 😉
                                </p>
                            </div>
                            <img v-else :src="recipientProofImage" alt="image"
                                class="bukti-menerima-bansos absolute left-0 top-0 w-full h-full object-cover"
                                @error="handleProofImageError" />
                        </div>
                    </section>
                </div>
                <div class="flex flex-col gap-6 rounded-2xl bg-white p-6">
                    <section id="Detail Pengajuan" class="flex flex-col gap-6">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Detail Pengajuan</h2>
                        <div class="point flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                                <img :src="iconReceiveSquare" alt="icon" class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">{{
                                    formatRupiah(detail.amount) }}</p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nominal Pengajuan
                                </h3>
                            </div>
                        </div>
                        <hr class="border-desa-background" />
                        <div class="point flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                                <img :src="iconCalendar" alt="icon" class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px]">{{ formatCreatedAt(detail.created_at)
                                    }}
                                </p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Tanggal Pengajuan
                                </h3>
                            </div>
                        </div>
                        <hr class="border-desa-background" />
                    </section>
                    <section id="Pesan-Pengajuan" class="flex flex-col gap-1">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Pesan Pengajuan:</h2>
                        <p class="font-medium leading-8">{{ detail.reason || 'Tidak ada alasan pengajuan.' }}</p>
                    </section>
                </div>
            </div>

            <section v-else-if="user?.role === 'admin'"
                class="flex min-w-0 flex-col flex-1 h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Detail Pengajuan</p>

                <!-- Head of Family Profile -->
                <div class="flex w-full min-w-0 items-center gap-3">
                    <div class="flex size-[54px] rounded-full bg-desa-foreshadow overflow-hidden">
                        <img :src="getProfilePicture(headOfFamily.profile_picture)" class="w-full h-full object-cover"
                            alt="icon" @error="handleImageError($event, fallbackProfilePicture)">
                    </div>
                    <div class="flex min-w-0 flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-black break-words">
                            {{ headOfFamilyUser.name || '-' }}
                        </p>
                        <p class="flex min-w-0 items-center gap-1">
                            <img :src="iconBriefcase" class="flex size-[18px] shrink-0" alt="icon">
                            <span class="font-medium text-sm text-desa-secondary break-words">
                                {{ headOfFamily.occupation || '-' }}
                            </span>
                        </p>
                    </div>
                </div>

                <hr class="border-desa-background">
                <InfoRow :icon="iconProfile2UserDark" :value="headOfFamilyUser.email || '-'"
                    label="Email Kepala Keluarga" />

                <hr class="border-desa-background">
                <InfoRow :icon="iconKeyboard" :value="headOfFamily.identity_number || '-'" label="NIK" />

                <hr class="border-desa-background">
                <InfoRow :icon="iconCalendar" :value="formatCreatedAt(detail.created_at)" label="Tanggal Pengajuan" />

                <hr class="border-desa-background">
                <InfoRow :icon="iconReceiveSquare" :value="formatRupiah(detail.amount)" label="Nominal Pengajuan" />

                <hr class="border-desa-background">
                <div class="flex w-full flex-col gap-1 min-w-0">
                    <p class="font-medium text-sm text-desa-secondary">Pesan Pengajuan:</p>
                    <p class="font-medium leading-8 break-words">
                        {{ detail.reason || 'Tidak ada alasan pengajuan.' }}
                    </p>
                </div>

                <hr class="border-desa-background">
                <!-- Bank Account -->
                <div class="flex w-full min-w-0 flex-col gap-6">
                    <p class="font-medium text-sm text-desa-secondary">Rekening Kepala Rumah</p>
                    <div class="flex items-center gap-3">
                        <div class="
                                flex
                                w-[120px]
                                h-[60px]
                                rounded-2xl
                                border border-desa-background
                                py-3
                                px-0.5
                                items-center
                                justify-center
                                bg-desa-blue/10
                                overflow-hidden
                                shrink-0
                            ">
                            <img v-if="bankLogo" :src="bankLogo" class="w-full h-full object-contain" alt="bank logo">
                            <span v-else class="px-3 text-center font-semibold text-desa-dark-green truncate">
                                {{ detail.bank || '-' }}
                            </span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-medium text-sm text-desa-secondary truncate">
                                {{ headOfFamilyUser.name || '-' }}
                            </p>
                            <div class="flex items-center gap-1">
                                <img :src="iconCopy" class="flex size-[18px] shrink-0" alt="icon">
                                <p class="font-semibold text-lg text-desa-dark-green truncate">
                                    {{ detail.account_number || '-' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <hr class="border-desa-background">
                <!-- Proof Upload + Actions -->
                <form @submit.prevent="handleSubmit" class="flex w-full min-w-0 flex-col gap-6">
                    <p class="font-medium text-sm text-desa-secondary">Bukti Pemberian Bansos</p>
                    <div class="flex flex-row items-center gap-4 justify-center">
                        <div id="Photo-Preview" class="
                                flex
                                justify-center
                                w-[120px]
                                h-[120px]
                                rounded-2xl
                                overflow-hidden
                                bg-desa-foreshadow
                                shrink-0
                            ">
                            <img :src="proofImage" alt="proof" class="size-full object-cover"
                                @error="handleProofImageError" />
                        </div>
                        <div class="relative w-[120px] justify-center">
                            <input ref="proofFileInput" type="file" accept="image/*"
                                class="absolute left-0 top-0 h-full w-full opacity-0 pointer-events-none"
                                @change="handleProofFileChange" />
                            <button type="button" class="
                                    flex
                                    items-center
                                    justify-center
                                    gap-[10px]
                                    rounded-2xl
                                    bg-desa-black
                                    px-6
                                    py-4
                                    w-full
                                    text-white
                                " @click="openProofFilePicker">
                                <img :src="iconSendSquare" alt="icon" class="size-6 shrink-0" />
                                <span class="font-medium">Upload</span>
                            </button>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                    <div class="flex items-center gap-3 w-full">
                        <button type="button" class="
                                flex
                                items-center
                                w-full
                                justify-center
                                gap-[10px]
                                rounded-2xl
                                py-4
                                px-6
                                bg-desa-red/10
                            " @click="handleStatusUpdate('rejected')">
                            <span class="font-medium text-desa-red">Tolak</span>
                        </button>
                        <button type="button" class="
                                flex
                                items-center
                                w-full
                                justify-center
                                gap-[10px]
                                rounded-2xl
                                py-4
                                px-6
                                bg-desa-dark-green
                            " @click="handleStatusUpdate('approved')">
                            <span class="font-medium text-white">Setuju</span>
                        </button>
                    </div>
                </form>
            </section>

            <div class="flex-1 flex flex-col h-fit gap-[14px] w-[418px]" v-if="user?.role === 'head-of-family'">
                <div class="rounded-2xl bg-white p-6 flex flex-col gap-6">
                    <section id="Status-Pengajuan" class="flex items-center justify-between">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Status Pengajuan</h2>
                        <div class="
                            badge
                            rounded-full
                            p-3
                            gap-2
                            flex
                            min-w-[110px]
                            justify-center
                            shrink-0
                        " :class="statusConfig.className">
                            <span class="font-semibold text-xs text-white uppercase">
                                {{ statusConfig.label }}
                            </span>
                        </div>
                    </section>
                    <hr class="border-desa-background" />
                    <section id="Bukti-Menerima-Bansos" class="flex flex-col gap-4">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Bukti Menerima Bansos</h2>
                        <div
                            class="relative flex justify-center items-center w-full h-[230px] overflow-hidden rounded-2xl">
                            <div class="square-dashed w-full h-[230px] flex justify-center items-center">
                                <p class="text-center w-[240px] font-medium text-xs leading-[19.2px] text-[#ACB9BB]">
                                    Gambar akan muncul jika status pengajuan sudah berhasil</p>
                            </div>
                            <img src="" alt="image"
                                class="bukti-menerima-bansos absolute left-0 top-0 w-full h-full object-cover" />
                        </div>
                    </section>
                </div>
                <div class="flex flex-col gap-6 rounded-2xl bg-white p-6">
                    <section id="Detail Pengajuan" class="flex flex-col gap-6">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Detail Pengajuan</h2>
                        <div class="point flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                                <img src="@/assets/images/icons/receive-square-2-dark-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">{{
                                    formatRupiah(detail.amount) }}</p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nominal Pengajuan
                                </h3>
                            </div>
                        </div>
                        <hr class="border-desa-background" />
                        <div class="point flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                                <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px]">
                                    {{ formatToClientTimezone(detail.created_at) }}</p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Tanggal Pengajuan
                                </h3>
                            </div>
                        </div>
                        <hr class="border-desa-background" />
                    </section>
                    <section id="Pesan-Pengajuan" class="flex flex-col gap-1">
                        <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Pesan Pengajuan:</h2>
                        <p class="font-medium leading-8">{{ socialAssistanceRecipient?.reason }}</p>
                    </section>
                </div>
            </div>
        </div>
    </div>
</template>
