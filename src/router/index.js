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
const SocialAssistanceRecipientDetailView = () =>
    import("@/views/social-assistance-recipient/SocialAssistanceRecipientDetailView.vue");
const DevelopmentsView = () => import("@/views/development/DevelopmentsView.vue");
const DevelopmentDetailView = () => import("@/views/development/DevelopmentDetailView.vue");
const DevelopmentCreateView = () => import("@/views/development/DevelopmentCreateView.vue");
const DevelopmentEditView = () => import("@/views/development/DevelopmentEditView.vue");
const EventsView = () => import("@/views/event/EventsView.vue");
const EventCreateView = () => import("@/views/event/EventCreateView.vue");
const EventEditView = () => import("@/views/event/EventEditView.vue");
const EventDetailView = () => import("@/views/event/EventDetailView.vue");
const ProfileView = () => import("@/views/profile/ProfileView.vue");
const ProfileCreateView = () => import("@/views/profile/ProfileCreateView.vue");

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
                {
                    path: "social-assistance-recipient/:id",
                    name: "manage-social-assistance-recipient",
                    component: SocialAssistanceRecipientDetailView,
                    meta: { requiresAuth: true, permission: "social-assistance-recipient-list" },
                },
                {
                    path: "development",
                    name: "development",
                    component: DevelopmentsView,
                    meta: { requiresAuth: true, permission: "development-list" },
                },
                {
                    path: "development/:id",
                    name: "manage-development",
                    component: DevelopmentDetailView,
                    meta: { requiresAuth: true, permission: "development-list" },
                },
                {
                    path: "development/create",
                    name: "create-development",
                    component: DevelopmentCreateView,
                    meta: { requiresAuth: true, permission: "development-create" },
                },
                {
                    path: "development/edit/:id",
                    name: "edit-development",
                    component: DevelopmentEditView,
                    meta: { requiresAuth: true, permission: "development-edit" },
                },
                {
                    path: "event",
                    name: "event",
                    component: EventsView,
                    meta: { requiresAuth: true, permission: "event-list" },
                },
                {
                    path: "event/:id",
                    name: "manage-event",
                    component: EventDetailView,
                    meta: { requiresAuth: true, permission: "event-list" },
                },
                {
                    path: "event/create",
                    name: "create-event",
                    component: EventCreateView,
                    meta: { requiresAuth: true, permission: "event-create" },
                },
                {
                    path: "event/edit/:id",
                    name: "edit-event",
                    component: EventEditView,
                    meta: { requiresAuth: true, permission: "event-edit" },
                },
                {
                    path: "profile",
                    name: "profile",
                    component: ProfileView,
                    meta: { requiresAuth: true, permission: "profile-menu" },
                },
                {
                    path: "profile/create",
                    name: "create-profile",
                    component: ProfileCreateView,
                    meta: { requiresAuth: true, permission: "profile-create" },
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

/* "permissions": [
      "dashboard-menu",
      "head-of-family-menu",
      "head-of-family-list",
      "head-of-family-create",
      "head-of-family-edit",
      "head-of-family-delete",
      "family-member-menu",
      "family-member-list",
      "family-member-create",
      "family-member-edit",
      "family-member-delete",
      "social-assistance-menu",
      "social-assistance-list",
      "social-assistance-create",
      "social-assistance-edit",
      "social-assistance-delete",
      "social-assistance-recipient-menu",
      "social-assistance-recipient-list",
      "social-assistance-recipient-create",
      "social-assistance-recipient-edit",
      "social-assistance-recipient-delete",
      "event-menu",
      "event-list",
      "event-create",
      "event-edit",
      "event-delete",
      "event-participant-menu",
      "event-participant-list",
      "event-participant-create",
      "event-participant-edit",
      "event-participant-delete",
      "development-menu",
      "development-list",
      "development-create",
      "development-edit",
      "development-delete",
      "development-applicant-menu",
      "development-applicant-list",
      "development-applicant-create",
      "development-applicant-edit",
      "development-applicant-delete",
      "profile-menu",
      "profile-create",
      "profile-edit"
    ],
    "role": "admin" */
