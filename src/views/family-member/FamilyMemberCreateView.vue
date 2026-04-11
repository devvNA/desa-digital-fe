<script setup>
import IconBriefcaseBlack from '@/assets/images/icons/briefcase-black.svg'
import IconBriefcaseSecondaryGreen from '@/assets/images/icons/briefcase-secondary-green.svg'
import IconCallBlack from '@/assets/images/icons/call-black.svg'
import IconCallSecondaryGreen from '@/assets/images/icons/call-secondary-green.svg'
import IconKeyBlack from '@/assets/images/icons/key-black.svg'
import IconKeySecondaryGreen from '@/assets/images/icons/key-secondary-green.svg'
import IconKeyboardBlack from '@/assets/images/icons/keyboard-black.svg'
import IconKeyboardSecondaryGreen from '@/assets/images/icons/keyboard-secondary-green.svg'
import IconProfileBlack from '@/assets/images/icons/profile-circle-black.svg'
import IconProfileSecondaryGreen from '@/assets/images/icons/profile-circle-secondary-green.svg'
import IconSmsBlack from '@/assets/images/icons/sms-black.svg'
import IconSmsSecondaryGreen from '@/assets/images/icons/sms-secondary-green.svg'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'
import { useFamilyMemberStore } from '@/stores/familyMember'
import { useHeadOfFamilyStore } from '@/stores/headOfFamily'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const familyMemberStore = useFamilyMemberStore()
const { loading, error } = storeToRefs(familyMemberStore)
const { createFamilyMember } = familyMemberStore

const headOfFamilyStore = useHeadOfFamilyStore()
const { headOfFamilies } = storeToRefs(headOfFamilyStore)

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const profilePictureInput = ref(null)
const validationErrors = ref({})
const fallbackProfilePicture = new URL('@/assets/images/photos/kk-photo-1.png', import.meta.url).href

const familyMember = ref({
    name: '',
    email: '',
    password: '',
    profile_picture: null,
    profile_picture_url: fallbackProfilePicture,
    identity_number: '',
    gender: '',
    date_of_birth: '',
    age: 0,
    phone_number: '',
    occupation: '',
    marital_status: '',
    relation: '',
    head_of_family_id: '',
})

const hasPresetHeadOfFamily = computed(() => Boolean(user.value?.head_of_family_id))
const selectedHeadOfFamilyName = computed(() => {
    if (hasPresetHeadOfFamily.value) {
        return user.value?.name ?? '-'
    }

    const selected = headOfFamilies.value.find(
        (item) => String(item.id) === String(familyMember.value.head_of_family_id),
    )

    return selected?.user?.name ?? '-'
})

const generalError = computed(() => {
    if (typeof error.value === 'string') {
        return error.value
    }

    if (error.value && typeof error.value === 'object') {
        return 'Data anggota keluarga gagal dibuat. Periksa kembali input yang bertanda error.'
    }

    return null
})

function getFieldError(field) {
    const fieldError = validationErrors.value[field] ?? error.value?.[field]

    if (!fieldError) {
        return null
    }

    return Array.isArray(fieldError) ? fieldError[0] : fieldError
}

function clearFieldError(field) {
    if (validationErrors.value[field]) {
        validationErrors.value = {
            ...validationErrors.value,
            [field]: null,
        }
    }

    if (error.value && typeof error.value === 'object' && error.value[field]) {
        error.value = {
            ...error.value,
            [field]: null,
        }
    }
}

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) {
        return 0
    }

    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1
    }

    return Math.max(age, 0)
}

function openProfilePicturePicker() {
    profilePictureInput.value?.click()
}

function handleImageChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
        return
    }

    if (familyMember.value.profile_picture_url?.startsWith('blob:')) {
        URL.revokeObjectURL(familyMember.value.profile_picture_url)
    }

    familyMember.value.profile_picture = file
    familyMember.value.profile_picture_url = URL.createObjectURL(file)
    clearFieldError('profile_picture')
}

async function handleSubmit() {
    validationErrors.value = {}
    error.value = null

    const result = await createFamilyMember({
        ...familyMember.value,
        head_of_family_id: familyMember.value.head_of_family_id || user.value?.head_of_family_id || '',
    })

    if (!result) {
        validationErrors.value = typeof error.value === 'object' && error.value !== null ? error.value : {}
    }
}

