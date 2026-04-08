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
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { loading, error } = storeToRefs(authStore)

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
        await router.push({ name: 'dashboard' })
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
    <div class="login-page">
        <!-- Left Panel: Form -->
        <div class="login-panel-left">
            <div class="login-form-wrapper">
                <!-- Logo -->
                <header class="login-logo">
                    <img src="@/assets/images/logos/logo-text.svg" alt="Desa Digital Logo" class="login-logo-img" />
                </header>

                <!-- Heading -->
                <div class="login-heading">
                    <h1 class="login-title">Masuk ke akun kamu</h1>
                    <p class="login-subtitle">
                        Silahkan masukkan email dan password untuk melanjutkan.
                    </p>
                </div>

                <!-- Form -->
                <form @submit.prevent="handleSubmit" novalidate class="login-form">
                    <!-- Role Selection -->
                    <div class="login-field-group">
                        <label class="login-label">Role</label>
                        <section id="Select" class="login-role-grid">
                            <div class="login-role-option" :class="{
                                'login-role-option--active': form.role === 'kepala_desa',
                                'login-role-option--error': validationErrors.role && !form.role,
                            }">
                                <input id="Kepala-Desa" required type="radio" name="role" v-model="form.role"
                                    value="kepala_desa" class="login-role-radio" />
                                <svg class="login-role-icon" viewBox="0 0 20 20" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10 1.5L12.09 6.26L17.18 6.84L13.36 10.26L14.47 15.23L10 12.67L5.53 15.23L6.64 10.26L2.82 6.84L7.91 6.26L10 1.5Z"
                                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                                <span class="login-role-label">Kepala Desa</span>
                            </div>
                            <div class="login-role-option" :class="{
                                'login-role-option--active': form.role === 'kepala_rumah',
                                'login-role-option--error': validationErrors.role && !form.role,
                            }">
                                <input id="Kepala-Rumah" required type="radio" name="role" v-model="form.role"
                                    value="kepala_rumah" class="login-role-radio" />
                                <svg class="login-role-icon" viewBox="0 0 20 20" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10Z"
                                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                    <path d="M17.39 18C17.39 14.69 14.07 12 10 12C5.93 12 2.61 14.69 2.61 18"
                                        stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                                        stroke-linejoin="round" />
                                </svg>
                                <span class="login-role-label">Kepala Rumah</span>
                            </div>
                        </section>
                        <span class="login-error-text" v-if="validationErrors.role">
                            {{ validationErrors.role[0] }}
                        </span>
                    </div>

                    <!-- Email -->
                    <div class="login-field-group">
                        <label class="login-label"
                            :class="{ 'login-label--error': validationErrors.email || error?.email }">
                            Email
                        </label>
                        <Input v-model="form.email" type="email" placeholder="Ketik Email Kamu"
                            :error-message="validationErrors.email || error?.email" :icon="IconProfileSecondaryGreen"
                            :filled-icon="IconProfileBlack" />
                    </div>

                    <!-- Password -->
                    <div class="login-field-group">
                        <label class="login-label"
                            :class="{ 'login-label--error': validationErrors.password || error?.password }">
                            Password
                        </label>
                        <Input v-model="form.password" type="password" placeholder="Ketik Password Kamu"
                            :error-message="validationErrors.password || error?.password" :icon="IconKeySecondaryGreen"
                            :filled-icon="IconKeyBlack" />
                    </div>

                    <!-- Submit -->
                    <Button type="submit" label="Masuk" :loading="loading" />
                </form>
            </div>

            <!-- Footer -->
            <footer class="login-footer">
                <span class="login-footer-text">&copy; {{ new Date().getFullYear() }} Desa Digital</span>
            </footer>
        </div>

        <!-- Right Panel: Banner -->
        <div class="login-panel-right">
            <div class="login-banner">
                <img src="@/assets/images/backgrounds/bg-signin.png" class="login-banner-img" alt="Dashboard preview" />
                <!-- Testimonial overlay -->
                <div class="login-testimonial">
                    <p class="login-testimonial-quote">
                        "Platform Desa Digital sangat membantu kami mengelola data desa secara efisien.
                        Semua informasi tersentralisasi dan mudah diakses."
                    </p>
                    <div class="login-testimonial-author">
                        <div class="login-testimonial-avatar">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12Z"
                                    fill="currentColor" />
                                <path
                                    d="M12 14.5C6.99 14.5 2.91 17.86 2.91 22C2.91 22.28 3.13 22.5 3.41 22.5H20.59C20.87 22.5 21.09 22.28 21.09 22C21.09 17.86 17.01 14.5 12 14.5Z"
                                    fill="currentColor" />
                            </svg>
                        </div>
                        <div class="login-testimonial-info">
                            <strong class="login-testimonial-name">Bimore Wicaksono</strong>
                            <span class="login-testimonial-role">Kepala Desa</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.login-page {
    display: flex;
    min-height: 100vh;
    width: 100%;
    background: #f2f9f6;
}

