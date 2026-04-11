import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

const normalizeSocialAssistanceRecipient = (item) => {
    if (!item || typeof item !== "object") {
        return null;
    }

    return {
        id: item.id ?? null,
        social_assistance: item.social_assistance ?? null,
        head_of_family: item.head_of_family ?? null,
        bank: item.bank ?? null,
        amount: item.amount ?? null,
        reason: item.reason ?? null,
        account_number: item.account_number ?? null,
        proof: item.proof ?? null,
        status: item.status ?? null,
        created_at: item.created_at ?? null,
    };
};

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
        async fetchSocialAssistanceRecipients(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/social-assistance-recipient", {
                    params,
                });
                this.socialAssistanceRecipients = (response.data.data ?? [])
                    .map(normalizeSocialAssistanceRecipient)
                    .filter(Boolean);
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

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
                this.socialAssistanceRecipients = (response.data.data?.data ?? [])
                    .map(normalizeSocialAssistanceRecipient)
                    .filter(Boolean);
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
            this.success = null;
            try {
                const response = await axiosInstance.get(`/social-assistance-recipient/${id}`);
                this.socialAssistanceRecipient = normalizeSocialAssistanceRecipient(
                    response.data.data,
                );
                return this.socialAssistanceRecipient;
            } catch (error) {
                this.error = handleError(error);
                this.socialAssistanceRecipient = null;
                return null;
            } finally {
                this.loading = false;
            }
        },

        async updateSocialAssistanceRecipient(id, payload) {
            this.loading = true;
            this.error = null;
            this.success = null;

            try {
                const formData = new FormData();

                formData.append("social_assistance_id", payload.social_assistance_id ?? "");
                formData.append("head_of_family_id", payload.head_of_family_id ?? "");
                formData.append("bank", payload.bank ?? "");
                formData.append("amount", payload.amount ?? "");
                formData.append("reason", payload.reason ?? "");
                formData.append("account_number", payload.account_number ?? "");
                formData.append("status", payload.status ?? "");

                if (payload.proof instanceof File) {
                    formData.append("proof", payload.proof);
                }

                if (import.meta.env.DEV) {
                    console.debug("[socialAssistanceRecipientStore] update payload", {
                        id,
                        socialAssistanceId: payload.social_assistance_id,
                        headOfFamilyId: payload.head_of_family_id,
                        status: payload.status,
                        hasProofFile: payload.proof instanceof File,
                    });
                }

                formData.append("_method", "PUT");

                const response = await axiosInstance.post(
                    `/social-assistance-recipient/${id}`,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );

                this.socialAssistanceRecipient = normalizeSocialAssistanceRecipient(
                    response.data.data,
                );
                this.success = response.data.message;

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
