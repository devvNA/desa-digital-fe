import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useSocialAssistanceRecipientStore = defineStore("socialAssistanceRecipient", {
    state: () => ({
        socialAssistanceRecipients: [],
        socialAssistanceRecipient: null,
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
        async fetchSocialAssistanceRecipientsPaginated(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(
                    "/social-assistance-recipient/all/paginated",
                    {
                        params,
                    },
                );
                this.socialAssistanceRecipients = response.data.data?.data ?? [];
                this.meta = response.data.data?.meta ?? this.meta;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchSocialAssistanceRecipient(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/social-assistance-recipient/${id}`);
                this.socialAssistanceRecipient = response.data.data;
                return this.socialAssistanceRecipient;
            } catch (error) {
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async deleteSocialAssistanceRecipient(id) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const response = await axiosInstance.delete(`/social-assistance-recipient/${id}`);
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
