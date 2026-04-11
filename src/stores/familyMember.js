import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import router from "@/router";
import { defineStore } from "pinia";

export const useFamilyMemberStore = defineStore("familyMember", {
    state: () => ({
        familyMember: null,
        familyMembers: [],
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
        async fetchFamilyMembers(params) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get("/family-member", { params });
                this.familyMembers = response.data.data;
            } catch (error) {
                this.error = handleError(error);
            } finally {
                this.loading = false;
            }
        },

        async fetchFamilyMember(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.get(`/family-member/${id}`);
                this.familyMember = response.data.data;
                return this.familyMember;
            } catch (error) {
                this.familyMember = null;
                this.error = handleError(error);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createFamilyMember(payload) {
            this.loading = true;
            this.error = null;
            this.success = null;
            try {
                const formData = new FormData();

                formData.append("name", payload.name ?? "");
                formData.append("email", payload.email ?? "");
                formData.append("password", payload.password ?? "");
                formData.append("identity_number", payload.identity_number ?? "");
                formData.append("gender", payload.gender ?? "");
                formData.append("date_of_birth", payload.date_of_birth ?? "");
                formData.append("phone_number", payload.phone_number ?? "");
                formData.append("occupation", payload.occupation ?? "");
                formData.append("marital_status", payload.marital_status ?? "");
                formData.append("relation", payload.relation ?? "");
                formData.append("head_of_family_id", payload.head_of_family_id ?? "");

                if (payload.profile_picture instanceof File) {
                    formData.append("profile_picture", payload.profile_picture);
                }

                const response = await axiosInstance.post("/family-member", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });

                this.success = response.data.message;
                router.push({ name: "family-member" });
                return response.data.data;
            } catch (error) {
                this.error = handleError(error);
                return false;
            } finally {
                this.loading = false;
            }
        },

        async deleteFamilyMember(id) {
            this.loading = true;
            this.error = null;
            try {
                const response = await axiosInstance.delete(`/family-member/${id}`);
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
