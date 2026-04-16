import { handleError } from '@/helpers/errorHelper'
import { axiosInstance } from '@/plugins/axios'
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        dashboardData: {},
        loading: false,
        error: null,
        success: null,
    }),

    actions: {
        async getDashboardData() {
            this.loading = true
            this.error = null
            this.success = null

            try {
                const response = await axiosInstance.get('/dashboard')
                this.dashboardData = response.data?.data ?? {}
                this.success = response.data?.message ?? true
            } catch (error) {
                this.dashboardData = {}
                this.error = handleError(error) ?? error
            } finally {
                this.loading = false
            }
        },

        async getHeadOfFamilyDashboardData() {
            this.loading = true
            this.error = null
            this.success = null

            try {
                const response = await axiosInstance.get('/dashboard/head-of-family')
                this.dashboardData = response.data?.data ?? {}
                this.success = response.data?.message ?? true
            } catch (error) {
                this.dashboardData = {}
                this.error = handleError(error) ?? error
            } finally {
                this.loading = false
            }
        },
    },
})