/* ───────── Left Panel ───────── */
.login-panel-left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 50%;
    min-height: 100vh;
    padding: 40px 56px;
    background: #ffffff;
}

.login-form-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 420px;
    width: 100%;
    margin: 0 auto;
    flex: 1;
    justify-content: center;
}

/* Logo */
.login-logo {
    margin-bottom: 40px;
}

.login-logo-img {
    height: 36px;
    width: auto;
    object-fit: contain;
}

/* Heading */
.login-heading {
    margin-bottom: 32px;
}

.login-title {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    color: #001b1a;
    margin-bottom: 8px;
    letter-spacing: -0.01em;
}

.login-subtitle {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.6;
    color: #5a7a7e;
}

/* Form */
.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Field Group */
.login-field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.login-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    color: #001b1a;
}

.login-label--error {
    color: #ff5070;
}

/* Role Selection */
.login-role-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.login-role-option {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #ffffff;
    border: 1.5px solid #e2ebe4;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    color: #5a7a7e;
}

.login-role-option:hover {
    border-color: #34613a;
    background: #f1fae6;
    color: #34613a;
}

.login-role-option--active {
    border-color: #34613a;
    background: #f1fae6;
    color: #34613a;
    box-shadow: 0 0 0 1px #34613a;
}

.login-role-option--error {
    border-color: #ff5070;
}

.login-role-option--error:hover {
    border-color: #ff5070;
}

.login-role-radio {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    z-index: 10;
}

.login-role-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.login-role-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
}

.login-error-text {
    font-size: 12px;
    color: #ff5070;
    line-height: 1.4;
}

/* Footer */
.login-footer {
    padding-top: 32px;
}

.login-footer-text {
    font-size: 13px;
    color: #5a7a7e;
}

/* ───────── Right Panel ───────── */
.login-panel-right {
    width: 50%;
    padding: 12px 12px 12px 0;
    min-height: 100vh;
}

.login-banner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 24px;
    overflow: hidden;
    background: linear-gradient(209.83deg, #89b854 1.15%, #042f2b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-banner-img {
    width: 90%;
    max-width: 470px;
    height: auto;
    object-fit: contain;
    filter: drop-shadow(0 24px 48px rgba(0, 0, 0, 0.18));
    animation: floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes floatIn {
    from {
        opacity: 0;
        transform: translateY(24px) scale(0.97);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

/* Testimonial Overlay */
.login-testimonial {
    position: absolute;
    bottom: 32px;
    left: 32px;
    right: 32px;
    background: rgba(0, 27, 26, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 24px 28px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    animation: slideUp 0.6s 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(16px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-testimonial-quote {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 20px;
    font-style: italic;
}

.login-testimonial-author {
    display: flex;
    align-items: center;
    gap: 12px;
}

.login-testimonial-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #89b854, #34613a);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.9);
}

.login-testimonial-avatar svg {
    width: 22px;
    height: 22px;
}

.login-testimonial-info {
    display: flex;
    flex-direction: column;
}

.login-testimonial-name {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.4;
}

.login-testimonial-role {
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.4;
}

/* ───────── Responsive ───────── */
@media (max-width: 1024px) {
    .login-panel-left {
        width: 55%;
        padding: 32px 40px;
    }

    .login-panel-right {
        width: 45%;
    }
}

@media (max-width: 768px) {
    .login-page {
        flex-direction: column;
    }

    .login-panel-left {
        width: 100%;
        min-height: auto;
        padding: 32px 24px;
    }

    .login-panel-right {
        display: none;
    }
}

/* ───────── Reduced Motion ───────── */
@media (prefers-reduced-motion: reduce) {

    .login-banner-img,
    .login-testimonial {
        animation: none;
    }
}
</style>
