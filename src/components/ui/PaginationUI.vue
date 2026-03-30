<script setup>
const props = defineProps({
  meta: {
    type: Object,
    required: true,
  },
  serverOptions: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:server-options'])

const updatePage = (page) => {
  if (page < 1 || page > props.meta.last_page || page === props.meta.current_page) {
    return
  }

  emit('update:server-options', {
    ...props.serverOptions,
    page,
  })
}
</script>

<template>
  <nav id="Pagination">
    <ul class="flex items-center gap-3">
      <li class="group">
        <button
          type="button"
          @click="updatePage(meta.current_page - 1)"
          :disabled="meta.current_page === 1"
          :class="{ 'cursor-not-allowed opacity-60': meta.current_page === 1 }"
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green transition-setup"
        >
          <img
            src="@/assets/images/icons/arrow-left-dark-green.svg"
            class="flex size-6 shrink-0 group-hover:hidden"
            alt="icon"
          />
          <img
            src="@/assets/images/icons/arrow-left-foreshadow.svg"
            class="hidden size-6 shrink-0 group-hover:flex"
            alt="icon"
          />
        </button>
      </li>
      <li
        v-for="page in meta.last_page"
        :key="page"
        class="group"
        :class="{ active: page === meta.current_page }"
      >
        <button
          type="button"
          @click="updatePage(page)"
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green group-[.active]:bg-desa-dark-green transition-setup"
        >
          <span
            class="text-desa-dark-green font-semibold group-[.active]:text-desa-foreshadow group-hover:text-desa-foreshadow transition-setup"
          >
            {{ page }}
          </span>
        </button>
      </li>
      <li class="group">
        <button
          type="button"
          @click="updatePage(meta.current_page + 1)"
          :disabled="meta.current_page === meta.last_page"
          :class="{ 'cursor-not-allowed opacity-60': meta.current_page === meta.last_page }"
          class="flex size-11 shrink-0 items-center justify-center rounded-full bg-desa-foreshadow group-hover:bg-desa-dark-green transition-setup"
        >
          <img
            src="@/assets/images/icons/arrow-left-dark-green.svg"
            class="flex size-6 shrink-0 rotate-180 group-hover:hidden"
            alt="icon"
          />
          <img
            src="@/assets/images/icons/arrow-left-foreshadow.svg"
            class="hidden size-6 shrink-0 rotate-180 group-hover:flex"
            alt="icon"
          />
        </button>
      </li>
    </ul>
  </nav>
</template>
