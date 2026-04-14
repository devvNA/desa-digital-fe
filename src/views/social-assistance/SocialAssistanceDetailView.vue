<script setup>
import IconDollarBlack from '@/assets/images/icons/dollar-square-black.svg'
import IconDollarSecondaryGreen from '@/assets/images/icons/dollar-square-secondary-green.svg'
import Input from '@/components/ui/Input.vue'
import ModalDelete from '@/components/ui/ModalDelete.vue'
import { formatRupiah, formatToClientTimezone, parseRupiah, ucfirst } from '@/helpers/format'
import { can } from '@/helpers/permissionHelper'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useSocialAssistanceRecipientStore } from '@/stores/socialAssistanceRecipient'
import { useSocialAssistanceStore } from '@/stores/socialAssistance'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const socialAssistanceStore = useSocialAssistanceStore()
const {
    socialAssistance,
    loading: assistanceLoading,
    error: assistanceError,
    success: assistanceSuccess,
} = storeToRefs(socialAssistanceStore)
const { deleteSocialAssistance, fetchSocialAssistance } = socialAssistanceStore

const socialAssistanceRecipientStore = useSocialAssistanceRecipientStore()
const {
    loading: recipientLoading,
    error: recipientError,
    success: recipientSuccess,
} = storeToRefs(socialAssistanceRecipientStore)
const { createSocialAssistanceRecipient } = socialAssistanceRecipientStore

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const fallbackImage = new URL('@/assets/images/thumbnails/kk-bansos-1.png', import.meta.url).href
const fallbackProfilePicture = new URL('@/assets/images/photos/kk-photo-1.png', import.meta.url).href
const showModalDelete = ref(false)
const validationErrors = ref({})
const deleteId = computed(() => route.params.id)
const detail = computed(() => socialAssistance.value ?? {})
const recentRecipients = computed(() => detail.value.recent_recipients ?? [])
const isHeadOfFamily = computed(() => user.value?.role === 'head-of-family')
const hasHeadOfFamilyId = computed(() =>
    Boolean(socialAssistanceRecipient.value.head_of_family_id || user.value?.head_of_family_id),
)

const bankOptions = [
    {
        value: 'BRI',
        label: 'Bank Rakyat Indonesia',
        logo: new URL('@/assets/images/logos/bri.svg', import.meta.url).href,
    },
    {
        value: 'BNI',
        label: 'Bank Negara Indonesia',
        logo: new URL('@/assets/images/logos/bni.svg', import.meta.url).href,
    },
    {
        value: 'MANDIRI',
        label: 'Bank Mandiri',
        logo: new URL('@/assets/images/logos/mandiri.svg', import.meta.url).href,
    },
    {
        value: 'BCA',
        label: 'Bank Central Asia',
        logo: new URL('@/assets/images/logos/bca.svg', import.meta.url).href,
    },
    {
        value: 'PERMATA',
        label: 'Bank Permata',
        logo: new URL('@/assets/images/logos/permata.svg', import.meta.url).href,
    },
]

const MAX_AMOUNT_INTEGER_DIGITS = 15
const MAX_AMOUNT_DECIMAL_DIGITS = 2

const socialAssistanceRecipient = ref({
    social_assistance_id: '',
    head_of_family_id: '',
    bank: '',
    amount: '',
    reason: '',
    account_number: '',
})

const socialAssistanceErrorMessage = computed(() => {
    if (typeof assistanceError.value === 'string') {
        return assistanceError.value
    }

    if (assistanceError.value && typeof assistanceError.value === 'object') {
        return 'Detail bantuan sosial gagal dimuat.'
    }

    return null
})

const recipientGeneralError = computed(() => {
    if (typeof recipientError.value === 'string') {
        return recipientError.value
    }

    if (recipientError.value && typeof recipientError.value === 'object') {
        return 'Pengajuan bantuan sosial gagal dikirim. Periksa kembali input yang bertanda error.'
    }

    return null
})

