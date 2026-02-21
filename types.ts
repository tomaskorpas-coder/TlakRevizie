export interface ThicknessMeasurements {
  topHead: string;
  shellTop: string;
  shellMiddle: string;
  shellBottom: string;
  bottomHead: string;
}

export type ReportType = 'TNS' | 'GZ';

export interface InspectionReport {
  id: string; // Unikátne ID pre databázu
  createdAt: number; // Dátum vytvorenia záznamu
  reportType: ReportType; // TNS = Tlaková nádoba stabilná, GZ = Plynové zariadenie

  // Header
  reportDate: string;
  reportNumber: string;
  nextInspectionDate: string;

  // Parties
  operatorName: string; // Prevádzkovateľ
  operatorAddress: string;
  siteName: string; // Prevádzka
  siteAddress: string;

  // Technician
  technicianName: string;
  technicianLicense: string; // Číslo osvedčenia

  // ================================================================
  // TECHNICAL DATA - TNS (Tlaková nádoba stabilná)
  // ================================================================
  tnsType: string;
  manufacturer: string;
  serialNumber: string;
  yearOfManufacture: string;
  volumeLiters: string;
  nominalTemp: string;
  nominalPressure: string; // MPa
  medium: string; // voda/vzduch
  classification: string; // Zaradenie (e.g., Ab1)

  // Equipment used (TNS)
  ultrasonicDevice: string;
  pressureGauge: string;

  // Measurements (TNS)
  measurements: ThicknessMeasurements;
  minMeasurement: string;

  // Tests (TNS)
  pressureTestValue: string;
  visualInspectionResult: string;

  // Conclusion (TNS)
  conclusion: string;

  // ================================================================
  // TECHNICAL DATA - GZ (Plynové zariadenie)
  // Vyhláška MPSVaR SR č. 508/2009 Z.z. Príloha č. 3
  // ================================================================

  // Technical parameters
  gasInstallationType: string; // DOPZ / Kotolňa / Priemyselné PZ / atď.
  gasType: string;             // Zemný plyn / Propán-bután / Mestský plyn
  gasPressureLevel: string;    // NTL / STL / VTL
  gasOperatingPressure: string; // Prevádzkový tlak (kPa)
  gasMaxPressure: string;       // Maximálny prevádzkový tlak MOP (kPa)
  gasPipeMaterial: string;      // Oceľ / Meď / PE / Nerez
  gasPipeDiameter: string;      // DN
  gasPipeLength: string;        // Dĺžka plynovodu (m)
  gasApplianceCount: string;    // Počet plynových spotrebičov (ks)
  gasInstallationYear: string;  // Rok inštalácie
  gasAnnualConsumption: string; // Ročná spotreba (m³/rok)

  // Inspection results (GZ)
  gasVisualInspectionResult: string;  // Vizuálna kontrola zariadenia
  gasTightnessTestPressure: string;   // Skúšobný tlak (kPa)
  gasTightnessTestMedium: string;     // Skúšobné médium
  gasTightnessTestDuration: string;   // Dĺžka trvania skúšky (min)
  gasTightnessTestResult: string;     // Vyhovela / Nevyhovela

  // Inspection checklist (GZ)
  gasShutoffValvesResult: string;  // Bezpečnostné uzávery: OK / Závada / N/A
  gasRegulatorResult: string;      // Regulátory tlaku: OK / Závada / N/A
  gasManometerResult: string;      // Manometre: OK / Závada / N/A
  gasMeterResult: string;          // Plynoměr: OK / Závada / N/A
  gasChimneyResult: string;        // Dymovody a komíny: OK / Závada / N/A
  gasVentilationResult: string;    // Vetranie a prívod vzduchu: OK / Závada / N/A

  // Defects & conclusion (GZ)
  gasDefectsFound: string;
  gasConclusion: string;
}

export const initialReportState: InspectionReport = {
  id: '',
  createdAt: 0,
  reportType: 'TNS',
  reportDate: new Date().toISOString().split('T')[0],
  nextInspectionDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  reportNumber: '',
  operatorName: '',
  operatorAddress: '',
  siteName: '',
  siteAddress: '',
  technicianName: 'Ing. Jozef Revízny',
  technicianLicense: '001/2024/TNS',

  // TNS defaults
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

  // GZ defaults
  gasInstallationType: 'DOPZ - Domový plynovod a odberné plynové zariadenie',
  gasType: 'Zemný plyn',
  gasPressureLevel: 'NTL (do 5 kPa)',
  gasOperatingPressure: '2.1',
  gasMaxPressure: '5',
  gasPipeMaterial: 'Oceľ',
  gasPipeDiameter: 'DN 25',
  gasPipeLength: '',
  gasApplianceCount: '',
  gasInstallationYear: '',
  gasAnnualConsumption: '',
  gasVisualInspectionResult: 'Bez viditeľných závad a netesností. Potrubný rozvod, armatúry a spoje sú v dobrom technickom stave.',
  gasTightnessTestPressure: '1.5',
  gasTightnessTestMedium: 'Vzduch',
  gasTightnessTestDuration: '10',
  gasTightnessTestResult: 'Vyhovela',
  gasShutoffValvesResult: 'OK',
  gasRegulatorResult: 'OK',
  gasManometerResult: 'OK',
  gasMeterResult: 'OK',
  gasChimneyResult: 'OK',
  gasVentilationResult: 'OK',
  gasDefectsFound: 'Neboli zistené žiadne závady.',
  gasConclusion: 'Plynové zariadenie je schopné bezpečnej prevádzky.',
};
