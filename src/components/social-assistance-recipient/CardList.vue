<script setup>
import { formatRupiah, formatToClientTimezone, ucfirst } from "@/helpers/format";
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

defineProps({
    socialAssistanceRecipients: {
        type: Array,
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false,
    },
    skeletonRows: {
        type: Number,
        default: 4,
    },
});

const fallbackThumbnail = new URL("@/assets/images/thumbnails/kk-bansos-6.jpg", import.meta.url)
    .href;
const fallbackProfilePicture = new URL("@/assets/images/photos/kk-photo-1.png", import.meta.url)
    .href;

function normalizeImageUrl(value, fallback) {
    if (!value) {
        return fallback;
    }

    const nestedHttpIndex = value.indexOf("http", value.indexOf("http") + 1);

    if (nestedHttpIndex > 0) {
        return value.slice(nestedHttpIndex);
    }

    return value;
}

function getThumbnail(value) {
    return normalizeImageUrl(value, fallbackThumbnail);
}

function getProfilePicture(value) {
    return normalizeImageUrl(value, fallbackProfilePicture);
}

function handleImageError(event, fallback) {
    event.target.src = fallback;
}

function formatCategory(value) {
    const map = {
        staple: "Bahan Pokok",
        cash: "Uang Tunai",
        "subsidized fuel": "BBM Subsidi",
        health: "Kesehatan",
    };

    return map[value] ?? ucfirst(value ?? "-");
}

function formatCreatedAt(value) {
    return value ? formatToClientTimezone(value) : "-";
}

function getStatusConfig(status) {
    const map = {
        pending: {
            label: "Menunggu",
            className: "bg-desa-yellow",
        },
        approved: {
            label: "Disetujui",
            className: "bg-desa-green",
        },
        rejected: {
            label: "Ditolak",
            className: "bg-desa-red",
        },
    };

    return (
        map[status] ?? {
            label: ucfirst(status ?? "Unknown"),
            className: "bg-desa-black",
        }
    );
}
</script>

