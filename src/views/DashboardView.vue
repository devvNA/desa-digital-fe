<script setup>
import buildingsIcon from "@/assets/images/icons/buildings-foreshadow-background.svg";
import calendarIcon from "@/assets/images/icons/calendar-2-foreshadow-background.svg";
import crownIcon from "@/assets/images/icons/crown-foreshadow-background.svg";
import residentsIcon from "@/assets/images/icons/profil-2user-foreshadow-background.svg";
import { formatDateWithDay, formatRupiah, formatToClientTimezone } from "@/helpers/format";
import {
    fallbackProfilePicture,
    fallbackThumbnail,
    getProfilePicture,
    getStatusConfig,
    getThumbnail,
    handleImageError,
} from "@/helpers/socialAssistance";
import { useAuthStore } from "@/stores/auth";
import { useDashboardStore } from "@/stores/dashboard";
import { Chart } from "chart.js/auto";
import { storeToRefs } from "pinia";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const dashboardStore = useDashboardStore();
const { dashboardData, error, loading } = storeToRefs(dashboardStore);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const residentChart = ref(null);
let residentChartInstance = null;

const summaryConfigs = [
    {
        key: "residents",
        label: "Jumlah Penduduk",
        icon: residentsIcon,
    },
    {
        key: "developments",
        label: "Pembangunan",
        icon: buildingsIcon,
    },
    {
        key: "head_of_families",
        label: "Kepala Rumah",
        icon: crownIcon,
    },
    {
        key: "events",
        label: "Total Events",
        icon: calendarIcon,
    },
];

const ageGroupColors = {
    balita: "#FBAD48",
    anak_anak: "#FA7139",
    remaja: "#005CAA",
    dewasa: "#34613A",
    lansia: "#8EBD55",
};

const numberFormatter = new Intl.NumberFormat("id-ID");

const dashboardPayload = computed(() => dashboardData.value ?? {});
const hasDashboardData = computed(() => Object.keys(dashboardPayload.value).length > 0);
const isInitialLoading = computed(() => loading.value && !hasDashboardData.value);
const headOfFamilySummary = computed(() => dashboardPayload.value?.summary ?? {});
const adminStatistics = computed(() => dashboardPayload.value?.statistics ?? {});
const socialAssistanceSummary = computed(() => dashboardPayload.value?.social_assistance ?? {});
const upcomingEventsSummary = computed(() => dashboardPayload.value?.upcoming_events ?? {});
const populationDemographics = computed(
    () => dashboardPayload.value?.population_demographics ?? {},
);
const familyMembers = computed(() => dashboardPayload.value?.family_members ?? []);
const socialAssistanceRecipients = computed(
    () => dashboardPayload.value?.social_assistance_recipients ?? [],
);
const eventParticipants = computed(() => dashboardPayload.value?.event_participants ?? []);
const developmentApplicants = computed(() =>
    Array.isArray(dashboardPayload.value?.development_applicants)
        ? dashboardPayload.value.development_applicants
        : [],
);
const latestSocialAssistances = computed(() =>
    Array.isArray(socialAssistanceSummary.value?.latest)
        ? socialAssistanceSummary.value.latest
        : [],
);
const upcomingEvents = computed(() =>
    Array.isArray(upcomingEventsSummary.value?.events) ? upcomingEventsSummary.value.events : [],
);
const adminDevelopmentApplicantsSummary = computed(() => {
    const data = dashboardPayload.value?.development_applicants;

    if (Array.isArray(data)) {
        return {
            total: data.length,
            growth_percentage: 0,
            latest: data,
        };
    }

    return data ?? {};
});
const adminDevelopmentApplicants = computed(() =>
    Array.isArray(adminDevelopmentApplicantsSummary.value?.latest)
        ? adminDevelopmentApplicantsSummary.value.latest
        : [],
);

const familyMembersCount = computed(() =>
    getNumber(headOfFamilySummary.value?.family_members_count, familyMembers.value.length),
);
const socialAssistanceRecipientsCount = computed(() =>
    getNumber(
        headOfFamilySummary.value?.social_assistance_recipients_count,
        socialAssistanceRecipients.value.length,
    ),
);
const eventParticipantsCount = computed(() =>
    getNumber(headOfFamilySummary.value?.event_participants_count, eventParticipants.value.length),
);
const developmentApplicantsCount = computed(() =>
    getNumber(
        headOfFamilySummary.value?.development_applicants_count,
        developmentApplicants.value.length,
    ),
);

const isFamilyMembersInitialLoading = computed(
    () => loading.value && familyMembers.value.length === 0,
);
const isSocialAssistanceRecipientsInitialLoading = computed(
    () => loading.value && socialAssistanceRecipients.value.length === 0,
);
const isEventParticipantsInitialLoading = computed(
    () => loading.value && eventParticipants.value.length === 0,
);

const isDevelopmentApplicantsInitialLoading = computed(
    () => loading.value && developmentApplicants.value.length === 0,
);

const getNumber = (...values) => {
    for (const value of values) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
            return Number(value);
        }
    }

    return 0;
};

const formatNumber = (value) => numberFormatter.format(getNumber(value));
const formatGrowthLabel = (value) => {
    const growth = getNumber(value);

    if (growth === 0) {
        return "0%";
    }

    return `${growth > 0 ? "+" : ""}${growth}%`;
};
const getReadableErrorMessage = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value?.response?.data?.message) {
        return value.response.data.message;
    }

    if (value?.message) {
        return value.message;
    }

    if (typeof value === "object") {
        const firstMessage = Object.values(value)
            .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
            .find(Boolean);

        return firstMessage ?? "Dashboard gagal dimuat.";
    }

    return "Dashboard gagal dimuat.";
};
const errorMessage = computed(() => getReadableErrorMessage(error.value));

const summaryCards = computed(() =>
    summaryConfigs.map((item) => ({
        ...item,
        value: getNumber(adminStatistics.value?.[item.key]?.total),
        growth: getNumber(adminStatistics.value?.[item.key]?.growth_percentage),
    })),
);

