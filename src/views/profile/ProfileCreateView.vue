<script setup>
import IconBuildingBlack from "@/assets/images/icons/building-4-black.svg";
import IconBuildingSecondaryGreen from "@/assets/images/icons/building-4-secondary-green.svg";
import IconGridBlack from "@/assets/images/icons/grid-5-black.svg";
import IconGridSecondaryGreen from "@/assets/images/icons/grid-5-secondary-green.svg";
import IconPeopleBlack from "@/assets/images/icons/profile-2user-black.svg";
import IconPeopleSecondaryGreen from "@/assets/images/icons/profile-2user-secondary-green.svg";
import IconUserBlack from "@/assets/images/icons/user-square-black.svg";
import IconUserSecondaryGreen from "@/assets/images/icons/user-square-secondary-green.svg";
import Input from "@/components/ui/Input.vue";
import { fallbackThumbnail, handleImageError } from "@/helpers/socialAssistance";
import router from "@/router";
import { useProfileStore } from "@/stores/profile";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref } from "vue";
import { RouterLink } from "vue-router";

const profileStore = useProfileStore();
const { loading, error } = storeToRefs(profileStore);

const thumbnailInput = ref(null);
const validationErrors = ref({});
const previewUrls = ref([]);

const profile = ref({
    thumbnail: null,
    thumbnail_url: fallbackThumbnail,
    name: "",
    address: "",
    about: "",
    headman: "",
    people: "",
    agricultural_area: "",
    total_area: "",
    images: [],
});

const galleryError = computed(() => {
    const baseErrors = typeof error.value === "object" && error.value !== null ? error.value : {};
    const allErrors = { ...validationErrors.value, ...baseErrors };

    const entry = Object.entries(allErrors).find(([key]) => /^(images|image)(\.|\[)/i.test(key));
    const value = entry?.[1];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
});

const hasGalleryError = computed(() => Boolean(galleryError.value));

const generalError = computed(() => {
    if (typeof error.value === "string") return error.value;
    if (error.value && typeof error.value === "object") {
        return "Validasi gagal. Periksa kembali input yang bertanda error.";
    }

    return null;
});

function clearErrors() {
    validationErrors.value = {};
    error.value = null;
}

function getFieldError(field) {
    const err = validationErrors.value[field] ?? error.value?.[field];
    if (!err) return null;
    return Array.isArray(err) ? err[0] : err;
}

function getImageFieldError(index) {
    if (index !== 0) return null;
    return galleryError.value;
}

function openThumbnailPicker() {
    thumbnailInput.value?.click();
}

function handleThumbnailChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    validationErrors.value.thumbnail = null;
    if (error.value && typeof error.value === "object") {
        error.value.thumbnail = null;
    }

    if (profile.value.thumbnail_url && profile.value.thumbnail_url.startsWith("blob:")) {
        URL.revokeObjectURL(profile.value.thumbnail_url);
    }

    profile.value.thumbnail = file;
    profile.value.thumbnail_url = URL.createObjectURL(file);
}

function addImage() {
    profile.value.images.push({
        image: null,
        imageUrl: fallbackThumbnail,
    });
}

function removeImage(index) {
    const currentImage = profile.value.images[index];

    if (currentImage?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentImage.imageUrl);
    }

    profile.value.images.splice(index, 1);
}

function openGalleryPicker(index) {
    const input = document.getElementById(`gallery-image-${index}`);
    input?.click();
}

function handleGalleryImageChange(event, index) {
    const file = event.target.files?.[0];
    if (!file) return;

    delete validationErrors.value[`images-${index}`];
    delete validationErrors.value[`images-${index}.image`];
    delete validationErrors.value[`images[${index}]`];
    delete validationErrors.value[`images-${index}.file`];
    delete validationErrors.value[`images[${index}].file`];
    delete validationErrors.value[`image-${index + 1}`];
    delete validationErrors.value[`images-${index + 1}`];

    if (error.value && typeof error.value === "object") {
        delete error.value[`images-${index}`];
        delete error.value[`images-${index}.image`];
        delete error.value[`images[${index}]`];
        delete error.value[`images-${index}.file`];
        delete error.value[`images[${index}].file`];
        delete error.value[`image-${index + 1}`];
        delete error.value[`image-${index + 1}`];
    }

    const currentImage = profile.value.images[index];

    if (currentImage?.imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentImage.imageUrl);
    }

    const imageUrl = URL.createObjectURL(file);
    profile.value.images[index] = {
        image: file,
        imageUrl,
    };

    previewUrls.value[index] = imageUrl;
}

