import api from './api';

export const reportsService = {
  async getAnalytics() {
    const response = await api.get('/reports/analytics');
    return response.data;
  },

  async getDailyOP(reportDate = null) {
    const params = reportDate ? { report_date: reportDate } : {};
    const response = await api.get('/reports/daily-op', { params });
    return response.data;
  },
};
