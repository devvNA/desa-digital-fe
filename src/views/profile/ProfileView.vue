<script setup>
import { formatDateWithDay } from "@/helpers/format";
import { can } from "@/helpers/permissionHelper";
import {
    fallbackProfilePicture,
    fallbackThumbnailSocialAssistance,
    handleImageError,
    normalizeImageUrl,
} from "@/helpers/socialAssistance";
import { useProfileStore } from "@/stores/profile";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref } from "vue";

const profileStore = useProfileStore();
const { profile, loading, error } = storeToRefs(profileStore);

const showModalImage = ref(false);
const activeImageIndex = ref(0);

const staticProfile = {
    label: "Profile Desa",
    address: "Jakarta, Indonesia",
    built_at: "2012-02-24",
    headman_photo: fallbackProfilePicture,
};

const normalizedProfile = computed(() => {
    const currentProfile = profile.value ?? {};
    const gallery = Array.isArray(currentProfile.profile_images)
        ? currentProfile.profile_images
        : [];

    return {
        label: currentProfile.label ?? staticProfile.label,
        thumbnail: normalizeImageUrl(currentProfile.thumbnail, fallbackThumbnailSocialAssistance),
        name: currentProfile.name ?? "Desa Angga Countryside",
        address: currentProfile.address ?? staticProfile.address,
        about: currentProfile.about ?? "-",
        headman: currentProfile.headman ?? "Bimore Wecaksono",
        headman_photo: normalizeImageUrl(currentProfile.headman_photo, staticProfile.headman_photo),
        people: formatNumber(currentProfile.people, "243.000"),
        agricultural_area: formatArea(currentProfile.agricultural_area, "25.200m²"),
        total_area: formatArea(currentProfile.total_area, "9.222.500m²"),
        built_at: currentProfile.built_at
            ? formatDateWithDay(currentProfile.built_at)
            : formatDateWithDay(staticProfile.built_at),
        profile_images: gallery.map((image) => ({
            image: normalizeImageUrl(image?.image, fallbackThumbnailSocialAssistance),
        })),
    };
});

const modalImage = computed(() => {
    return (
        normalizedProfile.value.profile_images[activeImageIndex.value]?.image ??
        normalizedProfile.value.thumbnail
    );
});

const galleryImages = computed(() => {
    return normalizedProfile.value.profile_images.slice(0, 3);
});

const hasProfile = computed(() => Boolean(profile.value));
const isEmpty = computed(() => !loading.value && !generalError.value && !hasProfile.value);

const generalError = computed(() => {
    if (typeof error.value === "string") return error.value;
    if (error.value && typeof error.value === "object") return "Gagal mengambil data profile desa.";
    return null;
});

function formatNumber(value, fallback) {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) return fallback;
    return new Intl.NumberFormat("id-ID").format(parsedValue);
}

function formatArea(value, fallback) {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue)) return fallback;
    return `${new Intl.NumberFormat("id-ID").format(parsedValue)}m²`;
}

function selectedImage(index) {
    if (!normalizedProfile.value.profile_images.length) return;
    activeImageIndex.value = index;
    showModalImage.value = true;
}

function closeModal() {
    showModalImage.value = false;
}

function onPreviewError(event) {
    handleImageError(event, fallbackThumbnailSocialAssistance);
}

function onHeadmanPhotoError(event) {
    handleImageError(event, fallbackProfilePicture);
}