const isApplicationDisabled = computed(
    () => recipientLoading.value || !detail.value.is_available || !hasHeadOfFamilyId.value,
)

const selectedBankLabel = computed(
    () => bankOptions.find((item) => item.value === socialAssistanceRecipient.value.bank)?.label,
)

const amountInput = computed({
    get: () => formatAmountInput(socialAssistanceRecipient.value.amount),
    set: (value) => {
        socialAssistanceRecipient.value.amount = normalizeAmountInput(value)
        clearFieldError('amount')
    },
})

async function fetchData() {
    const response = await fetchSocialAssistance(route.params.id)

    if (!response) {
        return
    }

    socialAssistanceRecipient.value.social_assistance_id = String(response.id ?? '')
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

    return (
        map[status] ?? {
            label: ucfirst(status ?? 'Unknown'),
            className: 'bg-desa-black',
        }
    )
}

async function handleDelete() {
    const isDeleted = await deleteSocialAssistance(deleteId.value)

    if (!isDeleted) {
        return
    }

    showModalDelete.value = false
    await router.replace({ path: '/social-assistance' })
}

function getFieldError(field) {
    const fieldError = validationErrors.value[field] ?? recipientError.value?.[field]

    if (!fieldError) {
        return null
    }

    return Array.isArray(fieldError) ? fieldError[0] : fieldError
}

function clearFieldError(field) {
    if (validationErrors.value[field]) {
        validationErrors.value = {
            ...validationErrors.value,
            [field]: null,
        }
    }

    if (recipientError.value && typeof recipientError.value === 'object' && recipientError.value[field]) {
        recipientError.value = {
            ...recipientError.value,
            [field]: null,
        }
    }
}

function clearSocialAssistanceFeedback() {
    assistanceError.value = null
    assistanceSuccess.value = null
}

function clearRecipientFeedback() {
    validationErrors.value = {}
    recipientError.value = null
    recipientSuccess.value = null
}

function normalizeAmountInput(value) {
    if (value === null || value === undefined || value === '') return ''

    const sanitizedValue = String(value)
        .trim()
        .replace(/[^\d,.-]/g, '')

    if (!sanitizedValue) return ''

    const hasDot = sanitizedValue.includes('.')
    const hasComma = sanitizedValue.includes(',')

    if (!hasDot && !hasComma) return sanitizedValue.replace(/[^\d-]/g, '')

    if (hasDot && hasComma) {
        const isCommaDecimal = sanitizedValue.lastIndexOf(',') > sanitizedValue.lastIndexOf('.')
        const groupingSeparator = isCommaDecimal ? /\./g : /,/g
        const normalized = sanitizedValue.replace(groupingSeparator, '')

        return isCommaDecimal ? normalized.replace(',', '.') : normalized
    }

    const separator = hasComma ? ',' : '.'
    const parts = sanitizedValue.split(separator)
    const trailingDigits = parts[parts.length - 1]?.replace(/\D/g, '') ?? ''
    const isGrouping = parts.length > 2 || trailingDigits.length > 2 || !trailingDigits

    if (isGrouping)
        return sanitizedValue.replace(new RegExp(`\\${separator}`, 'g'), '').replace(/[^\d-]/g, '')

    const cleanPattern = hasComma ? /[^\d,-]/g : /[^\d.-]/g
    const normalized = sanitizedValue.replace(cleanPattern, '')

    return hasComma ? normalized.replace(',', '.') : normalized
}

function formatAmountInput(value) {
    const normalized = normalizeAmountInput(value)
    return normalized ? formatRupiah(normalized) : ''
}