<template>
    <template v-if="!loading">
        <div
            v-for="item in socialAssistanceRecipients"
            :key="item.id"
            class="card flex flex-col gap-4 rounded-3xl p-6 bg-white"
        >
            <div class="flex items-center justify-between gap-4">
                <p class="flex items-center gap-1 min-w-0">
                    <img
                        src="@/assets/images/icons/calendar-2-secondary-green.svg"
                        class="flex size-[18px] shrink-0"
                        alt="icon"
                    />
                    <span class="font-medium text-sm text-desa-secondary truncate">{{
                        formatCreatedAt(item.created_at)
                    }}</span>
                </p>
                <div
                    class="badge rounded-full p-3 gap-2 flex w -[100px] justify-center shrink-0"
                    :class="getStatusConfig(item.status).className"
                >
                    <span class="font-semibold text-xs text-white uppercase">{{
                        getStatusConfig(item.status).label
                    }}</span>
                </div>
            </div>

            <hr class="border-desa-background" />

            <div class="flex items-center w-full gap-6">
                <div
                    class="flex w-[100px] h-20 shrink-0 rounded-2xl overflow-hidden bg-desa-foreshadow"
                >
                    <img
                        :src="getThumbnail(item.social_assistance?.thumbnail)"
                        class="w-full h-full object-cover"
                        alt="thumbnail"
                        @error="handleImageError($event, fallbackThumbnail)"
                    />
                </div>
                <div class="flex flex-col gap-[6px] w-full min-w-0">
                    <p class="font-semibold text-lg leading-[22.5px] line-clamp-1">
                        {{ item.social_assistance?.name || "-" }}
                    </p>
                    <p class="flex items-center gap-1 min-w-0">
                        <img
                            src="@/assets/images/icons/briefcase-secondary-green.svg"
                            class="flex size-[18px] shrink-0"
                            alt="icon"
                        />
                        <span class="font-medium text-sm text-desa-secondary truncate">{{
                            item.social_assistance?.provider || "-"
                        }}</span>
                    </p>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <div class="flex flex-col gap-1 text-right">
                        <p class="font-semibold text-lg leading-5 text-desa-dark-green text-nowrap">
                            {{ formatRupiah(item.social_assistance?.amount || 0) }}
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">
                            {{ formatCategory(item.social_assistance?.category) }}
                        </p>
                    </div>
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                    >
                        <img
                            src="@/assets/images/icons/money-dark-green.svg"
                            class="flex size-6 shrink-0"
                            alt="icon"
                        />
                    </div>
                </div>
            </div>

            <hr class="border-desa-background" />

            <div class="flex items-center gap-6 justify-between">
                <div class="flex items-center gap-3 w-[302px] shrink-0 min-w-0">
                    <div
                        class="flex size-[54px] rounded-full bg-desa-foreshadow overflow-hidden shrink-0"
                    >
                        <img
                            :src="getProfilePicture(item.head_of_family?.profile_picture)"
                            class="w-full h-full object-cover"
                            alt="photo"
                            @error="handleImageError($event, fallbackProfilePicture)"
                        />
                    </div>
                    <div class="flex flex-col gap-1 min-w-0">
                        <p class="font-semibold text-lg leading-5 text-desa-black truncate">
                            {{ item.head_of_family?.user?.name || "-" }}
                        </p>
                        <p class="flex items-center gap-1 min-w-0">
                            <img
                                src="@/assets/images/icons/briefcase-secondary-green.svg"
                                class="flex size-[18px] shrink-0"
                                alt="icon"
                            />
                            <span class="font-medium text-sm text-desa-secondary truncate">{{
                                item.head_of_family?.occupation || "-"
                            }}</span>
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3 w-[302px] shrink-0">
                    <div
                        class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                    >
                        <img
                            src="@/assets/images/icons/receive-square-2-dark-green.svg"
                            class="flex size-6 shrink-0"
                            alt="icon"
                        />
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="font-semibold text-lg leading-5 text-desa-dark-green text-nowrap">
                            {{ formatRupiah(item.amount || 0) }}
                        </p>
                        <p class="font-medium text-sm text-desa-secondary">Nominal Pengajuan</p>
                    </div>
                </div>

                <div class="flex items-center gap-3 justify-end w-[252px] shrink-0">
                    <RouterLink
                        v-if="item.id"
                        :to="{
                            name: 'manage-social-assistance-recipient',
                            params: { id: item.id },
                        }"
                        class="flex items-center shrink-0 gap-[10px] rounded-2xl py-4 px-6 bg-desa-black"
                    >
                        <span class="font-medium text-white">{{
                            user?.role === "admin" ? "Manage" : "View Details"
                        }}</span>
                    </RouterLink>
                    <div
                        v-else
                        class="rounded-2xl bg-desa-foreshadow px-4 py-3 text-sm font-medium text-desa-secondary"
                    >
                        Data bantuan tidak tersedia
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="!socialAssistanceRecipients.length"
            class="rounded-3xl bg-white p-8 text-center text-desa-secondary"
        >
            Data pengajuan bantuan sosial belum tersedia.
        </div>
    </template>

    <div v-else class="flex flex-col gap-[14px]">
        <div
            v-for="index in skeletonRows"
            :key="index"
            class="sar-skeleton-card rounded-3xl p-6"
            :style="{ '--skeleton-delay': `${index * 90}ms` }"
        >
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-2 min-w-[220px]">
                    <div class="sar-skeleton-block size-[18px] rounded-full"></div>
                    <div class="sar-skeleton-block h-4 w-44 rounded-full"></div>
                </div>
                <div class="sar-skeleton-pill h-10 w-[100px] rounded-full"></div>
            </div>

            <div class="mt-4 sar-skeleton-block h-px w-full"></div>

            <div class="mt-4 flex items-center gap-6">
                <div class="sar-skeleton-block h-20 w-[100px] shrink-0 rounded-2xl"></div>
                <div class="flex flex-1 flex-col gap-[6px] min-w-0">
                    <div class="sar-skeleton-block h-5 w-56 rounded-full"></div>
                    <div class="flex items-center gap-2">
                        <div class="sar-skeleton-block size-[18px] rounded-full"></div>
                        <div class="sar-skeleton-block h-4 w-40 rounded-full"></div>
                    </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                    <div class="flex flex-col gap-2 items-end">
                        <div class="sar-skeleton-block h-5 w-28 rounded-full"></div>
                        <div class="sar-skeleton-block h-4 w-20 rounded-full"></div>
                    </div>
                    <div class="sar-skeleton-block size-[52px] rounded-2xl"></div>
                </div>
            </div>

            <div class="mt-4 sar-skeleton-block h-px w-full"></div>

            <div class="mt-4 flex items-center justify-between gap-6">
                <div class="flex items-center gap-3 w-[302px] shrink-0">
                    <div class="sar-skeleton-block size-[54px] rounded-full"></div>
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="sar-skeleton-block h-5 w-32 rounded-full"></div>
                        <div class="sar-skeleton-block h-4 w-36 rounded-full"></div>
                    </div>
                </div>
                <div class="flex items-center gap-3 w-[302px] shrink-0">
                    <div class="sar-skeleton-block size-[52px] rounded-2xl"></div>
                    <div class="flex flex-col gap-2">
                        <div class="sar-skeleton-block h-5 w-24 rounded-full"></div>
                        <div class="sar-skeleton-block h-4 w-28 rounded-full"></div>
                    </div>
                </div>
                <div class="sar-skeleton-block h-12 w-[152px] shrink-0 rounded-2xl"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sar-skeleton-card {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    background:
        radial-gradient(circle at top right, rgba(142, 189, 85, 0.12), transparent 34%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 248, 0.95));
    box-shadow: 0 18px 42px rgba(38, 58, 42, 0.05);
}

.sar-skeleton-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), transparent 36%);
    pointer-events: none;
}

.sar-skeleton-block,
.sar-skeleton-pill {
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, rgba(111, 132, 121, 0.16), rgba(111, 132, 121, 0.08));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.sar-skeleton-pill {
    background:
        linear-gradient(180deg, rgba(64, 140, 255, 0.14), rgba(64, 140, 255, 0.08)),
        linear-gradient(180deg, rgba(111, 132, 121, 0.08), rgba(111, 132, 121, 0.04));
}

.sar-skeleton-block::after,
.sar-skeleton-card::after,
.sar-skeleton-pill::after {
    content: "";
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.08) 12%,
        rgba(255, 255, 255, 0.6) 50%,
        rgba(255, 255, 255, 0.08) 88%,
        transparent 100%
    );
    animation: shimmer 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
    animation-delay: var(--skeleton-delay, 0ms);
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .sar-skeleton-block::after,
    .sar-skeleton-card::after,
    .sar-skeleton-pill::after {
        animation: none;
    }
}
</style>
