<script setup>
import ModalDelete from '@/components/ui/ModalDelete.vue'
import { formatDate, formatDateTime, formatRupiah, formatToClientTimezone } from '@/helpers/format'
import { can } from '@/helpers/permissionHelper'
import { fallbackProfilePicture, fallbackThumbnail, getProfilePicture, getThumbnail, handleImageError } from '@/helpers/socialAssistance'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useDevelopmentStore } from '@/stores/development'
import { useDevelopmentApplicantStore } from '@/stores/developmentApplicant'
import { useFamilyMemberStore } from '@/stores/familyMember'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ── Store ────────────────────────────────────────────────────────
const developmentApplicant = ref({
    development_id: null,
    user_id: null
})

const developmentApplicantStore = useDevelopmentApplicantStore()
const {
    loading: developmentApplicantLoading,
    error: developmentApplicantError,
} = storeToRefs(developmentApplicantStore)

const developmentStore = useDevelopmentStore()
const { loading, error } = storeToRefs(developmentStore)

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const familyMemberStore = useFamilyMemberStore()
const { familyMembers, loading: familyMemberLoading, error: familyMemberError } = storeToRefs(familyMemberStore)

// ── Reactive state ───────────────────────────────────────────────
const development = ref(null)
const showModalDelete = ref(false)
const showSelectApplicant = ref(false)
const activeTab = ref('all')
const selectedApplicantKey = ref('')
const selectedApplicantValidationError = ref(null)

const relationMap = {
    husband: 'Suami',
    wife: 'Istri',
    child: 'Anak',
}


const filteredApplicants = computed(() => {
    const applicants = development.value?.development_applicants ?? []
    if (activeTab.value === 'all') return applicants
    return applicants.filter((a) => a.status === activeTab.value)
})

const familyMemberGeneralError = computed(() => {
    if (typeof familyMemberError.value === 'string') {
        return familyMemberError.value
    }

    if (familyMemberError.value && typeof familyMemberError.value === 'object') {
        return 'Terjadi kesalahan saat memuat data anggota keluarga.'
    }

    return null
})

const developmentApplicantGeneralError = computed(() => {
    if (selectedApplicantValidationError.value) {
        return selectedApplicantValidationError.value
    }

    if (typeof developmentApplicantError.value === 'string') {
        return developmentApplicantError.value
    }

    if (developmentApplicantError.value && typeof developmentApplicantError.value === 'object') {
        const userIdError = developmentApplicantError.value.user_id

        if (Array.isArray(userIdError) && userIdError.length > 0) {
            return userIdError[0]
        }

        if (typeof userIdError === 'string' && userIdError) {
            return userIdError
        }

        return 'Pengajuan pembangunan gagal dikirim. Periksa kembali data pelamar.'
    }

    return null
})

const headOfFamilyApplicant = computed(() => {
    if (!user.value) return null

    return {
        key: `head-of-family:${user.value.head_of_family_id ?? user.value.id ?? 'self'}`,
        user_id: user.value.id ?? null,
        name: user.value.name ?? '-',
        occupation: user.value.occupation ?? '-',
        identity_number: user.value.identity_number ?? '-',
        age: user.value.age ?? null,
        profile_picture: getProfilePicture(user.value.profile_picture),
    }
})

const groupedFamilyMembers = computed(() => {
    return familyMembers.value.reduce((groups, member) => {
        const relation = member?.relation ?? 'other'
        const existingGroup = groups.find((group) => group.key === relation)
        const item = {
            key: `family-member:${member?.id}`,
            id: member?.id,
            user_id: member?.user?.id ?? null,
            name: member?.user?.name ?? '-',
            occupation: member?.occupation ?? '-',
            identity_number: member?.identity_number ?? '-',
            age: member?.age ?? null,
            profile_picture: getProfilePicture(member?.profile_picture),
        }

        if (existingGroup) {
            existingGroup.items.push(item)
            return groups
        }

        groups.push({
            key: relation,
            label: relationMap[relation] ?? 'Lainnya',
            items: [item],
        })

        return groups
    }, [])
})

