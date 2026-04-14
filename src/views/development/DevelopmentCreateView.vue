<script setup>
import IconCalendarBlack from '@/assets/images/icons/calendar-2-black.svg'
import IconCalendarSecondaryGreen from '@/assets/images/icons/calendar-2-secondary-green.svg'
import IconEditBlack from '@/assets/images/icons/edit-black.svg'
import IconEditSecondaryGreen from '@/assets/images/icons/edit-secondary-green.svg'
import IconProfileCircleBlack from '@/assets/images/icons/profile-circle-black.svg'
import IconProfileCircleSecondaryGreen from '@/assets/images/icons/profile-circle-secondary-green.svg'
import IconWalletBlack from '@/assets/images/icons/wallet-3-black.svg'
import IconWalletSecondaryGreen from '@/assets/images/icons/wallet-3-secondary-green.svg'
import Input from '@/components/ui/Input.vue'
import { calculateEndDate, normalizeAmountInput, normalizeDateInput } from '@/helpers/development'
import { formatRupiah } from '@/helpers/format'
import { fallbackThumbnail, handleImageError } from '@/helpers/socialAssistance'
import router from '@/router'
import { useDevelopmentStore } from '@/stores/development'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

// ── Route / refs ──────────────────────────────────────────────────
const fileInput = ref(null)
const previewObjectUrl = ref(null)

// ── Constants ─────────────────────────────────────────────────────
const MAX_AMOUNT_INTEGER_DIGITS = 15
const MAX_AMOUNT_DECIMAL_DIGITS = 2

// ── Store ────────────────────────────────────────────────────────
const developmentStore = useDevelopmentStore()
const { loading, error } = storeToRefs(developmentStore)

// ── Reactive state ───────────────────────────────────────────────
const validationErrors = ref({})

function createInitialDevelopmentState() {
    return {
        thumbnail: null,
        name: '',
        description: '',
        person_in_charge: '',
        start_date: '',
        day: '',
        end_date: '',
        amount: '',
        status: 'ongoing',
    }
}

const development = ref(createInitialDevelopmentState())

// ── Derived state ────────────────────────────────────────────────
const generalError = computed(() => {
    if (typeof error.value === 'string') return error.value
    if (error.value && typeof error.value === 'object') {
        return 'Data pembangunan gagal ditambahkan. Periksa kembali input yang bertanda error.'
    }

    return null
})

const amountInput = computed({
    get: () => formatAmountInput(development.value.amount),
    set: (value) => {
        development.value.amount = normalizeAmountInput(value)
    },
})

// ── UI helpers ───────────────────────────────────────────────────
function clearErrors() {
    validationErrors.value = {}
    error.value = null
}

function openFilePicker() {
    fileInput.value?.click()
}

function getFieldError(field) {
    const err = validationErrors.value[field] ?? error.value?.[field]
    if (!err) return null
    return Array.isArray(err) ? err[0] : err
}

function onImageError(event) {
    handleImageError(event, fallbackThumbnail)
}

function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value)
    }

    previewObjectUrl.value = URL.createObjectURL(file)
    development.value.thumbnail = file
    development.value.thumbnail_url = previewObjectUrl.value
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
        return `Nominal dana terlalu besar. Maksimal ${MAX_AMOUNT_INTEGER_DIGITS} digit sebelum koma.`
    }

    if (decDigits.length > MAX_AMOUNT_DECIMAL_DIGITS) {
        return `Nominal dana hanya boleh memiliki ${MAX_AMOUNT_DECIMAL_DIGITS} angka desimal.`
    }

    return null
}

// ── Derived form sync ────────────────────────────────────────────
function syncEndDate() {
    development.value.end_date = calculateEndDate(
        development.value.start_date,
        development.value.day,
    )
}

// ── Actions ──────────────────────────────────────────────────────
async function handleSubmit() {
    validationErrors.value = {}
    error.value = null

    const amountError = validateAmountInput(development.value.amount)
    if (amountError) {
        validationErrors.value = { amount: [amountError] }
        return
    }

    const normalizedAmount = normalizeAmountInput(development.value.amount)
    const result = await developmentStore.createDevelopment({
        thumbnail: development.value.thumbnail,
        name: development.value.name,
        description: development.value.description,
        person_in_charge: development.value.person_in_charge,
        start_date: normalizeDateInput(development.value.start_date),
        end_date: normalizeDateInput(development.value.end_date),
        amount: normalizedAmount === '' ? '' : Number(normalizedAmount),
        status: development.value.status,
    })

    if (!result) {
        validationErrors.value =
            typeof error.value === 'object' && error.value !== null ? error.value : {}
        return
    }

    await router.replace({ name: 'development' })
}

watch([() => development.value.start_date, () => development.value.day], syncEndDate)

