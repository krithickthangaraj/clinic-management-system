/**
 * Global Clinic Configuration
 * This will eventually be populated from Admin API
 * For now, it's hardcoded for development
 *
 * All values are white-label ready and configurable per clinic
 */

export const clinicConfig = {
  // Clinic Branding
  clinicName: 'ClinicCare Medical Center',
  clinicAddress: '123 Medical Plaza, Health City, HC 12345',
  clinicLogoUrl: '🏥', // Can be a URL or emoji for now
  clinicPhone: '+1 (555) 123-4567',
  clinicEmail: 'info@cliniccare.com',

  // Doctor Information
  doctorName: 'Dr. Sarah Johnson',
  doctorQualifications: 'MBBS, MD (Internal Medicine), MRCP',
  doctorLicenseNumber: 'LIC-2024-12345',

  // Visual Theme (Configurable accent color per clinic)
  accentColor: '#0f766e', // Teal - medical professional look
  secondaryColor: '#2563eb', // Blue for accents
  successColor: '#059669', // Green
  dangerColor: '#dc2626', // Red
  warningColor: '#d97706', // Amber

  // Layout Settings
  headerHeight: 70, // pixels
  compactMode: true,
  spacingReductionPercent: 30,

  // Feature Flags
  enablePatientHistory: true,
  enablePrescriptionPrint: true,
  enableTestManagement: true,
  multiClinicSupport: false, // Will be true in future
};

// Helper to get computed header height
export const getHeaderHeight = () => clinicConfig.headerHeight;

// Helper to get clinic display info (for header)
export const getClinicHeaderInfo = () => ({
  name: clinicConfig.clinicName,
  address: clinicConfig.clinicAddress,
  logo: clinicConfig.clinicLogoUrl,
});

// Helper to get doctor info (for header & about sections)
export const getDoctorInfo = () => ({
  name: clinicConfig.doctorName,
  qualifications: clinicConfig.doctorQualifications,
});

// Helper to get theme colors
export const getThemeColors = () => ({
  primary: clinicConfig.accentColor,
  secondary: clinicConfig.secondaryColor,
  success: clinicConfig.successColor,
  danger: clinicConfig.dangerColor,
  warning: clinicConfig.warningColor,
});
