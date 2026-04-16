import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useEventStore = defineStore("event", {
    state: () => ({
        events: [],
        event: null,
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
        async fetchEventsPaginated(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/event/all/paginated", {
                    params,
                });
                this.events = response.data.data.data ?? [];
                this.meta = response.data.data.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchEvent(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/event/${id}`);
                this.event = response.data.data;
                return this.event;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateEvent(id, payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("price", payload.price ?? "");
                formData.append("date", payload.date ?? "");
                formData.append("time", payload.time ?? "");
                formData.append("is_active", payload.is_active ?? "");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                formData.append("_method", "PUT");

                const response = await axiosInstance.post(`/event/${id}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.event = {
                    ...this.event,
                    ...response.data.data,
                };
                this.success = response.data.message;

                return this.event;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createEvent(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("description", payload.description ?? "");
                formData.append("price", payload.price ?? "");
                formData.append("date", payload.date ?? "");
                formData.append("time", payload.time ?? "");
                formData.append("is_active", payload.is_active ?? "");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                const response = await axiosInstance.post(`/event`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.event = {
                    ...this.event,
                    ...response.data.data,
                };
                this.success = response.data.message;

                return this.event;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async deleteEvent(id) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.delete(`/event/${id}`);
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
