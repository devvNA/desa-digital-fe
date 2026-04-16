<script setup>
import calendarIcon from "@/assets/images/icons/calendar-2-dark-green.svg";
import emptyIcon from "@/assets/images/icons/empty-secondary-green.svg";
import moneyIcon from "@/assets/images/icons/money-dark-green.svg";
import participantsIcon from "@/assets/images/icons/profile-2user-blue.svg";
import profileIcon from "@/assets/images/icons/profile-secondary-green.svg";
import receiveSquareIcon from "@/assets/images/icons/receive-square-2-dark-green.svg";
import sendSquareIcon from "@/assets/images/icons/send-square-2-red.svg";
import ticketIcon from "@/assets/images/icons/ticket-secondary-green.svg";
import ticketPriceIcon from "@/assets/images/icons/ticket-2-red.svg";
import ownerIcon from "@/assets/images/icons/user-square-secondary-green-bold.svg";
import { formatDateWithDay, formatRupiah } from "@/helpers/format";
import {
    fallbackThumbnail,
    formatRecipientsCount,
    getStatusConfig,
    getThumbnail,
    handleImageError,
} from "@/helpers/socialAssistance";
import { useSearchStore } from "@/stores/search";
import { storeToRefs } from "pinia";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

defineOptions({
    name: "SearchView",
});

const defaultSearchTab = "socialAssistance";

const getReadableErrorMessage = (value) => {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return value;
    }

    if (value?.message) {
        return value.message;
    }

    if (typeof value === "object") {
        const firstMessage = Object.values(value)
            .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
            .find(Boolean);

        return firstMessage ?? "Pencarian gagal dimuat.";
    }

    return "Pencarian gagal dimuat.";
};

const getSearchQueryFromRoute = (route) => {
    return typeof route.query.q === "string"
        ? route.query.q.trim()
        : typeof route.query.keyword === "string"
          ? route.query.keyword.trim()
          : "";
};

const getRecipientStatusTextClass = (status) => {
    return status === "approved" ? "text-desa-dark-green" : "text-desa-red";
};

const getEventAvailabilityTextClass = (isActive) => {
    return isActive ? "text-desa-dark-green" : "text-desa-red";
};

const searchTabs = [
    {
        key: "socialAssistance",
        label: "List Bansos",
        responseKey: "social_assistances",
        normalizeItem: (item) => ({
            id: item?.id ?? item?.name ?? "social-assistance-result",
            detailRouteName: "manage-social-assistance",
            image: getThumbnail(item?.thumbnail),
            title: item?.name ?? "-",
            meta: {
                icon: profileIcon,
                value: item?.provider ?? "-",
                valueClass: "text-desa-secondary",
            },
            stats: [
                {
                    icon: moneyIcon,
                    iconBackgroundClass: "bg-desa-foreshadow",
                    value: formatRupiah(item?.amount),
                    valueClass: "text-desa-dark-green",
                    label: "Uang Tunai",
                },
                {
                    icon: sendSquareIcon,
                    iconBackgroundClass: "bg-desa-red/10",
                    value: formatRupiah(item?.remaining_amount),
                    valueClass: "text-desa-red",
                    label: "Bansos Tersisa",
                },
                {
                    icon: participantsIcon,
                    iconBackgroundClass: "bg-desa-blue/10",
                    value: formatRecipientsCount(item?.total_recipients),
                    valueClass: "text-desa-blue",
                    label: "Total Pengajuan",
                },
            ],
        }),
    },
    {
        key: "submission",
        label: "Pengajuan Bansos",
        responseKey: "social_assistance_recipients",
        normalizeItem: (item) => ({
            id: item?.id ?? item?.social_assistance?.id ?? "submission-result",
            detailRouteName: "manage-social-assistance-recipient",
            image: getThumbnail(item?.social_assistance?.thumbnail),
            title: item?.social_assistance?.name ?? "-",
            meta: {
                icon: profileIcon,
                prefix: "Status:",
                value: getStatusConfig(item?.status).label,
                valueClass: getRecipientStatusTextClass(item?.status),
            },
            stats: [
                {
                    icon: moneyIcon,
                    iconBackgroundClass: "bg-desa-foreshadow",
                    value: formatRupiah(item?.amount),
                    valueClass: "text-desa-dark-green",
                    label: "Nominal Pengajuan",
                },
                {
                    icon: item.status === "approved" ? receiveSquareIcon : sendSquareIcon,
                    iconBackgroundClass:
                        item.status === "approved" ? "bg-desa-foreshadow" : "bg-desa-red/10",
                    value: getStatusConfig(item?.status).label,
                    valueClass: getRecipientStatusTextClass(item?.status),
                    label: "Status Saat Ini",
                },
                {
                    icon: calendarIcon,
                    iconBackgroundClass: "bg-desa-blue/10",
                    value: formatDateWithDay(item?.created_at),
                    valueClass: "text-desa-blue",
                    label: "Tanggal Pengajuan",
                },
            ],
        }),
    },
    {
        key: "development",
        label: "Pembangunan",
        responseKey: "developments",
        normalizeItem: (item) => ({
            id: item?.id ?? item?.name ?? "development-result",
            detailRouteName: "manage-development",
            image: getThumbnail(item?.thumbnail),
            title: item?.name ?? "-",
            meta: {
                icon: ownerIcon,
                prefix: "Penanggung Jawab:",
                value: item?.person_in_charge ?? "-",
                valueClass: "text-desa-dark-green",
            },
            stats: [
                {
                    icon: sendSquareIcon,
                    iconBackgroundClass: "bg-desa-red/10",
                    value: formatRupiah(item?.amount),
                    valueClass: "text-desa-red",
                    label: "Dana Pembangunan",
                },
                {
                    icon: participantsIcon,
                    iconBackgroundClass: "bg-desa-blue/10",
                    value: formatRecipientsCount(item?.total_applicants),
                    valueClass: "text-desa-blue",
                    label: "Total Pelamar",
                },
                {
                    icon: calendarIcon,
                    iconBackgroundClass: "bg-desa-foreshadow",
                    value: formatDateWithDay(item?.start_date),
                    valueClass: "text-desa-dark-green",
                    label: "Tanggal Pelaksanaan",
                },
            ],
        }),
    },
    {
        key: "event",
        label: "Event Desa",
        responseKey: "events",
        normalizeItem: (item) => ({
            id: item?.id ?? item?.name ?? "event-result",
            detailRouteName: "manage-event",
            image: getThumbnail(item?.thumbnail),
            title: item?.name ?? "-",
            meta: {
                icon: ticketIcon,
                prefix: "Registration:",
                value: item?.is_active ? "Open" : "Closed",
                valueClass: getEventAvailabilityTextClass(Boolean(item?.is_active)),
            },
            stats: [
                {
                    icon: ticketPriceIcon,
                    iconBackgroundClass: "bg-desa-red/10",
                    value: formatRupiah(item?.price),
                    valueClass: "text-desa-red",
                    label: "Harga Event",
                },
                {
                    icon: participantsIcon,
                    iconBackgroundClass: "bg-desa-blue/10",
                    value: formatRecipientsCount(item?.total_participants),
                    valueClass: "text-desa-blue",
                    label: "Total Partisipasi",
                },
                {
                    icon: calendarIcon,
                    iconBackgroundClass: "bg-desa-foreshadow",
                    value: formatDateWithDay(item?.date),
                    valueClass: "text-desa-dark-green",
                    label: "Tanggal Pelaksanaan",
                },
            ],
        }),
    },
];

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();
const { error, loading, searchResults } = storeToRefs(searchStore);

