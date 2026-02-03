export interface ThicknessMeasurements {
  topHead: string;
  shellTop: string;
  shellMiddle: string;
  shellBottom: string;
  bottomHead: string;
}

export interface InspectionReport {
  id: string; // Unikátne ID pre databázu
  createdAt: number; // Dátum vytvorenia záznamu

  // Header
  reportDate: string;
  reportNumber: string; // e.g., 0376/20/10...
  nextInspectionDate: string; // NOVÉ: Plánovanie

  // Parties
  operatorName: string; // Prevádzkovateľ
  operatorAddress: string;
  siteName: string; // Prevádzka
  siteAddress: string;

  // Technician
  technicianName: string;
  technicianLicense: string; // Číslo osvedčenia

  // Technical Data (TNS)
  tnsType: string;
  manufacturer: string;
  serialNumber: string;
  yearOfManufacture: string;
  volumeLiters: string;
  nominalTemp: string;
  nominalPressure: string;
  medium: string; // voda/vzduch
  classification: string; // Zaradenie (e.g., Ab1)

  // Equipment used
  ultrasonicDevice: string;
  pressureGauge: string;

  // Measurements
  measurements: ThicknessMeasurements;
  minMeasurement: string; // Auto-calculated usually, but editable

  // Tests
  pressureTestValue: string; // 0,6 MPa
  visualInspectionResult: string; // Neboli zistené...

  // Conclusion
  conclusion: string; // TN je schopná...
}

export const initialReportState: InspectionReport = {
  id: '',
  createdAt: 0,
  reportDate: new Date().toISOString().split('T')[0],
  nextInspectionDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Default +1 rok
  reportNumber: '',
  operatorName: '',
  operatorAddress: '',
  siteName: '',
  siteAddress: '',
  technicianName: 'Ing. Jozef Revízny',
  technicianLicense: '001/2024/TNS',
  tnsType: '',
  manufacturer: '',
  serialNumber: '',
  yearOfManufacture: '',
  volumeLiters: '',
  nominalTemp: '70',
  nominalPressure: '0.6',
  medium: 'Vzduch / Voda',
  classification: 'Ab1',
  ultrasonicDevice: 'SA 40 + sonda 5P',
  pressureGauge: 'Ø 160, 0-2.5 MPa',
  measurements: {
    topHead: '0.00',
    shellTop: '0.00',
    shellMiddle: '0.00',
    shellBottom: '0.00',
    bottomHead: '0.00',
  },
  minMeasurement: '0.00',
  pressureTestValue: '0.6',
  visualInspectionResult: 'Neboli zistené korozívne úbytky ani deformácie.',
  conclusion: 'TN je schopná bezpečnej prevádzky.',
};