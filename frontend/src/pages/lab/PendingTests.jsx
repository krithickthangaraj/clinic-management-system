import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './PendingTests.css'

export default function PendingTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState(null)
  const [results, setResults] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadTests()
    // Refresh every 10 seconds
    const interval = setInterval(loadTests, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadTests = async () => {
    try {
      const response = await api.get('/tests/pending')
      setTests(response.data)
    } catch (err) {
      console.error('Failed to load tests:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTest = async (testId) => {
    setSaving(true)
    try {
      await api.patch(`/tests/${testId}`, {
        status: 'completed',
        results: results
      })
      setSelectedTest(null)
      setResults('')
      loadTests()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update test')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="tests-page">
        <div className="page-header">
          <h1>Pending Tests</h1>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="tests-page">
      <div className="page-header">
        <h1>Pending Tests</h1>
        <button onClick={() => navigate('/')} className="btn-back">← Back</button>
      </div>

      {tests.length === 0 ? (
        <div className="empty-tests">
          <p>No pending tests</p>
        </div>
      ) : (
        <div className="tests-list">
          {tests.map((test) => (
            <div key={test.id} className="test-item">
              <div className="test-info">
                <h3>{test.test_name}</h3>
                <p><strong>Type:</strong> {test.test_type}</p>
                <p><strong>Visit ID:</strong> {test.visit_id}</p>
                <p><strong>Ordered:</strong> {new Date(test.ordered_at).toLocaleString()}</p>
              </div>
              <div className="test-actions">
                {selectedTest?.id === test.id ? (
                  <div className="test-form">
                    <textarea
                      placeholder="Enter test results..."
                      value={results}
                      onChange={(e) => setResults(e.target.value)}
                      rows="4"
                      className="results-input"
                    />
                    <div className="form-buttons">
                      <button
                        onClick={() => handleUpdateTest(test.id)}
                        className="btn-save"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Results'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTest(null)
                          setResults('')
                        }}
                        className="btn-cancel"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedTest(test)
                      setResults(test.results || '')
                    }}
                    className="btn-enter-results"
                  >
                    Enter Results
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