onBeforeUnmount(() => {
    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value)
    }
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <router-link
                        :to="{ name: 'development' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                        >Pembangunan Desa
                    </router-link>
                    <span>/</span>
                    <p
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                    >
                        Tambah Pembangunan Desa
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Tambah Pembangunan Desa</h1>
            </div>
        </div>

        <div
            v-if="generalError"
            class="relative rounded-2xl border border-red-400 bg-red-100 px-4 py-3 text-red-700"
            role="alert"
        >
            <span class="block sm:inline">{{ generalError }}</span>
            <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2"
                @click="clearErrors"
            >
                <img
                    src="@/assets/images/icons/close-circle-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
            </button>
        </div>

        <form @submit.prevent="handleSubmit" id="myForm" class="capitalize">
            <div class="shrink-0 rounded-3xl p-6 bg-white flex flex-col gap-6 h-fit">
                <section id="Total-Dana" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Total Dana Pembangunan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="amountInput"
                            type="text"
                            placeholder="Ketik dana yang dibutuhkan"
                            :error-message="getFieldError('amount')"
                            :icon="IconWalletSecondaryGreen"
                            :filled-icon="IconWalletBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />
                <section id="Thumbnail" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Thumbnail Pembangunan Desa
                    </h2>
                    <div class="flex-1 flex items-center justify-between">
                        <div
                            class="flex justify-center w-[120px] h-[100px] rounded-2xl overflow-hidden bg-desa-foreshadow"
                        >
                            <img
                                :src="development.thumbnail_url || fallbackThumbnail"
                                alt="image"
                                class="size-full object-cover"
                                @error="onImageError"
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
                <div v-if="getFieldError('thumbnail')" class="flex justify -end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('thumbnail')
                    }}</span>
                </div>
                <hr class="border-desa-background" />
                <section id="Nama-Projek" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Projek Pembangunan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="development.name"
                            type="text"
                            placeholder="Tentukan nama projek pembangunan"
                            :error-message="getFieldError('name')"
                            :icon="IconEditSecondaryGreen"
                            :filled-icon="IconEditBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />
                <section id="Penanggung-Jawab" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Penanggung Jawab
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="development.person_in_charge"
                            type="text"
                            placeholder="Tentukan penanggung jawab"
                            :error-message="getFieldError('person_in_charge')"
                            :icon="IconProfileCircleSecondaryGreen"
                            :filled-icon="IconProfileCircleBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />
                <section id="Status" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Status Pembangunan
                    </p>
                    <div class="flex flex-1 gap-6 shrink-0">
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-none has-[:checked]:bg-desa-foreshadow transition-setup"
                        >
                            <input
                                v-model="development.status"
                                :value="'ongoing'"
                                type="radio"
                                checked
                                name="status"
                                id=""
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                On Going
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img
                                    src="@/assets/images/icons/tick-circle-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden"
                                    alt="icon"
                                />
                                <img
                                    src="@/assets/images/icons/tick-circle-dark-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex"
                                    alt="icon"
                                />
                            </div>
                        </label>
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-none has-[:checked]:bg-desa-foreshadow transition-setup"
                        >
                            <input
                                v-model="development.status"
                                :value="'completed'"
                                type="radio"
                                name="status"
                                id=""
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                Completed
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img
                                    src="@/assets/images/icons/close-circle-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden"
                                    alt="icon"
                                />
                                <img
                                    src="@/assets/images/icons/close-circle-secondary-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex"
                                    alt="icon"
                                />
                            </div>
                        </label>
                    </div>
                </section>
                <div v-if="getFieldError('status')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('status')
                    }}</span>
                </div>
                <hr class="border-desa-background" />
                <section id="Tanggal-Pembangunan" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Tanggal Pembangunan
                    </p>
                    <div class="flex items-center gap-6 flex-1 shrink-0">
                        <label class="relative group peer w-full">
                            <Input
                                v-model="development.start_date"
                                type="date"
                                placeholder="Pilih Tanggal Awal"
                                :error-message="getFieldError('start_date')"
                                :icon="IconCalendarSecondaryGreen"
                                :filled-icon="IconCalendarBlack"
                            />
                        </label>
                    </div>
                </section>
                <hr class="border-desa-background" />
                <section id="Hari" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Hari yang dibutuhkan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <label class="relative group peer w-full">
                            <input
                                v-model="development.days_needed"
                                type="number"
                                placeholder="Ketik hari yang dibutuhkan"
                                class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-12 pr-[98px] gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                            />
                            <div
                                class="absolute transform -translate-y-1/2 top-1/2 left-4 flex size-6 shrink-0"
                            >
                                <img
                                    src="@/assets/images/icons/timer-secondary-green.svg"
                                    class="size-6 hidden group-has-[:placeholder-shown]:flex"
                                    alt="icon"
                                />
                                <img
                                    src="@/assets/images/icons/timer-black.svg"
                                    class="size-6 flex group-has-[:placeholder-shown]:hidden"
                                    alt="icon"
                                />
                            </div>
                            <div
                                class="absolute transform -translate-y-1/2 top-1/2 right-4 flex shrink-0 gap-6"
                            >
                                <div class="w-px h-6 border border-desa-background"></div>
                                <span
                                    class="font-medium leading-5 text-desa-dark-green group-has-[:placeholder-shown]:text-desa-secondary"
                                    >Hari</span
                                >
                            </div>
                        </label>
                    </div>
                </section>
                <div v-if="getFieldError('days_needed')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('days_needed')
                    }}</span>
                </div>
                <hr class="border-desa-background" />
                <section id="Deskripsi" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Deskripsi Pembangunan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <textarea
                            v-model="development.description"
                            name=""
                            id=""
                            placeholder="Jelaskan lebih detail tentang pembangunan"
                            rows="6"
                            class="appearance-none outline-none w-full rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        ></textarea>
                    </div>
                </section>
                <div v-if="getFieldError('description')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError('description')
                    }}</span>
                </div>
                <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />
                <section id="Buttons" class="flex items-center justify-end gap-4">
                    <RouterLink :to="{ name: 'development' }">
                        <div
                            class="py-[18px] rounded-2xl bg-desa-red w-[180px] text-center flex justify-center font-medium text-white"
                        >
                            Batal, Tidak jadi
                        </div>
                    </RouterLink>
                    <button
                        id="submitButton"
                        type="submit"
                        :disabled="loading"
                        class="py-[18px] rounded-2xl disabled:bg-desa-grey w-[180px] text-center flex justify-center font-medium text-white bg-desa-dark-green transition-all duration-300"
                    >
                        {{ loading ? 'Saving...' : 'Save Changes' }}
                    </button>
                </section>
            </div>
        </form>
    </div>
</template>
