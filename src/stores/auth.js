import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import router from "@/router";
import Cookies from "js-cookie";
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: null,
        token: Cookies.get("token") || null,
        error: null,
        success: null,
        loading: false,
    }),

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
                const newToken = response.data.token;

                Cookies.set("token", newToken);
                this.token = newToken;
                this.success = response.data.message || "Login successful";

                return { success: true };
            } catch (error) {
                this.error = handleError(error);
                return { success: false, error: this.error };
            } finally {
                this.loading = false;
            }
        },

        async logout() {
            try {
                await axiosInstance.post("/logout");
            } catch (error) {
                this.error = handleError(error);
            } finally {
                Cookies.remove("token");
                this.token = null;
                this.user = null;
                this.error = null;
                this.success = "Logout successful";
                router.push({ name: "login" });
            }
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
