import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import router from "@/router";
import { defineStore } from "pinia";

export const useEventParticipantStore = defineStore("eventParticipant", {
    state: () => ({
        eventParticipants: [],
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
        async fetchEventParticipants(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/event-participant", { params });
                this.eventParticipants = response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },
    },
});
