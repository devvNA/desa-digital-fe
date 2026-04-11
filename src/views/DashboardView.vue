<script setup>
import buildingsIcon from '@/assets/images/icons/buildings-foreshadow-background.svg'
import calendarIcon from '@/assets/images/icons/calendar-2-foreshadow-background.svg'
import crownIcon from '@/assets/images/icons/crown-foreshadow-background.svg'
import residentsIcon from '@/assets/images/icons/profil-2user-foreshadow-background.svg'
import { formatDateWithDay, formatRupiah, formatToClientTimezone } from '@/helpers/format'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useEventParticipantStore } from '@/stores/eventParticipant'
import { useFamilyMemberStore } from '@/stores/familyMember'
import { useSocialAssistanceRecipientStore } from '@/stores/socialAssistanceRecipient'
import { Chart } from 'chart.js/auto'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const dashboardStore = useDashboardStore()
const { dashboardData, error, loading } = storeToRefs(dashboardStore)
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const familyMemberStore = useFamilyMemberStore();
const { familyMembers, loading: loadingFamilyMember } = storeToRefs(familyMemberStore)
const { fetchFamilyMembers } = familyMemberStore;

const socialAssistanceRecipientStore = useSocialAssistanceRecipientStore();
const { socialAssistanceRecipients, loading: loadingSocialAssistanceRecipient } = storeToRefs(socialAssistanceRecipientStore)
const { fetchSocialAssistanceRecipients } = socialAssistanceRecipientStore;

const eventParticipantStore = useEventParticipantStore();
const { eventParticipants, loading: loadingEventParticipant } = storeToRefs(eventParticipantStore)
const { fetchEventParticipants } = eventParticipantStore;

const residentChart = ref(null)
let residentChartInstance = null

const summaryConfigs = [
    {
        key: 'residents',
        label: 'Jumlah Penduduk',
        icon: residentsIcon,
    },
    {
        key: 'developments',
        label: 'Pembangunan',
        icon: buildingsIcon,
    },
    {
        key: 'head_of_families',
        label: 'Kepala Rumah',
        icon: crownIcon,
    },
    {
        key: 'events',
        label: 'Total Events',
        icon: calendarIcon,
    },
]

const residentSegmentsDummy = [
    {
        label: 'Pria',
        description: 'Rentang usia dominan 32-36 tahun',
        color: '#34613A',
        value: 114210,
    },
    {
        label: 'Wanita',
        description: 'Rentang usia dominan 26-31 tahun',
        color: '#8EBD55',
        value: 97200,
    },
    {
        label: 'Anak-anak',
        description: 'Rentang usia 6-12 tahun',
        color: '#FA7139',
        value: 24300,
    },
    {
        label: 'Balita',
        description: 'Rentang usia 0-5 tahun',
        color: '#FBAD48',
        value: 7290,
    },
]

const numberFormatter = new Intl.NumberFormat('id-ID')

const dashboardPayload = computed(() => dashboardData.value ?? {})
const hasDashboardData = computed(() => Object.keys(dashboardPayload.value).length > 0)
const isInitialLoading = computed(() => loading.value && !hasDashboardData.value)
const isFamilyMembersInitialLoading = computed(
    () => loadingFamilyMember.value && familyMembers.value.length === 0,
)
const isSocialAssistanceRecipientsInitialLoading = computed(
    () => loadingSocialAssistanceRecipient.value && socialAssistanceRecipients.value.length === 0,
)
const isEventParticipantsInitialLoading = computed(
    () => loadingEventParticipant.value && eventParticipants.value.length === 0,
)
const errorMessage = computed(
    () => error.value?.response?.data?.message ?? error.value?.message ?? '',
)

const getNumber = (...values) => {
    for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value
        }

        if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
            return Number(value)
        }
    }

    return 0
}

const formatNumber = (value) => numberFormatter.format(getNumber(value))

const summaryCards = computed(() =>
    summaryConfigs.map((item) => ({
        ...item,
        value: getNumber(dashboardPayload.value?.[item.key]),
    })),
)

const socialAssistanceCount = computed(() => getNumber(dashboardPayload.value?.social_assistances))

const residentSegments = computed(() => {
    const residentStatistic =
        dashboardPayload.value?.resident_statistic ?? dashboardPayload.value?.resident_statistics
    const genderStatistic =
        dashboardPayload.value?.gender_statistic ?? dashboardPayload.value?.gender_statistics
    const ageStatistic =
        dashboardPayload.value?.age_statistic ?? dashboardPayload.value?.age_statistics

    const apiSegments = [
        {
            label: 'Pria',
            description: 'Rentang usia dominan 32-36 tahun',
            color: '#34613A',
            value: getNumber(
                residentStatistic?.male,
                residentStatistic?.men,
                genderStatistic?.male,
                genderStatistic?.men,
                dashboardPayload.value?.male_residents,
            ),
        },
        {
            label: 'Wanita',
            description: 'Rentang usia dominan 26-31 tahun',
            color: '#8EBD55',
            value: getNumber(
                residentStatistic?.female,
                residentStatistic?.women,
                genderStatistic?.female,
                genderStatistic?.women,
                dashboardPayload.value?.female_residents,
            ),
        },
        {
            label: 'Anak-anak',
            description: 'Rentang usia 6-12 tahun',
            color: '#FA7139',
            value: getNumber(
                residentStatistic?.children,
                ageStatistic?.children,
                dashboardPayload.value?.children_residents,
            ),
        },
        {
            label: 'Balita',
            description: 'Rentang usia 0-5 tahun',
            color: '#FBAD48',
            value: getNumber(
                residentStatistic?.toddlers,
                ageStatistic?.toddlers,
                dashboardPayload.value?.toddlers,
                dashboardPayload.value?.toddlers_residents,
            ),
        },
    ]

    return apiSegments.some((segment) => segment.value > 0) ? apiSegments : residentSegmentsDummy
})

const totalResidents = computed(() => {
    const totalFromApi = getNumber(dashboardPayload.value?.residents)

    if (totalFromApi > 0) {
        return totalFromApi
    }

    return residentSegments.value.reduce((total, segment) => total + segment.value, 0)
})