onMounted(() => {
    profileStore.fetchProfile();
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <h1 class="font-semibold text-2xl">Profile Desa</h1>
            </div>
            <RouterLink
                v-if="!hasProfile && can('profile-create')"
                :to="{ name: 'create-profile' }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black"
            >
                <p class="font-medium text-white">Create Profile</p>
                <img
                    src="@/assets/images/icons/edit-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
            </RouterLink>
            <RouterLink
                v-else-if="hasProfile && can('profile-edit')"
                :to="{ name: 'edit-profile', params: { id: 1 } }"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black"
            >
                <p class="font-medium text-white">Ubah Data</p>
                <img
                    src="@/assets/images/icons/edit-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
            </RouterLink>
        </div>

        <div v-if="loading" class="rounded-3xl bg-white p-6">
            <p class="font-medium text-desa-secondary">Memuat profile desa...</p>
        </div>
        <div v-else-if="generalError" class="rounded-3xl bg-white p-6">
            <p class="font-medium text-desa-red">{{ generalError }}</p>
        </div>
        <div v-else-if="isEmpty" class="rounded-3xl bg-white p-6">
            <p class="font-medium text-desa-secondary">Data profile desa belum tersedia.</p>
        </div>
        <div v-else class="flex gap-[14px]">
            <section
                id="Nama-Desa"
                class="flex flex-col shrink-0 w-[calc(565/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white"
            >
                <div class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary">
                        {{ normalizedProfile.label }}
                    </p>
                    <img
                        src="@/assets/images/icons/building-foreshadow-background.svg"
                        class="flex size-12 shrink-0"
                        alt="icon"
                    />
                </div>
                <div id="Nama-Desa" class="flex flex-col gap-[6px]">
                    <h1 class="font-bold text-[32px] leading-10">{{ normalizedProfile.name }}</h1>
                    <div class="flex items-center gap-0.5">
                        <img
                            src="@/assets/images/icons/location-secondary-green.svg"
                            class="flex size-6 shrink-0"
                            alt="icon"
                        />
                        <span class="font-medium text-sm text-desa-secondary">{{
                            normalizedProfile.address
                        }}</span>
                    </div>
                </div>
                <div id="Gallery" class="flex flex-col gap-[14px]">
                    <div
                        data-modal="Modal-Gallery"
                        data-gallery="@/assets/images/thumbnails/desa-gallery-1.png"
                        id="Thumbnail-Desa"
                        class="flex w-[492px] h-[300px] shrink-0 rounded-3xl bg-desa-background overflow-hidden"
                    >
                        <img
                            :src="normalizedProfile.thumbnail"
                            class="w-full h-full object-cover"
                            alt="thumbnail"
                            @error="onPreviewError"
                        />
                    </div>
                    <div v-if="galleryImages.length" class="grid grid-cols-3 gap-[14px] w-[492px]">
                        <div v-for="(image, index) in galleryImages" :key="index" class="relative">
                            <button class="relative" @click="selectedImage(index)">
                                <div
                                    class="thumbnail-selection flex w-full h-[120px] shrink-0 rounded-3xl bg-desa-background overflow-hidden"
                                >
                                    <img
                                        :src="image.image"
                                        class="w-full h-full object-cover"
                                        alt="thumbnail"
                                        @error="onPreviewError"
                                    />
                                </div>
                                <div
                                    v-if="
                                        index === 2 && normalizedProfile.profile_images.length > 3
                                    "
                                    class="absolute inset-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center bg-[#001B1ACC] text-white"
                                >
                                    <p class="font-semibold text-xl leading-6">
                                        {{ normalizedProfile.profile_images.length - 3 }}+
                                    </p>
                                    <p class="font-semibold text-sm text-white">Photo</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Desa</p>
                    <p class="font-medium leading-8">{{ normalizedProfile.about }}</p>
                </div>
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Peta Desa</p>
                    <div class="rounded-2xl overflow-hidden max-w-full w-full !h-[350px]">
                        <div id="embedded-map-display" class="size-full max-w-full">
                            <iframe
                                class="size-full border-0"
                                frameborder="0"
                                src="https://www.google.com/maps/embed/v1/place?q=Kelurahan+Sukajaya&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
                            ></iframe>
                        </div>
                    </div>
                    <p class="font-medium text-sm leading-[28px] text-desa-secondary">
                        {{ normalizedProfile.address }}
                    </p>
                </div>
            </section>
            <section
                id="Detail-Desa"
                class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white"
            >
                <p class="font-medium leading-5 text-desa-secondary">Detail Desa</p>
                <div class="flex flex-col gap-[14px]">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[54px] rounded-full bg-desa-foreshadow overflow-hidden"
                        >
                            <img
                                :src="normalizedProfile.headman_photo"
                                class="w-full h-full object-cover"
                                alt="icon"
                                @error="onHeadmanPhotoError"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5 text-desa-black">
                                {{ normalizedProfile.headman }}
                            </p>
                            <p class="flex items-center gap-1">
                                <span class="font-medium text-sm text-desa-secondary"
                                    >Kepala Desa</span
                                >
                            </p>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                        >
                            <img
                                src="@/assets/images/icons/profile-2user-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="icon"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">
                                {{ normalizedProfile.people }}
                            </p>
                            <p class="font-medium text-sm text-desa-secondary">Jumlah Penduduk</p>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                        >
                            <img
                                src="@/assets/images/icons/tree-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="icon"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">
                                {{ normalizedProfile.agricultural_area }}
                            </p>
                            <p class="font-medium text-sm text-desa-secondary">Luas Pertanian</p>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                        >
                            <img
                                src="@/assets/images/icons/grid-5-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="icon"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">
                                {{ normalizedProfile.total_area }}
                            </p>
                            <p class="font-medium text-sm text-desa-secondary">Luas Area</p>
                        </div>
                    </div>
                    <hr class="border-desa-background" />
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden"
                        >
                            <img
                                src="@/assets/images/icons/calendar-2-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="icon"
                            />
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">
                                {{ normalizedProfile.built_at }}
                            </p>
                            <p class="font-medium text-sm text-desa-secondary">Desa Dibangun</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>

    <div
        id="Modal-Gallery"
        class="modal fixed inset-0 flex flex-col h-screen z-40 bg-[#080C1ACC]"
        v-if="showModalImage && normalizedProfile.profile_images.length"
    >
        <div class="flex flex-col items-center justify-center m-auto">
            <div
                id="Main-Image-Container"
                class="flex aspect-[805/492] w-full max-w-[805px] overflow-hidden mx-auto"
            >
                <img
                    id="Selected-Image"
                    :src="modalImage"
                    class="size-full object-contain object-center"
                    alt="thumbnail"
                />
            </div>
            <button
                class="btn-close-modal flex items-center rounded-full border border-white/10 py-3 px-4 mx-auto mt-[30px]"
                @click="closeModal"
            >
                <img
                    src="@/assets/images/icons/close-circle-white.svg"
                    class="flex size-6 shrink-0"
                    alt="icon"
                />
                <p class="font-medium leading-5 text-white">Tutup</p>
            </button>
        </div>
        <div class="flex flex-wrap items-center w-full border border-white/10 gap-4 p-4">
            <button
                v-for="(image, index) in normalizedProfile.profile_images"
                :key="index"
                @click="selectedImage(index)"
                class="group relative flex w-[140px] h-[120px] shrink-0 rounded-3xl bg-desa-background overflow-hidden"
                :class="{ active: activeImageIndex === index }"
            >
                <img
                    :src="image.image"
                    class="size-full object-cover group-[.active]:blur"
                    alt="thumbnail"
                    @error="onPreviewError"
                />
                <img
                    src="@/assets/images/icons/eye-white-fill.svg"
                    class="absolute hidden size-9 shrink-0 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 group-[.active]:flex"
                    alt="icon"
                />
            </button>
        </div>
    </div>
</template>
