import api from './api';

const billingService = {
  async getBillingSummary(visitId) {
    const response = await api.get(`/billing/visit/${visitId}/summary`);
    return response.data;
  },

  async settleInvoice(payload) {
    const response = await api.post('/billing/invoices/settle', payload);
    return response.data;
  },

  async getInvoiceByVisit(visitId) {
    const response = await api.get(`/billing/invoices/visit/${visitId}`);
    return response.data;
  },
};

export default billingService;
