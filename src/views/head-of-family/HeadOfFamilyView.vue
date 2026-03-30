<script setup>
import { formatDate } from '@/helpers/format'
import router from '@/router'
import { useHeadOfFamilyStore } from '@/stores/headOfFamily'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const headOfFamilyStore = useHeadOfFamilyStore()
const { headOfFamily, loading } = storeToRefs(headOfFamilyStore)
const { deleteHeadOfFamily } = headOfFamilyStore

const fallbackImage = 'https://i.pravatar.cc/300'
const showModalDelete = ref(false)
const deleteId = computed(() => route.params.id)

const detail = computed(() => headOfFamily.value ?? {})
const familyMembers = computed(() => detail.value.family_member ?? [])
const familyMemberCount = computed(() => familyMembers.value.length)
const groupedFamilyMembers = computed(() => {
  const relationMap = {
    husband: 'Suami',
    wife: 'Istri',
    child: 'Anak',
  }

  return familyMembers.value.reduce((groups, member) => {
    const relation = member?.relation ?? 'other'
    const existingGroup = groups.find((group) => group.key === relation)

    if (existingGroup) {
      existingGroup.items.push(member)
      return groups
    }

    groups.push({
      key: relation,
      label: relationMap[relation] ?? 'Lainnya',
      items: [member],
    })

    return groups
  }, [])
})

const fetchData = async () => {
  await headOfFamilyStore.fetchHeadOfFamily(route.params.id)
}

function getProfilePicture(value) {
  return value || fallbackImage
}

function formatGender(value) {
  return value === 'male' ? 'Pria' : value === 'female' ? 'Wanita' : '-'
}

function formatMaritalStatus(value) {
  const map = {
    single: 'Belum Menikah',
    married: 'Menikah',
    divorced: 'Cerai',
    widowed: 'Janda/Duda',
  }

  return map[value] ?? '-'
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) {
    return '-'
  }

  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return `${age} Tahun`
}

async function handleDelete() {
  const isDeleted = await deleteHeadOfFamily(deleteId.value)

  if (!isDeleted) {
    return
  }

  showModalDelete.value = false
  await router.replace({ path: '/head-of-family' })
}

