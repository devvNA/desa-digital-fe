<script setup>
</script>

<template>
    <div class="flex flex-col gap-4">
        <div id="Header" class="flex items-center justify-between">
            <div class="flex flex-col gap-2">
                <h1 class="font-semibold text-2xl">Profile Desa</h1>
            </div>
            <a href="kd-profile-desa-edit.html"
                class="flex items-center rounded-2xl py-4 px-6 gap-[10px] bg-desa-black">
                <p class="font-medium text-white">Ubah Data</p>
                <img src="@/assets/images/icons/edit-white.svg" class="flex size-6 shrink-0" alt="icon">
            </a>
        </div>
        <div class="flex gap-[14px]">
            <section id="Nama-Desa"
                class="flex flex-col shrink-0 w-[calc(565/1000*100%)] h-fit rounded-3xl p-6 gap-6 bg-white">
                <div class="flex items-center justify-between">
                    <p class="font-medium leading-5 text-desa-secondary">Nama Desa</p>
                    <img src="@/assets/images/icons/building-foreshadow-background.svg" class="flex size-12 shrink-0"
                        alt="icon">
                </div>
                <div id="Nama-Desa" class="flex flex-col gap-[6px]">
                    <h1 class="font-bold text-[32px] leading-10">Desa Angga Countryside</h1>
                    <div class="flex items-center gap-0.5">
                        <img src="@/assets/images/icons/location-secondary-green.svg" class="flex size-6 shrink-0"
                            alt="icon">
                        <span class="font-medium text-sm text-desa-secondary">Jakarta, Indoneia</span>
                    </div>
                </div>
                <div id="Gallery" class="flex flex-col gap-[14px]">
                    <div data-modal="Modal-Gallery" data-gallery="@/assets/images/thumbnails/desa-gallery-1.png"
                        id="Thumbnail-Desa"
                        class="flex w-[492px] h-[300px] shrink-0 rounded-3xl bg-desa-background overflow-hidden">
                        <img src="@/assets/images/thumbnails/desa-gallery-1.png" class="w-full h-full object-cover"
                            alt="thumbnail">
                    </div>
                    <div class="grid grid-cols-3 gap-[14px] w-[492px]">
                        <button data-modal="Modal-Gallery" data-gallery="@/assets/images/thumbnails/desa-gallery-2.png"
                            class="relative">
                            <div
                                class="thumbnail-selection flex w-full h-[120px] shrink-0 rounded-3xl bg-desa-background overflow-hidden">
                                <img src="@/assets/images/thumbnails/desa-gallery-2.png"
                                    class="w-full h-full object-cover" alt="thumbnail">
                            </div>
                        </button>
                        <button data-modal="Modal-Gallery" data-gallery="@/assets/images/thumbnails/desa-gallery-3.png"
                            class="relative">
                            <div
                                class="thumbnail-selection flex w-full h-[120px] shrink-0 rounded-3xl bg-desa-background overflow-hidden">
                                <img src="@/assets/images/thumbnails/desa-gallery-3.png"
                                    class="w-full h-full object-cover" alt="thumbnail">
                            </div>
                        </button>
                        <button data-modal="Modal-Gallery" data-gallery="@/assets/images/thumbnails/desa-gallery-4.png"
                            class="relative">
                            <div
                                class="thumbnail-selection flex w-full h-[120px] shrink-0 rounded-3xl bg-desa-background overflow-hidden">
                                <img src="@/assets/images/thumbnails/desa-gallery-4.png"
                                    class="w-full h-full object-cover" alt="thumbnail">
                            </div>
                            <div
                                class="absolute inset-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center bg-[#001B1ACC] text-white">
                                <p class="font-semibold text-xl leading-6">2+</p>
                                <p class="font-semibold text-sm text-white">Photo</p>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Tentang Desa</p>
                    <p class="font-medium leading-8">Desa Angga Countryside terletak di kaki gunung ðŸ”ï¸ dengan
                        udara sejuk dan pemandangan sawah yang hijau ðŸŒ¿. Warganya ramah dan masih menjaga
                        tradisi gotong-royong. Penghasilan utama desa ini adalah padi ðŸš, kopi â˜•, dan kerajinan
                        anyaman bambu ðŸŽ‹. Desa ini juga memiliki wisata alam seperti air terjun kecil ðŸ’§ dan
                        jalur tracking.</p>
                </div>
                <div class="flex flex-col gap-3">
                    <p class="font-medium text-sm text-desa-secondary">Peta Desa</p>
                    <div class="rounded-2xl overflow-hidden max-w-full w-full !h-[350px]">
                        <div id="embedded-map-display" class="size-full max-w-full">
                            <iframe class="size-full border-0" frameborder="0"
                                src="https://www.google.com/maps/embed/v1/place?q=Kelurahan+Sukajaya&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"></iframe>
                        </div>
                    </div>
                    <p class="font-medium text-sm leading-[28px] text-desa-secondary"> Jl. Mawar No. 45, RT
                        02/RW 03, Kelurahan Sukajaya, Kecamatan Sukarame, Kota Jakarta, Jawa Barat, 40286</p>
                </div>
            </section>
            <section id="Detail-Desa" class="flex flex-col flex-1 h-fit shrink-0 rounded-3xl p-6 gap-6 bg-white">
                <p class="font-medium leading-5 text-desa-secondary">Detail Desa</p>
                <div class="flex flex-col gap-[14px]">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div class="flex size-[54px] rounded-full bg-desa-foreshadow overflow-hidden">
                            <img src="@/assets/images/photos/kk-photo-1.png" class="w-full h-full object-cover"
                                alt="icon">
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5 text-desa-black">Bimore Wecaksono</p>
                            <p class="flex items-center gap-1">
                                <span class="font-medium text-sm text-desa-secondary">Kepala Desa</span>
                            </p>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                            <img src="@/assets/images/icons/profile-2user-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon">
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">243.000</p>
                            <p class="font-medium text-sm text-desa-secondary">Jumlah Penduduk</p>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                            <img src="@/assets/images/icons/tree-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon">
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">25.200m<sup>2</sup></p>
                            <p class="font-medium text-sm text-desa-secondary">Luas Pertanian</p>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                            <img src="@/assets/images/icons/grid-5-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon">
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">9.222.500m<sup>2</sup></p>
                            <p class="font-medium text-sm text-desa-secondary">Luas Area</p>
                        </div>
                    </div>
                    <hr class="border-desa-background">
                    <div class="flex items-center gap-3 w-[302px] shrink-0">
                        <div
                            class="flex size-[52px] rounded-2xl items-center justify-center bg-desa-foreshadow overflow-hidden">
                            <img src="@/assets/images/icons/calendar-2-dark-green.svg" class="flex size-6 shrink-0"
                                alt="icon">
                        </div>
                        <div class="flex flex-col gap-1">
                            <p class="font-semibold text-lg leading-5">Mon, 24 Feb 2012</p>
                            <p class="font-medium text-sm text-desa-secondary">Desa Dibangun</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>
