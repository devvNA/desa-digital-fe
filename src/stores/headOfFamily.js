import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import router from "@/router";
import { defineStore } from "pinia";

export const useHeadOfFamilyStore = defineStore("headOfFamily", {
    state: () => ({
        headOfFamily: null,
        headOfFamilies: [],
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 5,
            total: 0,
        },
        loading: false,
        error: null,
        success: null,
    }),
    actions: {
        async fetchHeadOfFamilies(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/head-of-family", { params });
                this.headOfFamilies = response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchHeadOfFamiliesPaginated(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/head-of-family/all/paginated", {
                    params,
                });
                this.headOfFamilies = response.data.data?.data ?? [];
                this.meta = response.data.data?.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchHeadOfFamily(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/head-of-family/${id}`);
                this.headOfFamily = response.data.data;
                return this.headOfFamily;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createHeadOfFamily(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.post("/head-of-family", payload);

                this.success = response.data.message;
                router.push({ name: "head-of-family" });
                return response.data.data;
            } catch (error) {
                this.error = handleError(error);
                return false;
            } finally {
                this.loading = false;
            }
        },

        async deleteHeadOfFamily(id) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.delete(`/head-of-family/${id}`);
                this.success = response.data.message;
                return true;
            } catch (error) {
                this.error = handleError(error);
                return false;
            } finally {
                this.loading = false;
            }
        },
    },
});