function handlePreviewError(event) {
    handleImageError(event, fallbackThumbnail);
}

async function handleSubmit() {
    validationErrors.value = {};
    error.value = null;

    const result = await profileStore.createProfile({
        ...profile.value,
        images: profile.value.images.map((image) => image.image).filter(Boolean),
    });

    if (!result) {
        validationErrors.value =
            typeof error.value === "object" && error.value !== null ? error.value : {};
        return;
    }

    await router.replace({ name: "profile" });
}

onBeforeUnmount(() => {
    if (profile.value.thumbnail_url?.startsWith("blob:")) {
        URL.revokeObjectURL(profile.value.thumbnail_url);
    }

    profile.value.images.forEach((image) => {
        if (image.imageUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(image.imageUrl);
        }
    });
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <router-link
                        :to="{ name: 'profile' }"
                        replace
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize hover:underline"
                        >Profile Desa</router-link
                    >
                    <span>/</span>
                    <p
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                    >
                        Create Profile Desa
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Create Profile Desa</h1>
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
                <section id="Photos" class="flex justify-between">
                    <h2
                        class="font-medium leading-5 text-desa-secondary flex h-[100px] items-center w-[calc(424/904*100%)]"
                    >
                        Thumbnail Profile Desa
                    </h2>
                    <div class="photo-input-container flex flex-col gap-6 flex-1">
                        <div
                            class="photo-form group/parent flex items-center justify-between gap-6 rounded-2xl transition-all duration-300"
                            :class="{
                                'border border-desa-red/30 bg-desa-red/5 p-3':
                                    getFieldError('thumbnail'),
                            }"
                        >
                            <div
                                class="Photo-Preview flex justify-center w-[120px] h-[100px] rounded-2xl overflow-hidden bg-desa-foreshadow shrink-0"
                            >
                                <img
                                    :src="profile.thumbnail_url || fallbackThumbnail"
                                    alt="thumbnail desa"
                                    class="Photo size-full object-cover"
                                    @error="handlePreviewError"
                                />
                            </div>
                            <div class="relative">
                                <input
                                    ref="thumbnailInput"
                                    type="file"
                                    name="thumbnail"
                                    accept="image/*"
                                    class="absolute opacity-0 left-0 top-0 size-0 -z-10"
                                    @change="handleThumbnailChange"
                                />
                                <div class="action flex gap-3">
                                    <button
                                        type="button"
                                        class="Upload-btn relative flex items-center py-4 px-6 rounded-2xl bg-desa-black gap-[10px] cursor-pointer"
                                        @click="openThumbnailPicker"
                                    >
                                        <img
                                            src="@/assets/images/icons/send-square-white.svg"
                                            alt="upload icon"
                                            class="size-6 shrink-0"
                                        />
                                        <p class="font-medium leading-5 text-white">Upload</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="getFieldError('thumbnail')"
                            class="text-left text-desa-red text-xs -mt-2"
                        >
                            {{ getFieldError("thumbnail") }}
                        </div>

                        <button
                            @click="addImage"
                            type="button"
                            class="add-more-btn flex items-center w-full justify-center rounded-2xl py-4 px-6 gap-3 bg-desa-foreshadow cursor-pointer transition-colors duration-200 hover:bg-desa-background"
                        >
                            <p class="font-medium leading-5 text-desa-dark-green">
                                Tambah Gambar Desa
                            </p>
                            <img
                                src="@/assets/images/icons/add-square-dark-green.svg"
                                class="flex size-6 shrink-0"
                                alt="add icon"
                            />
                        </button>

                        <div
                            v-for="(image, index) in profile.images"
                            :key="index"
                            class="photo-form flex items-center justify-between gap-6 rounded-2xl transition-all duration-300"
                            :class="{
                                'border border-desa-background p-3': true,
                                'border-desa-red/60 bg-desa-red/5': hasGalleryError,
                            }"
                        >
                            <div
                                class="Photo-Preview flex justify-center w-[120px] h-[100px] rounded-2xl overflow-hidden border border-desa-background bg-desa-foreshadow shrink-0"
                            >
                                <img
                                    :src="image.imageUrl || fallbackThumbnail"
                                    alt="galeri desa"
                                    class="Photo size-full object-cover"
                                    @error="handlePreviewError"
                                />
                            </div>
                            <div class="relative flex gap-3">
                                <input
                                    :id="`gallery-image-${index}`"
                                    type="file"
                                    name="images[]"
                                    accept="image/*"
                                    class="absolute opacity-0 left-0 top-0 size-0 -z-10"
                                    @change="handleGalleryImageChange($event, index)"
                                />
                                <button
                                    type="button"
                                    class="Upload-btn relative flex items-center py-4 px-6 rounded-2xl bg-desa-black gap-[10px] cursor-pointer"
                                    @click="openGalleryPicker(index)"
                                >
                                    <img
                                        src="@/assets/images/icons/send-square-white.svg"
                                        alt="upload icon"
                                        class="size-6 shrink-0"
                                    />
                                    <p class="font-medium leading-5 text-white">Upload</p>
                                </button>
                                <button
                                    type="button"
                                    @click="removeImage(index)"
                                    class="delete flex size-14 rounded-2xl p-4 bg-desa-red items-center justify-center cursor-pointer"
                                >
                                    <img
                                        src="@/assets/images/icons/trash-white.svg"
                                        alt="hapus gambar"
                                        class="size-6 shrink-0"
                                    />
                                </button>
                            </div>
                        </div>
                        <div
                            v-if="getImageFieldError(0)"
                            class="text-left text-desa-red text-xs -mt-2"
                        >
                            {{ getImageFieldError(0) }}
                        </div>
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Nama-Desa" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="profile.name"
                            type="text"
                            placeholder="Ketik nama desa"
                            :error-message="getFieldError('name')"
                            :icon="IconBuildingSecondaryGreen"
                            :filled-icon="IconBuildingBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Lokasi" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Lokasi Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <textarea
                            v-model="profile.address"
                            placeholder="Ketik alamat desa"
                            rows="6"
                            class="appearance-none outline-none w-full rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        ></textarea>
                        <span
                            v-if="getFieldError('address')"
                            class="text-left text-desa-red text-xs"
                            >{{ getFieldError("address") }}</span
                        >
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Kepala-Desa" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Kepala Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="profile.headman"
                            type="text"
                            placeholder="Pilih Kepala Desa"
                            :error-message="getFieldError('headman')"
                            :icon="IconUserSecondaryGreen"
                            :filled-icon="IconUserBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Luas-Pertanian" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Luas Pertanian Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="profile.agricultural_area"
                            type="number"
                            placeholder="Masukan total luas pertanian"
                            :error-message="getFieldError('agricultural_area')"
                            :icon="IconGridSecondaryGreen"
                            :filled-icon="IconGridBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Luas-Area" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Luas Area Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="profile.total_area"
                            type="number"
                            placeholder="Masukan total luas area"
                            :error-message="getFieldError('total_area')"
                            :icon="IconGridSecondaryGreen"
                            :filled-icon="IconGridBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Jumlah Penduduk" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Jumlah Penduduk Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="profile.people"
                            type="number"
                            placeholder="Masukan total penduduk desa"
                            :error-message="getFieldError('people')"
                            :icon="IconPeopleSecondaryGreen"
                            :filled-icon="IconPeopleBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Deskripsi" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Deskripsi Tentang Desa
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <textarea
                            v-model="profile.about"
                            placeholder="Jelaskan lebih detail tentang desa terkait"
                            rows="6"
                            class="appearance-none outline-none w-full rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        ></textarea>
                        <span
                            v-if="getFieldError('about')"
                            class="text-left text-desa-red text-xs"
                            >{{ getFieldError("about") }}</span
                        >
                    </div>
                </section>
                <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />

                <section id="Buttons" class="flex items-center justify-end gap-4">
                    <RouterLink :to="{ name: 'profile' }">
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
                        {{ loading ? "Creating..." : "Create Now" }}
                    </button>
                </section>
            </div>
        </form>
    </div>
</template>
