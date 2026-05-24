import { useClinic } from '../contexts/ClinicContext';
import './GlobalHeader.css';

export default function GlobalHeader() {
  const clinic = useClinic();
  const isLogoImage = /^https?:\/\//i.test(clinic.clinicLogoUrl || '');

  return (
    <header className="global-header">
      <div className="header-container">
        {/* Left: Clinic Logo & Info */}
        <div className="header-clinic">
          <div className="clinic-logo">
            {isLogoImage ? (
              <img src={clinic.clinicLogoUrl} alt={`${clinic.clinicName} logo`} />
            ) : (
              clinic.clinicLogoUrl
            )}
          </div>
          <div className="clinic-info">
            <h2 className="clinic-name">{clinic.clinicName}</h2>
            <p className="clinic-address">{clinic.clinicAddress}</p>
          </div>
        </div>

        {/* Right: Doctor Info */}
        <div className="header-doctor">
          <div className="doctor-info">
            <p className="doctor-name">{clinic.doctorName}</p>
            <p className="doctor-qualifications">
              {clinic.doctorQualifications}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
