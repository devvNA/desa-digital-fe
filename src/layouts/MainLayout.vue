<script setup>
import Topbar from '@/components/Topbar.vue'
import SidebarComponent from '@/components/sidebar/SidebarComponent.vue'
</script>

<template>
    <div class="flex min-h-screen">
        <SidebarComponent />
        <main class="flex flex-col flex-1">
            <Topbar />
            <div class="flex-1 p-6">
                <router-view />
            </div>
        </main>
    </div>
</template>
