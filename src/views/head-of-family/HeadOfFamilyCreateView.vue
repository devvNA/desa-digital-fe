<script setup>
import IconBriefcaseBlack from "@/assets/images/icons/briefcase-black.svg";
import IconBriefcaseSecondaryGreen from "@/assets/images/icons/briefcase-secondary-green.svg";
import IconCallBlack from "@/assets/images/icons/call-black.svg";
import IconCallSecondaryGreen from "@/assets/images/icons/call-secondary-green.svg";
import IconKeyBlack from "@/assets/images/icons/key-black.svg";
import IconKeySecondaryGreen from "@/assets/images/icons/key-secondary-green.svg";
import IconKeyboardBlack from "@/assets/images/icons/keyboard-black.svg";
import IconKeyboardSecondaryGreen from "@/assets/images/icons/keyboard-secondary-green.svg";
import IconProfileBlack from "@/assets/images/icons/profile-circle-black.svg";
import IconProfileSecondaryGreen from "@/assets/images/icons/profile-circle-secondary-green.svg";
import IconSmsBlack from "@/assets/images/icons/sms-black.svg";
import IconSmsSecondaryGreen from "@/assets/images/icons/sms-secondary-green.svg";
import Input from "@/components/ui/Input.vue";
import { useHeadOfFamilyStore } from "@/stores/headOfFamily";
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";

const headOfFamilyStore = useHeadOfFamilyStore();
const { loading, error } = storeToRefs(headOfFamilyStore);
const { createHeadOfFamily } = headOfFamilyStore;
const validationErrors = ref({});

const headOfFamily = ref({
  name: null,
  email: null,
  password: null,
  profile_picture: null,
  profile_picture_url: null,
  identity_number: null,
  gender: null,
  date_of_birth: null,
  age: null,
  phone_number: null,
  occupation: null,
  marital_status: null,
});

const handleSubmit = async () => {
  await createHeadOfFamily(headOfFamily.value);
};

const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    headOfFamily.value.profile_picture = file;
    headOfFamily.value.profile_picture_url = URL.createObjectURL(file);
  }
};

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

