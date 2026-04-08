import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useProfileStore = defineStore("profile", {
    state: () => ({
        profile: null,
        loading: false,
        error: null,
        success: null,
    }),
    actions: {
        async fetchProfile() {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.get("/profile");
                this.profile = response.data?.data ?? null;
                this.success = response.data?.message ?? null;
                return this.profile;
            } catch (error) {
                this.error = handleError(error);
                this.profile = null;
                return null;
            } finally {
                this.loading = false;
            }
        },
        async createProfile(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("address", payload.address ?? "");
                formData.append("about", payload.about ?? "");
                formData.append("headman", payload.headman ?? "");
                formData.append("people", payload.people ?? "");
                formData.append("agricultural_area", payload.agricultural_area ?? "");
                formData.append("total_area", payload.total_area ?? "");

                if (payload.thumbnail instanceof File) {
                    formData.append("thumbnail", payload.thumbnail);
                }

                payload.images?.forEach((image) => {
                    if (image instanceof File) {
                        formData.append("images[]", image);
                    }
                });

                const response = await axiosInstance.post("/profile", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.profile = response.data.data;
                this.success = response.data.message;
                return this.profile;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },
    },
});
