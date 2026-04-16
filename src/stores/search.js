import { handleError } from "@/helpers/errorHelper";
import { axiosInstance } from "@/plugins/axios";
import { defineStore } from "pinia";

export const useSearchStore = defineStore("search", {
    state: () => ({
        searchResults: {},
        loading: false,
        error: null,
        success: null,
    }),

    actions: {
        resetSearch() {
            this.searchResults = {};
            this.loading = false;
            this.error = null;
            this.success = null;
        },

        async fetchSearchResults(query) {
            const normalizedQuery = String(query ?? "").trim();

            if (!normalizedQuery) {
                this.resetSearch();
                return {};
            }

            this.loading = true;
            this.searchResults = {};
            this.error = null;
            this.success = null;

            try {
                const response = await axiosInstance.get("/search", {
                    params: {
                        q: normalizedQuery,
                    },
                });

                this.searchResults = response.data?.data ?? {};
                this.success = response.data?.message ?? true;

                return this.searchResults;
            } catch (error) {
                this.searchResults = {};
                this.error = handleError(error) ?? error;

                return null;
            } finally {
                this.loading = false;
            }
        },
    },
});
