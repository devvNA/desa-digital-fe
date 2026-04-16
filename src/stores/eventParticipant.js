import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useEventParticipantStore = defineStore("eventParticipant", {
    state: () => ({
        eventParticipants: [],
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
        async fetchEventParticipants(params) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.get("/event-participant", { params });
                this.eventParticipants = response.data?.data?.data ?? response.data?.data ?? [];
                this.meta = response.data?.meta ?? response.data?.data?.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async createEventParticipant(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.post("/event-participant", payload);
                this.success = response.data?.message ?? null;
                return response.data?.data ?? null;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },
    },
});
