import { format } from 'date-fns';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { prescriptionService } from '../services/prescriptionService';
import './PrescriptionView.css';

const formatDate = (value) => {
  if (!value) return '';
  return format(new Date(value), 'dd MMM yyyy');
};

const formatAge = (visit) => {
  const parts = [];
  if (visit?.patient_age != null) parts.push(`${visit.patient_age}Y`);
  if (visit?.patient_age_months != null && visit.patient_age_months > 0) {
    parts.push(`${visit.patient_age_months}M`);
  }
  return parts.join(' ');
};

export default function PrescriptionView({
  visitId,
  visit,
  vitals,
  medicines,
  chiefComplaints,
  orderedTests = [],
  diagnosis,
  advice,
  followUpDate,
  doctorFee,
  onBack,
  onPrinted,
}) {
  const prescriptionRef = useRef();

  const vitalsLine = [
    formatAge(visit) && `Age: ${formatAge(visit)}`,
    vitals?.bp_systolic &&
      vitals?.bp_diastolic &&
      `BP: ${vitals.bp_systolic}/${vitals.bp_diastolic}`,
    vitals?.weight != null && `Weight: ${vitals.weight} kg`,
    vitals?.height_cm != null && `Height: ${vitals.height_cm} cm`,
    vitals?.temperature != null && `Temp: ${vitals.temperature} C`,
    vitals?.sugar != null && `RBS: ${vitals.sugar} mg/dL`,
    vitals?.pr != null && `PR: ${vitals.pr}/min`,
    vitals?.spo2 != null && `SpO2: ${vitals.spo2}%`,
  ].filter(Boolean);

  const handlePrint = useReactToPrint({
    content: () => prescriptionRef.current,
    documentTitle: `Prescription-${visit?.visit_number || visitId}`,
    onAfterPrint: async () => {
      try {
        const prescription = await prescriptionService.getByVisit(visitId);
        await prescriptionService.markPrinted(prescription.id);
      } catch (err) {
        console.error('Failed to mark as printed:', err);
      } finally {
        onPrinted?.();
      }
    },
  });

  return (
    <div className="prescription-view">
      <div className="prescription-actions">
        <button onClick={onBack} className="btn-back">
          Back
        </button>
        <button onClick={handlePrint} className="btn-print">
          Print Prescription
        </button>
      </div>

      <div ref={prescriptionRef} className="prescription-content">
        <div className="patient-print-line">
          <strong>{visit?.patient_name || 'Patient'}</strong>
          {visit?.patient_gender && <span>{visit.patient_gender}</span>}
          {visit?.visit_number && <span>{visit.visit_number}</span>}
          {visit?.created_at && <span>{formatDate(visit.created_at)}</span>}
        </div>

        {vitalsLine.length > 0 && (
          <div className="print-vitals-line">
            {vitalsLine.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}

        {(chiefComplaints.length > 0 || diagnosis) && (
          <div className="print-two-column">
            {chiefComplaints.length > 0 && (
              <section className="print-section">
                <h3>Chief Complaints</h3>
                <p>{chiefComplaints.join(', ')}</p>
              </section>
            )}
            {diagnosis && (
              <section className="print-section">
                <h3>Diagnosis</h3>
                <p>{diagnosis}</p>
              </section>
            )}
          </div>
        )}

        {medicines.length > 0 && (
          <section className="print-section">
            <h3>Rx</h3>
            <table className="medicines-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med, index) => (
                  <tr key={index}>
                    <td>
                      <strong>{med.drug_name}</strong>
                      {med.frequency && (
                        <span className="medicine-frequency">
                          {med.frequency}
                        </span>
                      )}
                    </td>
                    <td>{med.dosage || '-'}</td>
                    <td>
                      {med.number_of_days ? `${med.number_of_days} days` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {orderedTests.length > 0 && (
          <section className="print-section">
            <h3>Investigation / Tests</h3>
            <p>{orderedTests.map((test) => test.test_name).join(', ')}</p>
          </section>
        )}

        {followUpDate && (
          <section className="print-section print-inline-section">
            <h3>Follow-up Date</h3>
            <p>{formatDate(followUpDate)}</p>
          </section>
        )}

        {advice && (
          <section className="print-section">
            <h3>Doctor Advice</h3>
            <p>{advice}</p>
          </section>
        )}

        {doctorFee && parseFloat(doctorFee) > 0 && (
          <section className="print-section print-inline-section">
            <h3>Doctor Fees</h3>
            <p>Rs. {parseFloat(doctorFee).toFixed(2)}</p>
          </section>
        )}
      </div>
    </div>
  );
}
