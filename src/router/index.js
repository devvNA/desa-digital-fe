import { useAuthStore } from "@/stores/auth";
import { createRouter, createWebHistory } from "vue-router";

import AuthLayout from "@/layouts/AuthLayout.vue";
import MainLayout from "@/layouts/MainLayout.vue";

const DashboardView = () => import("@/views/DashboardView.vue");
const LoginView = () => import("@/views/LoginView.vue");

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
