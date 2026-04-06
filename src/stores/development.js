import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useDevelopmentStore = defineStore("development", {
    state: () => ({
        developments: [],
        development: null,
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        },
        loading: false,
        error: null,
        success: null,
    }),
    actions: {
        async fetchDevelopmentsPaginated(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/development/all/paginated", {
                    params,
                });
                this.developments = response.data.data?.data ?? [];
                this.meta = response.data.data?.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchDevelopment(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/development/${id}`);
                this.development = response.data.data;
                return this.development;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateDevelopment(id, payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("person_in_charge", payload.person_in_charge ?? "");
                formData.append("start_date", payload.start_date ?? "");
                formData.append("end_date", payload.end_date ?? "");
                formData.append("amount", payload.amount ?? "");
                formData.append("status", payload.status ?? "");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                formData.append("_method", "PUT");

                const response = await axiosInstance.post(`/development/${id}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.development = {
                    ...this.development,
                    ...response.data.data,
                };
                this.success = response.data.message;

                return this.development;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createDevelopment(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("person_in_charge", payload.person_in_charge ?? "");
                formData.append("start_date", payload.start_date ?? "");
                formData.append("end_date", payload.end_date ?? "");
                formData.append("amount", payload.amount ?? "");
                formData.append("status", payload.status ?? "");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                const response = await axiosInstance.post(`/development`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.development = {
                    ...this.development,
                    ...response.data.data,
                };
                this.success = response.data.message;

                return this.development;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async deleteDevelopment(id) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.delete(`/development/${id}`);
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