const socialAssistanceCount = computed(() => getNumber(socialAssistanceSummary.value?.total));
const socialAssistanceGrowth = computed(() =>
    getNumber(socialAssistanceSummary.value?.growth_percentage),
);
const upcomingEventsCount = computed(() =>
    getNumber(upcomingEventsSummary.value?.total_upcoming, upcomingEvents.value.length),
);
const adminDevelopmentApplicantsCount = computed(() =>
    getNumber(
        adminDevelopmentApplicantsSummary.value?.total,
        adminDevelopmentApplicants.value.length,
    ),
);
const adminDevelopmentApplicantsGrowth = computed(() =>
    getNumber(adminDevelopmentApplicantsSummary.value?.growth_percentage),
);
const genderHighlights = computed(() => {
    const gender = populationDemographics.value?.gender ?? {};

    return [
        {
            key: "male",
            label: "Pria",
            count: getNumber(gender?.male?.count),
            description: gender?.male?.dominant_age_range
                ? `Usia dominan ${gender.male.dominant_age_range} tahun`
                : "Usia dominan belum tersedia",
            color: "#34613A",
        },
        {
            key: "female",
            label: "Wanita",
            count: getNumber(gender?.female?.count),
            description: gender?.female?.dominant_age_range
                ? `Usia dominan ${gender.female.dominant_age_range} tahun`
                : "Usia dominan belum tersedia",
            color: "#8EBD55",
        },
    ];
});

const residentSegments = computed(() => {
    const ageGroups = populationDemographics.value?.age_groups ?? {};

    return Object.entries(ageGroups)
        .map(([key, value]) => ({
            key,
            label: value?.label ?? key,
            description: `${formatNumber(value?.count)} warga`,
            color: ageGroupColors[key] ?? "#90A4AE",
            value: getNumber(value?.count),
        }))
        .filter((segment) => segment.value > 0);
});

const totalResidents = computed(() => {
    const totalFromApi = getNumber(
        populationDemographics.value?.total,
        adminStatistics.value?.residents?.total,
    );

    if (totalFromApi > 0) {
        return totalFromApi;
    }

    return residentSegments.value.reduce((total, segment) => total + segment.value, 0);
});

const hasResidentSegments = computed(() => residentSegments.value.length > 0);
const populationSnapshot = computed(() => {
    const headOfFamiliesTotal = getNumber(adminStatistics.value?.head_of_families?.total);

    return `${formatNumber(totalResidents.value)} warga, ${formatNumber(headOfFamiliesTotal)} kepala keluarga`;
});
const getEventSchedule = (eventItem) => {
    const dateLabel = eventItem?.date
        ? formatDateWithDay(eventItem.date)
        : "Tanggal belum tersedia";

    return eventItem?.time ? `${dateLabel}, ${eventItem.time}` : dateLabel;
};

const destroyResidentChart = () => {
    if (residentChartInstance) {
        residentChartInstance.destroy();
        residentChartInstance = null;
    }
};

const renderResidentChart = async () => {
    destroyResidentChart();

    await nextTick();

    if (!residentChart.value || !hasResidentSegments.value) {
        return;
    }

    residentChartInstance = new Chart(residentChart.value, {
        type: "doughnut",
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
                            return `${context.label}: ${formatNumber(context.raw)}`;
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
                    cutout: "72%",
                },
            },
        },
    });
};

watch(residentSegments, renderResidentChart, { immediate: true });

onMounted(async () => {
    if (user.value?.role === "admin") {
        await dashboardStore.getDashboardData();
        await renderResidentChart();
    } else {
        await dashboardStore.getHeadOfFamilyDashboardData();
    }
});

onBeforeUnmount(() => {
    destroyResidentChart();
});
</script>