const hasResidentSegments = computed(() => residentSegments.value.length > 0)

const destroyResidentChart = () => {
    if (residentChartInstance) {
        residentChartInstance.destroy()
        residentChartInstance = null
    }
}

const renderResidentChart = async () => {
    destroyResidentChart()

    await nextTick()

    if (!residentChart.value || !hasResidentSegments.value) {
        return
    }

    residentChartInstance = new Chart(residentChart.value, {
        type: 'doughnut',
        data: {
            labels: residentSegments.value.map((segment) => segment.label),
            datasets: [
                {
                    data: residentSegments.value.map((segment) => segment.value),
                    backgroundColor: residentSegments.value.map((segment) => segment.color),
                    borderWidth: 0,
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatNumber(context.raw)}`
                        },
                    },
                },
            },
            animation: {
                duration: 650,
            },
            datasets: {
                doughnut: {
                    spacing: 4,
                    borderRadius: 8,
                    cutout: '72%',
                },
            },
        },
    })
}

watch(residentSegments, renderResidentChart, { immediate: true })

onMounted(async () => {
    if (user.value?.role === 'admin') {
        await dashboardStore.getDashboardData()
        await renderResidentChart()
    } else {
        await Promise.all([
            fetchFamilyMembers(),
            fetchSocialAssistanceRecipients(),
            fetchEventParticipants(),
        ])
    }
})

onBeforeUnmount(() => {
    destroyResidentChart()
})
</script>

<template>
    <div class="flex flex-col gap-[14px] pb-[14px]">
        <div class="flex items-start justify-between gap-4 mb-2">
            <div v-if="loading && hasDashboardData"
                class="inline-flex items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary">
                <span class="size-2 rounded-full bg-desa-soft-green loading-dot"></span>
                Memuat pembaruan data
            </div>
        </div>
        <template v-if="isInitialLoading">
            <div class="flex gap-[14px]">
                <div
                    class="dashboard-skeleton dashboard-skeleton-hero gradient-vertical h-[358px] w-[calc(389/1000*100%)] rounded-2xl p-6">
                    <div class="skeleton-block skeleton-soft mb-8 h-[86px] w-[86px] rounded-[28px]"></div>
                    <div class="space-y-3">
                        <div class="skeleton-block skeleton-soft h-4 w-28 rounded-full"></div>
                        <div class="skeleton-block skeleton-soft h-8 w-4/5 rounded-xl"></div>
                        <div class="skeleton-block skeleton-soft h-4 w-full rounded-full"></div>
                        <div class="skeleton-block skeleton-soft h-4 w-3/4 rounded-full"></div>
                    </div>
                    <div class="skeleton-block skeleton-soft mt-10 h-[58px] w-full rounded-2xl bg-white/35"></div>
                </div>
                <section class="grid grid-cols-2 flex-1 shrink-0 gap-[14px]">
                    <div v-for="(item, index) in 4" :key="item"
                        class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6"
                        :style="{ '--skeleton-delay': `${index * 120}ms` }">
                        <div class="mb-6 flex items-center justify-between">
                            <div class="skeleton-block h-4 w-28 rounded-full"></div>
                            <div class="skeleton-block size-12 rounded-2xl"></div>
                        </div>
                        <div class="space-y-3">
                            <div class="skeleton-block h-9 w-24 rounded-xl"></div>
                            <div class="skeleton-block h-4 w-36 rounded-full"></div>
                        </div>
                        <div class="mt-6 flex gap-2">
                            <div class="skeleton-block h-2 w-12 rounded-full"></div>
                            <div class="skeleton-block h-2 w-20 rounded-full"></div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="grid grid-cols-[1.05fr,1fr] gap-[14px]">
                <div class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <div class="skeleton-block h-4 w-32 rounded-full"></div>
                        <div class="skeleton-block size-12 rounded-2xl"></div>
                    </div>
                    <div class="skeleton-block mb-4 h-9 w-28 rounded-xl"></div>
                    <div class="space-y-4">
                        <div v-for="(item, index) in 4" :key="`social-${item}`" class="flex items-center gap-3"
                            :style="{ '--skeleton-delay': `${index * 140}ms` }">
                            <div class="skeleton-block size-[72px] rounded-2xl"></div>
                            <div class="flex-1 space-y-2">
                                <div class="skeleton-block h-5 w-2/3 rounded-full"></div>
                                <div class="skeleton-block h-4 w-1/2 rounded-full"></div>
                            </div>
                            <div class="skeleton-block h-10 w-24 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <div class="skeleton-block h-4 w-32 rounded-full"></div>
                        <div class="skeleton-block size-12 rounded-2xl"></div>
                    </div>
                    <div class="skeleton-block mb-4 h-20 w-full rounded-2xl"></div>
                    <div class="skeleton-block skeleton-media h-[365px] w-full rounded-2xl"></div>
                </div>
            </div>

            <div class="grid grid-cols-[1.35fr,1fr] gap-[14px]">
                <div class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <div class="skeleton-block h-4 w-32 rounded-full"></div>
                        <div class="skeleton-block size-12 rounded-2xl"></div>
                    </div>
                    <div class="skeleton-block mb-6 h-9 w-24 rounded-xl"></div>
                    <div class="space-y-4">
                        <div v-for="(item, index) in 3" :key="`applicant-${item}`" class="flex items-center gap-3"
                            :style="{ '--skeleton-delay': `${index * 160}ms` }">
                            <div class="skeleton-block size-[72px] rounded-2xl"></div>
                            <div class="flex-1 space-y-2">
                                <div class="skeleton-block h-5 w-1/2 rounded-full"></div>
                                <div class="skeleton-block h-4 w-2/3 rounded-full"></div>
                            </div>
                            <div class="skeleton-block h-10 w-24 rounded-full"></div>
                        </div>
                    </div>
                </div>
                <div class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6">
                    <div class="mb-6 flex items-center justify-between">
                        <div class="skeleton-block h-4 w-36 rounded-full"></div>
                        <div class="skeleton-block size-12 rounded-2xl"></div>
                    </div>
                    <div class="mx-auto mb-6 skeleton-ring size-[288px] rounded-full"></div>
                    <div class="space-y-4">
                        <div v-for="(item, index) in 4" :key="`segment-${item}`"
                            class="flex items-center justify-between"
                            :style="{ '--skeleton-delay': `${index * 110}ms` }">
                            <div class="space-y-2">
                                <div class="skeleton-block h-4 w-20 rounded-full"></div>
                                <div class="skeleton-block h-4 w-28 rounded-full"></div>
                            </div>
                            <div class="skeleton-block h-4 w-16 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-else-if="errorMessage"
            class="rounded-2xl border border-desa-orange/20 bg-white p-8 shadow-[0_16px_40px_rgba(38,58,42,0.06)]">
            <div class="flex max-w-[520px] flex-col gap-3">
                <span
                    class="w-fit rounded-full bg-desa-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-desa-orange">
                    Dashboard belum berhasil dimuat
                </span>
                <h2 class="text-2xl font-semibold text-desa-black">
                    Data utama desa belum tersedia saat ini
                </h2>
                <p class="text-sm leading-6 text-desa-secondary">
                    {{ errorMessage }}
                </p>
            </div>
        </div>

        <template v-else>
            <div id="Dashboard-admin" v-if="user?.role === 'admin'" class="flex flex-col gap-[14px]">
                <div id="Row-1" class="flex gap-[14px]">
                    <div class="flex flex-col gap-1">
                        <h1 class="font-semibold text-2xl">Desa Statistics</h1>
                        <p class="text-sm text-desa-secondary">
                            Ringkasan data utama desa tampil lebih rapi dan mudah dipantau.
                        </p>
                    </div>
                    <div
                        class="flex flex-col w-[calc(389/1000*100%)] h-[358px] rounded-2xl p-6 gap-6 gradient-vertical">
                        <img src="@/assets/images/icons/gift-orange-background.svg" class="flex size-[86px] shrink-0"
                            alt="icon" />
                        <div class="flex flex-col gap-3">
                            <p class="font-medium text-sm text-desa-lime">— Bantuan Sosial</p>
                            <p class="font-semibold text-2xl text-white text-nowrap">
                                Dari Desa untuk Warga ❤️
                            </p>
                            <p class="text-white">
                                Wujudkan kesejahteraan desa dengan bantuan sosial yang tepat
                                sasaran.
                            </p>
                        </div>
                        <a href="#" class="flex items-center justify-between rounded-2xl p-4 gap-[10px] bg-white">
                            <span class="font-medium text-desa-dark-green leading-5">Bikin Bantuan Sosial</span>
                            <img src="@/assets/images/icons/add-square-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon" />
                        </a>
                    </div>
                    <section id="Statistics" class="grid grid-cols-2 flex-1 shrink-0 gap-[14px]">
                        <div v-for="card in summaryCards" :key="card.key"
                            class="card flex flex-col w-full rounded-2xl p-6 gap-3 bg-white transition-transform duration-200 hover:-translate-y-0.5">
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-desa-secondary">{{ card.label }}</p>
                                <img :src="card.icon" class="flex size-12 shrink-0" :alt="card.label" />
                            </div>
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(card.value) }}
                                </p>
                                <div class="flex items-center gap-0.5">
                                    <img src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                        class="flex size-[18px] shrink-0" alt="icon" />
                                    <p class="font-medium text-sm text-desa-secondary">
                                        <span class="text-desa-dark-green">+12%</span>
                                        dari bulan sebelumnya
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <div id="Row-2" class="flex gap-[14px]">
                    <section id="Bantuan-Sosial"
                        class="flex flex-col w-[calc(497/1000*100%)] shrink-0 rounded-2xl bg-white">
                        <div class="flex flex-col gap-3 p-6">
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-desa-secondary">Bantuan Sosial</p>
                                <img src="@/assets/images/icons/bag-2-foreshadow-background.svg"
                                    class="flex size-12 shrink-0" alt="icon" />
                            </div>
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(socialAssistanceCount) }}
                                </p>
                                <div class="flex items-center gap-0.5">
                                    <img src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                        class="flex size-[18px] shrink-0" alt="icon" />
                                    <p class="font-medium text-sm text-desa-secondary">
                                        <span class="text-desa-dark-green">+12%</span>
                                        dari bulan sebelumnya
                                    </p>
                                </div>
                            </div>
                        </div>
                        <hr class="border-desa-foreshadow" />
                        <div class="flex flex-col gap-4 p-6">
                            <p class="font-semibold text-[20px] leading-[25px] text-left w-full">
                                Bansos Terakhir
                            </p>
                            <div class="card flex items-center w-full gap-3">
                                <div
                                    class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                                    <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-9 shrink-0"
                                        alt="icon" />
                                </div>
                                <div class="flex flex-col gap-[6px] w-full">
                                    <p class="font-semibold text-xl leading-[25px]">
                                        Rp362.500.000
                                    </p>
                                    <div class="flex items-center gap-0.5 font-medium text-desa-secondary">
                                        <img src="@/assets/images/icons/profile-secondary-green.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <span class="line-clamp-1">
                                            Diberikan oleh Shayna Sakura
                                        </span>
                                    </div>
                                </div>
                                <div
                                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-yellow">
                                    <span class="font-semibold text-xs text-white uppercase">Menunggu</span>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow last-of-type:hidden" />
                            <div class="card flex items-center w-full gap-3">
                                <div
                                    class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                                    <img src="@/assets/images/icons/bag-2-dark-green.svg" class="flex size-9 shrink-0"
                                        alt="icon" />
                                </div>
                                <div class="flex flex-col gap-[6px] w-full">
                                    <p class="font-semibold text-xl leading-[25px]">Beras 10kg</p>
                                    <div class="flex items-center gap-0.5 font-medium text-desa-secondary">
                                        <img src="@/assets/images/icons/profile-secondary-green.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <span class="line-clamp-1">
                                            Diberikan oleh Angga Hikari
                                        </span>
                                    </div>
                                </div>
                                <div
                                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green">
                                    <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow last-of-type:hidden" />
                            <div class="card flex items-center w-full gap-3">
                                <div
                                    class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                                    <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-9 shrink-0"
                                        alt="icon" />
                                </div>
                                <div class="flex flex-col gap-[6px] w-full">
                                    <p class="font-semibold text-xl leading-[25px]">Rp52.500.000</p>
                                    <div class="flex items-center gap-0.5 font-medium text-desa-secondary">
                                        <img src="@/assets/images/icons/profile-secondary-green.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <span class="line-clamp-1">
                                            Diberikan oleh Obito Uciha
                                        </span>
                                    </div>
                                </div>
                                <div
                                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-orange">
                                    <span class="font-semibold text-xs text-white uppercase">Ditolak</span>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow last-of-type:hidden" />
                            <div class="card flex items-center w-full gap-3">
                                <div
                                    class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center">
                                    <img src="@/assets/images/icons/money-dark-green.svg" class="flex size-9 shrink-0"
                                        alt="icon" />
                                </div>
                                <div class="flex flex-col gap-[6px] w-full">
                                    <p class="font-semibold text-xl leading-[25px]">Rp52.500.000</p>
                                    <div class="flex items-center gap-0.5 font-medium text-desa-secondary">
                                        <img src="@/assets/images/icons/profile-secondary-green.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <span class="line-clamp-1"> Diberikan oleh Masayoshi </span>
                                    </div>
                                </div>
                                <div
                                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green">
                                    <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow last-of-type:hidden" />
                            <div
                                class="hidden m-auto h-[384px] flex flex-col shrink-0 justify-center items-center gap-6">
                                <img src="@/assets/images/icons/bag-cross-secondary.svg"
                                    class="flex size-[52px] shrink-0" alt="icon" />
                                <p class="font-medium leading-5 text-center text-desa-secondary">
                                    Ups, nampaknya belum bansos
                                </p>
                            </div>
                        </div>
                    </section>
                    <section id="Event" class="flex flex-col flex-1 shrink-0 rounded-2xl bg-white">
                        <div id="Date-Picker" class="flex flex-col gap-4 p-6">
                            <div class="flex items-center justify-between">
                                <button
                                    class="flex items-center justify-center size-14 rounded-2xl border border-desa-foreshadow hover:border-desa-dark-green">
                                    <img src="@/assets/images/icons/arrow-left-secondary-green.svg"
                                        class="flex size-6 shrink-0" alt="icon" />
                                </button>
                                <p class="font-semibold text-xl">December 2024</p>
                                <button
                                    class="flex items-center justify-center size-14 rounded-2xl border border-desa-foreshadow hover:border-desa-dark-green">
                                    <img src="@/assets/images/icons/arrow-left-secondary-green.svg"
                                        class="flex size-6 shrink-0 rotate-180" alt="icon" />
                                </button>
                            </div>
                            <div class="flex justify-between">
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            28
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Sen
                                    </span>
                                </button>
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            29
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Sel
                                    </span>
                                </button>
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            30
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Rab
                                    </span>
                                </button>
                                <button
                                    class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3 active">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            31
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Kam
                                    </span>
                                </button>
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            1
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Jum
                                    </span>
                                </button>
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            2
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Sab
                                    </span>
                                </button>
                                <button class="group flex flex-col items-center w-[46px] h-[76px] shrink-0 gap-3">
                                    <div
                                        class="flex rounded-full size-[46px] items-center justify-center bg-desa-foreshadow group-[.active]:bg-desa-soft-green">
                                        <span class="font-medium text-desa-dark-green group-[.active]:text-white">
                                            3
                                        </span>
                                    </div>
                                    <span
                                        class="font-medium text-sm text-desa-secondary group-[.active]:text-desa-black">
                                        Min
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div id="Events" class="flex flex-col flex-1 gap-4 p-6">
                            <div class="flex items-center justify-between">
                                <button>
                                    <img src="@/assets/images/icons/arrow-left-secondary-green.svg"
                                        class="flex size-6 shrink-0" alt="icon" />
                                </button>
                                <span class="font-medium text-desa-secondary">Upcoming Events (2)</span>
                                <button>
                                    <img src="@/assets/images/icons/arrow-left-secondary-green.svg"
                                        class="flex size-6 shrink-0 rotate-180" alt="icon" />
                                </button>
                            </div>
                            <div
                                class="event-card relative flex w-full h-[365px] shrink-0 rounded-2xl bg-desa-background overflow-hidden">
                                <img src="@/assets/images/thumbnails/event-image-1.png"
                                    class="w-full h-full object-cover object-top" alt="thumbnails" />
                                <div
                                    class="absolute inset-3 top-auto text-white flex flex-col rounded-[18px] border border-white/20 p-4 gap-[6px] backdrop-blur-xl bg-white/[2%]">
                                    <p class="font-semibold text-xl leading-[25px]">
                                        Belajar Coding Bersama
                                    </p>
                                    <div class="flex items-center gap-1">
                                        <img src="@/assets/images/icons/clock-white.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <p class="font-medium">11:30 WIB</p>
                                    </div>
                                </div>
                            </div>
                            <div
                                class="event-empty-state hidden m-auto h-[384px] flex flex-col shrink-0 justify-center items-center gap-6">
                                <img src="@/assets/images/icons/calendar-remove-secondary-green.svg"
                                    class="flex size-[52px] shrink-0" alt="icon" />
                                <p class="font-medium leading-5 text-center text-desa-secondary">
                                    Ups, nampaknya belum ada event
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
                <div id="Row-3" class="flex gap-[14px]">
                    <section id="Total-Aplicants" class="flex flex-col gap-[14px] w-[calc(603/1000*100%)]">
                        <div class="flex flex-col flex-1 shrink-0 rounded-2xl bg-white">
                            <div class="flex flex-col gap-3 p-6">
                                <div class="flex items-center justify-between">
                                    <p class="font-medium text-desa-secondary">Total Applicants</p>
                                    <img src="@/assets/images/icons/document-text-foreshadow-background.svg"
                                        class="flex size-12 shrink-0" alt="icon" />
                                </div>
                                <div class="flex flex-col gap-[6px]">
                                    <p class="font-semibold text-[32px] leading-10">1.200</p>
                                    <div class="flex items-center gap-0.5">
                                        <img src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                            class="flex size-[18px] shrink-0" alt="icon" />
                                        <p class="font-medium text-sm text-desa-secondary">
                                            <span class="text-desa-dark-green">+12%</span>
                                            dari bulan sebelumnya
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow" />
                            <div class="flex flex-col gap-4 p-6">
                                <p class="font-semibold text-[20px] leading-[25px] text-left w-full">
                                    Applicant Terakhir
                                </p>
                                <div class="card flex items-center w-full gap-3">
                                    <div
                                        class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow overflow-hidden">
                                        <img src="@/assets/images/thumbnails/kd-applicant-1.png"
                                            class="w-full h-full object-cover" alt="icon" />
                                    </div>
                                    <div class="flex flex-col gap-[6px] w-full">
                                        <div class="flex items-center gap-[6px]">
                                            <div class="flex size-8 rounded-full overflow-hidden bg-desa-foreshadow">
                                                <img src="@/assets/images/photos/kk-photo-1.png"
                                                    class="w-full h-full object-cover" alt="icon" />
                                            </div>
                                            <p class="font-medium text-xl leading-[22.5px] line-clamp-1">
                                                Masayoshi
                                            </p>
                                        </div>
                                        <span class="font-medium text-desa-secondary line-clamp-1">
                                            Melamar pembangunan Jalanan Utama Desa
                                        </span>
                                    </div>
                                    <div
                                        class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-yellow">
                                        <span class="font-semibold text-xs text-white uppercase">Menunggu</span>
                                    </div>
                                </div>
                                <hr class="border-desa-foreshadow last-of-type:hidden" />
                                <div class="card flex items-center w-full gap-3">
                                    <div
                                        class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow overflow-hidden">
                                        <img src="@/assets/images/thumbnails/kd-applicant-2.png"
                                            class="w-full h-full object-cover" alt="icon" />
                                    </div>
                                    <div class="flex flex-col gap-[6px] w-full">
                                        <div class="flex items-center gap-[6px]">
                                            <div class="flex size-8 rounded-full overflow-hidden bg-desa-foreshadow">
                                                <img src="@/assets/images/photos/kk-photo-2.png"
                                                    class="w-full h-full object-cover" alt="icon" />
                                            </div>
                                            <p class="font-medium text-xl leading-[22.5px] line-clamp-1">
                                                Surti Jasmine
                                            </p>
                                        </div>
                                        <span class="font-medium text-desa-secondary line-clamp-1">
                                            Melamar pembangunan Balai Desa
                                        </span>
                                    </div>
                                    <div
                                        class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green">
                                        <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                                    </div>
                                </div>
                                <hr class="border-desa-foreshadow last-of-type:hidden" />
                                <div class="card flex items-center w-full gap-3">
                                    <div
                                        class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow overflow-hidden">
                                        <img src="@/assets/images/thumbnails/kd-applicant-3.png"
                                            class="w-full h-full object-cover" alt="icon" />
                                    </div>
                                    <div class="flex flex-col gap-[6px] w-full">
                                        <div class="flex items-center gap-[6px]">
                                            <div class="flex size-8 rounded-full overflow-hidden bg-desa-foreshadow">
                                                <img src="@/assets/images/photos/kk-photo-3.png"
                                                    class="w-full h-full object-cover" alt="icon" />
                                            </div>
                                            <p class="font-medium text-xl leading-[22.5px] line-clamp-1">
                                                Mirna Wonongso
                                            </p>
                                        </div>
                                        <span class="font-medium text-desa-secondary line-clamp-1">
                                            Melamar pembangunan Puskemas Desa
                                        </span>
                                    </div>
                                    <div
                                        class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-orange">
                                        <span class="font-semibold text-xs text-white uppercase">Ditolak</span>
                                    </div>
                                </div>
                                <hr class="border-desa-foreshadow last-of-type:hidden" />
                                <div
                                    class="hidden m-auto h-[280px] flex flex-col shrink-0 justify-center items-center gap-6">
                                    <img src="@/assets/images/icons/note-remove-secondary.svg"
                                        class="flex size-[52px] shrink-0" alt="icon" />
                                    <p class="font-medium leading-5 text-center text-desa-secondary">
                                        Ups, nampaknya belum ada Applicant
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div
                            class="flex items-center justify-between h-[125px] rounded-2xl p-8 gap-4 gradient-horizontal">
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-medium text-sm text-desa-lime">— Unduh Data Desa</p>
                                <p class="font-semibold text-2xl text-white text-nowrap">
                                    Data Desa Terkini
                                </p>
                            </div>
                            <a href="#" class="flex items-center flex-nowrap rounded-2xl p-4 gap-[10px] bg-white">
                                <span class="font-medium text-desa-dark-green">Download Laporan</span>
                                <img src="@/assets/images/icons/receive-square-dark-green.svg"
                                    class="flex size-6 shrink-0" alt="icon" />
                            </a>
                        </div>
                    </section>
                    <section id="statistik-Penduduk"
                        class="flex flex-col flex-1 shrink-0 gap-4 p-6 rounded-2xl bg-white">
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-desa-secondary">Statistics Penduduk</p>
                            <img src="@/assets/images/icons/profile-2user-foreshadow-background.svg"
                                class="flex size-12 shrink-0" alt="icon" />
                        </div>
                        <div class="relative">
                            <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(totalResidents) }}
                                </p>
                                <p class="font-medium text-sm text-desa-secondary">
                                    Jumlah Penduduk
                                </p>
                            </div>
                            <canvas v-if="hasResidentSegments" ref="residentChart"
                                class="mx-auto size-[288px]"></canvas>
                            <div v-else
                                class="mx-auto flex size-[288px] items-center justify-center rounded-full border border-dashed border-desa-foreshadow bg-desa-background/40 p-10 text-center text-sm leading-6 text-desa-secondary">
                                Rincian kategori penduduk belum tersedia dari API dashboard.
                            </div>
                        </div>
                        <div v-if="hasResidentSegments" class="flex flex-col gap-4">
                            <template v-for="(segment, index) in residentSegments" :key="segment.label">
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-col gap-1">
                                        <p class="font-medium leading-5 flex">
                                            <span class="my-auto mr-[6px] block size-2 rounded-full"
                                                :style="{ backgroundColor: segment.color }"></span>
                                            {{ segment.label }}
                                        </p>
                                        <p class="font-medium text-sm text-desa-secondary">
                                            {{ segment.description }}
                                        </p>
                                    </div>
                                    <p class="flex items-center font-medium leading-5">
                                        {{ formatNumber(segment.value) }}
                                        <img src="@/assets/images/icons/user-black.svg"
                                            class="flex size-[18px] shrink-0 ml-0.5" alt="icon" />
                                    </p>
                                </div>
                                <hr v-if="index < residentSegments.length - 1" class="border-desa-foreshadow" />
                            </template>
                        </div>
                        <div v-else
                            class="rounded-2xl border border-dashed border-desa-foreshadow bg-desa-background/30 p-4 text-sm leading-6 text-desa-secondary">
                            Detail segment penduduk akan tampil otomatis ketika API mengirimkan
                            rincian kategori seperti pria, wanita, anak-anak, atau balita.
                        </div>
                    </section>
                </div>
            </div>
            <div id="Dashboard-kepala-keluarga" v-if="user?.role === 'head-of-family'" class="flex flex-col gap-[14px]">
                <header>
                    <h1 class="font-semibold text-2xl leading-[30px]">Rumah Tangga Stats</h1>
                </header>
                <div v-if="loadingFamilyMember || loadingSocialAssistanceRecipient || loadingEventParticipant"
                    class="inline-flex items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary w-fit">
                    <span class="size-2 rounded-full bg-desa-soft-green loading-dot"></span>
                    Memuat data rumah tangga
                </div>
                <div class="flex gap-[14px]">
                    <div class="flex flex-col gap-[14px] shrink-0 w-[calc(463/1000*100%)]">
                        <section id="Bantuan-Sosial" class="flex flex-col gap-6 p-6 gradient-vertical rounded-2xl">
                            <img src="@/assets/images/icons/bag-orange-background.svg" alt="icon"
                                class="size-[86px] shrink-0" />
                            <div class="flex flex-col gap-[12px]">
                                <h2 class="font-medium text-sm leading-[17.5px] text-[#DEFF6E]">— Bantuan Sosial</h2>
                                <h3 class="font-semibold text-2xl leading-[30px] text-white">Dari Desa Untuk Warga ❤️
                                </h3>
                                <p class="leading-6 text-white">Terima bantuan sosial dari desa yang tepat untuk
                                    kebutuhan
                                    spesifikmu setiap saat.</p>
                            </div>
                            <RouterLink :to="{ name: 'social-assistance' }">
                                <div class="flex items-center justify-between px-4 py-[18px] bg-white rounded-2xl">
                                    <p class="font-medium leading-5 text-desa-dark-green">Ajukan Bantuan Sosial</p>
                                    <img src="@/assets/images/icons/add-square-dark-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                </div>
                            </RouterLink>
                        </section>
                        <section id="Events-Joined" class="flex flex-col gap-6 p-6 bg-white rounded-2xl">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">{{ eventParticipants.length
                                        }}</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">Events Joined</h2>
                                </div>
                                <div
                                    class="p-[12px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0">
                                    <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                </div>
                            </div>
                            <hr class="border-desa-background" />
                            <div id="Recent-Event" class="flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">Recent Events</h3>
                                <div v-if="isEventParticipantsInitialLoading"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                    Memuat data event...
                                </div>
                                <div v-else-if="eventParticipants.length === 0"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                    Belum ada event yang diikuti.
                                </div>
                                <div class="event py-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                    v-for="data in eventParticipants" :key="data.id">
                                    <div class="time px-4 flex items-center justify-between">
                                        <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">{{
                                            formatDateWithDay(data.event.date) + ', ' + data.event.time }}</p>
                                        <img src="@/assets/images/icons/calendar-2-secondary-green.svg" alt="icon"
                                            class="size-[18px] shrink-0" />
                                    </div>
                                    <hr class="border-desa-background mx-4" />
                                    <div class="card px-4 flex items-center gap-3">
                                        <div
                                            class="flex items-center justify-center w-[100px] h-[80px] shrink-0 rounded-2xl overflow-auto">
                                            <img :src="data.event.thumbnail" alt="image"
                                                class="w-full h-full object-cover" />
                                        </div>
                                        <div class="flex flex-col gap-[6px] w-full">
                                            <h4 class="font-semibold text-lg leading-[22.5px] line-clamp-1">{{
                                                data.event.name }}
                                            </h4>
                                            <div class="flex items-center gap-1">
                                                <img src="@/assets/images/icons/profile-2user-orange.svg" alt="icon"
                                                    class="size-[18px] shrink-0" />
                                                <p class="font-semibold text-sm leading-[17.5px] text-desa-orange">{{
                                                    data.event.participants_count }}
                                                </p>
                                                <p
                                                    class="font-semibold text-sm leading-[17.5px] text-desa-orange line-clamp-1">
                                                    total partisipasi</p>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div class="harga-event px-4 flex items-center justify-between">
                                        <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">Harga Event:
                                        </p>
                                        <p class="font-medium leading-5 text-desa-red">{{ formatRupiah(data.event.price)
                                            }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section id="Pembangunan" class="flex flex-col gap-6 p-6 bg-white rounded-2xl">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">5 Applicants</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">Pembangunan</h2>
                                </div>
                                <div
                                    class="p-[12px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0">
                                    <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                </div>
                            </div>
                            <hr class="border-desa-background" />
                            <div id="Recent-Applicants" class="flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">Recent Applicants</h3>
                                <div
                                    class="applicant p-4 rounded-2xl border border-desa-background flex flex-col gap-4">
                                    <div class="flex items-center justify-between">
                                        <div
                                            class="flex items-center justify-center w-[100px] h-[80px] shrink-0 rounded-2xl overflow-hidden">
                                            <img src="@/assets/images/thumbnails/kk-dashboard-3.png" alt="image"
                                                class="size-full shrink-0" />
                                        </div>
                                        <div class="group menunggu">
                                            <span
                                                class="group-[&.menunggu]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-yellow text-white font-semibold text-xs leading-[15px] shrink-0">MENUNGGU</span>
                                            <span
                                                class="group-[&.ditolak]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-red text-white font-semibold text-xs leading-[15px] shrink-0">DITOLAK</span>
                                            <span
                                                class="group-[&.diterima]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-dark-green text-white font-semibold text-xs leading-[15px] shrink-0">DITERIMA</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <h5 class="font-semibold text-lg leading-[22.5px] line-clamp-1">Pembangunan
                                            Puskesmas Desa
                                        </h5>
                                        <div class="flex gap-1">
                                            <p class="font-medium leading-5 text-desa-secondary">Penanggung Jawab:</p>
                                            <p class="font-semibold leading-5 text-desa-dark-green">Uzumaki Asep</p>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div id="Tanggal-Pelaksanaan" class="flex items-center gap-[12px]">
                                        <div
                                            class="size-[48px] shrink-0 rounded-full bg-desa-foreshadow flex items-center justify-center">
                                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                                class="size-6 shrink-0" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">3 Jan 2025</p>
                                            <h6 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Tanggal
                                                Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div id="Waktu-Pelaksanaan" class="flex items-center gap-[12px]">
                                        <div
                                            class="size-[48px] shrink-0 rounded-full bg-desa-foreshadow flex items-center justify-center">
                                            <img src="@/assets/images/icons/timer-dark-green.svg" alt="icon"
                                                class="size-6 shrink-0" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">24 Hari</p>
                                            <h6 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Waktu
                                                Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="applicant p-4 rounded-2xl border border-desa-background flex flex-col gap-4">
                                    <div class="flex items-center justify-between">
                                        <div
                                            class="flex items-center justify-center w-[100px] h-[80px] shrink-0 rounded-2xl overflow-hidden">
                                            <img src="@/assets/images/thumbnails/kk-dashboard-4.png" alt="image"
                                                class="size-full shrink-0" />
                                        </div>
                                        <div class="group diterima">
                                            <span
                                                class="group-[&.menunggu]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-yellow text-white font-semibold text-xs leading-[15px] shrink-0">MENUNGGU</span>
                                            <span
                                                class="group-[&.ditolak]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-red text-white font-semibold text-xs leading-[15px] shrink-0">DITOLAK</span>
                                            <span
                                                class="group-[&.diterima]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-dark-green text-white font-semibold text-xs leading-[15px] shrink-0">DITERIMA</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <h5 class="font-semibold text-lg leading-[22.5px] line-clamp-1">Pembangunan
                                            Jalanan Utama
                                        </h5>
                                        <div class="flex gap-1">
                                            <p class="font-medium leading-5 text-desa-secondary">Penanggung Jawab:</p>
                                            <p class="font-semibold leading-5 text-desa-dark-green">Uzumaki Asep</p>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div id="Tanggal-Pelaksanaan" class="flex items-center gap-[12px]">
                                        <div
                                            class="size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow flex items-center justify-center">
                                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" alt="icon"
                                                class="size-6 shrink-0" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">3 Jan 2025</p>
                                            <h6 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Tanggal
                                                Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div id="Waktu-Pelaksanaan" class="flex items-center gap-[12px]">
                                        <div
                                            class="size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow flex items-center justify-center">
                                            <img src="@/assets/images/icons/timer-dark-green.svg" alt="icon"
                                                class="size-6 shrink-0" />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">24 Hari</p>
                                            <h6 class="font-medium text-sm leading-[17.5px] text-desa-secondary">Waktu
                                                Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div class="flex flex-col gap-[14px] flex-1">
                        <section id="Anggota-Keluarga" class="flex flex-col gap-6 p-6 bg-white rounded-2xl">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">{{ familyMembers.length
                                        }}</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">Anggota Keluarga</h2>
                                </div>
                                <div
                                    class="p-[16px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0">
                                    <img src="@/assets/images/icons/profile-2user-dark-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                </div>
                            </div>
                            <div class="box h-[1px] w-full"></div>
                            <div v-if="isFamilyMembersInitialLoading"
                                class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                Memuat data anggota keluarga...
                            </div>
                            <div v-else-if="familyMembers.length === 0"
                                class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                Belum ada data anggota keluarga.
                            </div>
                            <div v-for="familyMember in familyMembers" :key="familyMember.id"
                                class="people flex flex-col gap-[14px]">
                                <div class="rounded-2xl border border-desa-background p-4 flex flex-col gap-6">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-[12px]">
                                            <div
                                                class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
                                                <img :src="familyMember.profile_picture"
                                                    class="w-full h-full object-cover" alt="photo" />
                                            </div>
                                            <div class="flex flex-col gap-[6px]">
                                                <h4 class="font-semibold text-lg leading-[22.5px] line-clamp-1">{{
                                                    familyMember.user?.name }}</h4>
                                                <div class="flex items-center gap-1">
                                                    <img src="@/assets/images/icons/briefcase-secondary-green.svg"
                                                        alt="icon" class="size-[18px] shrink-0" />
                                                    <p class="font-medium leading-5 text-desa-secondary line-clamp-1">
                                                        {{ familyMember.occupation }}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="font-medium leading-5">{{ familyMember.age }} tahun</p>
                                    </div>
                                    <hr class="border-desa-foreshadow" />
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-1">
                                            <img src="@/assets/images/icons/keyboard-secondary-green.svg" alt="icon"
                                                class="size-[18px] shrink-0" />
                                            <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nomor
                                                Induk
                                                Kependudukan:</p>
                                        </div>
                                        <p class="font-medium leading-5">{{ familyMember.identity_number }}</p>
                                    </div>
                                </div>
                            </div>
                            <a href="kk-anggota-keluarga.html">
                                <div class="rounded-2xl py-[18px] bg-desa-dark-green flex justify-center items-center">
                                    <p class="font-medium leading-5 text-white">View Details</p>
                                </div>
                            </a>
                        </section>
                        <section id="Pengajuan-Bantuan-Sosial" class="flex flex-col gap-6 p-6 bg-white rounded-2xl">
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">{{
                                        socialAssistanceRecipients.length }}
                                        Pengajuan</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">Bantuan Sosial</h2>
                                </div>
                                <div
                                    class="p-[16px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0">
                                    <img src="@/assets/images/icons/note-dark-green.svg" alt="icon"
                                        class="size-6 shrink-0" />
                                </div>
                            </div>
                            <div class="box h-[1px] w-full"></div>
                            <div class="people flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">Recent Bansos</h3>
                                <div v-if="isSocialAssistanceRecipientsInitialLoading"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                    Memuat data bantuan sosial...
                                </div>
                                <div v-else-if="socialAssistanceRecipients.length === 0"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary">
                                    Belum ada pengajuan bantuan sosial.
                                </div>
                                <div v-for="data in socialAssistanceRecipients" :key="data.id"
                                    class="bantuan p-4 rounded-2xl border border-desa-background flex flex-col gap-4">
                                    <div class="flex items-center justify-between">
                                        <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">{{
                                            formatToClientTimezone(data.created_at) }}
                                        </p>
                                        <img src="@/assets/images/icons/calendar-2-secondary-green.svg" alt="icon"
                                            class="size-[18px] shrink-0" />
                                    </div>
                                    <hr class="border-desa-background" />
                                    <h4 class="font-semibold text-lg leading-[22.5px]">{{ data.social_assistance.name }}
                                    </h4>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="size-[52px] shrink-0 rounded-2xl flex justify-center items-center bg-desa-foreshadow">
                                                <img src="@/assets/images/icons/money-dark-green.svg" alt="icon"
                                                    class="size-6 shrink-0" />
                                            </div>
                                            <div class="flex flex-col gap-[6px]">
                                                <h5 class="font-semibold text-lg leading-[22.5px]">{{
                                                    formatRupiah(data.social_assistance.amount) }}</h5>
                                                <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">
                                                    Total Bansos</p>
                                            </div>
                                        </div>
                                        <div class="group menunggu">
                                            <span
                                                class="group-[&.menunggu]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-yellow text-white font-semibold text-xs leading-[15px] shrink-0">MENUNGGU</span>
                                            <span
                                                class="group-[&.ditolak]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-red text-white font-semibold text-xs leading-[15px] shrink-0">DITOLAK</span>
                                            <span
                                                class="group-[&.diterima]:flex hidden rounded-full py-[12px] w-[100px] justify-center bg-desa-dark-green text-white font-semibold text-xs leading-[15px] shrink-0">DITERIMA</span>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div class="flex items-center justify-between">
                                        <p class="font-medium text-sm leading-[17.5px] text-desa-secondary">Nominal
                                            Pengajuan:</p>
                                        <p class="font-medium leading-5 text-desa-red">{{ formatRupiah(data.amount) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section id="Unduh-Rumah-Tangga-Stat"
                            class="rounded-2xl gradient-horizontal pt-[32px] px-[32px] pb-[34px] flex flex-col gap-[32px]">
                            <div class="flex items-center gap-4">
                                <img src="@/assets/images/icons/document-download-orange-background.svg" alt="icon"
                                    class="size-[86px] shrink-0" />
                                <div class="flex flex-col gap-[6px]">
                                    <h2 class="font-medium text-sm leading-[17.5px] text-desa-lime">— Unduh Rumah Tangga
                                        Stat</h2>
                                    <strong class="font-semibold text-2xl leading-[30px] text-white">Statistik Rumah
                                        Tangga</strong>
                                </div>
                            </div>
                            <button type="button"
                                class="flex items-center justify-between px-4 py-[18px] bg-white rounded-2xl">
                                <p class="font-medium leading-5 text-desa-dark-green">Download Laporan</p>
                                <img src="@/assets/images/icons/receive-square-dark-green.svg" alt="icon"
                                    class="size-6 shrink-0" />
                            </button>
                        </section>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.dashboard-skeleton {
    position: relative;
    overflow: hidden;
    isolation: isolate;
}

.dashboard-skeleton-card {
    background:
        radial-gradient(circle at top right, rgba(142, 189, 85, 0.12), transparent 38%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 248, 0.94));
    box-shadow: 0 16px 40px rgba(38, 58, 42, 0.05);
}

.dashboard-skeleton-hero {
    box-shadow: 0 22px 44px rgba(52, 97, 58, 0.18);
}

.skeleton-block {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(111, 132, 121, 0.16), rgba(111, 132, 121, 0.09));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.38);
}

.skeleton-soft {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.16));
}

.skeleton-media {
    background:
        linear-gradient(135deg, rgba(142, 189, 85, 0.14), rgba(52, 97, 58, 0.08)),
        linear-gradient(180deg, rgba(111, 132, 121, 0.12), rgba(111, 132, 121, 0.08));
}

.skeleton-ring {
    position: relative;
    overflow: hidden;
    background:
        radial-gradient(circle at center,
            rgba(255, 255, 255, 0) 42%,
            rgba(111, 132, 121, 0.14) 43%,
            rgba(111, 132, 121, 0.14) 56%,
            rgba(255, 255, 255, 0) 57%),
        conic-gradient(from 120deg,
            rgba(52, 97, 58, 0.12),
            rgba(142, 189, 85, 0.22),
            rgba(250, 113, 57, 0.18),
            rgba(251, 173, 72, 0.2),
            rgba(52, 97, 58, 0.12));
    box-shadow: inset 0 0 0 1px rgba(111, 132, 121, 0.08);
}

.skeleton-ring::before {
    content: '';
    position: absolute;
    inset: 50%;
    width: 108px;
    height: 108px;
    transform: translate(-50%, -50%);
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 10px 24px rgba(38, 58, 42, 0.06);
}

.skeleton-block::after,
.dashboard-skeleton::after,
.skeleton-ring::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 12%,
            rgba(255, 255, 255, 0.58) 50%,
            rgba(255, 255, 255, 0.08) 88%,
            transparent 100%);
    animation: shimmer 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--skeleton-delay, 0ms);
}

.loading-dot {
    animation: pulse 1.2s ease-in-out infinite;
}

.dashboard-skeleton::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 35%);
    opacity: 0.85;
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.4;
    }

    50% {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {

    .skeleton-block::after,
    .dashboard-skeleton::after,
    .loading-dot {
        animation: none;
    }
}
</style>