watch(
    () => familyMember.value.date_of_birth,
    (newValue) => {
        familyMember.value.age = calculateAge(newValue)
        clearFieldError('date_of_birth')
    },
)

watch(
    () => user.value?.head_of_family_id,
    (newValue) => {
        if (newValue) {
            familyMember.value.head_of_family_id = String(newValue)
        }
    },
    { immediate: true },
)

onMounted(async () => {
    if (!hasPresetHeadOfFamily.value) {
        await headOfFamilyStore.fetchHeadOfFamilies()
    }
})

onBeforeUnmount(() => {
    if (familyMember.value.profile_picture_url?.startsWith('blob:')) {
        URL.revokeObjectURL(familyMember.value.profile_picture_url)
    }
})
</script>

<template>
    <div class="flex flex-col gap-4">
        <header class="flex flex-col gap-2">
            <p class="flex items-center gap-1 font-medium leading-5 text-desa-dark-green">
                <router-link :to="{ name: 'family-member' }" class="leading-5 text-desa-secondary">Anggota
                    Keluarga</router-link>
                <span class="font-medium leading-5 text-desa-dark-green">/</span>
                <span class="font-medium leading-5 text-desa-dark-green">Tambah Anggota Keluarga</span>
            </p>
            <h1 class="font-semibold text-2xl leading-[30px]">Tambah Anggota Keluarga</h1>
        </header>

        <div v-if="generalError" class="rounded-2xl border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {{ generalError }}
        </div>

        <form @submit.prevent="handleSubmit" id="myForm" class="capitalize">
            <div class="shrink-0 rounded-3xl p-6 bg-white flex flex-col gap-6 h-fit">
                <section id="Photo-Profile" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Photo Profile</h2>
                    <div class="flex items-center justify-between flex-1">
                        <div id="Photo-Preview"
                            class="flex justify-center size-[100px] rounded-full overflow-hidden bg-desa-foreshadow">
                            <img :src="familyMember.profile_picture_url" alt="image" class="size-full object-cover" />
                        </div>
                        <div class="relative">
                            <input ref="profilePictureInput" type="file" accept="image/*"
                                class="absolute opacity-0 left-0 w-full top-0 h-full" @change="handleImageChange" />
                            <button id="Upload" type="button"
                                class="relative flex items-center py-4 px-6 rounded-2xl bg-desa-black gap-[10px]"
                                @click="openProfilePicturePicker">
                                <img src="@/assets/images/icons/send-square-white.svg" alt="icon"
                                    class="size-6 shrink-0" />
                                <p class="font-medium leading-5 text-white">Upload</p>
                            </button>
                        </div>
                    </div>
                </section>
                <p v-if="getFieldError('profile_picture')" class="text-sm text-desa-red -mt-2 text-right">
                    {{ getFieldError('profile_picture') }}
                </p>
                <hr class="border-desa-background" />

                <section id="Nama-Keluarga" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Nama Keluarga</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.name" type="text" placeholder="Masukan nama lengkap keluarga"
                            :error-message="getFieldError('name')" :icon="IconProfileSecondaryGreen"
                            :filled-icon="IconProfileBlack" @update:model-value="clearFieldError('name')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Nomor-Induk-Kependudukan" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Nomor Induk
                        Kependudukan</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.identity_number" type="text" placeholder="Ketik NIK"
                            maxlength="16" :error-message="getFieldError('identity_number')"
                            :icon="IconKeyboardSecondaryGreen" :filled-icon="IconKeyboardBlack"
                            @update:model-value="clearFieldError('identity_number')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Pekerjaan" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Pekerjaan</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.occupation" type="text" placeholder="Masukan nama pekerjaan"
                            :error-message="getFieldError('occupation')" :icon="IconBriefcaseSecondaryGreen"
                            :filled-icon="IconBriefcaseBlack" @update:model-value="clearFieldError('occupation')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Tanggal-Lahir" class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Tanggal Lahir</p>
                    <div class="flex items-center gap-6 flex-1 shrink-0">
                        <div class="flex flex-col gap-3 w-full">
                            <Input v-model="familyMember.date_of_birth" type="date" placeholder="Pilih tanggal lahir"
                                :error-message="getFieldError('date_of_birth')" :icon="IconCalendarSecondaryGreen"
                                :filled-icon="IconCalendarBlack" />
                        </div>
                        <div
                            class="w-[180px] flex shrink-0 h-[52px] rounded-2xl bg-desa-foreshadow p-4 font-medium leading-5 text-desa-dark-green justify-center">
                            <p>Umur: <span id="Age">{{ familyMember.age }}</span> tahun</p>
                        </div>
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Jenis-Kelamin" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Jenis Kelamin</h2>
                    <div class="flex flex-1 gap-6 shrink-0">
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
                            <input type="radio" name="gender" class="flex size-[18px] shrink-0 accent-desa-secondary"
                                v-model="familyMember.gender" value="male" @change="clearFieldError('gender')" />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                                Pria
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img src="@/assets/images/icons/man-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                                <img src="@/assets/images/icons/man-dark-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex" alt="icon" />
                            </div>
                        </label>
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
                            <input type="radio" name="gender" class="flex size-[18px] shrink-0 accent-desa-secondary"
                                v-model="familyMember.gender" value="female" @change="clearFieldError('gender')" />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                                Wanita
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img src="@/assets/images/icons/woman-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                                <img src="@/assets/images/icons/woman-dark-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex" alt="icon" />
                            </div>
                        </label>
                    </div>
                </section>
                <p v-if="getFieldError('gender')" class="text-sm text-desa-red -mt-2 text-right">
                    {{ getFieldError('gender') }}
                </p>
                <hr class="border-desa-background" />

                <section id="Status" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Status</h2>
                    <div class="flex flex-1 gap-6 shrink-0">
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
                            <input type="radio" name="status" class="flex size-[18px] shrink-0 accent-desa-secondary"
                                v-model="familyMember.marital_status" value="single"
                                @change="clearFieldError('marital_status')" />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                                Belum Menikah
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img src="@/assets/images/icons/profile-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                                <img src="@/assets/images/icons/profile-dark-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex" alt="icon" />
                            </div>
                        </label>
                        <label
                            class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
                            <input type="radio" name="status" class="flex size-[18px] shrink-0 accent-desa-secondary"
                                v-model="familyMember.marital_status" value="married"
                                @change="clearFieldError('marital_status')" />
                            <span
                                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                                Sudah Menikah
                            </span>
                            <div class="flex size-6 shrink-0">
                                <img src="@/assets/images/icons/profile-2user-secondary-green.svg"
                                    class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                                <img src="@/assets/images/icons/profile-2user-dark-green.svg"
                                    class="size-6 hidden group-has-[:checked]:flex" alt="icon" />
                            </div>
                        </label>
                    </div>
                </section>
                <p v-if="getFieldError('marital_status')" class="text-sm text-desa-red -mt-2 text-right">
                    {{ getFieldError('marital_status') }}
                </p>
                <hr class="border-desa-background" />

                <section id="Kategori-Keluarga" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Kategori Keluarga</h2>
                    <div class="flex-1 grid grid-cols-3 gap-6">
                        <label
                            class="relative flex items-center gap-2 rounded-2xl border border-desa-background p-4 hover:border-transparent hover:bg-desa-foreshadow has-[:checked]:bg-desa-foreshadow hover:ring-[1.5px] hover:ring-desa-dark-green has-[:checked]:ring-[1.5px] has-[:checked]:ring-desa-dark-green transition-all duration-300">
                            <input type="radio" name="relation" value="wife"
                                class="peer flex size-[18px] shrink-0 accent-desa-dark-green"
                                v-model="familyMember.relation" @change="clearFieldError('relation')" />
                            <p
                                class="w-full font-medium text-desa-secondary leading-5 peer-checked:text-desa-dark-green">
                                Istri</p>
                        </label>
                        <label
                            class="relative flex items-center gap-2 rounded-2xl border border-desa-background p-4 hover:border-transparent hover:bg-desa-foreshadow has-[:checked]:bg-desa-foreshadow hover:ring-[1.5px] hover:ring-desa-dark-green has-[:checked]:ring-[1.5px] has-[:checked]:ring-desa-dark-green transition-all duration-300">
                            <input type="radio" name="relation" value="child"
                                class="peer flex size-[18px] shrink-0 accent-desa-dark-green"
                                v-model="familyMember.relation" @change="clearFieldError('relation')" />
                            <p
                                class="w-full font-medium text-desa-secondary leading-5 peer-checked:text-desa-dark-green">
                                Anak</p>
                        </label>
                        <label
                            class="relative flex items-center gap-2 rounded-2xl border border-desa-background p-4 hover:border-transparent hover:bg-desa-foreshadow has-[:checked]:bg-desa-foreshadow hover:ring-[1.5px] hover:ring-desa-dark-green has-[:checked]:ring-[1.5px] has-[:checked]:ring-desa-dark-green transition-all duration-300">
                            <input type="radio" name="relation" value="husband"
                                class="peer flex size-[18px] shrink-0 accent-desa-dark-green"
                                v-model="familyMember.relation" @change="clearFieldError('relation')" />
                            <p
                                class="w-full font-medium text-desa-secondary leading-5 peer-checked:text-desa-dark-green">
                                Suami</p>
                        </label>
                    </div>
                </section>
                <p v-if="getFieldError('relation')" class="text-sm text-desa-red -mt-2 text-right">
                    {{ getFieldError('relation') }}
                </p>
                <hr class="border-desa-background" />

                <section id="Nomor-Handphone" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Nomor Handphone</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.phone_number" type="text" placeholder="Masukan No. HP yang aktif"
                            :error-message="getFieldError('phone_number')" :icon="IconCallSecondaryGreen"
                            :filled-icon="IconCallBlack" @update:model-value="clearFieldError('phone_number')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Head-Of-Family" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Kepala Keluarga</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <div v-if="hasPresetHeadOfFamily"
                            class="flex h-14 items-center rounded-2xl border border-desa-background bg-desa-foreshadow px-4 font-medium text-desa-dark-green">
                            {{ selectedHeadOfFamilyName }}
                        </div>
                        <div v-else class="relative">
                            <select v-model="familyMember.head_of_family_id"
                                class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black py-4 px-4 pr-[52px] gap-2 font-medium transition-all duration-300"
                                :class="getFieldError('head_of_family_id') ? 'ring-red-500 focus:ring-red-500' : ''"
                                @change="clearFieldError('head_of_family_id')">
                                <option value="">Pilih kepala keluarga</option>
                                <option v-for="head in headOfFamilies" :key="head.id" :value="String(head.id)">
                                    {{ head.user?.name ?? '-' }}
                                </option>
                            </select>
                            <img src="@/assets/images/icons/arrow-down-black.svg"
                                class="flex size-6 shrink-0 absolute transform -translate-y-1/2 top-1/2 right-4"
                                alt="icon" />
                        </div>
                        <span v-if="getFieldError('head_of_family_id')" class="text-left text-desa-red text-xs">
                            {{ getFieldError('head_of_family_id') }}
                        </span>
                    </div>
                </section>
                <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />

                <p class="font-medium leading-5">Akun Dashboard</p>

                <section id="Email-Address" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Email Address</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.email" type="email" placeholder="Masukan Email"
                            :error-message="getFieldError('email')" :icon="IconSmsSecondaryGreen"
                            :filled-icon="IconSmsBlack" @update:model-value="clearFieldError('email')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Passwords" class="flex items-center justify-between">
                    <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Passwords</h2>
                    <div class="flex flex-col gap-3 flex-1 shrink-0">
                        <Input v-model="familyMember.password" type="password" placeholder="Masukan Password"
                            :error-message="getFieldError('password')" :icon="IconKeySecondaryGreen"
                            :filled-icon="IconKeyBlack" @update:model-value="clearFieldError('password')" />
                    </div>
                </section>
                <hr class="border-desa-background" />

                <section id="Buttons" class="flex items-center justify-end gap-4">
                    <router-link :to="{ name: 'family-member' }">
                        <div
                            class="py-[18px] rounded-2xl bg-desa-red w-[180px] text-center flex justify-center font-medium text-white">
                            Batal, Tidak jadi</div>
                    </router-link>
                    <button :disabled="loading" id="submitButton" type="submit"
                        class="py-[18px] rounded-2xl disabled:bg-desa-grey w-[180px] text-center flex justify-center font-medium text-white bg-desa-dark-green transition-all duration-300">
                        <span v-if="!loading">Create Now</span>
                        <span v-else>Loading ...</span>
                    </button>
                </section>
            </div>
        </form>
    </div>
</template>
