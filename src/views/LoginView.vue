<script setup>
import IconKeyBlack from '@/assets/images/icons/key-black.svg'
import IconKeySecondaryGreen from '@/assets/images/icons/key-secondary-green.svg'
import IconProfileBlack from '@/assets/images/icons/profile-circle-black.svg'
import IconProfileSecondaryGreen from '@/assets/images/icons/profile-circle-secondary-green.svg'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

const authStore = useAuthStore()
const { loading, error, success } = storeToRefs(authStore)

const form = ref({
  role: '',
  email: '',
  password: '',
})

const validationErrors = ref({})

const handleSubmit = async () => {
  validationErrors.value = {}
  authStore.resetFeedback()

  let isValid = true

  if (!form.value.role) {
    validationErrors.value.role = ['Pilih role kamu terlebih dahulu']
    isValid = false
  }

  if (!form.value.email) {
    validationErrors.value.email = ['Email Address harus diisi']
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    validationErrors.value.email = ['Format Email tidak valid']
    isValid = false
  }

  if (!form.value.password) {
    validationErrors.value.password = ['Password harus diisi']
    isValid = false
  } else if (form.value.password.length < 8) {
    validationErrors.value.password = ['Password minimal 8 karakter']
    isValid = false
  }

  if (!isValid) return

  const result = await authStore.login({ ...form.value })

  if (result.success) {
    alert(success.value || 'Login berhasil')
    return
  }

  if (error.value === 'Unauthorized' || String(error.value).includes('401')) {
    form.value.password = ''
    validationErrors.value.password = ['Email atau Password Salah']
    alert('Login gagal. Email atau password salah.')
  } else if (typeof error.value === 'object' && error.value !== null) {
    validationErrors.value = { ...validationErrors.value, ...error.value }
    alert('Login gagal. Periksa kembali data yang diinput.')
  } else if (typeof error.value === 'string' && error.value) {
    alert(error.value)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" novalidate class="flex items-center justify-center flex-1">
    <div class="flex flex-col h-fit w-fit shrink-0 rounded-3xl p-6 gap-6 bg-white">
      <header class="flex flex-col items-center">
        <img
          src="@/assets/images/logos/logo-text.svg"
          alt="icon"
          class="shrink-0 h-[38px] w-[200px] object-contain mb-8"
        />
      </header>
      <div class="flex flex-col gap-2">
        <h1 class="font-semibold text-[20px] leading-[28px] text-center">
          Halo🙌🏻 , Selamat Datang!
        </h1>
        <p class="font-medium text-sm leading-5 text-desa-secondary text-center">
          Silahkan masuk untuk melanjutkan
        </p>
      </div>
      <div class="flex flex-col gap-1">
        <section id="Select" class="grid grid-cols-2 gap-4 relative">
          <div
            class="group relative flex items-center justify-between p-4 rounded-xl bg-white ring-[1px] ring-desa-background hover:bg-desa-foreshadow has-[:checked]:bg-desa-foreshadow has-[:checked]:ring-desa-dark-green transition-all duration-300"
            :class="{ 'ring-red-500': validationErrors.role && !form.role }"
          >
            <input
              id="Kepala-Desa"
              required
              type="radio"
              name="role"
              v-model="form.role"
              value="kepala_desa"
              class="peer absolute left-0 right-0 top-0 bottom-0 z-50 opacity-0 cursor-pointer"
            />
            <p
              class="font-medium text-sm leading-5 text-desa-secondary group-hover:text-desa-dark-green group-has-[:checked]:text-desa-dark-green transition-all duration-300"
              :class="{
                'text-desa-red group-hover:text-desa-red group-has-[:checked]:text-desa-red':
                  validationErrors.role && !form.role,
              }"
            >
              Kepala Desa
            </p>
            <div class="relative">
              <img
                src="@/assets/images/icons/crown-secondary-green.svg"
                alt="icon"
                class="shrink-0 h-[20px] w-[20px] group-hover:opacity-0 group-has-[:checked]:opacity-0 absolute transition-all duration-300"
              />
              <img
                src="@/assets/images/icons/crown-dark-green.svg"
                alt="icon"
                class="shrink-0 h-[20px] w-[20px] group-hover:opacity-100 group-has-[:checked]:opacity-100 opacity-0 transition-all duration-300"
              />
            </div>
          </div>
          <div
            class="group relative flex items-center justify-between p-4 rounded-xl bg-white ring-[1px] ring-desa-background hover:bg-desa-foreshadow has-[:checked]:bg-desa-foreshadow has-[:checked]:ring-desa-dark-green transition-all duration-300"
            :class="{ 'ring-red-500': validationErrors.role && !form.role }"
          >
            <input
              id="Kepala-Rumah"
              required
              type="radio"
              name="role"
              v-model="form.role"
              value="kepala_rumah"
              class="peer absolute left-0 right-0 top-0 bottom-0 z-50 opacity-0 cursor-pointer"
            />
            <p
              class="font-medium text-sm leading-5 text-desa-secondary group-hover:text-desa-dark-green group-has-[:checked]:text-desa-dark-green transition-all duration-300"
              :class="{
                'text-desa-red group-hover:text-desa-red group-has-[:checked]:text-desa-red':
                  validationErrors.role && !form.role,
              }"
            >
              Kepala Rumah
            </p>
            <div class="relative">
              <img
                src="@/assets/images/icons/profile-circle-secondary-green.svg"
                alt="icon"
                class="shrink-0 h-[20px] w-[20px] group-hover:opacity-0 group-has-[:checked]:opacity-0 absolute transition-all duration-300"
              />
              <img
                src="@/assets/images/icons/profile-circle-dark-green.svg"
                alt="icon"
                class="shrink-0 h-[20px] w-[20px] group-hover:opacity-100 group-has-[:checked]:opacity-100 opacity-0 transition-all duration-300"
              />
            </div>
          </div>
        </section>
        <span class="text-left text-desa-red" style="font-size: 14px" v-if="validationErrors.role">
          {{ validationErrors.role[0] }}
        </span>
      </div>

      <section id="Inputs" class="flex flex-col gap-2">
        <div id="Email-Address" class="flex flex-col gap-2">
          <h2
            class="font-medium text-sm leading-5 text-desa-secondary"
            :class="{ 'text-desa-red': validationErrors.email || error?.email }"
          >
            Email Address
          </h2>

          <Input
            v-model="form.email"
            type="email"
            placeholder="Ketik Email Kamu"
            :error-message="validationErrors.email || error?.email"
            :icon="IconProfileSecondaryGreen"
            :filled-icon="IconProfileBlack"
          />
        </div>
        <div id="Password" class="flex flex-col gap-2">
          <h2
            class="font-medium text-sm leading-5 text-desa-secondary"
            :class="{ 'text-desa-red': validationErrors.password || error?.password }"
          >
            Password
          </h2>

          <Input
            v-model="form.password"
            type="password"
            placeholder="Ketik Password Kamu"
            :error-message="validationErrors.password || error?.password"
            :icon="IconKeySecondaryGreen"
            :filled-icon="IconKeyBlack"
          />
        </div>
      </section>

      <Button type="submit" label="Masuk" :loading="loading" />
    </div>
  </form>
  <section id="Banner" class="relative flex w-full max-w-[634px]">
    <div class="fixed top-0 h-screen w-full max-w-[634px] overflow-hidden pr-3 py-3">
      <div class="h-full w-[622px] rounded-3xl gradient-vertical pt-[59px] pb-[60px]">
        <img
          src="@/assets/images/backgrounds/bg-signin.png"
          class="h-full w-[542px] object-contain mx-auto"
          alt="banner"
        />
      </div>
    </div>
  </section>
</template>
