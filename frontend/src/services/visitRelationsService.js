import api from './api'

export const visitRelationsService = {
  // Complaints
  async getComplaints(visitId) {
    const response = await api.get(`/visit-relations/${visitId}/complaints`)
    return response.data
  },

  async addComplaint(visitId, complaintId = null, customComplaint = null) {
    const response = await api.post(`/visit-relations/${visitId}/complaints`, { complaint_id: complaintId, custom_complaint: customComplaint })
    return response.data
  },

  async removeComplaint(visitId, complaintId) {
    await api.delete(`/visit-relations/${visitId}/complaints/${complaintId}`)
  },

  // Diagnosis
  async getDiagnosis(visitId) {
    const response = await api.get(`/visit-relations/${visitId}/diagnosis`)
    return response.data
  },

  async addDiagnosis(visitId, diagnosisId = null, customDiagnosis = null) {
    const response = await api.post(`/visit-relations/${visitId}/diagnosis`, { diagnosis_id: diagnosisId, custom_diagnosis: customDiagnosis })
    return response.data
  },

  async removeDiagnosis(visitId, diagnosisId) {
    await api.delete(`/visit-relations/${visitId}/diagnosis/${diagnosisId}`)
  },

  // Payment
  async getPayment(visitId) {
    try {
      const response = await api.get(`/visit-relations/${visitId}/payment`)
      return response.data
    } catch {
      return null
    }
  },

  async createPayment(visitId, doctorFee = 0, labFee = 0, paymentStatus = 'pending', paymentMode = null) {
    const response = await api.post(`/visit-relations/${visitId}/payment`, {
      doctor_fee: doctorFee,
      lab_fee: labFee,
      payment_status: paymentStatus,
      payment_mode: paymentMode
    })
    return response.data
  },

  async updatePayment(visitId, data) {
    const response = await api.patch(`/visit-relations/${visitId}/payment`, data)
    return response.data
  }
}
