<script setup>
import IconBagDarkGreen from '@/assets/images/icons/bag-2-dark-green.svg'
import IconBagSecondaryGreen from '@/assets/images/icons/bag-2-secondary-green.svg'
import IconBriefcaseBlack from '@/assets/images/icons/briefcase-black.svg'
import IconBriefcaseSecondaryGreen from '@/assets/images/icons/briefcase-secondary-green.svg'
import IconCloseCircleRedFill from '@/assets/images/icons/close-circle-red-fill.svg'
import IconCloseCircleSecondaryGreen from '@/assets/images/icons/close-circle-secondary-green.svg'
import IconDollarBlack from '@/assets/images/icons/dollar-square-black.svg'
import IconDollarSecondaryGreen from '@/assets/images/icons/dollar-square-secondary-green.svg'
import IconEditBlack from '@/assets/images/icons/edit-black.svg'
import IconEditSecondaryGreen from '@/assets/images/icons/edit-secondary-green.svg'
import IconGasStationDarkGreen from '@/assets/images/icons/gas-station-dark-green.svg'
import IconGasStationSecondaryGreen from '@/assets/images/icons/gas-station-secondary-green.svg'
import IconHealthSecondaryGreen from '@/assets/images/icons/health-secondary-green.svg'
import IconMoneyDarkGreen from '@/assets/images/icons/money-dark-green.svg'
import IconMoneySecondaryGreen from '@/assets/images/icons/money-secondary-green.svg'
import IconTickCircleDarkGreen from '@/assets/images/icons/tick-circle-dark-green.svg'
import IconTickCircleSecondaryGreen from '@/assets/images/icons/tick-circle-secondary-green.svg'
import Input from '@/components/ui/Input.vue'
import { formatRupiah } from '@/helpers/format'
import router from '@/router'
import { useSocialAssistanceStore } from '@/stores/socialAssistance'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const fileInput = ref(null)
const validationErrors = ref({})
const socialAssistanceStore = useSocialAssistanceStore()
const { loading, error, success } = storeToRefs(socialAssistanceStore)
const { fetchSocialAssistance, updateSocialAssistance } = socialAssistanceStore

const fallbackImage = new URL('@/assets/images/thumbnails/kk-bansos-1.png', import.meta.url).href
const MAX_AMOUNT_INTEGER_DIGITS = 15
const MAX_AMOUNT_DECIMAL_DIGITS = 2

const socialAssistance = ref({
    thumbnail: null,
    thumbnail_url: null,
    name: '',
    category: '',
    amount: '',
    provider: '',
    description: '',
    is_available: true,
})

const categories = [
    {
        value: 'staple',
        label: 'Bahan Pokok',
        icon: IconBagSecondaryGreen,
        checkedIcon: IconBagDarkGreen,
    },
    {
        value: 'cash',
        label: 'Uang Tunai',
        icon: IconMoneySecondaryGreen,
        checkedIcon: IconMoneyDarkGreen,
    },
    {
        value: 'subsidized fuel',
        label: 'BBM Subsidi',
        icon: IconGasStationSecondaryGreen,
        checkedIcon: IconGasStationDarkGreen,
    },
    {
        value: 'health',
        label: 'Kesehatan',
        icon: IconHealthSecondaryGreen,
        checkedIcon: IconHealthSecondaryGreen,
    },
]

// [OPT-1] Unified array, eliminates hardcoded availability template duplication
const availabilityOptions = [
    {
        value: true,
        label: 'Tersedia',
        icon: IconTickCircleSecondaryGreen,
        checkedIcon: IconTickCircleDarkGreen,
    },
    {
        value: false,
        label: 'Tidak Tersedia',
        icon: IconCloseCircleSecondaryGreen,
        checkedIcon: IconCloseCircleRedFill,
    },
]

// [OPT-2] Centralized error resolver — replaces 5x repeated ternary in template
function getFieldError(field) {
    const err = validationErrors.value[field] ?? error.value?.[field]
    if (!err) return null
    return Array.isArray(err) ? err[0] : err
}

const generalError = computed(() => {
    if (typeof error.value === 'string') return error.value
    if (error.value && typeof error.value === 'object') {
        return 'Data bantuan sosial gagal diperbarui. Periksa kembali input yang bertanda error.'
    }
    return null
})

const amountInput = computed({
    get: () => formatAmountInput(socialAssistance.value.amount),
    set: (value) => {
        socialAssistance.value.amount = normalizeAmountInput(value)
    },
})

const fetchData = async () => {
    const response = await fetchSocialAssistance(route.params.id)
    if (!response) return

    socialAssistance.value = {
        thumbnail: null,
        thumbnail_url: normalizeImageUrl(response.thumbnail),
        name: response.name ?? '',
        category: response.category ?? '',
        amount: response.amount ? normalizeAmountInput(response.amount) : '',
        provider: response.provider ?? '',
        description: response.description ?? '',
        is_available: Boolean(response.is_available),
    }
}