watch(() => headOfFamily.value.date_of_birth, (newVal) => {
  headOfFamily.value.age = calculateAge(newVal)
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div id="Header" class="flex items-center justify-between">
      <div class="flex flex-col gap-2">
        <div class="flex gap-1 items-center leading-5 text-desa-secondary">
          <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
            Kepala Rumah
          </p>
          <span>/</span>
          <p class="last-of-type:text-desa-dark-green last-of-type:font-semibold capitalize">
            Tambah Kepala Rumah
          </p>
        </div>
        <h1 class="font-semibold text-2xl">Tambah Kepala Rumah Baru</h1>
      </div>
    </div>
    <form @submit.prevent="handleSubmit" id="myForm" class="capitalize">
      <div class="shrink-0 rounded-3xl p-6 bg-white flex flex-col gap-6 h-fit">
        <section id="Photo-Profile" class="flex items-center justify-between">
          <h2 class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Profile Kepala Rumah
          </h2>
          <div class="flex-1 flex items-center justify-between">
            <div id="Photo-Preview"
              class="flex itce justify-center size-[100px] rounded-full overflow-hidden bg-desa-foreshadow">
              <img id="Photo" :src="headOfFamily.profile_picture_url" alt="image" class="size-full object-cover" />
            </div>
            <div class="relative">
              <input required id="File" type="file" name="file" class="absolute opacity-0 left-0 w-full top-0 h-full"
                @change="handleImageChange" ref="profile_picture" />
              <button id="Upload" type="button"
                class="relative flex items-center py-4 px-6 rounded-2xl bg-desa-black gap-[10px]"
                @click="$refs.profile_picture.click()">
                <img src="@/assets/images/icons/send-square-white.svg" alt="icon" c lass="size-6 shrink-0" />
                <p class="font-medium leading-5 text-white">Upload</p>
              </button>
            </div>
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Nama-Kepala-Rumah" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Nama Kepala Rumah
          </p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.name" type="text" placeholder="Masukan nama kepala rumah"
              :error-message="validationErrors.name || error?.name" :icon="IconProfileSecondaryGreen"
              :filled-icon="IconProfileBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="NIK" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Nomor Induk Kependudukan
          </p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.identity_number" type="text" placeholder="Ketik NIK" maxlength="16"
              :error-message="validationErrors.identity_number || error?.identity_number"
              :icon="IconKeyboardSecondaryGreen" :filled-icon="IconKeyboardBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Phone" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Nomor Handphone
          </p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.phone_number" type="text" placeholder="Masukan No. HP yang aktif"
              :error-message="validationErrors.phone_number || error?.phone_number" :icon="IconCallSecondaryGreen"
              :filled-icon="IconCallBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Pekerjaan" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Pekerjaan</p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.occupation" type="text" placeholder="Masukan nama pekerjaan"
              :error-message="validationErrors.occupation || error?.occupation" :icon="IconBriefcaseSecondaryGreen"
              :filled-icon="IconBriefcaseBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Tanggal-Lahir" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Tanggal Lahir
          </p>
          <div class="flex items-center gap-6 flex-1 shrink-0">
            <label class="relative group peer w-full valid">
              <input v-model="headOfFamily.date_of_birth" required type="date" id="birthdate"
                placeholder="Masukan tanggal lahir"
                class="appearance-none outline-none w-full h-14 rounded-2xl ring-[1.5px] ring-desa-background focus:ring-desa-black p-4 pl-12 gap-2 font-medium invalid:text-desa-secondary transition-all duration-300 [&::-webkit-calendar-picker-indicator]:hidden"
                onclick="this.showPicker()" />
              <div class="absolute transform -translate-y-1/2 top-1/2 left-4 flex size-6 shrink-0">
                <img src="@/assets/images/icons/calendar-2-secondary-green.svg"
                  class="size-6 hidden group-has-[:invalid]:flex" alt="icon" />
                <img src="@/assets/images/icons/calendar-2-black.svg" class="size-6 flex group-has-[:invalid]:hidden"
                  alt="icon" />
              </div>
              <img src="@/assets/images/icons/Checklist-dark-green-fill.svg"
                class="absolute transform -translate-y-1/2 top-1/2 right-4 size-6 shrink-0 hidden group-[.valid]:flex"
                alt="icon" />
            </label>
            <div
              class="w-[180px] flex shrink-0 h-[52px] rounded-2xl bg-desa-foreshadow p-4 font-medium leading-5 text-desa-dark-green justify-center">
              <p>Umur: <span id="Age">{{ headOfFamily.age }}</span> tahun</p>
            </div>
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Jenis-Kelamin" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Jenis Kelamin
          </p>
          <div class="flex flex-1 gap-6 shrink-0">
            <label
              class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
              <input type="radio" name="gender" id=""
                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                v-model="headOfFamily.gender" value="male" />
              <span
                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                Pria
              </span>
              <div class="flex size-6 shrink-0">
                <img src="@/assets/images/icons/man-secondary-green.svg" class="size-6 flex group-has-[:checked]:hidden"
                  alt="icon" />
                <img src="@/assets/images/icons/man-dark-green.svg" class="size-6 hidden group-has-[:checked]:flex"
                  alt="icon" />
              </div>
            </label>
            <label
              class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
              <input type="radio" name="gender" id=""
                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                v-model="headOfFamily.gender" value="female" />
              <span
                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                Wanita
              </span>
              <div class="flex size-6 shrink-0">
                <img src="@/assets/images/icons/woman-secondary-green.svg"
                  class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                <img src="@/assets/images/icons/woman-dark-green.svg" class="size-6 hidden group-has-[:checked]:flex"
                  alt="icon" />
              </div>
            </label>
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Status" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Status</p>
          <div class="flex flex-1 gap-6 shrink-0">
            <label
              class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
              <input type="radio" name="status" id=""
                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                v-model="headOfFamily.marital_status" value="single" />
              <span
                class="font-medium leading-5 text-desa-secondary w-full group-has-[:checked]:text-desa-dark-green transition-setup">
                Belum Menikah
              </span>
              <div class="flex size-6 shrink-0">
                <img src="@/assets/images/icons/profile-secondary-green.svg"
                  class="size-6 flex group-has-[:checked]:hidden" alt="icon" />
                <img src="@/assets/images/icons/profile-dark-green.svg" class="size-6 hidden group-has-[:checked]:flex"
                  alt="icon" />
              </div>
            </label>
            <label
              class="group flex w-full items-center h-14 rounded-2xl p-4 ring-[1.5px] ring-desa-background gap-2 has-[:checked]:ring-desa-dark-green transition-setup">
              <input type="radio" name="status" id=""
                class="flex size-[18px] shrink-0 accent-desa-secondary checked:accent-desa-dark-green transition-setup"
                v-model="headOfFamily.marital_status" value="married" />
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
        <hr class="border-desa-background w-[calc(100%+48px)] -mx-6" />
        <p class="font-medium leading-5">Akun Dashboard</p>
        <section id="Email" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">
            Email Address
          </p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.email" type="email" placeholder="Masukan Email"
              :error-message="validationErrors.email || error?.email" :icon="IconSmsSecondaryGreen"
              :filled-icon="IconSmsBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Passwords" class="flex items-center justify-between">
          <p class="font-medium leading-5 text-desa-secondary w-[calc(424/904*100%)]">Passwords</p>
          <div class="flex flex-col gap-3 flex-1 shrink-0">
            <Input v-model="headOfFamily.password" type="password" placeholder="Masukan Password"
              :error-message="validationErrors.password || error?.password" :icon="IconKeySecondaryGreen"
              :filled-icon="IconKeyBlack" />
          </div>
        </section>
        <hr class="border-desa-background" />
        <section id="Buttons" class="flex items-center justify-end gap-4">
          <RouterLink :to="{ name: 'head-of-family' }">
            <div
              class="py-[18px] rounded-2xl bg-desa-red w-[180px] text-center flex justify-center font-medium text-white">
              Batal, Tidak jadi
            </div>
          </RouterLink>
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
