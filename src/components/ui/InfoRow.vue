<script setup>
defineProps({
    icon: { type: String, required: true },
    value: { type: String, default: '-' },
    label: { type: String, default: '' },
    valueClass: { type: String, default: '' },
    iconBoxClass: { type: String, default: 'bg-desa-foreshadow' },
})
</script>

<template>
    <div class="flex w-full min-w-0 items-center gap-3">
        <div class="flex size-[52px] shrink-0 rounded-2xl items-center justify-center overflow-hidden"
            :class="iconBoxClass">
            <img :src="icon" class="flex size-6 shrink-0" alt="icon">
        </div>
        <div class="flex min-w-0 flex-col gap-1">
            <p class="font-semibold text-lg leading-5" :class="[valueClass, { 'break-all': !valueClass }]">
                {{ value }}
            </p>
            <p v-if="label" class="font-medium text-sm text-desa-secondary">{{ label }}</p>
        </div>
    </div>
</template>