const searchKeyword = computed(() => getSearchQueryFromRoute(route));
const hasSearchKeyword = computed(() => searchKeyword.value.length > 0);
const activeSearchTab = computed(() => {
    const routeTab = typeof route.query.tab === "string" ? route.query.tab : defaultSearchTab;

    return searchTabs.some((tab) => tab.key === routeTab) ? routeTab : defaultSearchTab;
});
const normalizedSearchSections = computed(() => {
    return Object.fromEntries(
        searchTabs.map((tab) => {
            const section = searchResults.value?.[tab.responseKey] ?? {};
            const items = Array.isArray(section?.data) ? section.data.map(tab.normalizeItem) : [];
            const total = Number(section?.total);

            return [
                tab.key,
                {
                    total: Number.isFinite(total) ? total : items.length,
                    items,
                },
            ];
        }),
    );
});
const activeSearchSection = computed(() => {
    return normalizedSearchSections.value[activeSearchTab.value] ?? { total: 0, items: [] };
});
const activeSearchResults = computed(() => activeSearchSection.value.items ?? []);
const activeSearchTotal = computed(
    () => activeSearchSection.value.total ?? activeSearchResults.value.length,
);
const errorMessage = computed(() => getReadableErrorMessage(error.value));
const hasError = computed(() => Boolean(errorMessage.value));
const emptyStateMessage = computed(() => {
    if (!hasSearchKeyword.value) {
        return "Masukkan kata kunci untuk melihat hasil pencarian";
    }

    if (hasError.value) {
        return errorMessage.value;
    }

    return "Pencarian tidak ditemukan";
});

const handleTabChange = (tabKey) => {
    router.replace({
        name: "search",
        query: {
            q: searchKeyword.value,
            tab: tabKey,
        },
    });
};

const handleViewDetails = (item) => {
    if (!item?.id || !item?.detailRouteName) {
        return;
    }

    router.push({
        name: item.detailRouteName,
        params: {
            id: item.id,
        },
    });
};

watch(
    () => searchKeyword.value,
    async (keyword) => {
        if (!keyword) {
            searchStore.resetSearch();
            return;
        }

        await searchStore.fetchSearchResults(keyword);
    },
    { immediate: true },
);
</script>

