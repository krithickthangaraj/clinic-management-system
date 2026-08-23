import api from './api';

export const medicineService = {
  async getAll(q = '') {
    try {
      const response = await api.get('/master/meds/drugs', {
        params: { search: q || undefined },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  async searchDrugs(q) {
    try {
      const response = await api.get('/master/meds/drugs', {
        params: { search: q },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  async listTypes(q) {
    const response = await api.get('/master/meds/types', {
      params: { search: q },
    });
    return response.data;
  },

  async listBrands({ drug_id, type_id, search }) {
    const params = {};
    if (drug_id) params.drug_id = drug_id;
    if (type_id) params.type_id = type_id;
    if (search) params.search = search;
    const response = await api.get('/master/meds/brands', { params });
    return response.data;
  },

  async listDosages({ brand_id, search }) {
    const params = {};
    if (brand_id) params.brand_id = brand_id;
    if (search) params.search = search;
    const response = await api.get('/master/meds/dosages', { params });
    return response.data;
  },
  // Admin CRUD
  async createDrug(name) {
    const response = await api.post('/master/meds/drugs', { name });
    return response.data;
  },
  async updateDrug(id, name) {
    const response = await api.patch(`/master/meds/drugs/${id}`, { name });
    return response.data;
  },
  async deleteDrug(id) {
    await api.delete(`/master/meds/drugs/${id}`);
  },
  async createType(name) {
    const response = await api.post('/master/meds/types', { name });
    return response.data;
  },
  async updateType(id, name) {
    const response = await api.patch(`/master/meds/types/${id}`, { name });
    return response.data;
  },
  async deleteType(id) {
    await api.delete(`/master/meds/types/${id}`);
  },
  async createBrand({ drug_id, type_id, name }) {
    const response = await api.post('/master/meds/brands', {
      drug_id,
      type_id,
      name,
    });
    return response.data;
  },
  async updateBrand(id, { drug_id, type_id, name }) {
    const response = await api.patch(`/master/meds/brands/${id}`, {
      drug_id,
      type_id,
      name,
    });
    return response.data;
  },
  async deleteBrand(id) {
    await api.delete(`/master/meds/brands/${id}`);
  },
  async createDosage({ brand_id, label, default_instruction }) {
    const response = await api.post('/master/meds/dosages', {
      brand_id,
      label,
      default_instruction,
    });
    return response.data;
  },
  async updateDosage(id, { brand_id, label, default_instruction }) {
    const response = await api.patch(`/master/meds/dosages/${id}`, {
      brand_id,
      label,
      default_instruction,
    });
    return response.data;
  },
  async deleteDosage(id) {
    await api.delete(`/master/meds/dosages/${id}`);
  },

  // Medicine Master Clinical Templates (Magic Auto-Fill & Admin CRUD)
  async listMedicineMaster(params = {}) {
    const response = await api.get('/master/medicines', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  async searchMedicineMaster(q = '') {
    try {
      const response = await api.get('/master/medicines', {
        params: { search: q || undefined },
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  async getMedicineMaster(id) {
    const response = await api.get(`/master/medicines/${id}`);
    return response.data;
  },

  async createMedicineMaster(data) {
    const response = await api.post('/master/medicines', data);
    return response.data;
  },

  async saveMedicineMaster(data) {
    const response = await api.post('/master/medicines', data);
    return response.data;
  },

  async updateMedicineMaster(id, data) {
    const response = await api.put(`/master/medicines/${id}`, data);
    return response.data;
  },

  async deleteMedicineMaster(id) {
    await api.delete(`/master/medicines/${id}`);
  },
};

export default medicineService;
