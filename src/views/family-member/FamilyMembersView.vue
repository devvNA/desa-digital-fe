<script setup>
import { useAuthStore } from '@/stores/auth'
import { useFamilyMemberStore } from '@/stores/familyMember'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'


const familyMemberStore = useFamilyMemberStore()
const { familyMembers, success, error } = storeToRefs(familyMemberStore)

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const generalError = computed(() => {
    if (typeof error.value === 'string') {
        return error.value
    }

    if (error.value && typeof error.value === 'object') {
        return 'Terjadi kesalahan saat memuat data anggota keluarga.'
    }

    return null
})

onMounted(() => {
    familyMemberStore.fetchFamilyMembers()
})

const relationMap = {
    husband: 'Suami',
    wife: 'Istri',
    child: 'Anak',
}

function getManageRoute(member, type) {
    return {
        name: 'manage-family-member',
        params: { id: member?.id },
        query: { type },
    }
}

const groupedFamilyMembers = computed(() => {
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

</script>

<template>
    <div class="flex flex-col gap-4">
        <header class="flex items-center justify-between">
            <h1 class="font-semibold text-2xl leading-[30px]">Anggota Keluarga</h1>
            <router-link :to="{ name: 'create-family-member' }" class="shrink-0">
                <div class="px-6 py-4 rounded-2xl bg-desa-dark-green flex items-center gap-[10px]">
                    <img src="@/assets/images/icons/add-square-white.svg" alt="icon" class="size-6 shrink-0" />
                    <p class="font-medium leading-5 text-white">Add New</p>
                </div>
            </router-link>
        </header>

        <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl relative"
            role="alert">
            <span class="block sm:inline">{{ success }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="success = null">
                <img src="@/assets/images/icons/close-circle-secondary-green.svg" class="flex size-6 shrink-0"
                    alt="icon" />
            </button>
        </div>

        <div v-if="generalError"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl relative" role="alert">
            <span class="block sm:inline">{{ generalError }}</span>
            <button type="button" class="absolute top-1/2 -translate-y-1/2 right-4" @click="error = null">
                <img src="@/assets/images/icons/close-circle-white.svg" class="flex size-6 shrink-0" alt="icon" />
            </button>
        </div>

        <section id="Kepala-Keluarga" class="flex flex-col gap-6 p-6 bg-white rounded-3xl">
            <h2 class="font-medium leading-5 text-desa-secondary">Kepala Keluarga</h2>
            <div class="data rounded-2xl border border-desa-background p-6 flex justify-between">
                <div class="name flex items-center gap-3 min-w-[240px]">
                    <div class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
                        <img :src="user?.profile_picture" class="w-full h-full object-cover" alt="photo" />
                    </div>
                    <div class="flex flex-col gap-[6px]">
                        <h3 class="font-semibold text-lg leading-[22.5px] line-clamp-1">{{ user?.name }}</h3>
                        <div class="flex items-center gap-1">
                            <img src="@/assets/images/icons/briefcase-secondary-green.svg" alt="icon"
                                class="size-[18px] shrink-0" />
                            <p class="font-medium leading-5 text-desa-secondary line-clamp-1">{{ user?.occupation }}</p>
                        </div>
                    </div>
                </div>
                <div class="nik flex flex-col gap-[6px] min-w-[155px]">
                    <div class="flex items-center gap-1">
                        <img src="@/assets/images/icons/keyboard-secondary-green.svg" alt="icon"
                            class="size-[18px] shrink-0" />
                        <h3 class="font-medium leading-[17.5px] text-sm text-desa-secondary">NIK</h3>
                    </div>
                    <p class="font-semibold leading-5">{{ user?.identity_number }}</p>
                </div>
                <div class="umur flex flex-col gap-[6px] min-w-[92px]">
                    <div class="flex items-center gap-1">
                        <img src="@/assets/images/icons/timer-secondary-green.svg" alt="icon"
                            class="size-[18px] shrink-0" />
                        <h3 class="font-medium leading-[17.5px] text-sm text-desa-secondary">Umur</h3>
                    </div>
                    <p class="font-semibold leading-5">{{ user?.age }} Tahun</p>
                </div>
                <router-link
                    :to="{ name: 'manage-family-member-by-head-of-family', params: { id: user?.head_of_family_id } }"
                    class="shrink-0">
                    <div class="rounded-2xl px-6 py-[18px] bg-desa-black font-medium leading-5 text-white">View Detail
                    </div>
                </router-link>
            </div>
        </section>
        <section v-for="group in groupedFamilyMembers" :key="group.key" :id="group.label"
            class="flex flex-col gap-6 p-6 bg-white rounded-3xl">
            <h2 class="font-medium leading-5 text-desa-secondary">{{ group.label }} ({{ group.items.length }})</h2>
            <div v-for="member in group.items" :key="member.id"
                class="data rounded-2xl border border-desa-background p-6 flex items-center justify-between">
                <div class="name flex items-center gap-3 min-w-[240px]">
                    <div class="flex size-[64px] shrink-0 rounded-full overflow-hidden bg-desa-foreshadow">
                        <img :src="member.profile_picture" class="w-full h-full object-cover" alt="photo" />
                    </div>
                    <div class="flex flex-col gap-[6px]">
                        <h3 class="font-semibold text-lg leading-[22.5px] line-clamp-1">{{ member.user?.name }}</h3>
                        <div class="flex items-center gap-1">
                            <img src="@/assets/images/icons/briefcase-secondary-green.svg" alt="icon"
                                class="size-[18px] shrink-0" />
                            <p class="font-medium leading-5 text-desa-secondary line-clamp-1">{{ member.occupation }}
                            </p>
                        </div>
                    </div>
                </div>
                <div class="nik flex flex-col gap-[6px] min-w-[155px]">
                    <div class="flex items-center gap-1">
                        <img src="@/assets/images/icons/keyboard-secondary-green.svg" alt="icon"
                            class="size-[18px] shrink-0" />
                        <h3 class="font-medium leading-[17.5px] text-sm text-desa-secondary">NIK</h3>
                    </div>
                    <p class="font-semibold leading-5">{{ member.identity_number }}</p>
                </div>
                <div class="umur flex flex-col gap-[6px] min-w-[92px]">
                    <div class="flex items-center gap-1">
                        <img src="@/assets/images/icons/timer-secondary-green.svg" alt="icon"
                            class="size-[18px] shrink-0" />
                        <h3 class="font-medium leading-[17.5px] text-sm text-desa-secondary">Umur</h3>
                    </div>
                    <p class="font-semibold leading-5">{{ member.age }} Tahun</p>
                </div>
                <router-link :to="getManageRoute(member, 'family-member')" class="shrink-0">
                    <div class="rounded-2xl px-6 py-[18px] bg-desa-black font-medium leading-5 text-white">Manage</div>
                </router-link>
            </div>
        </section>
    </div>
</template>
