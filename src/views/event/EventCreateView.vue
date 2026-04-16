<script setup>
import IconCalendarBlack from "@/assets/images/icons/calendar-2-black.svg";
import IconCalendarSecondaryGreen from "@/assets/images/icons/calendar-2-secondary-green.svg";
import IconClockBlack from "@/assets/images/icons/clock-black.svg";
import IconClockSecondaryGreen from "@/assets/images/icons/clock-secondary-green.svg";
import IconDollarBlack from "@/assets/images/icons/dollar-square-black.svg";
import IconDollarSecondaryGreen from "@/assets/images/icons/dollar-square-secondary-green.svg";
import IconEditBlack from "@/assets/images/icons/edit-black.svg";
import IconEditSecondaryGreen from "@/assets/images/icons/edit-secondary-green.svg";
import Input from "@/components/ui/Input.vue";
import TimePicker from "@/components/ui/TimePicker.vue";
import { normalizeAmountInput, normalizeDateInput } from "@/helpers/development";
import { formatRupiah } from "@/helpers/format";
import { fallbackThumbnail, handleImageError } from "@/helpers/socialAssistance";
import router from "@/router";
import { useEventStore } from "@/stores/event";
import { storeToRefs } from "pinia";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink } from "vue-router";

// -- Reactive state ------------------------------------------------
const isTimeModalOpen = ref(false);
const fileInput = ref(null);
const previewObjectUrl = ref(null);
const timePickerValue = ref(null);
const validationErrors = ref({});

// -- Constants -----------------------------------------------------
const MAX_AMOUNT_INTEGER_DIGITS = 15;
const MAX_AMOUNT_DECIMAL_DIGITS = 2;

// -- Store ---------------------------------------------------------
const eventStore = useEventStore();
const { loading, error } = storeToRefs(eventStore);

function createInitialEventState() {
    return {
        thumbnail: null,
        thumbnail_url: fallbackThumbnail,
        name: "",
        description: "",
        price: "",
        date: "",
        time: "",
        is_active: true,
    };
}

const event = ref(createInitialEventState());

// -- Derived state -------------------------------------------------
const generalError = computed(() => {
    if (typeof error.value === "string") return error.value;
    if (error.value && typeof error.value === "object") {
        return "Data event gagal ditambahkan. Periksa kembali input yang bertanda error.";
    }

    return null;
});

const amountInput = computed({
    get: () => formatAmountInput(event.value.price),
    set: (value) => {
        event.value.price = normalizeAmountInput(value);
    },
});

// -- Data helpers --------------------------------------------------
function normalizeTimeInput(value) {
    if (!value) return "";

    const match = String(value).match(/^(\d{2}:\d{2})/);
    return match ? match[1] : "";
}

function formatTimePickerValue(value) {
    if (!value || typeof value !== "object") return "";

    const hours = Number(value.hours);
    const minutes = Number(value.minutes);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return "";
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// -- UI helpers ----------------------------------------------------
function clearErrors() {
    validationErrors.value = {};
    error.value = null;
}

function openFilePicker() {
    fileInput.value?.click();
}

function getFieldError(field) {
    const err = validationErrors.value[field] ?? error.value?.[field];
    if (!err) return null;
    return Array.isArray(err) ? err[0] : err;
}

function onImageError(currentEvent) {
    handleImageError(currentEvent, fallbackThumbnail);
}

function handleImageChange(currentEvent) {
    const file = currentEvent.target.files?.[0];
    if (!file) return;

    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value);
    }

    previewObjectUrl.value = URL.createObjectURL(file);
    event.value.thumbnail = file;
    event.value.thumbnail_url = previewObjectUrl.value;
}

function handleTimePickerChange(value) {
    event.value.time = formatTimePickerValue(value);
}

function formatAmountInput(value) {
    const normalized = normalizeAmountInput(value);
    return normalized ? formatRupiah(normalized) : "";
}

function validateAmountInput(value) {
    if (!value) return null;

    const [integerPart = "", decimalPart = ""] = String(value).split(".");
    const intDigits = integerPart.replace(/[^\d]/g, "");
    const decDigits = decimalPart.replace(/\D/g, "");

    if (intDigits.length > MAX_AMOUNT_INTEGER_DIGITS) {
        return `Nominal harga terlalu besar. Maksimal ${MAX_AMOUNT_INTEGER_DIGITS} digit sebelum koma.`;
    }

    if (decDigits.length > MAX_AMOUNT_DECIMAL_DIGITS) {
        return `Nominal harga hanya boleh memiliki ${MAX_AMOUNT_DECIMAL_DIGITS} angka desimal.`;
    }

    return null;
}