function validateAmountInput(value) {
    if (!value) {
        return null
    }

    const [integerPart = '', decimalPart = ''] = String(value).split('.')
    const intDigits = integerPart.replace(/[^\d]/g, '')
    const decDigits = decimalPart.replace(/\D/g, '')

    if (intDigits.length > MAX_AMOUNT_INTEGER_DIGITS) {
        return `Nominal pengajuan terlalu besar. Maksimal ${MAX_AMOUNT_INTEGER_DIGITS} digit sebelum koma.`
    }

    if (decDigits.length > MAX_AMOUNT_DECIMAL_DIGITS) {
        return `Nominal pengajuan hanya boleh memiliki ${MAX_AMOUNT_DECIMAL_DIGITS} angka desimal.`
    }

    return null
}

async function handleSubmit() {
    if (isApplicationDisabled.value) {
        return
    }

    validationErrors.value = {}
    recipientError.value = null
    recipientSuccess.value = null

    const amountError = validateAmountInput(socialAssistanceRecipient.value.amount)

    if (amountError) {
        validationErrors.value = { amount: [amountError] }
        return
    }

    const payload = {
        social_assistance_id:
            socialAssistanceRecipient.value.social_assistance_id || String(detail.value.id ?? ''),
        head_of_family_id:
            socialAssistanceRecipient.value.head_of_family_id || String(user.value?.head_of_family_id ?? ''),
        bank: socialAssistanceRecipient.value.bank,
        amount: parseRupiah(socialAssistanceRecipient.value.amount),
        reason: socialAssistanceRecipient.value.reason,
        account_number: socialAssistanceRecipient.value.account_number,
    }

    const result = await createSocialAssistanceRecipient(payload)

    if (!result) {
        validationErrors.value =
            typeof recipientError.value === 'object' && recipientError.value !== null
                ? recipientError.value
                : {}
        return
    }

    if (!result.id) {
        return
    }

    await router.replace({
        name: 'manage-social-assistance-recipient',
        params: { id: result.id },
        query: { submitted: '1' },
    })
}

watch(
    () => user.value?.head_of_family_id,
    (newValue) => {
        if (newValue) {
            socialAssistanceRecipient.value.head_of_family_id = String(newValue)
        }
    },
    { immediate: true },
)