const applicantOptions = computed(() => {
    const options = []

    if (headOfFamilyApplicant.value) {
        options.push(headOfFamilyApplicant.value)
    }

    return [...options, ...groupedFamilyMembers.value.flatMap((group) => group.items)]
})

const selectedApplicant = computed(() => {
    return applicantOptions.value.find((option) => option.key === selectedApplicantKey.value) ?? null
})

const selectedApplicantImage = computed(() => {
    return selectedApplicant.value?.profile_picture ?? fallbackProfilePicture
})

const selectedApplicantName = computed(() => {
    return selectedApplicant.value?.name ?? 'Pelamar Applicant'
})

const selectedApplicantSubtitle = computed(() => {
    return selectedApplicant.value?.occupation ?? 'Pilih Anggota Keluarga'
})

// ── Data fetching ────────────────────────────────────────────────
async function fetchData() {
    const response = await developmentStore.fetchDevelopment(route.params.id)
    if (!response) return
    development.value = response
    developmentApplicant.value.development_id = response.id
}

async function fetchApplicantOptions() {
    if (user.value?.role !== 'head-of-family') return
    await familyMemberStore.fetchFamilyMembers()
}

// ── Actions ──────────────────────────────────────────────────────
async function handleDelete() {
    const result = await developmentStore.deleteDevelopment(route.params.id)
    if (result) {
        await router.replace({ name: 'development' })
    }
}

async function handleApplicantStatus(applicantId, status) {
    await developmentStore.updateApplicantStatus(applicantId, status)
    await fetchData()
}

async function handleSubmit() {
    selectedApplicantValidationError.value = null
    developmentApplicantError.value = null

    if (!selectedApplicant.value?.user_id) {
        selectedApplicantValidationError.value = 'Pilih pelamar terlebih dahulu sebelum mengajukan pembangunan.'
        return
    }

    developmentApplicant.value.user_id = selectedApplicant.value.user_id

    const result = await developmentApplicantStore.createDevelopmentApplicant(developmentApplicant.value)

    if (!result) {
        return
    }

    showSelectApplicant.value = false
    await router.replace({ name: 'development' })
}

function onImageError(event) {
    handleImageError(event, fallbackThumbnail)
}

function onProfileImageError(event) {
    handleImageError(event, fallbackProfilePicture)
}

function selectApplicant(key) {
    selectedApplicantKey.value = key
    selectedApplicantValidationError.value = null
    developmentApplicantError.value = null
}

function formatApplicantAge(value) {
    return value === 0 || value ? `${value} Tahun` : '-'
}

async function scrollToTop() {
    await nextTick()
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    })
}

watch(developmentApplicantGeneralError, (value, previousValue) => {
    if (!value || value === previousValue) {
        return
    }

    scrollToTop()
})

onMounted(async () => {
    await fetchData()
    await fetchApplicantOptions()
})
</script>

