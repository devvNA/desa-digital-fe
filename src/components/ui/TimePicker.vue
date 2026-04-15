<script setup>
import { computed, onMounted, ref } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        default: "09:00",
    },
});

const emit = defineEmits(["update:modelValue", "close"]);

const mode = ref("hour");
const hour = ref(13);
const minute = ref(0);

// Inisialisasi waktu dari props (form) saat komponen dimuat
onMounted(() => {
    if (props.modelValue) {
        const [h, m] = props.modelValue.split(":");
        hour.value = parseInt(h);
        minute.value = parseInt(m);
    }
});

const outerHours = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const innerHours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const minutes = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 0];

const formattedHour = computed(() =>
    (hour.value === 24 ? 0 : hour.value).toString().padStart(2, "0"),
);
const formattedMinute = computed(() => minute.value.toString().padStart(2, "0"));

const getPosition = (index, total, radius) => {
    const angle = ((index - 2) * (Math.PI * 2)) / total;
    return {
        left: `calc(50% + ${Math.cos(angle) * radius}px)`,
        top: `calc(50% + ${Math.sin(angle) * radius}px)`,
    };
};

const handStyle = computed(() => {
    let radius = mode.value === "hour" && hour.value >= 1 && hour.value <= 12 ? 65 : 100;
    let rotation = mode.value === "hour" ? hour.value * 30 : minute.value * 6;
    return { height: `${radius}px`, transform: `rotate(${rotation}deg)` };
});

const selectHour = (h) => {
    hour.value = h;
    setTimeout(() => (mode.value = "minute"), 300);
};

const selectMinute = (m) => (minute.value = m);

// Mengirim nilai kembali ke form dan menutup modal
const handleConfirm = () => {
    const timeString = `${formattedHour.value}:${formattedMinute.value}`;
    emit("update:modelValue", timeString);
    emit("close");
};
</script>

<template>
    <div class="time-picker-card">
        <div class="time-header">
            <div class="time-display">
                <span
                    class="time-segment"
                    :class="{ active: mode === 'hour' }"
                    @click="mode = 'hour'"
                >
                    {{ formattedHour }}
                </span>
                <span class="colon">:</span>
                <span
                    class="time-segment"
                    :class="{ active: mode === 'minute' }"
                    @click="mode = 'minute'"
                >
                    {{ formattedMinute }}
                </span>
            </div>
        </div>

        <div class="clock-body">
            <div class="clock-face">
                <div class="center-dot"></div>
                <div class="clock-hand" :style="handStyle">
                    <div class="hand-circle"></div>
                </div>

                <div v-if="mode === 'hour'" class="clock-numbers">
                    <div
                        v-for="(h, index) in outerHours"
                        :key="'outer-' + h"
                        class="clock-number"
                        :class="{ selected: hour === h }"
                        :style="getPosition(index, 12, 100)"
                        @click="selectHour(h)"
                    >
                        {{ h === 24 ? "00" : h }}
                    </div>
                    <div
                        v-for="(h, index) in innerHours"
                        :key="'inner-' + h"
                        class="clock-number inner"
                        :class="{ selected: hour === h }"
                        :style="getPosition(index, 12, 65)"
                        @click="selectHour(h)"
                    >
                        {{ h }}
                    </div>
                </div>

                <div v-else class="clock-numbers">
                    <div
                        v-for="(m, index) in minutes"
                        :key="'min-' + m"
                        class="clock-number"
                        :class="{ selected: minute === m }"
                        :style="getPosition(index, 12, 100)"
                        @click="selectMinute(m)"
                    >
                        {{ m === 0 ? "00" : m }}
                    </div>
                </div>
            </div>
        </div>

        <div class="time-actions">
            <button class="btn-text" @click="$emit('close')">BATAL</button>
            <button class="btn-text" @click="handleConfirm">OKE</button>
        </div>
    </div>
</template>

<style scoped>
.time-picker-card {
    --tp-surface: rgb(255 255 255);
    --tp-surface-muted: rgb(242 249 246);
    --tp-surface-soft: rgb(241 250 230);
    --tp-border: rgb(242 249 246);
    --tp-text: rgb(0 27 26);
    --tp-text-muted: rgb(90 122 126);
    --tp-accent: rgb(52 97 58);
    --tp-accent-soft: rgba(52, 97, 58, 0.12);
    --tp-shadow: 0 24px 48px rgba(38, 58, 42, 0.08);
    width: 320px;
    background:
        radial-gradient(circle at top right, rgba(142, 189, 85, 0.18), transparent 36%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 250, 0.98));
    border: 2px solid var(--tp-border);
    border-radius: 24px;
    box-shadow: var(--tp-shadow);
    overflow: hidden;
    color: var(--tp-text);
    backdrop-filter: blur(10px);
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
}

