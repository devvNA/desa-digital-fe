import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useSocialAssistanceStore = defineStore("socialAssistance", {
    state: () => ({
        socialAssistances: [],
        socialAssistance: null,
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
        async fetchSocialAssistancesPaginated(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/social-assistance/all/paginated", {
                    params,
                });
                this.socialAssistances = response.data.data?.data ?? [];
                this.meta = response.data.data?.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async createSocialAssistance(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("category", payload.category ?? "");
                formData.append("amount", payload.amount ?? "");
                formData.append("provider", payload.provider ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("is_available", payload.is_available ? "1" : "0");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                const response = await axiosInstance.post("/social-assistance", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.socialAssistance = {
                    ...response.data.data,
                    recent_recipients: response.data.data?.recent_recipients ?? [],
                };
                this.success = response.data.message;

                return this.socialAssistance;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async fetchSocialAssistance(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/social-assistance/${id}`);
                this.socialAssistance = {
                    ...response.data.data,
                    recent_recipients: response.data.data?.recent_recipients ?? [],
                };
                return this.socialAssistance;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateSocialAssistance(id, payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("category", payload.category ?? "");
                formData.append("amount", payload.amount ?? "");
                formData.append("provider", payload.provider ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("is_available", payload.is_available ? "1" : "0");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                formData.append("_method", "PUT");

                const response = await axiosInstance.post(`/social-assistance/${id}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.socialAssistance = {
                    ...this.socialAssistance,
                    ...response.data.data,
                    recent_recipients:
                        response.data.data?.recent_recipients ??
                        this.socialAssistance?.recent_recipients ??
                        [],
                };
                this.success = response.data.message;

                return this.socialAssistance;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async deleteSocialAssistance(id) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.delete(`/social-assistance/${id}`);
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
