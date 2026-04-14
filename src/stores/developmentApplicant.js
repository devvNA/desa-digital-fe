import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useDevelopmentApplicantStore = defineStore("developmentApplicant", {
    state: () => ({
        developmentApplicants: [],
        developmentApplicant: null,
        loading: false,
        error: null,
        success: null,
    }),
    actions: {
        async fetchDevelopmentApplicants(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/development-applicant", { params });
                this.developmentApplicants = response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async createDevelopmentApplicant(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const response = await axiosInstance.post(`/development-applicant`, payload);
                this.developmentApplicant = response.data.data;
                this.success = response.data.message;
                return this.developmentApplicant;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },
    },
});
