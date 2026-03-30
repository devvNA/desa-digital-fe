import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import router from "@/router";
import Cookies from "js-cookie";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    error: null,
    success: null,
    loading: false,
  }),

  getters: {
    token: () => Cookies.get("token"),
  },

  actions: {
    resetFeedback() {
      this.error = null;
      this.success = null;
    },

    async login(credentials) {
      this.loading = true;
      this.resetFeedback();

      try {
        const response = await axiosInstance.post("/login", credentials);
        const token = response.data.token;

        Cookies.set("token", token);
        await this.checkAuth();

        this.success = response.data.message || "Login successful";
        await router.push({ name: "dashboard" });

        return { success: true };
      } catch (error) {
        this.error = handleError(error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      Cookies.remove("token");
      router.push({ name: "login" });
      this.user = null;
      this.error = null;
      this.success = "Logout successful";
    },

    async checkAuth() {
      this.loading = true;
      try {
        const response = await axiosInstance.get("/me");
        this.user = response.data.data;
        return this.user;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.logout();
        }

        this.user = null;
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
