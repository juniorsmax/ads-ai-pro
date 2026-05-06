import { api } from './client'

export const generarReporte = (cuentaId, periodo) =>
  api.post('/reports/generate', { cuentaId, periodo })

export const getReportes = () =>
  api.get('/reports')

export const getReporteHtml = (reporteId) =>
  fetch(`/api/reports/${reporteId}/html`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('adsai_token')}` },
  }).then(r => r.text())