<template>
    <div id="Content" class="relative flex w-full flex-1 shrink-0 flex-col gap-6">
        <div id="Header" class="flex flex-col gap-6">
            <h1 class="text-[32px] font-bold leading-10">
                Search Result<span v-if="searchKeyword">: {{ searchKeyword }}</span>
            </h1>
            <div
                id="Tabs-Button"
                class="flex flex-nowrap gap-0.5 overflow-x-auto rounded-2xl bg-white p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <button
                    v-for="tab in searchTabs"
                    :key="tab.key"
                    type="button"
                    class="group min-w-[220px] flex-1 rounded-xl transition-setup"
                    @click="handleTabChange(tab.key)"
                >
                    <div
                        class="flex h-12 items-center justify-center rounded-xl transition-setup"
                        :class="
                            activeSearchTab === tab.key
                                ? 'bg-desa-dark-green'
                                : 'bg-desa-foreshadow group-hover:bg-desa-dark-green'
                        "
                    >
                        <span
                            class="font-medium leading-5 transition-setup"
                            :class="
                                activeSearchTab === tab.key
                                    ? 'text-white'
                                    : 'text-desa-secondary group-hover:text-white'
                            "
                        >
                            {{ tab.label }}
                        </span>
                    </div>
                </button>
            </div>
        </div>

        <div id="Tabs-Content" class="flex flex-1 flex-col gap-6">
            <p class="text-2xl font-semibold">
                Result based on your search ({{ activeSearchTotal }})
            </p>

            <div v-if="loading" class="rounded-3xl bg-white p-6">
                <p class="font-medium text-desa-secondary">Memuat hasil pencarian...</p>
            </div>

            <div v-else class="result flex flex-1 flex-col gap-[14px]">
                <section class="flex flex-1 flex-col gap-[14px]" :id="activeSearchTab">
                    <div v-if="activeSearchResults.length" class="flex flex-col gap-[14px]">
                        <div class="result flex flex-1 flex-col gap-[14px]">
                            <section :id="activeSearchTab" class="flex flex-1 flex-col gap-[14px]">
                                <div
                                    v-for="item in activeSearchResults"
                                    :key="item.id"
                                    class="card flex flex-col gap-6 rounded-3xl bg-white p-6"
                                >
                                    <div class="flex items-center w-full">
                                        <div
                                            class="flex w-[100px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow"
                                        >
                                            <img
                                                :src="item.image"
                                                class="w-full h-full object-cover"
                                                alt="photo"
                                                @error="handleImageError($event, fallbackThumbnail)"
                                            />
                                        </div>
                                        <div
                                            class="flex flex-col gap-[6px] w-full ml-4 mr-9 min-w-0"
                                        >
                                            <p
                                                class="result-title font-semibold text-lg leading-[22.5px] line-clamp-1"
                                            >
                                                {{ item.title }}
                                            </p>
                                            <p class="flex items-center gap-1 min-w-0">
                                                <img
                                                    :src="item.meta.icon"
                                                    class="flex size-[18px] shrink-0"
                                                    alt="icon"
                                                />
                                                <span
                                                    v-if="item.meta.prefix"
                                                    class="font-medium text-sm text-desa-secondary shrink-0"
                                                >
                                                    {{ item.meta.prefix }}
                                                </span>
                                                <span
                                                    class="font-medium text-sm truncate"
                                                    :class="
                                                        item.meta.valueClass ??
                                                        'text-desa-secondary'
                                                    "
                                                >
                                                    {{ item.meta.value }}
                                                </span>
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            class="flex items-center shrink-0 gap-[10px] rounded-2xl bg-desa-black px-6 py-4"
                                            @click="handleViewDetails(item)"
                                        >
                                            <span class="font-medium text-white">View Details</span>
                                        </button>
                                    </div>
                                    <hr class="border-desa-background" />
                                    <div class="grid grid-cols-3 gap-3">
                                        <div
                                            v-for="stat in item.stats"
                                            :key="`${item.id}-${stat.label}`"
                                            class="flex items-center gap-3"
                                        >
                                            <div
                                                class="flex size-[52px] rounded-2xl items-center justify-center overflow-hidden"
                                                :class="stat.iconBackgroundClass"
                                            >
                                                <img
                                                    :src="stat.icon"
                                                    class="flex size-6 shrink-0"
                                                    alt="icon"
                                                />
                                            </div>
                                            <div class="flex flex-col gap-1 min-w-0">
                                                <p
                                                    class="font-semibold text-lg leading-5 truncate"
                                                    :class="stat.valueClass"
                                                >
                                                    {{ stat.value }}
                                                </p>
                                                <p
                                                    class="font-medium text-sm text-desa-secondary truncate"
                                                >
                                                    {{ stat.label }}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div v-else class="flex flex-1 items-center justify-center py-16">
                        <div
                            class="empty-result flex flex-col items-center justify-center gap-6 text-center"
                        >
                            <img :src="emptyIcon" class="flex size-[52px] shrink-0" alt="icon" />
                            <p class="font-medium leading-5 text-desa-secondary">
                                {{ emptyStateMessage }}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>
