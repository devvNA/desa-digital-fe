<script setup>
import SidebarComponent from '@/components/sidebar/SidebarComponent.vue';
import TopbarComponent from '@/components/TopbarComponent.vue';
</script>

<template>
  <div class="flex min-h-screen">
    <SidebarComponent />
    <main class="flex flex-col flex-1">
      <TopbarComponent />
      <div class="flex-1 p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