function normalizeImageUrl(value) {
    if (!value) return fallbackImage
    const nestedHttpIndex = value.indexOf('http', value.indexOf('http') + 1)
    return nestedHttpIndex > 0 ? value.slice(nestedHttpIndex) : value
}

function handleImageError(event) {
    event.target.src = fallbackImage
}

function clearErrors() {
    validationErrors.value = {}
    error.value = null
    success.value = null
}

function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    socialAssistance.value.thumbnail = file
    socialAssistance.value.thumbnail_url = URL.createObjectURL(file)
}

function openFilePicker() {
    fileInput.value?.click()
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

    // Treat as grouping separator (no decimal intent): multiple parts, or >2 trailing digits, or empty trailing
    const isGrouping = parts.length > 2 || trailingDigits.length > 2 || !trailingDigits
    if (isGrouping)
        return sanitizedValue.replace(new RegExp(`\\${separator}`, 'g'), '').replace(/[^\d-]/g, '')

    // Actual decimal separator
    const cleanPattern = hasComma ? /[^\d,-]/g : /[^\d.-]/g
    const normalized = sanitizedValue.replace(cleanPattern, '')
    return hasComma ? normalized.replace(',', '.') : normalized
}

function formatAmountInput(value) {
    const normalized = normalizeAmountInput(value)
    return normalized ? formatRupiah(normalized) : ''
}

function validateAmountInput(value) {
    if (!value) return null

    const [integerPart = '', decimalPart = ''] = String(value).split('.')
    const intDigits = integerPart.replace(/[^\d]/g, '')
    const decDigits = decimalPart.replace(/\D/g, '')

    if (intDigits.length > MAX_AMOUNT_INTEGER_DIGITS) {
        return `Nominal bantuan terlalu besar. Maksimal ${MAX_AMOUNT_INTEGER_DIGITS} digit sebelum koma.`
    }
    if (decDigits.length > MAX_AMOUNT_DECIMAL_DIGITS) {
        return `Nominal bantuan hanya boleh memiliki ${MAX_AMOUNT_DECIMAL_DIGITS} angka desimal.`
    }
    return null
}

async function handleSubmit() {
    validationErrors.value = {}

    const amountError = validateAmountInput(socialAssistance.value.amount)
    if (amountError) {
        validationErrors.value = { amount: [amountError] }
        return
    }

    // [OPT-3] Removed redundant spread + re-assign — socialAssistance.value is already the payload
    const result = await updateSocialAssistance(route.params.id, socialAssistance.value)
    if (!result) {
        validationErrors.value =
            typeof error.value === 'object' && error.value !== null ? error.value : {}
        return
    }

    await router.replace({ name: 'manage-social-assistance', params: { id: route.params.id } })
}

