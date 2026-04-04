import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

const DashboardView = () => import("@/views/DashboardView.vue");
const HeadOfFamiliesView = () => import("@/views/head-of-family/HeadOfFamiliesView.vue");
const HeadOfFamilyDetailView = () => import("@/views/head-of-family/HeadOfFamilyDetailView.vue");
const HeadOfFamilyCreateView = () => import("@/views/head-of-family/HeadOfFamilyCreateView.vue");
const LoginView = () => import("@/views/LoginView.vue");
const SocialAssistancesView = () => import("@/views/social-assistance/SocialAssistancesView.vue");
const SocialAssistanceDetailView = () =>
    import("@/views/social-assistance/SocialAssistanceDetailView.vue");
const SocialAssistanceCreateView = () =>
    import("@/views/social-assistance/SocialAssistanceCreateView.vue");
const SocialAssistanceEditView = () =>
    import("@/views/social-assistance/SocialAssistanceEditView.vue");
const SocialAssistanceRecipientsView = () =>
    import("@/views/social-assistance-recipient/SocialAssistanceRecipientsView.vue");

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            component: MainLayout,
            children: [
                {
                    path: "",
                    name: "dashboard",
                    component: DashboardView,
                    meta: { requiresAuth: true, permission: "dashboard-menu" },
                },
                {
                    path: "head-of-family",
                    name: "head-of-family",
                    component: HeadOfFamiliesView,
                    meta: { requiresAuth: true, permission: "head-of-family-list" },
                },
                {
                    path: "head-of-family/:id",
                    name: "manage-head-of-family",
                    component: HeadOfFamilyDetailView,
                    meta: { requiresAuth: true, permission: "head-of-family-list" },
                },
                {
                    path: "head-of-family/create",
                    name: "create-head-of-family",
                    component: HeadOfFamilyCreateView,
                    meta: { requiresAuth: true, permission: "head-of-family-create" },
                },
                {
                    path: "social-assistance",
                    name: "social-assistance",
                    component: SocialAssistancesView,
                    meta: { requiresAuth: true, permission: "social-assistance-list" },
                },
                {
                    path: "social-assistance/:id",
                    name: "manage-social-assistance",
                    component: SocialAssistanceDetailView,
                    meta: { requiresAuth: true, permission: "social-assistance-list" },
                },
                {
                    path: "social-assistance/create",
                    name: "create-social-assistance",
                    component: SocialAssistanceCreateView,
                    meta: { requiresAuth: true, permission: "social-assistance-create" },
                },
                {
                    path: "social-assistance/edit/:id",
                    name: "edit-social-assistance",
                    component: SocialAssistanceEditView,
                    meta: { requiresAuth: true, permission: "social-assistance-edit" },
                },
                {
                    path: "social-assistance-recipient",
                    name: "social-assistance-recipient",
                    component: SocialAssistanceRecipientsView,
                    meta: { requiresAuth: true, permission: "social-assistance-recipient-list" },
                },
            ],
        },
        {
            path: "/login",
            component: AuthLayout,
            children: [
                {
                    path: "",
                    name: "login",
                    component: LoginView,
                    meta: { requiresUnauth: true },
                },
            ],
        },
    ],
});

router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth) {
        if (!authStore.token) {
            return { name: "login" };
        }

        try {
            if (!authStore.user) {
                await authStore.checkAuth();
            }

            const userPermissions = authStore.user?.permissions || [];

            if (to.meta.permission && !userPermissions.includes(to.meta.permission)) {
                return false;
            }
        } catch (error) {
            console.error("[Router Guard] checkAuth failed:", error);
            return { name: "login" };
        }
    } else if (to.meta.requiresUnauth && authStore.token) {
        return { name: "dashboard" };
    }
});

export default router;