onMounted(() => {
    fetchData()
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <RouterLink :to="{ name: 'social-assistance' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize hover:text-desa-dark-green transition-colors">
                        Bantuan sosial</RouterLink>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Manage bantuan sosial
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Manage Bantuan Sosial</h1>
            </div>
            <div class="flex items-center gap-3"
                v-if="can('social-assistance.delete') || can('social-assistance.edit')">
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

        <div v-if="assistanceSuccess"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ assistanceSuccess }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4"
                @click="clearSocialAssistanceFeedback">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div v-if="socialAssistanceErrorMessage"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ socialAssistanceErrorMessage }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4"
                @click="clearSocialAssistanceFeedback">
                <img src="@/assets/images/icons/close-circle-white.svg" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <div v-if="isHeadOfFamily && recipientSuccess"
            class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ recipientSuccess }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="clearRecipientFeedback">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div v-if="isHeadOfFamily && recipientGeneralError"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ recipientGeneralError }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="clearRecipientFeedback">
                <img src="@/assets/images/icons/close-circle-white.svg" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <div class="flex gap-[14px]">
            <section id="Informasi-Bantuan-Sosial"
                class="flex flex-col shrink-0 w-[calc(545/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Bantuan Sosial</p>
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
                            detail.provider || '-'
                        }}</span>
                    </p>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                        <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">
                            {{ formatRupiah(detail.amount) }}
                        </p>
                        <span class="font-medium text-desa-secondary">Nominal Bantuan</span>
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
                            {{ formatRecipientsCount(detail.recipients_count) }}
                        </p>
                        <span class="font-medium text-desa-secondary">Total Penerima</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center w-full gap-3">
                    <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-yellow/10 items-center justify-center">
                        <img src="@/assets/images/icons/clock-yellow.svg" class="flex size-6 shrink-0" alt="icon" />
                    </div>
                    <div class="flex flex-col gap-1 w-full">
                        <p class="font-semibold text-lg leading-[22.5px] text-desa-black">
                            {{ formatCategory(detail.category) }}
                        </p>
                        <span class="font-medium text-desa-secondary">Kategori Bantuan</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Bantuan</p>
                    <p class="font-medium leading-8">
                        {{ detail.description || 'Tidak ada deskripsi bantuan sosial.' }}
                    </p>
                </div>
            </section>
            <section id="Penerima-Bansos-Terakhir"
                class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white"
                v-if="user?.role === 'admin'">
                <p class="font-medium leading-5 text-desa-secondary">Penerima Bansos Terakhir</p>
                <div id="List-Bansos-Terkahir" class="flex flex-col gap-6">
                    <div v-for="recipient in recentRecipients" :key="recipient.id"
                        class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-sm text-desa-secondary">
                                {{ formatToClientTimezone(recipient.created_at) }}
                            </p>
                            <img src="@/assets/images/icons/calendar-2-secondary-green.svg"
                                class="flex size-[18px] shrink-0" alt="icon" />
                        </div>
                        <hr class="border-desa-background" />
                        <div class="flex items-center gap-3">
                            <div class="flex flex-col gap-[6px] w-full">
                                <p class="font-semibold text-lg leading-5">
                                    {{ formatRupiah(recipient.amount) }}
                                </p>
                                <p class="font-medium text-sm text-desa-secondary">
                                    Nominal Pengajuan
                                </p>
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
                                    Diberikan Kepada:
                                </p>
                            </div>
                            <div class="flex items-center gap-1">
                                <p class="font-medium leading-5">
                                    {{ recipient.recipient_name || '-' }}
                                </p>
                                <div class="flex size-8 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden">
                                    <img :src="getProfilePicture(recipient.recipient_profile_picture)
                                        " class="w-full h-full object-cover" alt="photo"
                                        @error="handleImageError($event, fallbackProfilePicture)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div v-if="!recentRecipients.length && !assistanceLoading"
                        class="rounded-2xl border border-dashed border-desa-background px-5 py-6 text-center text-desa-secondary">
                        Belum ada data penerima bantuan sosial terbaru.
                    </div>
                </div>
            </section>

            <form @submit.prevent="handleSubmit" class="w-full" v-if="isHeadOfFamily">
                <div class="flex flex-col gap-[14px] flex-1">
                    <section id="Bank-Account-Detail" class="rounded-2xl bg-white p-6 flex flex-col gap-6">
                        <h2 class="font-semibold leading-5">Bank Account Detail</h2>
                        <div v-if="!detail.is_available"
                            class="rounded-2xl border border-dashed border-desa-red bg-red-50 px-4 py-3 text-sm text-desa-red">
                            Bantuan sosial ini sedang tidak tersedia untuk diajukan.
                        </div>
                        <div v-else-if="!hasHeadOfFamilyId"
                            class="rounded-2xl border border-dashed border-desa-red bg-red-50 px-4 py-3 text-sm text-desa-red">
                            Akun ini belum terhubung ke data kepala keluarga.
                        </div>
                        <label id="Pilih-Bank" class="flex flex-col gap-4">
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Kamu Pake Bank Apa?
                            </h3>
                            <div
                                class="flex flex-col gap-4 py-4 mt-4 bg-white border border-desa-background rounded-2xl">
                                <div class="px-4 flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <img src="@/assets/images/icons/bank-secondary-green.svg" alt="icon"
                                            class="size-6 shrink-0" />
                                        <h4 class="font-medium leading-5 text-desa-secondary">{{
                                            selectedBankLabel || 'Pilih salah satu bank'
                                        }}</h4>
                                    </div>
                                </div>
                                <div id="BankJ" class="border-t border-desa-background flex flex-col gap-4 pt-4 px-4">
                                    <label v-for="bankOption in bankOptions" :key="bankOption.value"
                                        class="flex items-center justify-between gap-4">
                                        <div class="flex items-center gap-4">
                                            <div
                                                class="rounded-2xl border border-desa-background bg-[#F2F7FA] w-[100px] h-[60px] shrink-0 px-[14px] py-5">
                                                <img :src="bankOption.logo" :alt="bankOption.label"
                                                    class="size-full object-contain" />
                                            </div>
                                            <p class="font-medium leading-5 text-[#000000]">{{ bankOption.label }}</p>
                                        </div>
                                        <input v-model="socialAssistanceRecipient.bank" :value="bankOption.value"
                                            type="radio" name="bank" @change="clearFieldError('bank')"
                                            class="peer flex size-[18px] shrink-0 accent-desa-dark-green" />
                                    </label>
                                    <hr class="border-desa-background" />
                                </div>
                            </div>
                        </label>
                        <p v-if="getFieldError('bank')" class="text-sm text-desa-red -mt-2">
                            {{ getFieldError('bank') }}
                        </p>
                        <label id="Nomer-Rekening" class="flex flex-col gap-4">
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nomor Rekening Bank
                            </h3>
                            <div class="relative">
                                <input v-model="socialAssistanceRecipient.account_number" type="number"
                                    placeholder="Masukan Nomor Rekening" @input="clearFieldError('account_number')"
                                    class="peer w-full py-[18px] rounded-2xl border border-desa-background pl-[48px] pr-4 focus:outline-none bg-white font-medium leading-5 placeholder:text-desa-secondary placeholder:font-medium placeholder:leading-5 focus:ring-[1.5px] focus:ring-desa-dark-green transition-all duration-300" />
                                <img src="@/assets/images/icons/card-secondary-green.svg" alt="icon"
                                    class="peer-placeholder-shown:block hidden size-6 shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                                <img src="@/assets/images/icons/card-black.svg" alt="icon"
                                    class="peer-placeholder-shown:hidden size-6 shrink-0 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </label>
                        <p v-if="getFieldError('account_number')" class="text-sm text-desa-red -mt-2">
                            {{ getFieldError('account_number') }}
                        </p>
                    </section>
                    <section id="Ajukan-Bantuan-Sosial" class="rounded-2xl bg-white p-6 flex flex-col gap-6">
                        <h2 class="font-semibold leading-5">Ajukan Bantuan Sosial</h2>
                        <div id="Nominal" class="flex flex-col gap-4">
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nominal Pengajuan</h3>
                            <Input v-model="amountInput" type="text" placeholder="Ketik nominal bantuan"
                                :error-message="getFieldError('amount')" :icon="IconDollarSecondaryGreen"
                                :filled-icon="IconDollarBlack" />
                        </div>
                        <label id="Nomer-Pemilik" class="flex flex-col gap-4">
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Alasan
                                Sosial</h3>
                            <div class="relative">
                                <textarea v-model="socialAssistanceRecipient.reason"
                                    placeholder="Jelaskan lebih detail tentang bantuan" name="" id=""
                                    @input="clearFieldError('reason')"
                                    class="w-full h-[224px] rounded-2xl peer p-4 border border-desa-background focus:outline-none bg-white font-medium leading-5 placeholder:text-desa-secondary placeholder:font-medium placeholder:leading-5 focus:ring-[1.5px] focus:ring-desa-dark-green transition-all duration-300 [&::-webkit-scrollbar]:hidden"></textarea>
                            </div>
                        </label>
                        <p v-if="getFieldError('reason')" class="text-sm text-desa-red -mt-2">
                            {{ getFieldError('reason') }}
                        </p>
                        <button :disabled="isApplicationDisabled" type="submit"
                            class="bg-desa-black rounded-2xl w-full py-[18px] flex justify-center items-center font-medium leading-5 text-white text-center">
                            {{ recipientLoading ? 'Mengirim Pengajuan...' : 'Ajukan Bantuan' }}
                        </button>
                    </section>
                </div>
            </form>
        </div>
    </div>
    <ModalDelete :show="showModalDelete" :title="'Hapus Bantuan Sosial?'" :loading="assistanceLoading"
        @close="showModalDelete = false" @confirm="handleDelete" />
</template>