onMounted(fetchData)
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <p
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                    >
                        Bantuan sosial
                    </p>
                    <span>/</span>
                    <p
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                    >
                        ubah bantuan sosial
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Ubah Bantuan Sosial</h1>
            </div>
        </div>

        <div
            v-if="generalError"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative"
            role="alert"
        >
            <span class="block sm:inline">{{ generalError }}</span>
            <button
                type="button"
                class="absolute top-1/2 -translate-y-1/2 right-4"
                @click="clearErrors"
            >
                <img
                    src="@/assets/images/icons/close-circle-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
            </button>
        </div>

        <form id="myForm" class="capitalize" @submit.prevent="handleSubmit">
            <div class="shrink-0 rounded-3xl p-6 bg-white flex flex-col gap-6 h-fit">
                <!-- Thumbnail -->
                <section id="Thumbnail" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Thumbnail Bantuan Sosial
                    </h2>
                    <div class="flex-1 flex items-center justify-between">
                        <div
                            class="flex justify-center w-[120px] h-[100px] rounded-2xl overflow-hidden bg-desa-foreshadow"
                        >
                            <img
                                :src="socialAssistance.thumbnail_url || fallbackImage"
                                alt="image"
                                class="size-full object-cover"
                                @error="handleImageError"
                            />
                        </div>
                        <div class="relative">
                            <input
                                ref="fileInput"
                                type="file"
                                name="thumbnail"
                                accept="image/*"
                                class="absolute opacity-0 left-0 w-full top-0 h-full"
                                @change="handleImageChange"
                            />
                            <button
                                type="button"
                                class="relative flex items-center py-4 px-6 rounded-2xl bg-desa-black gap-[10px]"
                                @click="openFilePicker"
                            >
                                <img
                                    src="@/assets/images/icons/send-square-white.svg"
                                    alt="icon"
                                    class="size-6 shrink-0"
                                />
                                <p class="font-medium leading-5 text-white">Upload</p>
                            </button>
                        </div>
                    </div>
                </section>
                <div v-if="getFieldError('thumbnail')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('thumbnail')
                    }}</span>
                </div>

                <hr class="border-desa-background" />

                <!-- Nama -->
                <section id="Nama-Bantuan-Sosial" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Bantuan Sosial
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="socialAssistance.name"
                            type="text"
                            placeholder="Tentukan nama bantuan sosial"
                            :error-message="getFieldError('name')"
                            :icon="IconEditSecondaryGreen"
                            :filled-icon="IconEditBlack"
                        />
                    </div>
                </section>

                <hr class="border-desa-background" />

                <!-- Kategori -->
                <section id="Kategori" class="flex items-start justify-between">
                    <p
                        class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)] pt-4"
                    >
                        Pilih Opsi Kategori
                    </p>
                    <div class="grid grid-cols-2 flex-1 gap-6 shrink-0">
                        <label
                            v-for="category in categories"
                            :key="category.value"
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green has-[:checked]:bg-desa-foreshadow transition-setup"
                        >
                            <input
                                v-model="socialAssistance.category"
                                type="radio"
                                name="category"
                                :value="category.value"
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                {{ category.label }}
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img
                                    :src="category.icon"
                                    class="size-6 flex group-has-[:checked]:hidden"
                                    alt="icon"
                                />
                                <img
                                    :src="category.checkedIcon"
                                    class="size-6 hidden group-has-[:checked]:flex"
                                    alt="icon"
                                />
                            </div>
                        </label>
                    </div>
                </section>
                <div v-if="getFieldError('category')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('category')
                    }}</span>
                </div>

                <hr class="border-desa-background" />

                <!-- Nominal -->
                <section id="Nominal-Bantuan" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nominal Bantuan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="amountInput"
                            type="text"
                            placeholder="Ketik nominal bantuan"
                            :error-message="getFieldError('amount')"
                            :icon="IconDollarSecondaryGreen"
                            :filled-icon="IconDollarBlack"
                        />
                    </div>
                </section>

                <hr class="border-desa-background" />

                <!-- Provider -->
                <section id="Nama-Pemberi-Bantuan" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Pemberi Bantuan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="socialAssistance.provider"
                            type="text"
                            placeholder="Ketik nama orang atau organisasi"
                            :error-message="getFieldError('provider')"
                            :icon="IconBriefcaseSecondaryGreen"
                            :filled-icon="IconBriefcaseBlack"
                        />
                    </div>
                </section>

                <hr class="border-desa-background" />

                <!-- Deskripsi -->
                <section id="Deskripsi" class="flex items-start justify-between">
                    <p
                        class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)] pt-4"
                    >
                        Deskripsi Bantuan Sosial
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <textarea
                            v-model="socialAssistance.description"
                            rows="6"
                            placeholder="Jelaskan lebih detail tentang bantuan"
                            class="appearance-none outline-none w-full rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                            :class="
                                getFieldError('description')
                                    ? 'ring-red-500 focus:ring-red-500'
                                    : ''
                            "
                        ></textarea>
                        <span
                            v-if="getFieldError('description')"
                            class="text-left text-desa-red text-xs"
                        >
                            {{ getFieldError('description') }}
                        </span>
                    </div>
                </section>

                <hr class="border-desa-background" />

                <!-- Ketersediaan -->
                <section id="Ketersediaan" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Pilih Opsi Ketersediaan
                    </p>
                    <div class="flex flex-1 gap-6 shrink-0">
                        <!-- [OPT-1] v-for replaces two hardcoded identical label blocks -->
                        <label
                            v-for="option in availabilityOptions"
                            :key="String(option.value)"
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green has-[:checked]:bg-desa-foreshadow transition-setup"
                        >
                            <input
                                v-model="socialAssistance.is_available"
                                type="radio"
                                name="is_available"
                                :value="option.value"
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                {{ option.label }}
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img
                                    :src="option.icon"
                                    class="size-6 flex group-has-[:checked]:hidden"
                                    alt="icon"
                                />
                                <img
                                    :src="option.checkedIcon"
                                    class="size-6 hidden group-has-[:checked]:flex"
                                    alt="icon"
                                />
                            </div>
                        </label>
                    </div>
                </section>
                <div v-if="getFieldError('is_available')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('is_available')
                    }}</span>
                </div>

                <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />

                <!-- Actions -->
                <section id="Buttons" class="flex items-center justify-end gap-4">
                    <button type="button" @click="$router.back()">
                        <div
                            class="py-[18px] rounded-2xl bg-desa-red w-[180px] text-center flex justify-center font-medium text-white"
                        >
                            Batal, Tidak jadi
                        </div>
                    </button>
                    <button
                        :disabled="loading"
                        type="submit"
                        class="py-[18px] rounded-2xl disabled:bg-desa-grey w-[180px] text-center flex justify-center font-medium text-white bg-desa-dark-green transition-all duration-300"
                    >
                        <span v-if="!loading">Save Changes</span>
                        <span v-else>Loading ...</span>
                    </button>
                </section>
            </div>
        </form>
    </div>
</template>