.time-header {
    background: linear-gradient(135deg, rgba(52, 97, 58, 0.98), rgba(73, 124, 80, 0.98));
    color: white;
    padding: 28px 24px 24px;
    text-align: center;
    border-radius: 22px 22px 0 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.time-display {
    font-size: 42px;
    font-weight: 600;
    letter-spacing: -0.04em;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 25px;
    gap: 8px;
}

.time-segment {
    cursor: pointer;
    opacity: 0.54;
    padding: 2px 8px;
    border-radius: 14px;
    transition:
        opacity 0.2s ease,
        background-color 0.2s ease,
        transform 0.2s ease;
}

.time-segment:hover {
    opacity: 0.9;
}

.time-segment.active {
    opacity: 1;
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-1px);
}

.colon {
    opacity: 0.65;
}

.clock-body {
    padding: 24px 24px 18px;
    display: flex;
    justify-content: center;
}

.clock-face {
    width: 250px;
    height: 250px;
    background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 0.96) 0%,
        rgba(242, 249, 246, 1) 74%
    );
    border: 1px solid rgba(52, 97, 58, 0.08);
    border-radius: 50%;
    position: relative;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        0 14px 32px rgba(38, 58, 42, 0.08);
}

.center-dot {
    width: 10px;
    height: 10px;
    background-color: var(--tp-accent);
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    box-shadow: 0 0 0 4px rgba(52, 97, 58, 0.12);
}

.clock-hand {
    position: absolute;
    bottom: 50%;
    left: calc(50% - 1px);
    width: 2px;
    background: linear-gradient(180deg, rgba(52, 97, 58, 0.24), rgba(52, 97, 58, 0.96));
    transform-origin: bottom center;
    transition:
        height 0.28s ease,
        transform 0.28s ease;
    z-index: 1;
}

.hand-circle {
    width: 30px;
    height: 30px;
    background: linear-gradient(135deg, rgba(52, 97, 58, 0.96), rgba(73, 124, 80, 0.96));
    border-radius: 50%;
    position: absolute;
    top: -15px;
    left: -14px;
    box-shadow:
        0 10px 18px rgba(52, 97, 58, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.clock-number {
    position: absolute;
    width: 38px;
    height: 38px;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: translate(-50%, -50%);
    cursor: pointer;
    border-radius: 50%;
    font-size: 14px;
    font-weight: 600;
    color: var(--tp-text-muted);
    z-index: 3;
    transition:
        color 0.2s ease,
        background-color 0.2s ease,
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.clock-number.inner {
    font-size: 13px;
}

.clock-number:hover {
    background-color: var(--tp-accent-soft);
    color: var(--tp-accent);
}

.clock-number.selected {
    background: linear-gradient(135deg, rgba(52, 97, 58, 0.96), rgba(73, 124, 80, 0.96));
    color: white;
    box-shadow: 0 10px 18px rgba(52, 97, 58, 0.18);
}

.time-actions {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px 20px;
    gap: 10px;
    border-top: 1px solid var(--tp-border);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(242, 249, 246, 0.72));
}

.btn-text {
    min-width: 92px;
    border: 1px solid transparent;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
    padding: 10px 16px;
    cursor: pointer;
    border-radius: 16px;
    transition:
        background-color 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;
}

.btn-text:first-child {
    background: transparent;
    border-color: var(--tp-border);
    color: var(--tp-text-muted);
}

.btn-text:last-child {
    background: var(--tp-accent);
    border-color: rgba(52, 97, 58, 0.24);
    color: white;
    box-shadow: 0 12px 22px rgba(52, 97, 58, 0.18);
}

.btn-text:hover {
    transform: translateY(-1px);
}

.btn-text:first-child:hover {
    background-color: rgba(241, 250, 230, 0.9);
    color: var(--tp-accent);
}

.btn-text:last-child:hover {
    background-color: rgb(44 83 49);
}

.btn-text:active {
    transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
    .time-segment,
    .clock-hand,
    .clock-number,
    .btn-text {
        transition: none;
    }
}
</style>
