import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { visitService } from '../../services/visitService'
import './DoctorQueue.css'

const STATUS_WAITING = 'vitals_done'
const STATUS_PENDING = 'in_consultation'
const STATUS_COMPLETED = ['consulted', 'completed']

export default function DoctorQueue() {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'waiting' | 'pending' | 'completed'
  const navigate = useNavigate()

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const load = async () => {
    try {
      const data = await visitService.getDoctorToday()
      setVisits(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load doctor today:', err)
      setVisits([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = visits.filter((v) => {
    if (filter === 'all') return true
    if (filter === 'waiting') return v.status === STATUS_WAITING
    if (filter === 'pending') return v.status === STATUS_PENDING
    if (filter === 'completed') return STATUS_COMPLETED.includes(v.status)
    return true
  })

  const countTotal = visits.length
  const countWaiting = visits.filter((v) => v.status === STATUS_WAITING).length
  const countPending = visits.filter((v) => v.status === STATUS_PENDING).length
  const countCompleted = visits.filter((v) => STATUS_COMPLETED.includes(v.status)).length

  const getStatusLabel = (s) => {
    if (s === STATUS_WAITING) return 'Waiting'
    if (s === STATUS_PENDING) return 'In consultation'
    if (STATUS_COMPLETED.includes(s)) return 'Completed'
    return s || '—'
  }

  return (
    <div className="queue-container">
      <header className="page-header">
        <div className="header-left">
          <h1>Patient Queue</h1>
          <p className="subtitle">Today&apos;s patients</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-back">Dashboard</button>
      </header>

      {/* Summary cards — sticky, compact, click to filter */}
      <div className="summary-cards">
        <button
          type="button"
          className={`summary-card ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span className="summary-value">{countTotal}</span>
          <span className="summary-label">Total Patients</span>
        </button>
        <button
          type="button"
          className={`summary-card ${filter === 'waiting' ? 'active' : ''}`}
          onClick={() => setFilter('waiting')}
        >
          <span className="summary-value">{countWaiting}</span>
          <span className="summary-label">Patients Waiting</span>
        </button>
        <button
          type="button"
          className={`summary-card ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <span className="summary-value">{countPending}</span>
          <span className="summary-label">Pending</span>
        </button>
        <button
          type="button"
          className={`summary-card ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          <span className="summary-value">{countCompleted}</span>
          <span className="summary-label">Completed</span>
        </button>
      </div>

      {loading && visits.length === 0 ? (
        <div className="loading-state">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">✓</div>
          <h3>No patients</h3>
          <p>
            {filter === 'all' ? "There are no patients today." : `No ${filter} patients.`}
          </p>
        </div>
      ) : (
        <div className="queue-grid">
          {filtered.map((visit, index) => (
            <div
              key={visit.id}
              className="queue-card card"
              onClick={() => navigate(`/doctor/consultation/${visit.id}`)}
            >
              <div className="queue-rank">{index + 1}</div>
              <div className="patient-info">
                <h3>{visit.patient_name}</h3>
                <div className="patient-badges">
                  <span className="badge age">{visit.patient_age != null ? `${visit.patient_age}Y` : '—'}</span>
                  <span className={`badge gender ${visit.patient_gender || ''}`}>{visit.patient_gender || '—'}</span>
                  <span className={`badge status status-${visit.status}`}>{getStatusLabel(visit.status)}</span>
                </div>
              </div>
              <div className="visit-details">
                <span className="visit-id">{visit.visit_number}</span>
                <span className="visit-time">
                  {visit.created_at
                    ? new Date(visit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
              <div className="queue-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