// -- Actions -------------------------------------------------------
async function handleSubmit() {
    validationErrors.value = {};
    error.value = null;

    const amountError = validateAmountInput(event.value.price);
    if (amountError) {
        validationErrors.value = { price: [amountError] };
        return;
    }

    const normalizedAmount = normalizeAmountInput(event.value.price);
    const result = await eventStore.createEvent({
        thumbnail: event.value.thumbnail,
        name: event.value.name,
        description: event.value.description,
        price: normalizedAmount === "" ? "" : Number(normalizedAmount),
        date: normalizeDateInput(event.value.date),
        time: normalizeTimeInput(event.value.time),
        is_active: event.value.is_active ? "1" : "0",
    });

    if (!result) {
        validationErrors.value =
            typeof error.value === "object" && error.value !== null ? error.value : {};
        return;
    }

    await router.replace({ name: "event" });
}

watch(timePickerValue, handleTimePickerChange);

onBeforeUnmount(() => {
    if (previewObjectUrl.value) {
        URL.revokeObjectURL(previewObjectUrl.value);
    }
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <div class="flex gap-1 items-center leading-5 text-desa-secondary">
                    <RouterLink
                        :to="{ name: 'event' }"
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize hover:underline"
                        >Event Desa</RouterLink
                    >
                    <span>/</span>
                    <p
                        class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize"
                    >
                        Tambah Event Desa
                    </p>
                </div>
                <h1 class="font-semibold text-2xl">Tambah Event Desa</h1>
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
                <section id="Thumbnail" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Thumbnail Event Terkait
                    </h2>
                    <div class="flex-1 flex items-center justify-between">
                        <div
                            class="flex justify-center w-[120px] h-[100px] rounded-2xl overflow-hidden bg-desa-foreshadow"
                        >
                            <img
                                :src="event.thumbnail_url || fallbackThumbnail"
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
                <div v-if="getFieldError('thumbnail')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError("thumbnail")
                    }}</span>
                </div>
                <hr class="border-desa-background" />

                <section id="Nama-Event" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Nama Event
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="event.name"
                            type="text"
                            placeholder="Ketik nama event terkait"
                            :error-message="getFieldError('name')"
                            :icon="IconEditSecondaryGreen"
                            :filled-icon="IconEditBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Status" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Pilih status event
                    </p>
                    <div class="flex flex-1 gap-6 shrink-0">
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-none has-[:checked]:bg-desa-foreshadow transition-setup"
                        >
                            <input
                                v-model="event.is_active"
                                :value="true"
                                type="radio"
                                name="status"
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                Open
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
                                v-model="event.is_active"
                                :value="false"
                                type="radio"
                                name="status"
                                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                            />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup"
                            >
                                Closed
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
                <div v-if="getFieldError('is_active')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError("is_active")
                    }}</span>
                </div>
                <hr class="border-desa-background" />

                <section id="Harga-Event" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Harga Event
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input
                            v-model="amountInput"
                            type="text"
                            placeholder="Ketik total harga event"
                            :error-message="getFieldError('price')"
                            :icon="IconDollarSecondaryGreen"
                            :filled-icon="IconDollarBlack"
                        />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Tanggal" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Tanggal event dilakukan
                    </p>
                    <div class="flex items-center gap-6 flex-1 shrink-0">
                        <label class="relative group peer w-full">
                            <Input
                                v-model="event.date"
                                type="date"
                                placeholder="Pilih tanggal event"
                                :error-message="getFieldError('date')"
                                :icon="IconCalendarSecondaryGreen"
                                :filled-icon="IconCalendarBlack"
                            />
                        </label>
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Waktu" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Waktu event dilakukan
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <div class="relative w-full">
                            <div class="cursor-pointer" @click="isTimeModalOpen = true">
                                <Input
                                    v-model="event.time"
                                    type="text"
                                    placeholder="Pilih waktu event"
                                    :error-message="getFieldError('time')"
                                    :icon="IconClockSecondaryGreen"
                                    :filled-icon="IconClockBlack"
                                    readonly
                                    class="pointer-events-none"
                                />
                            </div>

                            <Teleport to="body">
                                <div
                                    v-if="isTimeModalOpen"
                                    class="fixed inset-0 z-[1000] flex items-center justify-center"
                                >
                                    <TimePicker
                                        v-model="event.time"
                                        @close="isTimeModalOpen = false"
                                    />
                                </div>
                            </Teleport>
                        </div>
                    </div>
                </section>
                <div v-if="getFieldError('time')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError("time")
                    }}</span>
                </div>
                <hr class="border-desa-background" />

                <section id="Deskripsi" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
                        Deskripsi event terkait
                    </p>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <textarea
                            v-model="event.description"
                            placeholder="Jelaskan lebih detail tentang event"
                            rows="6"
                            class="appearance-none outline-none w-full rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 gap-2 font-medium placeholder:text-desa-secondary transition-all duration-300"
                        ></textarea>
                    </div>
                </section>
                <div v-if="getFieldError('description')" class="flex justify-end">
                    <span class="w-full max-w-[480px] text-left text-desa-red text-xs">{{
                        getFieldError("description")
                    }}</span>
                </div>
                <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />

                <section id="Buttons" class="flex items-center justify-end gap-4">
                    <RouterLink :to="{ name: 'event' }">
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