<template>
    <div v-if="development" class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <router-link :to="{ name: 'development' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">Pembangunan Desa
                    </router-link>
                    <span>/</span>
                    <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
                        Detail Pembangunan Desa
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Detail Pembangunan Desa</h1>
            </div>
            <div class="flex items-center gap-3">
                <button @click="showModalDelete = true"
                    class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-red"
                    v-if="can('development-delete')">
                    <p class="font-medium text-white">Hapus Data</p>
                    <img src="@/assets/images/icons/trash-white.svg" class="flex size-6 shrink-0" alt="icon" />
                </button>
                <router-link :to="{ name: 'edit-development', params: { id: development.id } }"
                    class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black"
                    v-if="can('development-edit')">
                    <p class="font-medium text-white">Ubah Data</p>
                    <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                        alt="close success alert" />

                </router-link>
            </div>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative"
            role="alert">
            <span class="block sm:inline">{{ error }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="error = null">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="close success alert" />

            </button>
        </div>
        <div v-if="developmentApplicantGeneralError"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ developmentApplicantGeneralError }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4"
                @click="selectedApplicantValidationError = null; developmentApplicantError = null">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="close success alert" />
            </button>
        </div>
        <div class="flex flex-col gap-[14px]" v-if="user?.role === 'admin'">
            <section id="Informasi" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Pembangunan</p>
                <div class="flex items-center justify-between">
                    <div class="flex w-[120px] h-[100px] shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="getThumbnail(development.thumbnail)" @error="onImageError"
                            class="w-full h-full object-cover" alt="photo" />
                    </div>
                    <div class="badge rounded-full p-3 gap-2 flex justify-center shrink-0 bg-desa-yellow"
                        v-if="development.status === 'ongoing'">
                        <span class="font-semibold text-xs text-white uppercase">Sedang Berjalan</span>
                    </div>
                    <div class="badge rounded-full p-3 gap-2 flex justify-center shrink-0 bg-desa-green"
                        v-if="development.status === 'completed'">
                        <span class="font-semibold text-xs text-white uppercase">Selesai</span>
                    </div>
                </div>
                <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-lg leading-[22.5px] line-clamp-1">
                        {{ development.name }}
                    </p>
                    <p class="font-medium text-sm text-desa-secondary">
                        Penanggung Jawab:
                        <span class="font-medium text-base text-desa-dark-green">
                            {{ development.person_in_charge }}
                        </span>
                    </p>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex items-center justify-between">
                    <div class="flex items-center w-full gap-3">
                        <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-red/10 items-center justify-center">
                            <img src="@/assets/images/icons/wallet-3-red.svg" class="flex size-6 shrink-0" alt="icon" />
                        </div>
                        <div class="flex flex-col gap-1 w-full">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-red">
                                {{ formatRupiah(development.amount) }}
                            </p>
                            <span class="font-medium text-desa-secondary"> Dana Pembangunan </span>
                        </div>
                    </div>
                    <div class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green">
                        <span class="font-semibold text-xs text-white uppercase">Tersedia</span>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-center w-full gap-3">
                        <div
                            class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon" />
                        </div>
                        <div class="flex flex-col gap-1 w-full">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-dark-green">
                                {{ formatDate(development.start_date) }}
                            </p>
                            <span class="font-medium text-desa-secondary">
                                Tanggal Pelaksanaan
                            </span>
                        </div>
                    </div>
                    <div class="flex items-center w-full gap-3 justify-end">
                        <div class="flex flex-col gap-1 w-full text-right">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-dark-green">
                                {{ formatDate(development.end_date) }}
                            </p>
                            <span class="font-medium text-desa-secondary"> Perkiraan Selesai </span>
                        </div>
                        <div
                            class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon" />
                        </div>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="grid grid-cols-2 gap-3">
                    <div class="flex items-center w-full gap-3">
                        <div class="flex size-[52px] shrink-0 rounded-2xl bg-desa-blue/10 items-center justify-center">
                            <img src="@/assets/images/icons/profile-2user-blue.svg" class="flex size-6 shrink-0"
                                alt="icon" />
                        </div>
                        <div class="flex flex-col gap-1 w-full">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-blue">
                                {{ development.applicants_count ?? development.development_applicants?.length ?? 0 }}
                            </p>
                            <span class="font-medium text-desa-secondary"> Total Pelamar </span>
                        </div>
                    </div>
                    <div class="flex items-center w-full gap-3 justify-end">
                        <div class="flex flex-col gap-1 w-full text-right">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-yellow">
                                {{ development.days_needed }} Hari
                            </p>
                            <span class="font-medium text-desa-secondary"> Days Needed </span>
                        </div>
                        <div
                            class="flex size-[52px] shrink-0 rounded-2xl bg-desa-yellow/10 items-center justify-center">
                            <img src="@/assets/images/icons/clock-yellow.svg" class="flex size-6 shrink-0" alt="icon" />
                        </div>
                    </div>
                </div>
                <hr class="border-desa-foreshadow" />
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Pembangunan</p>
                    <p class="font-medium leading-8">{{ development.description }}</p>
                </div>
            </section>
            <section id="Applicants" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
                <div class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary">Pengajuan Applicants</p>
                    <div id="Tabs-Button" class="grid grid-cols-4 gap-3">
                        <button @click="activeTab = 'all'"
                            :class="['tab-btn group', activeTab === 'all' ? 'active' : '']">
                            <div
                                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup">
                                <span
                                    class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup">
                                    SEMUA
                                </span>
                            </div>
                        </button>
                        <button @click="activeTab = 'pending'"
                            :class="['tab-btn group', activeTab === 'pending' ? 'active' : '']">
                            <div
                                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup">
                                <span
                                    class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup">
                                    MENUNGGU
                                </span>
                            </div>
                        </button>
                        <button @click="activeTab = 'approved'"
                            :class="['tab-btn group', activeTab === 'approved' ? 'active' : '']">
                            <div
                                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup">
                                <span
                                    class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup">
                                    DITERIMA
                                </span>
                            </div>
                        </button>
                        <button @click="activeTab = 'rejected'"
                            :class="['tab-btn group', activeTab === 'rejected' ? 'active' : '']">
                            <div
                                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup">
                                <span
                                    class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup">
                                    DITOLAK
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
                <div id="Tabs-Content" class="flex flex-col">
                    <div class="flex flex-col gap-6">
                        <div class="card flex flex-col gap-6 rounded-3xl p-6 border border-desa-background bg-white"
                            v-for="applicant in filteredApplicants" :key="applicant.id">
                            <div class="flex items-center justify-between">
                                <p class="flex items-center gap-1">
                                    <img src="@/assets/images/icons/calendar-2-secondary-green.svg"
                                        class="flex size-[18px] shrink-0" alt="icon" />
                                    <span class="font-medium text-sm text-desa-secondary">{{
                                        formatToClientTimezone(applicant.created_at)
                                        }}</span>
                                </p>
                                <div class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-yellow"
                                    v-if="applicant.status === 'pending'">
                                    <span class="font-semibold text-xs text-white uppercase">Menunggu</span>
                                </div>
                                <div class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-green"
                                    v-if="applicant.status === 'approved'">
                                    <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                                </div>
                                <div class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-red"
                                    v-if="applicant.status === 'rejected'">
                                    <span class="font-semibold text-xs text-white uppercase">Ditolak</span>
                                </div>
                            </div>
                            <hr class="border-desa-background" />
                            <div class="flex items-center gap-6 justify-between">
                                <div class="flex items-center gap-3 w-[302px] shrink-0">
                                    <div class="flex flex-col gap-1">
                                        <p class="font-semibold text-lg leading-5 text-desa-black">
                                            {{ applicant.user.name }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 w-[236px] shrink-0">
                                    <div class="flex flex-col gap-1 w-full">
                                        <p class="flex items-center gap-1">
                                            <img src="@/assets/images/icons/keyboard-secondary-green.svg"
                                                class="flex size-[18px] shrink-0" alt="icon" />
                                            <span class="font-medium text-sm text-desa-secondary">EMAIL</span>
                                        </p>
                                        <p class="font-semibold text-sm leading-5 text-desa-dark-green truncate"
                                            :title="applicant.user.email">
                                            {{ applicant.user.email }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3 justify-end shrink-0"
                                    v-if="applicant.status === 'pending' && can('development-edit') && can('development-applicant-edit')">
                                    <button @click="handleApplicantStatus(applicant.id, 'rejected')"
                                        :disabled="applicant.status !== 'pending' || loading"
                                        class="flex items-center w-[120px] justify-center shrink-0 gap-[10px] rounded-2xl py-4 px-6 bg-desa-red/10 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <span class="font-medium text-desa-red">Tolak</span>
                                    </button>
                                    <button @click="handleApplicantStatus(applicant.id, 'approved')"
                                        :disabled="applicant.status !== 'pending' || loading"
                                        class="flex items-center w-[120px] justify-center shrink-0 gap-[10px] rounded-2xl py-4 px-6 bg-desa-dark-green disabled:opacity-50 disabled:cursor-not-allowed">
                                        <span class="font-medium text-white">Setuju</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <div class="flex gap-[14px]" v-if="user?.role === 'head-of-family'">
            <div class="w-[calc(545/1000*100%)] h-fit shrink-0 rounded-2xl bg-white p-6 flex flex-col gap-6">
                <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Informasi Pembangunan</h2>
                <section id="Hero" class="flex items-center justify-between">
                    <div
                        class="flex justify-center items-center w-[120px] h-[100px] shrink-0 rounded-3xl overflow-hidden">
                        <img :src="getThumbnail(development.thumbnail)" alt="image" class="size-full object-cover"
                            @error="onImageError" />
                    </div>
                    <span class="p-3 rounded-full bg-desa-orange font-semibold text-xs leading-[15px] text-white">{{
                        development.status }}</span>
                </section>
                <section id="Title" class="flex flex-col gap-[6px]">
                    <h3 class="font-semibold text-xl leading-7">{{ development.name }}</h3>
                    <div class="flex items-center gap-1">
                        <p class="font-medium leading-5 text-desa-secondary">Penanggung Jawab:</p>
                        <p class="font-medium leading-5 text-desa-dark-green">{{ development.person_in_charge }}</p>
                    </div>
                </section>
                <hr class="border-desa-background" />
                <section id="Points" class="flex flex-col gap-6">
                    <div class="point flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="p-[14px] shrink-0 bg-[#FF507017] rounded-2xl">
                                <img src="@/assets/images/icons/wallet-3-red.svg" alt="icon" class="size-6 shrink-0" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <p class="font-semibold text-lg leading-[22.5px] text-desa-red">{{
                                    formatRupiah(development.amount) }}</p>
                                <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Dana Pembangunan
                                </h3>
                            </div>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="point flex items-center gap-3">
                        <div class="p-[14px] shrink-0 bg-[#005CAA17] rounded-2xl">
                            <img src="@/assets/images/icons/profile-2user-blue.svg" alt="icon"
                                class="size-6 shrink-0" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-[22.5px] text-desa-blue">{{
                                development.applicants_count }} Warga</p>
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Total Partisipasi</h3>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="point flex items-center gap-3">
                        <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                class="size-6 shrink-0" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">{{
                                formatDateTime(development.start_date) }}</p>
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Jadwal Pelaksanaan
                            </h3>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                </section>
                <section id="Tentang-Pembangunan" class="flex flex-col gap-3">
                    <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Tentang Pembangunan</h2>
                    <p class="font-medium leading-8">{{ development.description }}</p>
                </section>
            </div>
            <div class="flex flex-col gap-6 rounded-2xl flex-1 h-fit bg-white p-6">
                <section id="Applicant-Details" class="flex flex-col gap-6">
                    <h2 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Applicant Details</h2>
                    <div class="point flex items-center gap-3">
                        <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                            <img src="@/assets/images/icons/timer-dark-green.svg" alt="icon" class="size-6 shrink-0" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">{{
                                development.days_needed }}
                            </p>
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Days Needed</h3>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="point flex items-center gap-3">
                        <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                            <img src="@/assets/images/icons/calendar-tick-dark-green.svg" alt="icon"
                                class="size-6 shrink-0" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">{{
                                formatDate(development.end_date) }}</p>
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Perkiraan Selesai</h3>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="point flex items-center gap-3">
                        <div class="p-[14px] shrink-0 bg-desa-foreshadow rounded-2xl">
                            <img src="@/assets/images/icons/dollar-square-dark-green.svg" alt="icon"
                                class="size-6 shrink-0" />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-[22.5px] text-desa-dark-green">Pembayaran diatur di
                                balai desa.</p>
                            <h3 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Bayaran Kerja</h3>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                </section>
                <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
                    <button type="button" id="Pelamar-Applicant-Button" class="flex items-center justify-between"
                        @click="showSelectApplicant = true">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex items-center justify-center size-[52px] shrink-0 rounded-full bg-desa-foreshadow overflow-hidden">
                                <img :src="selectedApplicantImage" @error="onProfileImageError" alt="image"
                                    class="size-full object-cover" />
                            </div>
                            <div class="flex flex-col gap-1 items-start">
                                <p id="default-Profile-Name" class="font-semibold text-lg leading-[22.5px]">{{
                                    selectedApplicantName }}</p>
                                <div class="flex items-center gap-1">
                                    <img v-if="selectedApplicant"
                                        src="@/assets/images/icons/briefcase-secondary-green.svg" alt="icon"
                                        class="size-[18px] shrink-0" />
                                    <h3 id="default-Profile-Status"
                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                        {{ selectedApplicantSubtitle }}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <img src="@/assets/images/icons/arrow-square-right-secondary-green.svg" alt="icon"
                            class="size-6 shrink-0" />
                    </button>
                    <hr class="border-desa-background" />
                    <button type="submit" :disabled="developmentApplicantLoading || !selectedApplicant"
                        class="font-medium leading-5 text-white py-[18px] flex justify-center items-center bg-desa-dark-green rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
                        {{ developmentApplicantLoading ? 'Mengirim...' : 'Confirm & Apply Now' }}
                    </button>

                    <!-- modal -->
                    <div id="modal" class="fixed inset-0 flex items-center justify-center bg-[#001B1ACC] z-50"
                        v-if="showSelectApplicant">
                        <div class="bg-white rounded-2xl p-4 w-[760px] flex flex-col gap-6">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-2">
                                    <h3 class="font-semibold text-2xl leading-[30px]">Pilih Pelamar Applicant</h3>
                                    <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">Pilih salah satu
                                        anggota keluarga</p>
                                </div>
                                <button id="closeModal"
                                    class="py-4 px-6 border border-desa-background rounded-2xl bg-white flex items-center gap-2"
                                    @click="showSelectApplicant = false">
                                    <img src="@/assets/images/icons/close-square-secondary-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                    <p class="font-medium leading-5 text-desa-secondary">Tutup</p>
                                </button>
                            </div>
                            <hr class="border-desa-background" />
                            <div v-if="familyMemberGeneralError"
                                class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl"
                                role="alert">
                                {{ familyMemberGeneralError }}
                            </div>
                            <div v-else-if="familyMemberLoading" class="py-12 text-center text-desa-secondary">
                                Memuat data anggota keluarga...
                            </div>
                            <ul v-else id="Profile-List"
                                class="flex flex-col gap-6 max-h-[497px] overflow-y-auto hide-scrollbar px-[1.5px] pb-[2px]">
                                <li v-if="headOfFamilyApplicant">
                                    <label class="profile flex flex-col gap-3 bg-white rounded-3xl">
                                        <h4 class="font-medium leading-[17.5px] text-sm text-desa-secondary">You</h4>
                                        <div class="data rounded-2xl border border-desa-background p-6 flex items-center gap-[49px] transition-all duration-300 hover:ring-[1.5px] hover:ring-desa-dark-green"
                                            :class="selectedApplicantKey === headOfFamilyApplicant.key ? 'ring-[1.5px] ring-desa-dark-green' : ''">
                                            <div class="name flex items-center gap-3 min-w-[240px]">
                                                <div
                                                    class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
                                                    <img :src="headOfFamilyApplicant.profile_picture"
                                                        @error="onProfileImageError" class="w-full h-full object-cover"
                                                        alt="photo" />
                                                </div>
                                                <div class="flex flex-col gap-[6px]">
                                                    <h5
                                                        class="font-semibold text-lg leading-[22.5px] truncate w-[164px]">
                                                        {{ headOfFamilyApplicant.name }}</h5>
                                                    <div class="flex items-center gap-1">
                                                        <img src="@/assets/images/icons/briefcase-secondary-green.svg"
                                                            alt="icon" class="size-[18px] shrink-0" />
                                                        <p
                                                            class="font-medium leading-5 text-desa-secondary truncate w-[142px]">
                                                            {{ headOfFamilyApplicant.occupation }}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nik flex flex-col gap-[6px] min-w-[155px]">
                                                <div class="flex items-center gap-1">
                                                    <img src="@/assets/images/icons/keyboard-secondary-green.svg"
                                                        alt="icon" class="size-[18px] shrink-0" />
                                                    <h5
                                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                                        NIK</h5>
                                                </div>
                                                <p class="font-semibold leading-5 truncate w-[155px]">{{
                                                    headOfFamilyApplicant.identity_number }}</p>
                                            </div>
                                            <div class="umur flex flex-col gap-[6px] min-w-[92px]">
                                                <div class="flex items-center gap-1">
                                                    <img src="@/assets/images/icons/timer-secondary-green.svg"
                                                        alt="icon" class="size-[18px] shrink-0" />
                                                    <h5
                                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                                        Umur</h5>
                                                </div>
                                                <p class="font-semibold leading-5 truncate w-[92px]">{{
                                                    formatApplicantAge(headOfFamilyApplicant.age) }}</p>
                                            </div>
                                            <input :checked="selectedApplicantKey === headOfFamilyApplicant.key"
                                                type="radio" name="anggota"
                                                class="flex size-[30px] shrink-0 accent-desa-dark-green"
                                                @change="selectApplicant(headOfFamilyApplicant.key)" />
                                        </div>
                                    </label>
                                </li>
                                <li v-for="group in groupedFamilyMembers" :key="group.key" class="flex flex-col gap-3">
                                    <h4 class="font-medium leading-[17.5px] text-sm text-desa-secondary">{{ group.label
                                        }}
                                        ({{ group.items.length }})</h4>
                                    <label v-for="member in group.items" :key="member.key"
                                        class="profile flex flex-col gap-3 bg-white rounded-3xl">
                                        <div class="data rounded-2xl border border-desa-background p-6 flex items-center gap-[49px] transition-all duration-300 hover:ring-[1.5px] hover:ring-desa-dark-green"
                                            :class="selectedApplicantKey === member.key ? 'ring-[1.5px] ring-desa-dark-green' : ''">
                                            <div class="name flex items-center gap-3 min-w-[240px]">
                                                <div
                                                    class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
                                                    <img :src="member.profile_picture" @error="onProfileImageError"
                                                        class="w-full h-full object-cover" alt="photo" />
                                                </div>
                                                <div class="flex flex-col gap-[6px]">
                                                    <h5
                                                        class="font-semibold text-lg leading-[22.5px] truncate w-[164px]">
                                                        {{ member.name }}</h5>
                                                    <div class="flex items-center gap-1">
                                                        <img src="@/assets/images/icons/briefcase-secondary-green.svg"
                                                            alt="icon" class="size-[18px] shrink-0" />
                                                        <p
                                                            class="font-medium leading-5 text-desa-secondary truncate w-[142px]">
                                                            {{ member.occupation }}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="nik flex flex-col gap-[6px] min-w-[155px]">
                                                <div class="flex items-center gap-1">
                                                    <img src="@/assets/images/icons/keyboard-secondary-green.svg"
                                                        alt="icon" class="size-[18px] shrink-0" />
                                                    <h5
                                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                                        NIK</h5>
                                                </div>
                                                <p class="font-semibold leading-5 truncate w-[155px]">{{
                                                    member.identity_number }}</p>
                                            </div>
                                            <div class="umur flex flex-col gap-[6px] min-w-[92px]">
                                                <div class="flex items-center gap-1">
                                                    <img src="@/assets/images/icons/timer-secondary-green.svg"
                                                        alt="icon" class="size-[18px] shrink-0" />
                                                    <h5
                                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                                        Umur</h5>
                                                </div>
                                                <p class="font-semibold leading-5 truncate w-[92px]">{{
                                                    formatApplicantAge(member.age) }}</p>
                                            </div>
                                            <input :checked="selectedApplicantKey === member.key" type="radio"
                                                name="anggota" class="flex size-[30px] shrink-0 accent-desa-dark-green"
                                                @change="selectApplicant(member.key)" />
                                        </div>
                                    </label>
                                </li>
                                <li v-if="!headOfFamilyApplicant && !groupedFamilyMembers.length"
                                    class="py-12 text-center text-desa-secondary">
                                    Belum ada data anggota keluarga yang bisa dipilih.
                                </li>
                            </ul>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <ModalDelete :show="showModalDelete" :title="'Hapus Pembangunan Desa?'" :loading="loading"
        @close="showModalDelete = false" @confirm="handleDelete" />
</template>
