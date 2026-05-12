import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { prescriptionService } from '../services/prescriptionService'
import { format } from 'date-fns'
import './PrescriptionView.css'

export default function PrescriptionView({
  visitId,
  visit,
  vitals,
  medicines,
  chiefComplaints,
  orderedTests = [],
  diagnosis,
  advice,
  onBack
}) {
  const prescriptionRef = useRef()

  const handlePrint = useReactToPrint({
    content: () => prescriptionRef.current,
    documentTitle: `Prescription-${visit?.visit_number}`,
    onAfterPrint: async () => {
      try {
        // Mark prescription as printed
        const prescription = await prescriptionService.getByVisit(visitId)
        await prescriptionService.markPrinted(prescription.id)
      } catch (err) {
        console.error('Failed to mark as printed:', err)
      }
    }
  })

  return (
    <div className="prescription-view">
      <div className="prescription-actions">
        <button onClick={onBack} className="btn-back">← Back</button>
        <button onClick={handlePrint} className="btn-print">🖨️ Print Prescription</button>
      </div>

      <div ref={prescriptionRef} className="prescription-content">
        <div className="prescription-header">
          <h1>PRESCRIPTION</h1>
          <div className="prescription-meta">
            {visit?.patient_name && (
              <p><strong>Patient:</strong> {visit.patient_name} {visit.patient_age && `(${visit.patient_age} years)`}</p>
            )}
            <p><strong>Visit No:</strong> {visit?.visit_number}</p>
            <p><strong>Date:</strong> {visit?.created_at ? format(new Date(visit.created_at), 'dd MMM yyyy') : ''}</p>
          </div>
        </div>

        {vitals && (
          <div className="prescription-section">
            <h3>Vitals</h3>
            <div className="vitals-display">
              {vitals.bp_systolic && vitals.bp_diastolic && (
                <span>BP: {vitals.bp_systolic}/{vitals.bp_diastolic}</span>
              )}
              {vitals.temperature && <span>Temp: {vitals.temperature}°C</span>}
              {vitals.weight && <span>Weight: {vitals.weight} kg</span>}
            </div>
          </div>
        )}

        {chiefComplaints.length > 0 && (
          <div className="prescription-section">
            <h3>Chief Complaints</h3>
            <p>{chiefComplaints.join(', ')}</p>
          </div>
        )}

        {diagnosis && (
          <div className="prescription-section">
            <h3>Diagnosis</h3>
            <p>{diagnosis}</p>
          </div>
        )}

        {medicines.length > 0 && (
          <div className="prescription-section">
            <h3>Medications</h3>
            <table className="medicines-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, index) => (
                  <tr key={index}>
                    <td><strong>{med.drug_name}</strong></td>
                    <td>{med.dosage}</td>
                    <td>{med.frequency}</td>
                    <td>{med.number_of_days} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orderedTests.length > 0 && (
          <div className="prescription-section">
            <h3>Tests Ordered</h3>
            <ul className="ordered-tests-list">
              {orderedTests.map((test, index) => (
                <li key={index}>{test.test_name}</li>
              ))}
            </ul>
          </div>
        )}

        {advice && (
          <div className="prescription-section">
            <h3>Advice</h3>
            <p>{advice}</p>
          </div>
        )}

        <div className="prescription-footer">
          <p>Thank you for visiting</p>
        </div>
      </div>
    </div>
  )
}
