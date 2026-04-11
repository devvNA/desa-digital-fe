<script setup>
import ModalDelete from '@/components/ui/ModalDelete.vue'
import { mapDevelopmentResponse } from '@/helpers/development'
import { formatDate, formatRupiah, formatToClientTimezone } from '@/helpers/format'
import { can } from '@/helpers/permissionHelper'
import { fallbackThumbnail, handleImageError } from '@/helpers/socialAssistance'
import router from '@/router'
import { useDevelopmentStore } from '@/stores/development'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

// ── Store ────────────────────────────────────────────────────────
const developmentStore = useDevelopmentStore()
const { loading, error, success } = storeToRefs(developmentStore)


// ── Reactive state ───────────────────────────────────────────────
const development = ref(null)
const showModalDelete = ref(false)
const activeTab = ref('all')

const filteredApplicants = computed(() => {
    const applicants = development.value?.development_applicants ?? []
    if (activeTab.value === 'all') return applicants
    return applicants.filter((a) => a.status === activeTab.value)
})

// ── Data fetching ────────────────────────────────────────────────
async function fetchData() {
    const response = await developmentStore.fetchDevelopment(route.params.id)
    if (!response) return
    development.value = mapDevelopmentResponse(response, route.params.id)
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

function onImageError(event) {
    handleImageError(event, fallbackThumbnail)
}

onMounted(fetchData)
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
        <div class="flex flex-col gap-[14px]">
            <section id="Informasi" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Informasi Pembangunan</p>
                <div class="flex items-center justify-between">
                    <div class="flex w-[120px] h-[100px] shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow">
                        <img :src="development.thumbnail_url" @error="onImageError" class="w-full h-full object-cover"
                            alt="photo" />
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
                                {{ development.development_applicants?.length }}
                            </p>
                            <span class="font-medium text-desa-secondary"> Total Pelamar </span>
                        </div>
                    </div>
                    <div class="flex items-center w-full gap-3 justify-end">
                        <div class="flex flex-col gap-1 w-full text-right">
                            <p class="font-semibold text-xl leading-[22.5px] text-desa-yellow">
                                {{ development.day }} Hari
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
    </div>
    <ModalDelete :show="showModalDelete" :title="'Hapus Pembangunan Desa?'" :loading="loading"
        @close="showModalDelete = false" @confirm="handleDelete" />
</template>
