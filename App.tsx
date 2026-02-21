import React, { useState, useRef, useEffect } from 'react';
import { InspectionReport, ReportType, initialReportState, ThicknessMeasurements } from './types';
import { TankDiagram } from './components/TankDiagram';
import { ReportPreview } from './components/ReportPreview';
import { GasReportPreview } from './components/GasReportPreview';
import { extractDataFromImage, fileToGenerativePart } from './services/geminiService';
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  Printer,
  FileText,
  Activity,
  CheckCircle,
  Loader2,
  Sparkles,
  Plus,
  Home,
  Save,
  Trash2,
  Calendar,
  Search,
  AlertTriangle,
  Database,
  Edit,
  Download,
  FileCheck,
  Clock,
  AlertOctagon,
  Eye,
  FileDown,
  Flame,
  Gauge,
  X,
} from 'lucide-react';

const STEPS_TNS = ['Základné Údaje', 'Technické Parametre', 'Merania', 'Záver'];
const STEPS_GZ  = ['Základné Údaje', 'Parametre PZ', 'Výsledky', 'Záver'];

type ViewState = 'dashboard' | 'type-selection' | 'editor';

// Reusable styled input/select
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-white";
const selectCls = "w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none font-bold text-slate-700 bg-white appearance-none";

// Gas checklist item
const GasCheck = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const opts = ['OK', 'Závada', 'N/A'];
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
      <span className="text-sm font-bold text-slate-700 flex-1 mr-4">{label}</span>
      <div className="flex gap-2">
        {opts.map(o => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              value === o
                ? o === 'OK'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                  : o === 'Závada'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-100'
                  : 'bg-slate-400 text-white'
                : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView]               = useState<ViewState>('dashboard');
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport]           = useState<InspectionReport>(initialReportState);
  const [isProcessingAI, setIsProcessingAI]   = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [savedReports, setSavedReports]       = useState<InspectionReport[]>([]);
  const [searchTerm, setSearchTerm]           = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const STEPS = report.reportType === 'GZ' ? STEPS_GZ : STEPS_TNS;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tlak_revizie_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) { setSavedReports(parsed); return; }
      } catch (_) {}
    }
    generateDemoData(true);
  }, []);

  // Persist
  useEffect(() => {
    if (savedReports.length > 0) {
      localStorage.setItem('tlak_revizie_db', JSON.stringify(savedReports));
    }
  }, [savedReports]);

  // Auto-calc min measurement (TNS)
  useEffect(() => {
    if (report.reportType !== 'TNS') return;
    const vals = Object.values(report.measurements).map(v => parseFloat(v as string));
    const min  = Math.min(...vals.filter(v => !isNaN(v)));
    if (min !== Infinity) setReport(prev => ({ ...prev, minMeasurement: min.toFixed(2) }));
  }, [report.measurements, report.reportType]);

  const handleInputChange = (field: keyof InspectionReport, value: string) =>
    setReport(prev => ({ ...prev, [field]: value }));

  const handleMeasurementChange = (key: keyof ThicknessMeasurements, value: string) =>
    setReport(prev => ({ ...prev, measurements: { ...prev.measurements, [key]: value } }));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessingAI(true);
    try {
      const base64Data     = await fileToGenerativePart(file);
      const extractedData  = await extractDataFromImage(base64Data, file.type);
      setReport(prev => ({ ...prev, ...extractedData }));
    } catch (error) {
      console.error(error);
      alert('Nepodarilo sa analyzovať obrázok. Skúste to prosím znova.');
    } finally {
      setIsProcessingAI(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateDemoData = (silent = false) => {
    const demoReports: InspectionReport[] = [
      {
        ...initialReportState,
        id: 'demo-1', createdAt: Date.now() - 5000000,
        reportType: 'TNS',
        reportDate: '2024-01-10', nextInspectionDate: '2025-01-10',
        reportNumber: 'REV-2024-001',
        operatorName: 'Slovnaft, a.s.', siteName: 'Čerpacia stanica D2',
        siteAddress: 'Prístavná 12, Bratislava',
        manufacturer: 'Dukla Trutnov', serialNumber: '998-A/2021',
        tnsType: 'Vzdušník ležatý', volumeLiters: '500', nominalPressure: '1.0',
        measurements: { topHead: '5.20', shellTop: '5.10', shellMiddle: '5.05', shellBottom: '5.10', bottomHead: '5.25' },
        minMeasurement: '5.05', conclusion: 'TN je schopná bezpečnej prevádzky.',
      },
      {
        ...initialReportState,
        id: 'demo-2', createdAt: Date.now() - 4000000,
        reportType: 'TNS',
        reportDate: '2023-12-05', nextInspectionDate: '2024-03-05',
        reportNumber: 'REV-2023-442',
        operatorName: 'Volkswagen Slovakia, a.s.', siteName: 'Hala H4 - Lisovňa',
        siteAddress: 'Jána Jonáša 1, Bratislava',
        manufacturer: 'Atlas Copco', serialNumber: 'AC-77854',
        tnsType: 'Vzdušník stojatý', volumeLiters: '2000', nominalPressure: '1.6',
        measurements: { topHead: '10.50', shellTop: '10.20', shellMiddle: '10.15', shellBottom: '10.20', bottomHead: '10.45' },
        minMeasurement: '10.15',
      },
      {
        ...initialReportState,
        id: 'demo-3', createdAt: Date.now() - 3000000,
        reportType: 'GZ',
        reportDate: '2024-03-15', nextInspectionDate: '2025-03-15',
        reportNumber: 'GZ-2024-033',
        operatorName: 'Bytové družstvo Petržalka', siteName: 'Kotolňa K1',
        siteAddress: 'Budatínska 1, Bratislava',
        gasInstallationType: 'Kotolňa na plynné palivo',
        gasType: 'Zemný plyn', gasPressureLevel: 'NTL (do 5 kPa)',
        gasOperatingPressure: '2.1', gasMaxPressure: '5',
        gasPipeMaterial: 'Oceľ', gasPipeDiameter: 'DN 32',
        gasPipeLength: '45', gasApplianceCount: '3', gasInstallationYear: '2005',
        gasTightnessTestPressure: '1.5', gasTightnessTestResult: 'Vyhovela',
        gasConclusion: 'Plynové zariadenie je schopné bezpečnej prevádzky.',
      },
      {
        ...initialReportState,
        id: 'demo-4', createdAt: Date.now() - 2000000,
        reportType: 'GZ',
        reportDate: '2022-11-10', nextInspectionDate: '2023-11-10',
        reportNumber: 'GZ-2022-118',
        operatorName: 'Reštaurácia Koliba', siteName: 'Prevádzka - kuchyňa',
        siteAddress: 'Partizánska 5, Žilina',
        gasInstallationType: 'DOPZ - Domový plynovod a odberné plynové zariadenie',
        gasType: 'Zemný plyn', gasPressureLevel: 'NTL (do 5 kPa)',
        gasOperatingPressure: '2.0', gasMaxPressure: '5',
        gasPipeMaterial: 'Meď', gasPipeDiameter: 'DN 20',
        gasPipeLength: '18', gasApplianceCount: '4', gasInstallationYear: '2010',
        gasTightnessTestPressure: '1.5', gasTightnessTestResult: 'Vyhovela',
        gasChimneyResult: 'Závada',
        gasDefectsFound: 'Zistená korózia na dymovodnom potrubí – nutná oprava do 30 dní.',
        gasConclusion: 'Plynové zariadenie je podmienečne schopné prevádzky. Nutná oprava dymovodu.',
      },
      {
        ...initialReportState,
        id: 'demo-5', createdAt: Date.now() - 1000000,
        reportType: 'TNS',
        reportDate: '2024-03-01', nextInspectionDate: '2025-03-01',
        reportNumber: 'REV-2024-085',
        operatorName: 'Nemocnica s poliklinikou', siteName: 'Kompresorovňa kyslíka',
        siteAddress: 'Námestie slobody, Sabinov',
        manufacturer: 'Orlík', serialNumber: 'OR-5541',
        tnsType: 'Vzdušník', volumeLiters: '150', nominalPressure: '1.0',
        measurements: { topHead: '4.50', shellTop: '4.40', shellMiddle: '4.35', shellBottom: '4.40', bottomHead: '4.50' },
        minMeasurement: '4.35',
      },
    ];
    setSavedReports(demoReports);
    if (!silent) alert('Bolo vygenerovaných 5 vzorových revízií.');
  };

  const saveReport = (silent = false) => {
    let r = { ...report };
    if (!r.id) {
      r.id = crypto.randomUUID();
      r.createdAt = Date.now();
      if (!r.reportNumber) {
        const prefix = r.reportType === 'GZ' ? 'GZ' : 'TNS';
        r.reportNumber = `${prefix}-${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      }
    }
    setSavedReports(prev => {
      const idx = prev.findIndex(x => x.id === r.id);
      if (idx >= 0) { const u = [...prev]; u[idx] = r; return u; }
      return [r, ...prev];
    });
    setReport(r);
    if (!silent) alert('Revízia bola úspešne uložená.');
  };

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Naozaj chcete vymazať túto revíziu?'))
      setSavedReports(prev => prev.filter(r => r.id !== id));
  };

  const startNewReport = (type: ReportType) => {
    const license = type === 'GZ' ? '001/2024/RT-PZ' : '001/2024/TNS';
    setReport({ ...initialReportState, id: '', reportType: type, technicianLicense: license });
    setCurrentStep(0);
    setView('editor');
  };

  const editReport = (r: InspectionReport) => {
    setReport(r);
    setCurrentStep(0);
    setView('editor');
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
  const goToPreview = () => setCurrentStep(STEPS.length);

  const handleExportPDF = async (targetReport?: InspectionReport) => {
    const rpt = targetReport || report;
    setIsGeneratingPDF(true);
    if (targetReport) {
      setReport(targetReport);
      setCurrentStep(STEPS.length);
      setView('editor');
      setTimeout(async () => { await executePDFExport(targetReport); setIsGeneratingPDF(false); }, 500);
    } else {
      await executePDFExport(rpt);
      setIsGeneratingPDF(false);
    }
  };

  const executePDFExport = async (r: InspectionReport) => {
    const element = document.getElementById('report-preview-content');
    if (!element) return;
    const opt = {
      margin: 10,
      filename: `Revizia_${r.reportNumber.replace(/[\/\\]/g, '-')}_${r.operatorName.substring(0, 10).replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    try { // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (e) { console.error('PDF generation failed:', e); }
  };

  const getStatusColor = (dateStr: string) => {
    const d = new Date(dateStr).getTime(), now = Date.now(), mo = 1000 * 60 * 60 * 24 * 30;
    if (d < now) return 'bg-white border-l-4 border-red-500';
    if (d < now + mo) return 'bg-white border-l-4 border-orange-500';
    return 'bg-white border-l-4 border-green-500';
  };

  const getStatusBadge = (dateStr: string) => {
    const d = new Date(dateStr).getTime(), now = Date.now(), mo = 1000 * 60 * 60 * 24 * 30;
    if (d < now) return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-tight"><AlertOctagon size={10} /> Exspirované</span>;
    if (d < now + mo) return <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-tight"><Clock size={10} /> Končiaca platnosť</span>;
    return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-tight"><CheckCircle size={10} /> V poriadku</span>;
  };

  const getTypeBadge = (type: ReportType) =>
    type === 'GZ'
      ? <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 uppercase tracking-tight border border-orange-200"><Flame size={10} /> GZ</span>
      : <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 uppercase tracking-tight border border-blue-200"><Gauge size={10} /> TNS</span>;

  const stats = {
    total: savedReports.length,
    expired: savedReports.filter(r => new Date(r.nextInspectionDate).getTime() < Date.now()).length,
    warning: savedReports.filter(r => {
      const d = new Date(r.nextInspectionDate).getTime();
      return d >= Date.now() && d < Date.now() + 1000 * 60 * 60 * 24 * 30;
    }).length,
    valid: savedReports.filter(r => new Date(r.nextInspectionDate).getTime() >= Date.now() + 1000 * 60 * 60 * 24 * 30).length,
  };

  // ═══════════════════════════════════════════════════════════════
  // VIEW: TYPE SELECTION
  // ═══════════════════════════════════════════════════════════════
  if (view === 'type-selection') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Nová revízia</h2>
              <p className="text-slate-400 text-sm mt-1">Vyberte typ zariadenia</p>
            </div>
            <button
              onClick={() => setView('dashboard')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* TNS Card */}
            <button
              onClick={() => startNewReport('TNS')}
              className="group text-left p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">
                <Gauge size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Tlaková nádoba</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                Tlaková nádoba stabilná (TNS) — vzdušníky, expanzné nádoby, zásobníky
              </p>
              <div className="text-xs text-blue-500 font-bold uppercase tracking-widest">
                Vyhl. č. 508/2009 Z.z. • STN 69 0012
              </div>
            </button>

            {/* GZ Card */}
            <button
              onClick={() => startNewReport('GZ')}
              className="group text-left p-8 bg-white rounded-[2rem] border-2 border-slate-100 hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-orange-200 group-hover:scale-110 transition-transform">
                <Flame size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Plynové zariadenie</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">
                DOPZ, kotolne, priemyselné plynové zariadenia, regulačné stanice, LPG zásobníky
              </p>
              <div className="text-xs text-orange-500 font-bold uppercase tracking-widest">
                Vyhl. č. 508/2009 Z.z. Príloha č. 3
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW: DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  if (view === 'dashboard') {
    const filteredReports = savedReports.filter(r =>
      r.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.siteName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <nav className="bg-white text-slate-900 px-4 py-4 shadow-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-blue-200 shadow-lg">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter leading-none">
                  Tlak<span className="text-blue-600">Revízie</span>
                </h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  TNS & Plynové zariadenia
                </span>
              </div>
            </div>
            <button
              onClick={() => setView('type-selection')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={20} /> <span className="hidden sm:inline">Nová Revízia</span>
            </button>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto p-4 md:p-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Celkom</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-3xl font-black text-slate-900">{stats.total}</span>
                <div className="bg-slate-50 p-2 rounded-lg text-slate-400"><FileText size={20} /></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">Vyhovujúce</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-3xl font-black text-green-600">{stats.valid}</span>
                <div className="bg-green-50 p-2 rounded-lg text-green-500"><CheckCircle size={20} /></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-orange-500 text-[10px] font-black uppercase tracking-widest">Upozornenia</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-3xl font-black text-orange-600">{stats.warning}</span>
                <div className="bg-orange-50 p-2 rounded-lg text-orange-500"><Clock size={20} /></div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">Exspirované</span>
              <div className="flex items-end justify-between mt-1">
                <span className="text-3xl font-black text-red-600">{stats.expired}</span>
                <div className="bg-red-50 p-2 rounded-lg text-red-500"><AlertTriangle size={20} /></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Databáza protokolov</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Hľadať firmu, číslo správy, prevádzku..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Nenašli sa žiadne výsledky</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">Skúste iné kľúčové slovo alebo nahrajte vzorové dáta.</p>
                <button onClick={() => generateDemoData()} className="mt-8 text-blue-600 font-black hover:bg-blue-50 px-6 py-2 rounded-full transition-all">
                  Generovať vzory
                </button>
              </div>
            ) : (
              filteredReports.map(r => (
                <div
                  key={r.id}
                  onClick={() => editReport(r)}
                  className={`group p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-slate-100 ${getStatusColor(r.nextInspectionDate)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        {getTypeBadge(r.reportType)}
                        <h3 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-md">
                          {r.operatorName}
                        </h3>
                        {getStatusBadge(r.nextInspectionDate)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <FileText size={14} className="text-slate-300" /> {r.reportNumber}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          {r.reportType === 'GZ'
                            ? <><Flame size={14} className="text-slate-300" /> {r.gasInstallationType?.split(' - ')[0] || 'Plynové zariadenie'}</>
                            : <><Database size={14} className="text-slate-300" /> {r.tnsType}</>
                          }
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 col-span-2 md:col-span-1">
                          <Home size={14} className="text-slate-300" /> {r.siteName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 pt-5 md:pt-0 border-t md:border-none border-slate-50">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block">Ďalšia revízia</span>
                        <span className="text-sm font-black text-slate-700">
                          {new Date(r.nextInspectionDate).toLocaleDateString('sk-SK')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleExportPDF(r); }}
                          className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all active:scale-90"
                          title="Export PDF"
                        >
                          <FileDown size={20} />
                        </button>
                        <button
                          onClick={e => deleteReport(r.id, e)}
                          className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90"
                          title="Zmazať"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // VIEW: EDITOR
  // ═══════════════════════════════════════════════════════════════
  const isGZ  = report.reportType === 'GZ';
  const accentCls = isGZ
    ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100';

  return (
    <div className="min-h-screen pb-24 print:pb-0 bg-slate-50">
      {/* Nav */}
      <nav className="bg-white text-slate-900 p-4 shadow-sm border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
              <ChevronLeft className="text-slate-600 group-hover:text-blue-600 w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            {isGZ
              ? <span className="hidden sm:flex items-center gap-1 text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 uppercase tracking-widest"><Flame size={12} /> Plynové zariadenie</span>
              : <span className="hidden sm:flex items-center gap-1 text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200 uppercase tracking-widest"><Gauge size={12} /> Tlaková nádoba</span>
            }
            <button onClick={() => saveReport()} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all hover:bg-slate-800 shadow-lg active:scale-95 flex items-center gap-2">
              <Save size={16} /> <span className="hidden sm:inline">Uložiť</span>
            </button>
            <button onClick={goToPreview} className={`text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2 ${accentCls}`}>
              <Eye size={16} /> <span className="hidden sm:inline">Náhľad & PDF</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 md:p-10">
        {/* Stepper */}
        <div className="mb-12 print:hidden">
          <div className="flex justify-between items-center relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-200 -z-0"></div>
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className="relative z-10 flex flex-col items-center group cursor-pointer"
                onClick={() => idx <= currentStep && setCurrentStep(idx)}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ring-8 ${
                  idx === currentStep
                    ? `${isGZ ? 'bg-orange-500' : 'bg-blue-600'} text-white ring-${isGZ ? 'orange' : 'blue'}-50 scale-110 shadow-xl`
                    : idx < currentStep
                    ? `${isGZ ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600'} ring-white`
                    : 'bg-white text-slate-300 ring-white border border-slate-200'
                }`}>
                  {idx < currentStep ? <CheckCircle size={20} /> : idx + 1}
                </div>
                <span className={`text-[10px] uppercase tracking-widest mt-4 font-black absolute -bottom-8 w-32 text-center transition-colors ${
                  idx === currentStep ? (isGZ ? 'text-orange-500' : 'text-blue-600') : 'text-slate-300'
                }`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 mt-16 animate-in fade-in duration-700">

          {/* ── STEP 0: Základné údaje (spoločné pre TNS aj GZ) ── */}
          {currentStep === 0 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Všeobecné informácie</h2>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isGZ ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600'}`}>
                  Krok 1/{STEPS.length}
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Dátum prehliadky">
                  <input type="date" value={report.reportDate} onChange={e => handleInputChange('reportDate', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Číslo správy">
                  <input type="text" value={report.reportNumber} onChange={e => handleInputChange('reportNumber', e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Prevádzkovateľ</h3>
                  <input type="text" placeholder="Názov firmy / osoby" value={report.operatorName} onChange={e => handleInputChange('operatorName', e.target.value)} className={inputCls} />
                  <input type="text" placeholder="Adresa sídla" value={report.operatorAddress} onChange={e => handleInputChange('operatorAddress', e.target.value)} className={inputCls} />
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                  <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Miesto prevádzky</h3>
                  <input type="text" placeholder="Názov objektu / prevádzky" value={report.siteName} onChange={e => handleInputChange('siteName', e.target.value)} className={inputCls} />
                  <input type="text" placeholder="Adresa prevádzky" value={report.siteAddress} onChange={e => handleInputChange('siteAddress', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Revízny technik</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Meno a priezvisko" value={report.technicianName} onChange={e => handleInputChange('technicianName', e.target.value)} className={inputCls} />
                  <input type="text" placeholder={`Č. osvedčenia RT ${isGZ ? 'PZ' : 'TNS'}`} value={report.technicianLicense} onChange={e => handleInputChange('technicianLicense', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1 TNS: Technické parametre ── */}
          {currentStep === 1 && !isGZ && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Technické parametre TNS</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-100"
                >
                  {isProcessingAI ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Auto-Sken z fotky
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Field label="Výrobca">
                    <input type="text" value={report.manufacturer} onChange={e => handleInputChange('manufacturer', e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Výrobné číslo">
                    <input type="text" value={report.serialNumber} onChange={e => handleInputChange('serialNumber', e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <Field label="Rok výroby">
                  <input type="text" value={report.yearOfManufacture} onChange={e => handleInputChange('yearOfManufacture', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Typ TNS">
                  <input type="text" value={report.tnsType} onChange={e => handleInputChange('tnsType', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Objem (L)">
                  <input type="number" value={report.volumeLiters} onChange={e => handleInputChange('volumeLiters', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Max. tlak (MPa)">
                  <input type="number" step="0.1" value={report.nominalPressure} onChange={e => handleInputChange('nominalPressure', e.target.value)} className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Médium">
                    <input type="text" value={report.medium} onChange={e => handleInputChange('medium', e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Zaradenie (napr. Ab1)">
                    <input type="text" value={report.classification} onChange={e => handleInputChange('classification', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1 GZ: Parametre plynového zariadenia ── */}
          {currentStep === 1 && isGZ && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Parametre plynového zariadenia</h2>
                <p className="text-slate-400 text-xs mt-1">Vyhl. č. 508/2009 Z.z. Príloha č. 3</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Field label="Druh plynového zariadenia">
                  <select value={report.gasInstallationType} onChange={e => handleInputChange('gasInstallationType', e.target.value)} className={selectCls}>
                    <option>DOPZ - Domový plynovod a odberné plynové zariadenie</option>
                    <option>Kotolňa na plynné palivo</option>
                    <option>Priemyselné plynové zariadenie</option>
                    <option>Regulačná stanica plynu</option>
                    <option>LP zásobník (LPG)</option>
                    <option>Technologické plynové zariadenie</option>
                  </select>
                </Field>
                <Field label="Druh plynu">
                  <select value={report.gasType} onChange={e => handleInputChange('gasType', e.target.value)} className={selectCls}>
                    <option>Zemný plyn</option>
                    <option>Propán-bután (LPG)</option>
                    <option>Mestský plyn</option>
                    <option>Propán</option>
                  </select>
                </Field>
                <Field label="Tlakový stupeň">
                  <select value={report.gasPressureLevel} onChange={e => handleInputChange('gasPressureLevel', e.target.value)} className={selectCls}>
                    <option>NTL (do 5 kPa)</option>
                    <option>STL (5 kPa – 400 kPa)</option>
                    <option>VTL (nad 400 kPa)</option>
                  </select>
                </Field>
                <Field label="Materiál potrubia">
                  <select value={report.gasPipeMaterial} onChange={e => handleInputChange('gasPipeMaterial', e.target.value)} className={selectCls}>
                    <option>Oceľ</option>
                    <option>Meď</option>
                    <option>PE (polyetylén)</option>
                    <option>Nerez</option>
                    <option>Liatina</option>
                  </select>
                </Field>
                <Field label="Prevádzkový tlak PP (kPa)">
                  <input type="number" step="0.1" value={report.gasOperatingPressure} onChange={e => handleInputChange('gasOperatingPressure', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Max. prevádzkový tlak MOP (kPa)">
                  <input type="number" step="0.1" value={report.gasMaxPressure} onChange={e => handleInputChange('gasMaxPressure', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Menovitý priemer DN">
                  <input type="text" placeholder="napr. DN 25" value={report.gasPipeDiameter} onChange={e => handleInputChange('gasPipeDiameter', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Dĺžka plynovodu (m)">
                  <input type="number" value={report.gasPipeLength} onChange={e => handleInputChange('gasPipeLength', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Počet plynových spotrebičov (ks)">
                  <input type="number" value={report.gasApplianceCount} onChange={e => handleInputChange('gasApplianceCount', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Rok inštalácie">
                  <input type="text" placeholder="napr. 2005" value={report.gasInstallationYear} onChange={e => handleInputChange('gasInstallationYear', e.target.value)} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Ročná spotreba plynu (m³/rok) — voliteľné">
                    <input type="number" value={report.gasAnnualConsumption} onChange={e => handleInputChange('gasAnnualConsumption', e.target.value)} className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 TNS: Merania ── */}
          {currentStep === 2 && !isGZ && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight border-b border-slate-100 pb-4">Meranie hrúbky steny</h2>
              <TankDiagram measurements={report.measurements} onChange={handleMeasurementChange} />
              <div className="p-6 bg-slate-900 rounded-3xl flex items-center justify-between text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Najnižšia nameraná hodnota</span>
                <span className="text-4xl font-black">{report.minMeasurement} <small className="text-xl">mm</small></span>
              </div>
            </div>
          )}

          {/* ── STEP 2 GZ: Výsledky prehliadky ── */}
          {currentStep === 2 && isGZ && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight border-b border-slate-100 pb-4">Výsledky odbornej prehliadky</h2>

              {/* Vizuálna kontrola */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Vizuálna kontrola zariadenia</label>
                <textarea rows={3} value={report.gasVisualInspectionResult} onChange={e => handleInputChange('gasVisualInspectionResult', e.target.value)} className={`${inputCls} resize-none`} />
              </div>

              {/* Skúška plynotesnosti */}
              <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 space-y-4">
                <h3 className="font-black text-orange-700 text-sm uppercase tracking-widest flex items-center gap-2"><Flame size={16} /> Skúška plynotesnosti</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Skúšobný tlak (kPa)">
                    <input type="number" step="0.1" value={report.gasTightnessTestPressure} onChange={e => handleInputChange('gasTightnessTestPressure', e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Skúšobné médium">
                    <select value={report.gasTightnessTestMedium} onChange={e => handleInputChange('gasTightnessTestMedium', e.target.value)} className={selectCls}>
                      <option>Vzduch</option>
                      <option>Dusík</option>
                      <option>Plyn</option>
                    </select>
                  </Field>
                  <Field label="Dĺžka trvania (min)">
                    <input type="number" value={report.gasTightnessTestDuration} onChange={e => handleInputChange('gasTightnessTestDuration', e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleInputChange('gasTightnessTestResult', 'Vyhovela')}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.gasTightnessTestResult === 'Vyhovela' ? 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    ✓ Vyhovela
                  </button>
                  <button
                    onClick={() => handleInputChange('gasTightnessTestResult', 'Nevyhovela')}
                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.gasTightnessTestResult === 'Nevyhovela' ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-400'}`}
                  >
                    ✗ Nevyhovela
                  </button>
                </div>
              </div>

              {/* Kontrolný zoznam */}
              <div className="space-y-3">
                <h3 className="font-black text-slate-500 text-xs uppercase tracking-widest">Kontrolný zoznam</h3>
                <GasCheck label="Bezpečnostné uzávery (hlavný uzáver, spotrebičové uzávery)" value={report.gasShutoffValvesResult} onChange={v => handleInputChange('gasShutoffValvesResult', v)} />
                <GasCheck label="Regulátory tlaku plynu" value={report.gasRegulatorResult} onChange={v => handleInputChange('gasRegulatorResult', v)} />
                <GasCheck label="Manometre a meracie zariadenia" value={report.gasManometerResult} onChange={v => handleInputChange('gasManometerResult', v)} />
                <GasCheck label="Plynoměr a odberné miesto" value={report.gasMeterResult} onChange={v => handleInputChange('gasMeterResult', v)} />
                <GasCheck label="Dymovody a komínové teleso" value={report.gasChimneyResult} onChange={v => handleInputChange('gasChimneyResult', v)} />
                <GasCheck label="Vetranie priestoru a prívod spaľovacieho vzduchu" value={report.gasVentilationResult} onChange={v => handleInputChange('gasVentilationResult', v)} />
              </div>

              {/* Zistené nedostatky */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Zistené nedostatky a uložené opatrenia</label>
                <textarea rows={3} value={report.gasDefectsFound} onChange={e => handleInputChange('gasDefectsFound', e.target.value)} className={`${inputCls} resize-none`} />
              </div>
            </div>
          )}

          {/* ── STEP 3: Záver (TNS aj GZ) ── */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight border-b border-slate-100 pb-4">Záver a plánovanie</h2>

              {/* Vizuálna kontrola - len TNS */}
              {!isGZ && (
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Výsledok vizuálnej kontroly</label>
                  <textarea rows={2} value={report.visualInspectionResult} onChange={e => handleInputChange('visualInspectionResult', e.target.value)} className={`${inputCls} resize-none`} />
                </div>
              )}

              {/* Plánovaná revízia */}
              <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden ${isGZ ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}>
                <Calendar className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10" />
                <h3 className="font-black text-lg mb-6 flex items-center gap-2 uppercase tracking-widest opacity-90">
                  <Clock size={20} /> Plánovaná ďalšia revízia
                </h3>
                <div className="flex gap-4 mb-6 relative z-10">
                  {(isGZ ? [1, 2, 3] : [1, 2, 5]).map(year => (
                    <button key={year} onClick={() => {
                      const d = new Date(report.reportDate);
                      d.setFullYear(d.getFullYear() + year);
                      handleInputChange('nextInspectionDate', d.toISOString().split('T')[0]);
                    }} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                      +{year} r
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={report.nextInspectionDate}
                  onChange={e => handleInputChange('nextInspectionDate', e.target.value)}
                  className="w-full p-5 rounded-2xl bg-white text-slate-900 font-black text-xl outline-none relative z-10"
                />
              </div>

              {/* Záver - TNS */}
              {!isGZ && (
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Zhodnotenie technika</label>
                  <div className="flex gap-3">
                    <button onClick={() => handleInputChange('conclusion', 'TN je schopná bezpečnej prevádzky.')} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.conclusion.includes('schopná') && !report.conclusion.includes('NIE') ? 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-400'}`}>Schopná</button>
                    <button onClick={() => handleInputChange('conclusion', 'TN NIE JE schopná prevádzky. Odstaviť!')} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.conclusion.includes('NIE JE') ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-400'}`}>Neschopná</button>
                  </div>
                </div>
              )}

              {/* Záver - GZ */}
              {isGZ && (
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Celkové zhodnotenie</label>
                  <div className="flex gap-3 flex-wrap">
                    <button onClick={() => handleInputChange('gasConclusion', 'Plynové zariadenie je schopné bezpečnej prevádzky.')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.gasConclusion.includes('schopné bezpečnej') ? 'bg-green-500 border-green-500 text-white shadow-xl shadow-green-100' : 'bg-white border-slate-100 text-slate-400'}`}>Schopné prevádzky</button>
                    <button onClick={() => handleInputChange('gasConclusion', 'Plynové zariadenie je podmienečne schopné prevádzky. Nutné odstrániť závady.')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.gasConclusion.includes('podmienečne') ? 'bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-100' : 'bg-white border-slate-100 text-slate-400'}`}>Podmienečne</button>
                    <button onClick={() => handleInputChange('gasConclusion', 'Plynové zariadenie NIE JE schopné prevádzky. Odstaviť z prevádzky!')} className={`flex-1 min-w-[140px] py-4 rounded-2xl text-xs font-black uppercase tracking-widest border-2 transition-all ${report.gasConclusion.includes('NIE JE') ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-100' : 'bg-white border-slate-100 text-slate-400'}`}>Neschopné</button>
                  </div>
                  <textarea rows={2} value={isGZ ? report.gasConclusion : report.conclusion} onChange={e => handleInputChange(isGZ ? 'gasConclusion' : 'conclusion', e.target.value)} className={`${inputCls} resize-none`} />
                </div>
              )}
            </div>
          )}

          {/* ── Preview ── */}
          {currentStep === STEPS.length && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isGZ ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600'}`}>
                    <FileCheck size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-none">Pripravené na export</h2>
                    <p className="text-slate-400 text-xs mt-1 font-bold">Skontrolujte údaje pred stiahnutím PDF.</p>
                  </div>
                </div>
                <button onClick={() => handleExportPDF()} disabled={isGeneratingPDF} className="flex items-center gap-3 px-10 py-5 rounded-3xl font-black text-white bg-slate-900 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {isGeneratingPDF ? <Loader2 className="animate-spin w-6 h-6" /> : <Download size={24} />}
                  {isGeneratingPDF ? 'Generujem...' : 'Exportovať PDF'}
                </button>
              </div>
              <div className="bg-slate-50 p-4 md:p-10 rounded-[3rem] border border-slate-200 shadow-inner">
                <div className="bg-white shadow-2xl overflow-hidden rounded-sm">
                  {isGZ ? <GasReportPreview data={report} /> : <ReportPreview data={report} />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md p-6 border-t border-slate-100 flex justify-between md:relative md:bg-transparent md:border-none md:p-0 md:mt-12 print:hidden z-40">
          <button onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-600 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-[10px]">
            <ChevronLeft size={16} /> Späť
          </button>
          {currentStep < STEPS.length && (
            <button onClick={nextStep} className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[10px] ${accentCls}`}>
              Ďalej <ChevronRight size={16} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