<template>
    <div class="flex flex-col gap-[14px] pb-[14px]">
        <div class="flex items-start justify-between gap-4 mb-2">
            <div
                v-if="loading && hasDashboardData && user?.role === 'admin'"
                class="inline-flex items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary"
            >
                <span class="size-2 rounded-full bg-desa-soft-green loading-dot"></span>
                Memuat pembaruan data
            </div>
        </div>
        <template v-if="isInitialLoading">
            <div class="flex gap-[14px]">
                <div
                    class="dashboard-skeleton dashboard-skeleton-hero gradient-vertical h-[358px] w-[calc(389/1000*100%)] rounded-2xl p-6"
                >
                    <div
                        class="skeleton-block skeleton-soft mb-8 h-[86px] w-[86px] rounded-[28px]"
                    ></div>
                    <div class="space-y-3">
                        <div class="skeleton-block skeleton-soft h-4 w-28 rounded-full"></div>
                        <div class="skeleton-block skeleton-soft h-8 w-4/5 rounded-xl"></div>
                        <div class="skeleton-block skeleton-soft h-4 w-full rounded-full"></div>
                        <div class="skeleton-block skeleton-soft h-4 w-3/4 rounded-full"></div>
                    </div>
                    <div
                        class="skeleton-block skeleton-soft mt-10 h-[58px] w-full rounded-2xl bg-white/35"
                    ></div>
                </div>
                <section class="grid grid-cols-2 flex-1 shrink-0 gap-[14px]">
                    <div
                        v-for="(item, index) in 4"
                        :key="item"
                        class="dashboard-skeleton dashboard-skeleton-card rounded-2xl bg-white p-6"
                        :style="{ '--skeleton-delay': `${index * 120}ms` }"
                    >
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
                        <div
                            v-for="(item, index) in 4"
                            :key="`social-${item}`"
                            class="flex items-center gap-3"
                            :style="{ '--skeleton-delay': `${index * 140}ms` }"
                        >
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
                        <div
                            v-for="(item, index) in 3"
                            :key="`applicant-${item}`"
                            class="flex items-center gap-3"
                            :style="{ '--skeleton-delay': `${index * 160}ms` }"
                        >
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
                        <div
                            v-for="(item, index) in 4"
                            :key="`segment-${item}`"
                            class="flex items-center justify-between"
                            :style="{ '--skeleton-delay': `${index * 110}ms` }"
                        >
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

        <div
            v-else-if="errorMessage"
            class="rounded-2xl border border-desa-orange/20 bg-white p-8 shadow-[0_16px_40px_rgba(38,58,42,0.06)]"
        >
            <div class="flex max-w-[520px] flex-col gap-3">
                <span
                    class="w-fit rounded-full bg-desa-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-desa-orange"
                >
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
            <div
                id="Dashboard-admin"
                v-if="user?.role === 'admin'"
                class="flex flex-col gap-[14px]"
            >
                <div class="flex flex-col gap-1">
                    <h1 class="font-semibold text-2xl">Desa Statistics</h1>
                    <p class="text-sm text-desa-secondary">
                        Ringkasan utama dashboard admin sekarang mengikuti data terbaru dari API.
                    </p>
                </div>
                <div id="Row-1" class="flex gap-[14px]">
                    <div
                        class="flex flex-col w-[calc(389/1000*100%)] rounded-2xl p-6 gap-6 gradient-vertical"
                    >
                        <img
                            src="@/assets/images/icons/gift-orange-background.svg"
                            class="flex size-[86px] shrink-0"
                            alt="icon"
                        />
                        <div class="flex flex-col gap-3">
                            <p class="font-medium text-sm text-desa-lime">— Bantuan Sosial</p>
                            <p class="font-semibold text-2xl leading-[30px] text-white break-words">
                                Ringkasan bantuan sosial desa
                            </p>
                            <p class="text-white">
                                Pantau total pengajuan bansos, event terdekat, dan aktivitas warga
                                dari satu dashboard.
                            </p>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div
                                class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
                            >
                                <p
                                    class="text-xs font-medium uppercase tracking-[0.16em] text-desa-lime"
                                >
                                    Total Bansos
                                </p>
                                <p class="mt-2 text-2xl font-semibold text-white">
                                    {{ formatNumber(socialAssistanceCount) }}
                                </p>
                            </div>
                            <div
                                class="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
                            >
                                <p
                                    class="text-xs font-medium uppercase tracking-[0.16em] text-desa-lime"
                                >
                                    Event Mendatang
                                </p>
                                <p class="mt-2 text-2xl font-semibold text-white">
                                    {{ formatNumber(upcomingEventsCount) }}
                                </p>
                            </div>
                        </div>
                        <RouterLink
                            :to="{ name: 'social-assistance' }"
                            class="flex items-center justify-between rounded-2xl p-4 gap-[10px] bg-white"
                        >
                            <span class="font-medium text-desa-dark-green leading-5"
                                >Lihat Bantuan Sosial</span
                            >
                            <img
                                src="@/assets/images/icons/add-square-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="icon"
                            />
                        </RouterLink>
                    </div>
                    <section id="Statistics" class="grid grid-cols-2 flex-1 shrink-0 gap-[14px]">
                        <div
                            v-for="card in summaryCards"
                            :key="card.key"
                            class="card flex flex-col w-full rounded-2xl p-6 gap-3 bg-white transition-transform duration-200 hover:-translate-y-0.5"
                        >
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-desa-secondary">{{ card.label }}</p>
                                <img
                                    :src="card.icon"
                                    class="flex size-12 shrink-0"
                                    :alt="card.label"
                                />
                            </div>
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(card.value) }}
                                </p>
                                <div class="flex items-center gap-0.5">
                                    <img
                                        src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                        class="flex size-[18px] shrink-0"
                                        alt="icon"
                                    />
                                    <p class="font-medium text-sm text-desa-secondary">
                                        <span class="text-desa-dark-green">{{
                                            formatGrowthLabel(card.growth)
                                        }}</span>
                                        dibanding data sebelumnya
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <div id="Row-2" class="grid grid-cols-[1.05fr,1fr] gap-[14px]">
                    <section id="Bantuan-Sosial" class="flex flex-col rounded-2xl bg-white">
                        <div class="flex flex-col gap-3 p-6">
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-desa-secondary">Bantuan Sosial</p>
                                <img
                                    src="@/assets/images/icons/bag-2-foreshadow-background.svg"
                                    class="flex size-12 shrink-0"
                                    alt="icon"
                                />
                            </div>
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(socialAssistanceCount) }}
                                </p>
                                <div class="flex items-center gap-0.5">
                                    <img
                                        src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                        class="flex size-[18px] shrink-0"
                                        alt="icon"
                                    />
                                    <p class="font-medium text-sm text-desa-secondary">
                                        <span class="text-desa-dark-green">{{
                                            formatGrowthLabel(socialAssistanceGrowth)
                                        }}</span>
                                        dibanding data sebelumnya
                                    </p>
                                </div>
                            </div>
                        </div>
                        <hr class="border-desa-foreshadow" />
                        <div class="flex flex-col gap-4 p-6">
                            <div class="flex items-center justify-between gap-3">
                                <p
                                    class="font-semibold text-[20px] leading-[25px] text-left w-full"
                                >
                                    Bansos Terbaru
                                </p>
                            </div>
                            <div
                                v-if="latestSocialAssistances.length === 0"
                                class="dashboard-empty-state"
                            >
                                Belum ada riwayat bantuan sosial terbaru dari API dashboard.
                            </div>
                            <template v-else>
                                <template
                                    v-for="(item, index) in latestSocialAssistances"
                                    :key="item.id"
                                >
                                    <div class="card flex items-start w-full gap-3">
                                        <div
                                            class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
                                        >
                                            <img
                                                src="@/assets/images/icons/money-dark-green.svg"
                                                class="flex size-9 shrink-0"
                                                alt="icon"
                                            />
                                        </div>
                                        <div class="flex min-w-0 flex-col gap-[6px] w-full">
                                            <div class="flex items-start justify-between gap-3">
                                                <div class="min-w-0">
                                                    <p class="font-semibold text-xl leading-[25px]">
                                                        {{ formatRupiah(item.amount) }}
                                                    </p>
                                                    <p
                                                        class="font-medium text-sm leading-[17.5px] text-desa-secondary line-clamp-1"
                                                    >
                                                        {{
                                                            item.recipient_name ||
                                                            "Penerima tidak tersedia"
                                                        }}
                                                    </p>
                                                </div>
                                                <div
                                                    :class="getStatusConfig(item.status).className"
                                                    class="dashboard-status-badge"
                                                >
                                                    {{ getStatusConfig(item.status).label }}
                                                </div>
                                            </div>
                                            <p
                                                class="font-medium leading-5 line-clamp-1 text-desa-black"
                                            >
                                                {{
                                                    item.social_assistance?.name ||
                                                    "Bantuan sosial tidak diketahui"
                                                }}
                                            </p>
                                            <p class="text-sm leading-[17.5px] text-desa-secondary">
                                                {{ formatToClientTimezone(item.created_at) }}
                                            </p>
                                        </div>
                                    </div>
                                    <hr
                                        v-if="index < latestSocialAssistances.length - 1"
                                        class="border-desa-foreshadow"
                                    />
                                </template>
                            </template>
                        </div>
                    </section>
                    <section id="Event" class="flex flex-col rounded-2xl bg-white">
                        <div class="flex flex-col gap-4 p-6">
                            <div class="flex items-center justify-between">
                                <p class="font-medium text-desa-secondary">Upcoming Events</p>
                                <img :src="calendarIcon" class="flex size-12 shrink-0" alt="icon" />
                            </div>
                            <div class="rounded-2xl bg-desa-background p-4">
                                <p class="text-sm font-medium text-desa-secondary">
                                    {{ formatNumber(upcomingEventsCount) }} event mendatang tercatat
                                    di dashboard.
                                </p>
                            </div>
                        </div>
                        <hr class="border-desa-foreshadow" />
                        <div id="Events" class="flex flex-col flex-1 gap-4 p-6">
                            <div
                                v-if="upcomingEvents.length === 0"
                                class="dashboard-empty-state h-[365px] justify-center"
                            >
                                Belum ada event mendatang.
                            </div>
                            <template v-else>
                                <template
                                    v-for="(eventItem, index) in upcomingEvents"
                                    :key="eventItem.id"
                                >
                                    <div
                                        class="event-card flex items-start gap-4 rounded-2xl border border-desa-background p-4"
                                    >
                                        <div
                                            class="flex w-[110px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow"
                                        >
                                            <img
                                                :src="getThumbnail(eventItem.thumbnail)"
                                                class="w-full h-full object-cover"
                                                alt="thumbnails"
                                                @error="handleImageError($event, fallbackThumbnail)"
                                            />
                                        </div>
                                        <div class="flex min-w-0 flex-1 flex-col gap-[6px]">
                                            <div class="flex items-start justify-between gap-3">
                                                <p
                                                    class="font-semibold text-xl leading-[25px] line-clamp-2"
                                                >
                                                    {{ eventItem.name || "Event desa" }}
                                                </p>
                                                <span
                                                    class="rounded-full bg-desa-foreshadow px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-desa-dark-green"
                                                >
                                                    {{
                                                        eventItem.is_active === false
                                                            ? "Closed"
                                                            : "Upcoming"
                                                    }}
                                                </span>
                                            </div>
                                            <p class="font-medium text-sm text-desa-secondary">
                                                {{ getEventSchedule(eventItem) }}
                                            </p>
                                            <p
                                                v-if="
                                                    eventItem.price !== null &&
                                                    eventItem.price !== undefined
                                                "
                                                class="font-semibold leading-5 text-desa-red"
                                            >
                                                {{ formatRupiah(eventItem.price) }}
                                            </p>
                                        </div>
                                    </div>
                                    <hr
                                        v-if="index < upcomingEvents.length - 1"
                                        class="border-desa-foreshadow"
                                    />
                                </template>
                            </template>
                        </div>
                    </section>
                </div>
                <div id="Row-3" class="grid grid-cols-[1.35fr,1fr] gap-[14px]">
                    <section id="Total-Aplicants" class="flex flex-col gap-[14px]">
                        <div class="flex flex-col flex-1 shrink-0 rounded-2xl bg-white">
                            <div class="flex flex-col gap-3 p-6">
                                <div class="flex items-center justify-between">
                                    <p class="font-medium text-desa-secondary">Total Applicants</p>
                                    <img
                                        src="@/assets/images/icons/document-text-foreshadow-background.svg"
                                        class="flex size-12 shrink-0"
                                        alt="icon"
                                    />
                                </div>
                                <div class="flex flex-col gap-[6px]">
                                    <p class="font-semibold text-[32px] leading-10">
                                        {{ formatNumber(adminDevelopmentApplicantsCount) }}
                                    </p>
                                    <div class="flex items-center gap-0.5">
                                        <img
                                            src="@/assets/images/icons/trend-up-dark-green-fill.svg"
                                            class="flex size-[18px] shrink-0"
                                            alt="icon"
                                        />
                                        <p class="font-medium text-sm text-desa-secondary">
                                            <span class="text-desa-dark-green">{{
                                                formatGrowthLabel(adminDevelopmentApplicantsGrowth)
                                            }}</span>
                                            dibanding data sebelumnya
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <hr class="border-desa-foreshadow" />
                            <div class="flex flex-col gap-4 p-6">
                                <p
                                    class="font-semibold text-[20px] leading-[25px] text-left w-full"
                                >
                                    Applicant Terakhir
                                </p>
                                <div
                                    v-if="adminDevelopmentApplicants.length === 0"
                                    class="dashboard-empty-state min-h-[280px] justify-center"
                                >
                                    Belum ada pelamar pembangunan terbaru dari API dashboard.
                                </div>
                                <template v-else>
                                    <template
                                        v-for="(item, index) in adminDevelopmentApplicants"
                                        :key="item.id"
                                    >
                                        <div class="card flex items-start w-full gap-3">
                                            <div
                                                class="flex size-[72px] shrink-0 rounded-2xl bg-desa-foreshadow overflow-hidden"
                                            >
                                                <img
                                                    :src="getThumbnail(item.development?.thumbnail)"
                                                    class="w-full h-full object-cover"
                                                    alt="icon"
                                                    @error="
                                                        handleImageError($event, fallbackThumbnail)
                                                    "
                                                />
                                            </div>
                                            <div class="flex min-w-0 flex-col gap-[6px] w-full">
                                                <div class="flex items-center gap-[6px]">
                                                    <div
                                                        class="flex size-8 rounded-full overflow-hidden bg-desa-foreshadow"
                                                    >
                                                        <img
                                                            :src="
                                                                getProfilePicture(
                                                                    item.user?.profile_picture,
                                                                )
                                                            "
                                                            class="w-full h-full object-cover"
                                                            alt="icon"
                                                            @error="
                                                                handleImageError(
                                                                    $event,
                                                                    fallbackProfilePicture,
                                                                )
                                                            "
                                                        />
                                                    </div>
                                                    <p
                                                        class="font-medium text-base leading-5 line-clamp-1"
                                                    >
                                                        {{ item.user?.name || "Warga desa" }}
                                                    </p>
                                                </div>
                                                <span
                                                    class="font-semibold text-lg leading-[22.5px] line-clamp-1"
                                                >
                                                    {{
                                                        item.development?.name ||
                                                        "Pembangunan desa tidak diketahui"
                                                    }}
                                                </span>
                                                <p class="font-medium text-sm text-desa-secondary">
                                                    {{ formatToClientTimezone(item.created_at) }}
                                                </p>
                                            </div>
                                            <div
                                                :class="getStatusConfig(item.status).className"
                                                class="dashboard-status-badge"
                                            >
                                                {{ getStatusConfig(item.status).label }}
                                            </div>
                                        </div>
                                        <hr
                                            v-if="index < adminDevelopmentApplicants.length - 1"
                                            class="border-desa-foreshadow"
                                        />
                                    </template>
                                </template>
                            </div>
                        </div>
                        <div
                            class="flex items-center justify-between h-[125px] rounded-2xl p-8 gap-4 gradient-horizontal"
                        >
                            <div class="flex flex-col gap-[6px]">
                                <p class="font-medium text-sm text-desa-lime">
                                    — Snapshot Penduduk
                                </p>
                                <p class="font-semibold text-2xl text-white text-nowrap">
                                    Demografi desa aktif
                                </p>
                                <p class="text-sm text-white">{{ populationSnapshot }}</p>
                            </div>
                            <div
                                class="flex items-center flex-nowrap rounded-2xl p-4 gap-[10px] bg-white"
                            >
                                <span class="font-medium text-desa-dark-green"
                                    >{{ formatNumber(totalResidents) }} Penduduk</span
                                >
                                <img
                                    src="@/assets/images/icons/profile-2user-dark-green.svg"
                                    class="flex size-6 shrink-0"
                                    alt="icon"
                                />
                            </div>
                        </div>
                    </section>
                    <section
                        id="statistik-Penduduk"
                        class="flex flex-col flex-1 shrink-0 gap-4 p-6 rounded-2xl bg-white"
                    >
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-desa-secondary">Statistics Penduduk</p>
                            <img
                                src="@/assets/images/icons/profile-2user-foreshadow-background.svg"
                                class="flex size-12 shrink-0"
                                alt="icon"
                            />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div
                                v-for="item in genderHighlights"
                                :key="item.key"
                                class="rounded-2xl border border-desa-background bg-desa-background/50 p-4"
                            >
                                <p
                                    class="mb-2 flex items-center gap-2 text-sm font-medium text-desa-secondary"
                                >
                                    <span
                                        class="block size-2 rounded-full"
                                        :style="{ backgroundColor: item.color }"
                                    ></span>
                                    {{ item.label }}
                                </p>
                                <p class="text-2xl font-semibold leading-8 text-desa-black">
                                    {{ formatNumber(item.count) }}
                                </p>
                                <p class="mt-1 text-sm leading-[17.5px] text-desa-secondary">
                                    {{ item.description }}
                                </p>
                            </div>
                        </div>
                        <div class="relative">
                            <div
                                class="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
                            >
                                <p class="font-semibold text-[32px] leading-10">
                                    {{ formatNumber(totalResidents) }}
                                </p>
                                <p class="font-medium text-sm text-desa-secondary">
                                    Jumlah Penduduk
                                </p>
                            </div>
                            <canvas
                                v-if="hasResidentSegments"
                                ref="residentChart"
                                class="mx-auto size-[288px]"
                            ></canvas>
                            <div
                                v-else
                                class="mx-auto flex size-[288px] items-center justify-center rounded-full border border-dashed border-desa-foreshadow bg-desa-background/40 p-10 text-center text-sm leading-6 text-desa-secondary"
                            >
                                Rincian kelompok usia penduduk belum tersedia dari API dashboard.
                            </div>
                        </div>
                        <div v-if="hasResidentSegments" class="flex flex-col gap-4">
                            <template
                                v-for="(segment, index) in residentSegments"
                                :key="segment.label"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex flex-col gap-1">
                                        <p class="font-medium leading-5 flex">
                                            <span
                                                class="my-auto mr-[6px] block size-2 rounded-full"
                                                :style="{ backgroundColor: segment.color }"
                                            ></span>
                                            {{ segment.label }}
                                        </p>
                                        <p class="font-medium text-sm text-desa-secondary">
                                            {{ segment.description }}
                                        </p>
                                    </div>
                                    <p class="flex items-center font-medium leading-5">
                                        {{ formatNumber(segment.value) }}
                                        <img
                                            src="@/assets/images/icons/user-black.svg"
                                            class="flex size-[18px] shrink-0 ml-0.5"
                                            alt="icon"
                                        />
                                    </p>
                                </div>
                                <hr
                                    v-if="index < residentSegments.length - 1"
                                    class="border-desa-foreshadow"
                                />
                            </template>
                        </div>
                        <div
                            v-else
                            class="rounded-2xl border border-dashed border-desa-foreshadow bg-desa-background/30 p-4 text-sm leading-6 text-desa-secondary"
                        >
                            Detail kelompok usia akan tampil otomatis ketika API mengirimkan data
                            demografi penduduk.
                        </div>
                    </section>
                </div>
            </div>
            <div
                id="Dashboard-kepala-keluarga"
                v-if="user?.role === 'head-of-family'"
                class="flex flex-col gap-[14px]"
            >
                <header>
                    <h1 class="font-semibold text-2xl leading-[30px]">Rumah Tangga Stats</h1>
                </header>
                <div
                    v-if="loading && hasDashboardData"
                    class="inline-flex items-center gap-2 rounded-full border border-desa-foreshadow bg-white px-4 py-2 text-sm text-desa-secondary w-fit"
                >
                    <span class="size-2 rounded-full bg-desa-soft-green loading-dot"></span>
                    Memuat data rumah tangga
                </div>
                <div class="flex gap-[14px]">
                    <div class="flex flex-col gap-[14px] shrink-0 w-[calc(463/1000*100%)]">
                        <section
                            id="Bantuan-Sosial"
                            class="flex flex-col gap-6 p-6 gradient-vertical rounded-2xl"
                        >
                            <img
                                src="@/assets/images/icons/bag-orange-background.svg"
                                alt="icon"
                                class="size-[86px] shrink-0"
                            />
                            <div class="flex flex-col gap-[12px]">
                                <h2 class="font-medium text-sm leading-[17.5px] text-[#DEFF6E]">
                                    — Bantuan Sosial
                                </h2>
                                <h3 class="font-semibold text-2xl leading-[30px] text-white">
                                    Dari Desa Untuk Warga ❤️
                                </h3>
                                <p class="leading-6 text-white">
                                    Terima bantuan sosial dari desa yang tepat untuk kebutuhan
                                    spesifikmu setiap saat.
                                </p>
                            </div>
                            <RouterLink :to="{ name: 'social-assistance' }">
                                <div
                                    class="flex items-center justify-between px-4 py-[18px] bg-white rounded-2xl"
                                >
                                    <p class="font-medium leading-5 text-desa-dark-green">
                                        Ajukan Bantuan Sosial
                                    </p>
                                    <img
                                        src="@/assets/images/icons/add-square-dark-green.svg"
                                        alt="icon"
                                        class="size-6 shrink-0"
                                    />
                                </div>
                            </RouterLink>
                        </section>
                        <section
                            id="Events-Joined"
                            class="flex flex-col gap-6 p-6 bg-white rounded-2xl"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">{{
                                        eventParticipantsCount
                                    }}</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">
                                        Events Joined
                                    </h2>
                                </div>
                                <div
                                    class="p-[12px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0"
                                >
                                    <img
                                        src="@/assets/images/icons/calendar-2-dark-green.svg"
                                        alt="icon"
                                        class="size-6 shrink-0"
                                    />
                                </div>
                            </div>
                            <hr class="border-desa-background" />
                            <div id="Recent-Event" class="flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">
                                    Recent Events
                                </h3>
                                <div
                                    v-if="isEventParticipantsInitialLoading"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                                >
                                    Memuat data event...
                                </div>
                                <div
                                    v-else-if="eventParticipants.length === 0"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                                >
                                    Belum ada event yang diikuti.
                                </div>
                                <div
                                    class="event py-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                    v-for="data in eventParticipants"
                                    :key="data.id"
                                >
                                    <div class="time px-4 flex items-center justify-between">
                                        <p
                                            class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                        >
                                            {{
                                                formatDateWithDay(data.event.date) +
                                                ", " +
                                                data.event.time
                                            }}
                                        </p>
                                        <img
                                            src="@/assets/images/icons/calendar-2-secondary-green.svg"
                                            alt="icon"
                                            class="size-[18px] shrink-0"
                                        />
                                    </div>
                                    <hr class="border-desa-background mx-4" />
                                    <div class="card px-4 flex items-center gap-3">
                                        <div
                                            class="flex items-center justify-center w-[100px] h-[80px] shrink-0 rounded-2xl overflow-auto"
                                        >
                                            <img
                                                :src="getThumbnail(data.event?.thumbnail)"
                                                alt="image"
                                                class="w-full h-full object-cover"
                                                @error="handleImageError($event, fallbackThumbnail)"
                                            />
                                        </div>
                                        <div class="flex flex-col gap-[6px] w-full">
                                            <h4
                                                class="font-semibold text-lg leading-[22.5px] line-clamp-1"
                                            >
                                                {{ data.event.name }}
                                            </h4>
                                            <div class="flex items-center gap-1">
                                                <img
                                                    src="@/assets/images/icons/profile-2user-orange.svg"
                                                    alt="icon"
                                                    class="size-[18px] shrink-0"
                                                />
                                                <p
                                                    class="font-semibold text-sm leading-[17.5px] text-desa-orange"
                                                >
                                                    {{ data.event.participants_count }}
                                                </p>
                                                <p
                                                    class="font-semibold text-sm leading-[17.5px] text-desa-orange line-clamp-1"
                                                >
                                                    total partisipasi
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div class="harga-event px-4 flex items-center justify-between">
                                        <p
                                            class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                        >
                                            Harga Event:
                                        </p>
                                        <p class="font-medium leading-5 text-desa-red">
                                            {{ formatRupiah(data.event.price) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section
                            id="Pembangunan"
                            class="flex flex-col gap-6 p-6 bg-white rounded-2xl"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]"
                                        >{{ developmentApplicantsCount }} Applicants</strong
                                    >
                                    <h2 class="font-medium leading-5 text-desa-secondary">
                                        Pembangunan
                                    </h2>
                                </div>
                                <div
                                    class="p-[12px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0"
                                >
                                    <img
                                        src="@/assets/images/icons/calendar-2-dark-green.svg"
                                        alt="icon"
                                        class="size-6 shrink-0"
                                    />
                                </div>
                            </div>
                            <hr class="border-desa-background" />
                            <div id="Recent-Applicants" class="flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">
                                    Recent Applicants
                                </h3>
                                <div
                                    v-if="isDevelopmentApplicantsInitialLoading"
                                    class="applicant p-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                >
                                    Memuat data pembangunan...
                                </div>
                                <div
                                    v-else-if="developmentApplicants.length === 0"
                                    class="applicant p-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                >
                                    Belum ada lamaran pembangunan.
                                </div>
                                <div
                                    class="applicant p-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                    v-for="data in developmentApplicants"
                                    :key="data.id"
                                >
                                    <div class="flex items-center justify-between">
                                        <div
                                            class="flex items-center justify-center w-[100px] h-[80px] shrink-0 rounded-2xl overflow-hidden"
                                        >
                                            <img
                                                :src="getThumbnail(data.development?.thumbnail)"
                                                alt="image"
                                                class="size-full shrink-0 object-cover"
                                                @error="handleImageError($event, fallbackThumbnail)"
                                            />
                                        </div>
                                        <div
                                            :class="getStatusConfig(data.status).className"
                                            class="rounded-full py-[12px] w-[100px] flex justify-center text-white font-semibold text-xs leading-[15px] shrink-0 uppercase"
                                        >
                                            {{ getStatusConfig(data.status).label }}
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <h5
                                            class="font-semibold text-lg leading-[22.5px] line-clamp-1"
                                        >
                                            {{ data.development.name }}
                                        </h5>
                                        <div class="flex gap-1">
                                            <p class="font-medium leading-5 text-desa-secondary">
                                                Penanggung Jawab:
                                            </p>
                                            <p class="font-semibold leading-5 text-desa-dark-green">
                                                {{ data.development.person_in_charge }}
                                            </p>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div
                                        id="Tanggal-Pelaksanaan"
                                        class="flex items-center gap-[12px]"
                                    >
                                        <div
                                            class="size-[48px] shrink-0 rounded-full bg-desa-foreshadow flex items-center justify-center"
                                        >
                                            <img
                                                src="@/assets/images/icons/calendar-2-dark-green.svg"
                                                alt="icon"
                                                class="size-6 shrink-0"
                                            />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">
                                                {{ formatDateWithDay(data.development.start_date) }}
                                            </p>
                                            <h6
                                                class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                            >
                                                Tanggal Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div
                                        id="Waktu-Pelaksanaan"
                                        class="flex items-center gap-[12px]"
                                    >
                                        <div
                                            class="size-[48px] shrink-0 rounded-full bg-desa-foreshadow flex items-center justify-center"
                                        >
                                            <img
                                                src="@/assets/images/icons/timer-dark-green.svg"
                                                alt="icon"
                                                class="size-6 shrink-0"
                                            />
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <p class="font-semibold leading-5 text-desa-dark-green">
                                                {{ data.development.days_needed }} Hari
                                            </p>
                                            <h6
                                                class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                            >
                                                Waktu Pelaksanaan
                                            </h6>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                    <div class="flex flex-col gap-[14px] flex-1">
                        <section
                            id="Anggota-Keluarga"
                            class="flex flex-col gap-6 p-6 bg-white rounded-2xl"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]">{{
                                        familyMembersCount
                                    }}</strong>
                                    <h2 class="font-medium leading-5 text-desa-secondary">
                                        Anggota Keluarga
                                    </h2>
                                </div>
                                <div
                                    class="p-[16px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0"
                                >
                                    <img
                                        src="@/assets/images/icons/profile-2user-dark-green.svg"
                                        alt="icon"
                                        class="size-6 shrink-0"
                                    />
                                </div>
                            </div>
                            <div class="box h-[1px] w-full"></div>
                            <div
                                v-if="isFamilyMembersInitialLoading"
                                class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                            >
                                Memuat data anggota keluarga...
                            </div>
                            <div
                                v-else-if="familyMembers.length === 0"
                                class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                            >
                                Belum ada data anggota keluarga.
                            </div>
                            <div
                                v-for="familyMember in familyMembers"
                                :key="familyMember.id"
                                class="people flex flex-col gap-[14px]"
                            >
                                <div
                                    class="rounded-2xl border border-desa-background p-4 flex flex-col gap-6"
                                >
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-[12px]">
                                            <div
                                                class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow"
                                            >
                                                <img
                                                    :src="
                                                        getProfilePicture(
                                                            familyMember.profile_picture,
                                                        )
                                                    "
                                                    class="w-full h-full object-cover"
                                                    alt="photo"
                                                    @error="
                                                        handleImageError(
                                                            $event,
                                                            fallbackProfilePicture,
                                                        )
                                                    "
                                                />
                                            </div>
                                            <div class="flex flex-col gap-[6px]">
                                                <h4
                                                    class="font-semibold text-lg leading-[22.5px] line-clamp-1"
                                                >
                                                    {{ familyMember.user?.name }}
                                                </h4>
                                                <div class="flex items-center gap-1">
                                                    <img
                                                        src="@/assets/images/icons/briefcase-secondary-green.svg"
                                                        alt="icon"
                                                        class="size-[18px] shrink-0"
                                                    />
                                                    <p
                                                        class="font-medium leading-5 text-desa-secondary line-clamp-1"
                                                    >
                                                        {{ familyMember.occupation }}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="font-medium leading-5">
                                            {{ familyMember.age }} tahun
                                        </p>
                                    </div>
                                    <hr class="border-desa-foreshadow" />
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-1">
                                            <img
                                                src="@/assets/images/icons/keyboard-secondary-green.svg"
                                                alt="icon"
                                                class="size-[18px] shrink-0"
                                            />
                                            <p
                                                class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                            >
                                                Nomor Induk Kependudukan:
                                            </p>
                                        </div>
                                        <p class="font-medium leading-5">
                                            {{ familyMember.identity_number }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <a href="kk-anggota-keluarga.html">
                                <div
                                    class="rounded-2xl py-[18px] bg-desa-dark-green flex justify-center items-center"
                                >
                                    <p class="font-medium leading-5 text-white">View Details</p>
                                </div>
                            </a>
                        </section>
                        <section
                            id="Pengajuan-Bantuan-Sosial"
                            class="flex flex-col gap-6 p-6 bg-white rounded-2xl"
                        >
                            <div class="flex items-center justify-between">
                                <div class="flex flex-col gap-[6px]">
                                    <strong class="font-semibold text-[32px] leading-[40px]"
                                        >{{ socialAssistanceRecipientsCount }} Pengajuan</strong
                                    >
                                    <h2 class="font-medium leading-5 text-desa-secondary">
                                        Bantuan Sosial
                                    </h2>
                                </div>
                                <div
                                    class="p-[16px] rounded-full flex justify-center items-center bg-desa-foreshadow shrink-0"
                                >
                                    <img
                                        src="@/assets/images/icons/note-dark-green.svg"
                                        alt="icon"
                                        class="size-6 shrink-0"
                                    />
                                </div>
                            </div>
                            <div class="box h-[1px] w-full"></div>
                            <div class="people flex flex-col gap-4">
                                <h3 class="font-medium leading-5 text-desa-secondary">
                                    Recent Bansos
                                </h3>
                                <div
                                    v-if="isSocialAssistanceRecipientsInitialLoading"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                                >
                                    Memuat data bantuan sosial...
                                </div>
                                <div
                                    v-else-if="socialAssistanceRecipients.length === 0"
                                    class="rounded-2xl border border-desa-background p-4 text-sm text-desa-secondary"
                                >
                                    Belum ada pengajuan bantuan sosial.
                                </div>
                                <div
                                    v-for="data in socialAssistanceRecipients"
                                    :key="data.id"
                                    class="bantuan p-4 rounded-2xl border border-desa-background flex flex-col gap-4"
                                >
                                    <div class="flex items-center justify-between">
                                        <p
                                            class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                        >
                                            {{ formatToClientTimezone(data.created_at) }}
                                        </p>
                                        <img
                                            src="@/assets/images/icons/calendar-2-secondary-green.svg"
                                            alt="icon"
                                            class="size-[18px] shrink-0"
                                        />
                                    </div>
                                    <hr class="border-desa-background" />
                                    <h4 class="font-semibold text-lg leading-[22.5px]">
                                        {{ data.social_assistance.name }}
                                    </h4>
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <div
                                                class="size-[52px] shrink-0 rounded-2xl flex justify-center items-center bg-desa-foreshadow"
                                            >
                                                <img
                                                    src="@/assets/images/icons/money-dark-green.svg"
                                                    alt="icon"
                                                    class="size-6 shrink-0"
                                                />
                                            </div>
                                            <div class="flex flex-col gap-[6px]">
                                                <h5 class="font-semibold text-lg leading-[22.5px]">
                                                    {{
                                                        formatRupiah(data.social_assistance.amount)
                                                    }}
                                                </h5>
                                                <p
                                                    class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                                >
                                                    Total Bansos
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            :class="getStatusConfig(data.status).className"
                                            class="rounded-full py-[12px] w-[100px] flex justify-center text-white font-semibold text-xs leading-[15px] shrink-0 uppercase"
                                        >
                                            {{ getStatusConfig(data.status).label }}
                                        </div>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div class="flex items-center justify-between">
                                        <p
                                            class="font-medium text-sm leading-[17.5px] text-desa-secondary"
                                        >
                                            Nominal Pengajuan:
                                        </p>
                                        <p class="font-medium leading-5 text-desa-red">
                                            {{ formatRupiah(data.amount) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section
                            id="Unduh-Rumah-Tangga-Stat"
                            class="rounded-2xl gradient-horizontal pt-[32px] px-[32px] pb-[34px] flex flex-col gap-[32px]"
                        >
                            <div class="flex items-center gap-4">
                                <img
                                    src="@/assets/images/icons/document-download-orange-background.svg"
                                    alt="icon"
                                    class="size-[86px] shrink-0"
                                />
                                <div class="flex flex-col gap-[6px]">
                                    <h2 class="font-medium text-sm leading-[17.5px] text-desa-lime">
                                        — Unduh Rumah Tangga Stat
                                    </h2>
                                    <strong class="font-semibold text-2xl leading-[30px] text-white"
                                        >Statistik Rumah Tangga</strong
                                    >
                                </div>
                            </div>
                            <button
                                type="button"
                                class="flex items-center justify-between px-4 py-[18px] bg-white rounded-2xl"
                            >
                                <p class="font-medium leading-5 text-desa-dark-green">
                                    Download Laporan
                                </p>
                                <img
                                    src="@/assets/images/icons/receive-square-dark-green.svg"
                                    alt="icon"
                                    class="size-6 shrink-0"
                                />
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
        radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0) 42%,
            rgba(111, 132, 121, 0.14) 43%,
            rgba(111, 132, 121, 0.14) 56%,
            rgba(255, 255, 255, 0) 57%
        ),
        conic-gradient(
            from 120deg,
            rgba(52, 97, 58, 0.12),
            rgba(142, 189, 85, 0.22),
            rgba(250, 113, 57, 0.18),
            rgba(251, 173, 72, 0.2),
            rgba(52, 97, 58, 0.12)
        );
    box-shadow: inset 0 0 0 1px rgba(111, 132, 121, 0.08);
}

.skeleton-ring::before {
    content: "";
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
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.08) 12%,
        rgba(255, 255, 255, 0.58) 50%,
        rgba(255, 255, 255, 0.08) 88%,
        transparent 100%
    );
    animation: shimmer 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--skeleton-delay, 0ms);
}

.loading-dot {
    animation: pulse 1.2s ease-in-out infinite;
}

.dashboard-skeleton::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.32), transparent 35%);
    opacity: 0.85;
}

.dashboard-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    border: 1px dashed rgba(142, 189, 85, 0.45);
    border-radius: 1rem;
    background: rgba(241, 250, 230, 0.4);
    padding: 1.5rem;
    text-align: center;
    color: rgb(90 122 126);
}

.dashboard-status-badge {
    display: flex;
    width: 100px;
    flex-shrink: 0;
    justify-content: center;
    border-radius: 9999px;
    padding: 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    text-transform: uppercase;
    color: white;
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