onMounted(() => {
  fetchData()
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
            Manage Kepala Rumah
          </p>
        </div>
        <h1 class="font-semibold text-2xl">Manage Kepala Rumah</h1>
      </div>
      <button
        data-modal="Modal-Delete"
        class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-red"
        @click="showModalDelete = true"
      >
        <p class="font-medium text-white">Hapus Data</p>
        <img src="@/assets/images/icons/trash-white.svg" class="flex size-6 shrink-0" alt="icon" />
      </button>
    </div>
    <div class="flex gap-[14px]">
      <div class="flex flex-col w-[calc(525/1000*100%)] shrink-0 gap-[14px]">
        <section id="Kepala-Rumah" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
          <p class="font-medium leading-5 text-desa-secondary">Kepala Rumah</p>
          <div class="flex items-center gap-4">
            <div class="flex size-[76px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
              <img
                :src="getProfilePicture(detail.profile_picture)"
                class="w-full h-full object-cover"
                alt="photo"
              />
            </div>
            <div class="flex flex-col gap-[6px] w-full">
              <p class="font-semibold text-xl line-clamp-1">{{ detail.user?.name ?? '-' }}</p>
              <p class="flex items-center gap-1">
                <img
                  src="@/assets/images/icons/briefcase-secondary-green.svg"
                  class="flex size-[18px] shrink-0"
                  alt="icon"
                />
                <span class="font-medium text-sm text-desa-secondary">{{
                  detail.occupation ?? '-'
                }}</span>
              </p>
            </div>
            <div
              class="badge rounded-full p-3 gap-2 flex w-[100px] items-center justify-center shrink-0 bg-desa-soft-green"
            >
              <span class="font-semibold text-xs text-center text-white uppercase leading-tight">{{
                formatMaritalStatus(detail.marital_status)
              }}</span>
            </div>
          </div>
          <hr class="border-desa-foreshadow" />
          <div class="flex items-center w-full gap-3">
            <div
              class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
            >
              <img
                src="@/assets/images/icons/keyboard-dark-green.svg"
                class="flex size-6 shrink-0"
                alt="icon"
              />
            </div>
            <div class="flex flex-col gap-1 w-full">
              <p class="font-semibold text-xl leading-[22.5px]">
                {{ detail.identity_number ?? '-' }}
              </p>
              <span class="font-medium text-desa-secondary"> Nomor Induk Kependudukan </span>
            </div>
          </div>
          <hr class="border-desa-foreshadow" />
          <div class="flex items-center w-full gap-3">
            <div
              class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
            >
              <img
                src="@/assets/images/icons/user-square-dark-green.svg"
                class="flex size-6 shrink-0"
                alt="icon"
              />
            </div>
            <div class="flex flex-col gap-1 w-full">
              <p class="font-semibold text-xl leading-[22.5px]">
                {{ calculateAge(detail.date_of_birth) }}
              </p>
              <span class="font-medium text-desa-secondary"> Umur Kepala Rumah </span>
            </div>
          </div>
          <hr class="border-desa-foreshadow" />
          <div class="flex items-center w-full gap-3">
            <div
              class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
            >
              <img
                src="@/assets/images/icons/man-dark-green.svg"
                class="flex size-6 shrink-0"
                alt="icon"
              />
            </div>
            <div class="flex flex-col gap-1 w-full">
              <p class="font-semibold text-xl leading-[22.5px]">
                {{ formatGender(detail.gender) }}
              </p>
              <span class="font-medium text-desa-secondary"> Jenis Kelamin </span>
            </div>
          </div>
          <hr class="border-desa-foreshadow" />
          <div class="flex items-center w-full gap-3">
            <div
              class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
            >
              <img
                src="@/assets/images/icons/sms-dark-green.svg"
                class="flex size-6 shrink-0"
                alt="icon"
              />
            </div>
            <div class="flex flex-col gap-1 w-full">
              <p class="font-semibold text-xl leading-[22.5px]">{{ detail.user?.email ?? '-' }}</p>
              <span class="font-medium text-desa-secondary"> Email Address </span>
            </div>
          </div>
          <hr class="border-desa-foreshadow" />
          <div class="flex items-center w-full gap-3">
            <div
              class="flex size-[52px] shrink-0 rounded-2xl bg-desa-foreshadow items-center justify-center"
            >
              <img
                src="@/assets/images/icons/call-dark-green.svg"
                class="flex size-6 shrink-0"
                alt="icon"
              />
            </div>
            <div class="flex flex-col gap-1 w-full">
              <p class="font-semibold text-xl leading-[22.5px]">{{ detail.phone_number ?? '-' }}</p>
              <span class="font-medium text-desa-secondary"> Nomor Hp </span>
            </div>
          </div>
        </section>
        <section id="Anggota-Keluarga" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
          <div class="flex items-center justify-between">
            <div class="flex flex-col gap-[6px]">
              <p class="font-semibold text-[32px] leading-10">{{ familyMemberCount }}</p>
              <p class="font-medium leading-5 text-desa-secondary">Anggota Keluarga</p>
            </div>
            <img
              src="@/assets/images/icons/profile-2user-foreshadow-background.svg"
              class="flex size-12 shrink-0"
              alt="icon"
            />
          </div>
          <hr class="border-desa-foreshadow" />
          <div
            v-for="group in groupedFamilyMembers"
            :key="group.key"
            :id="group.key"
            class="flex flex-col gap-[14px]"
          >
            <p class="font-medium leading-5 text-desa-secondary">
              {{ group.label }} ({{ group.items.length }})
            </p>
            <div
              v-for="member in group.items"
              :key="member.id"
              class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-6"
            >
              <div class="flex items-center gap-4">
                <div
                  class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow"
                >
                  <img
                    :src="getProfilePicture(member.profile_picture ?? 'https://i.pravatar.cc/300')"
                    class="w-full h-full object-cover"
                    alt="photo"
                  />
                </div>
                <div class="flex flex-col gap-[6px] w-full">
                  <p class="font-semibold text-xl line-clamp-1">{{ member.user?.name ?? '-' }}</p>
                  <p class="flex items-center gap-1">
                    <img
                      src="@/assets/images/icons/briefcase-secondary-green.svg"
                      class="flex size-[18px] shrink-0"
                      alt="icon"
                    />
                    <span class="font-medium text-sm text-desa-secondary">{{
                      member.occupation ?? '-'
                    }}</span>
                  </p>
                  <p class="font-medium text-sm text-desa-secondary">
                    {{ formatGender(member.gender) }} -
                    {{ formatMaritalStatus(member.marital_status) }}
                  </p>
                </div>
                <p class="font-medium leading-5 text-nowrap">
                  {{ calculateAge(member.date_of_birth) }}
                </p>
              </div>
              <hr class="border-desa-background" />
              <div class="flex justify-between items-center gap-4">
                <p class="flex items-center gap-1">
                  <img
                    src="@/assets/images/icons/keyboard-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                  <span class="font-medium text-sm text-desa-secondary"
                    >Nomor Induk Kependudukan:</span
                  >
                </p>
                <p class="font-medium leading-5">{{ member.identity_number ?? '-' }}</p>
              </div>
              <div class="flex justify-between items-center gap-4">
                <p class="flex items-center gap-1">
                  <img
                    src="@/assets/images/icons/sms-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                  <span class="font-medium text-sm text-desa-secondary">Email Address:</span>
                </p>
                <p class="font-medium leading-5 text-right">{{ member.user?.email ?? '-' }}</p>
              </div>
              <div class="flex justify-between items-center gap-4">
                <p class="flex items-center gap-1">
                  <img
                    src="@/assets/images/icons/call-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                  <span class="font-medium text-sm text-desa-secondary">Nomor Hp:</span>
                </p>
                <p class="font-medium leading-5">{{ member.phone_number ?? '-' }}</p>
              </div>
              <div class="flex justify-between items-center gap-4">
                <p class="flex items-center gap-1">
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                  <span class="font-medium text-sm text-desa-secondary">Tanggal Lahir:</span>
                </p>
                <p class="font-medium leading-5">
                  {{ member.date_of_birth ? formatDate(member.date_of_birth) : '-' }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <div class="flex flex-col flex-1 shrink-0 gap-[14px]">
        <section id="Recent-Activity" class="flex flex-col rounded-3xl p-6 gap-6 bg-white">
          <p class="font-medium leading-5 text-desa-secondary">Recent Activity</p>
          <div id="Tabs-Button" class="grid grid-cols-3 gap-3">
            <button data-content="Bansos" class="tab-btn group active">
              <div
                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup"
              >
                <span
                  class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup"
                >
                  Bansos
                </span>
              </div>
            </button>
            <button data-content="Events" class="tab-btn group">
              <div
                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup"
              >
                <span
                  class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup"
                >
                  Events
                </span>
              </div>
            </button>
            <button data-content="Applicants" class="tab-btn group">
              <div
                class="flex items-center justify-center rounded-full border border-desa-background py-[14px] px-[18px] group-hover:bg-desa-black group-[.active]:bg-desa-black transition-setup"
              >
                <span
                  class="font-medium leading-5 text-desa-secondary group-hover:text-white group-[.active]:text-white transition-setup"
                >
                  Applicants
                </span>
              </div>
            </button>
          </div>
          <div id="Tabs-Content" class="flex flex-col">
            <div id="Bansos" class="flex flex-col gap-6">
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Tue, 31 Dec 2024</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <p class="font-semibold text-lg">Bantuan Untuk Rakyat Kurang Mampu</p>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow"
                  >
                    <img src="@/assets/images/icons/money-dark-green.svg" alt="icon" />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-lg leading-5">Rp120.000.000</p>
                    <p class="font-medium text-sm text-desa-secondary">Nominal Pengajuan</p>
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-yellow"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Menunggu</span>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Nominal Pengajuan:</p>
                  <p class="font-medium leading-5 text-desa-red">Rp2.500.000</p>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Tue, 25 Dec 2024</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <p class="font-semibold text-lg">Bantuan Pangan Sehari-hari</p>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow"
                  >
                    <img src="@/assets/images/icons/bag-2-dark-green.svg" alt="icon" />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-lg leading-5">Beras 200 Ton</p>
                    <p class="font-medium text-sm text-desa-secondary">Bahan Pokok</p>
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Nominal Pengajuan:</p>
                  <p class="font-medium leading-5 text-desa-red">Beras 2kg</p>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Tue, 12 Dec 2024</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <p class="font-semibold text-lg">Bantuan Untuk anak kurang gizi</p>
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow"
                  >
                    <img src="@/assets/images/icons/bag-2-dark-green.svg" alt="icon" />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold text-lg leading-5">Susu 200 Liter</p>
                    <p class="font-medium text-sm text-desa-secondary">Bahan Pokok</p>
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-red"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Ditolak</span>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Nominal Pengajuan:</p>
                  <p class="font-medium leading-5 text-desa-red">Susu 200ml</p>
                </div>
              </div>
            </div>
            <div id="Events" class="flex flex-col gap-6 hidden">
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Fri, 3 Jan 2025</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/event-image-1.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold leading-5 line-clamp-1">Belajar HTML Dasar Bersama</p>
                    <div class="flex items-center gap-1">
                      <img
                        src="@/assets/images/icons/profile-2user-orange.svg"
                        class="flex size-[18px] shrink-0"
                        alt="icon"
                      />
                      <p class="font-medium text-sm text-desa-orange">9210 total partisipasi</p>
                    </div>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Harga Event:</p>
                  <p class="font-medium leading-5 text-desa-red">Rp49.000</p>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Wed, 1 Jan 2025</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/kk-dashboard-2.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold leading-5 line-clamp-1">
                      Dari Desa ke dunia digital: workshop
                    </p>
                    <div class="flex items-center gap-1">
                      <img
                        src="@/assets/images/icons/profile-2user-orange.svg"
                        class="flex size-[18px] shrink-0"
                        alt="icon"
                      />
                      <p class="font-medium text-sm text-desa-orange">9210 total partisipasi</p>
                    </div>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Harga Event:</p>
                  <p class="font-medium leading-5 text-desa-red">Rp49.000</p>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Sun, 21 Dec 2024</p>
                  <img
                    src="@/assets/images/icons/calendar-2-secondary-green.svg"
                    class="flex size-[18px] shrink-0"
                    alt="icon"
                  />
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/kk-event-desa-3.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div class="flex flex-col gap-[6px] w-full">
                    <p class="font-semibold leading-5 line-clamp-1">
                      Mengenal AI: Menjelajah dunia Kecerdasan
                    </p>
                    <div class="flex items-center gap-1">
                      <img
                        src="@/assets/images/icons/profile-2user-orange.svg"
                        class="flex size-[18px] shrink-0"
                        alt="icon"
                      />
                      <p class="font-medium text-sm text-desa-orange">9210 total partisipasi</p>
                    </div>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center justify-between">
                  <p class="font-medium text-sm text-desa-secondary">Harga Event:</p>
                  <p class="font-medium leading-5 text-desa-red">Rp49.000</p>
                </div>
              </div>
            </div>
            <div id="Applicants" class="flex flex-col gap-6 hidden">
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/event-image-1.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-yellow"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Menunggu</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <p class="font-semibold leading-5">Pembangunan Jalanan Utama</p>
                  <p class="font-medium leading-5 text-desa-secondary">
                    Penanggung jawab:
                    <span class="font-semibold text-desa-dark-green"> Uzumaki Asep </span>
                  </p>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/calendar-2-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">3 Jan 2025</p>
                    <p class="font-medium text-sm text-desa-secondary">Tanggal Pelaksanaan</p>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/timer-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">24 Hari</p>
                    <p class="font-medium text-sm text-desa-secondary">Waktu Pelaksanaan</p>
                  </div>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/event-image-1.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-dark-green"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Diterima</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <p class="font-semibold leading-5">Pembangunan Jalanan Utama</p>
                  <p class="font-medium leading-5 text-desa-secondary">
                    Penanggung jawab:
                    <span class="font-semibold text-desa-dark-green"> Uzumaki Asep </span>
                  </p>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/calendar-2-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">3 Jan 2025</p>
                    <p class="font-medium text-sm text-desa-secondary">Tanggal Pelaksanaan</p>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/timer-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">24 Hari</p>
                    <p class="font-medium text-sm text-desa-secondary">Waktu Pelaksanaan</p>
                  </div>
                </div>
              </div>
              <div class="card flex flex-col rounded-2xl border border-desa-background p-4 gap-4">
                <div class="flex items-center justify-between gap-3">
                  <div
                    class="flex w-20 h-[60px] shrink-0 items-center justify-center rounded-2xl bg-desa-foreshadow overflow-hidden"
                  >
                    <img
                      src="@/assets/images/thumbnails/event-image-1.png"
                      class="w-full h-full object-cover"
                      alt="thumbnail"
                    />
                  </div>
                  <div
                    class="badge rounded-full p-3 gap-2 flex w-[100px] justify-center shrink-0 bg-desa-red"
                  >
                    <span class="font-semibold text-xs text-white uppercase">Ditolak</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <p class="font-semibold leading-5">Pembangunan Jalanan Utama</p>
                  <p class="font-medium leading-5 text-desa-secondary">
                    Penanggung jawab:
                    <span class="font-semibold text-desa-dark-green"> Uzumaki Asep </span>
                  </p>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/calendar-2-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">3 Jan 2025</p>
                    <p class="font-medium text-sm text-desa-secondary">Tanggal Pelaksanaan</p>
                  </div>
                </div>
                <hr class="border-desa-background" />
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 rounded-full bg-desa-foreshadow overflow-hidden items-center justify-center"
                  >
                    <img
                      src="@/assets/images/icons/timer-dark-green.svg"
                      class="flex size-6"
                      alt="icon"
                    />
                  </div>
                  <div>
                    <p class="font-semibold leading-5 text-desa-dark-green">24 Hari</p>
                    <p class="font-medium text-sm text-desa-secondary">Waktu Pelaksanaan</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
  <div
    id="Modal-Delete"
    class="modal fixed inset-0 h-screen z-40 flex bg-[#080C1ACC]"
    :class="showModalDelete ? 'block' : 'hidden'"
  >
    <div
      id="Alert"
      class="flex flex-col w-[335px] shrink-0 rounded-2xl overflow-hidden bg-white m-auto"
    >
      <div class="flex items-center justify-between p-4 gap-3 bg-desa-black">
        <p class="font-medium leading-5 text-white">Hapus Kepala Keluarga?</p>
        <button class="btn-close-modal" @click="showModalDelete = false">
          <img
            src="@/assets/images/icons/close-circle-white.svg"
            class="flex size-6 shrink-0"
            alt="icon"
          />
        </button>
      </div>
      <div class="flex flex-col p-4 gap-3">
        <p class="font-medium text-sm leading-[22.5px] text-desa-secondary">
          Tindakan ini permanen dan tidak bisa dibatalkan!
        </p>
        <hr class="border-desa-background" />
        <div class="flex items-center gap-3">
          <button
            class="btn-close-modal flex items-center h-14 rounded-2xl py-3 px-8 gap-[10px] border border-desa-background hover:bg-desa-black hover:text-white transition-setup"
            @click="showModalDelete = false"
          >
            <span class="font-semibold text-sm">Batal</span>
          </button>
          <button
            class="flex items-center justify-center h-14 rounded-2xl py-3 px-8 gap-[10px] bg-desa-red w-full"
            @click="handleDelete"
            :disabled="loading"
          >
            <span v-if="!loading" class="flex items-center gap-2">
              <img
                src="@/assets/images/icons/trash-white.svg"
                class="flex size-6 shrink-0"
                alt=""
              />
              <span class="font-semibold text-sm text-white">Iya Hapus</span>
            </span>
            <span v-else class="flex items-center justify-center gap-2 w-full">
              <span class="font-semibold text-sm text-white animate-pulse">Loading...</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
