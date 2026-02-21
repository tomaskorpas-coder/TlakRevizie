import React from 'react';
import { InspectionReport } from '../types';

interface GasReportPreviewProps {
  data: InspectionReport;
}

const StatusCell: React.FC<{ value: string }> = ({ value }) => {
  const isOK = value === 'OK' || value === 'Vyhovela';
  const isNA = value === 'N/A';
  const isFail = value === 'Závada' || value === 'Nevyhovela';
  return (
    <td
      className={`border border-black p-1.5 text-center font-bold text-xs w-28 ${
        isOK ? 'text-green-700' : isFail ? 'text-red-700' : isNA ? 'text-gray-400' : 'text-gray-700'
      }`}
    >
      {isOK ? '✓ ' : isFail ? '✗ ' : ''}{value}
    </td>
  );
};

export const GasReportPreview: React.FC<GasReportPreviewProps> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('sk-SK'); } catch { return dateStr; }
  };

  return (
    <div
      id="report-preview-content"
      className="bg-white p-8 max-w-[210mm] mx-auto text-black text-sm leading-tight shadow-xl print:shadow-none print:w-full print:max-w-none"
    >
      {/* ─── Hlavička dokumentu ─── */}
      <div className="text-center mb-5">
        <div className="font-bold text-base uppercase tracking-wide border-b-2 border-black pb-2 mb-1">
          Správa o odbornej prehliadke a odbornej skúške
          <br />
          plynového zariadenia
        </div>
        <div className="text-xs text-gray-600 mt-1">
          v zmysle vyhl. MPSVaR SR č. 508/2009 Z.z. (Príloha č. 3) a § 14 zákona NR SR č. 124/2006 Z.z.
        </div>
      </div>

      {/* ─── Identifikácia dokumentu ─── */}
      <div className="grid grid-cols-3 gap-0 border border-black mb-4 text-xs">
        <div className="p-2 border-r border-black">
          <span className="font-bold">Číslo správy: </span>{data.reportNumber}
        </div>
        <div className="p-2 border-r border-black">
          <span className="font-bold">Dátum vykonania: </span>{formatDate(data.reportDate)}
        </div>
        <div className="p-2">
          <span className="font-bold">Druh prehliadky: </span>Odborná prehliadka a skúška
        </div>
      </div>

      {/* ─── Prevádzkovateľ, prevádzka, technik ─── */}
      <table className="w-full border-collapse border border-black mb-4 text-xs">
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-100 w-[28%]">Prevádzkovateľ:</td>
            <td className="border border-black p-2">
              <span className="font-bold">{data.operatorName}</span>
              {data.operatorAddress && (
                <span className="text-gray-600">, {data.operatorAddress}</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-100">Prevádzka / Objekt:</td>
            <td className="border border-black p-2">
              <span className="font-bold">{data.siteName}</span>
              {data.siteAddress && (
                <span className="text-gray-600">, {data.siteAddress}</span>
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-100">Revízny technik:</td>
            <td className="border border-black p-2">
              {data.technicianName} — osvedčenie RT PZ č. <span className="font-bold">{data.technicianLicense}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ─── I. Technické parametre ─── */}
      <div className="font-bold text-xs uppercase tracking-wide bg-gray-200 border border-black border-b-0 p-1.5">
        I. Technické parametre plynového zariadenia
      </div>
      <table className="w-full border-collapse border border-black mb-4 text-xs">
        <tbody>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50 w-[28%]">
              Druh plynového zariadenia:
            </td>
            <td className="border border-black p-1.5 w-[22%]">{data.gasInstallationType}</td>
            <td className="border border-black p-1.5 font-bold bg-gray-50 w-[28%]">Druh plynu:</td>
            <td className="border border-black p-1.5">{data.gasType}</td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Tlakový stupeň:</td>
            <td className="border border-black p-1.5">{data.gasPressureLevel}</td>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Prevádzkový tlak (PP):</td>
            <td className="border border-black p-1.5">{data.gasOperatingPressure} kPa</td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Max. prevádzkový tlak (MOP):</td>
            <td className="border border-black p-1.5">{data.gasMaxPressure} kPa</td>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Materiál potrubia:</td>
            <td className="border border-black p-1.5">{data.gasPipeMaterial}</td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Menovitý priemer (DN):</td>
            <td className="border border-black p-1.5">{data.gasPipeDiameter}</td>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Dĺžka plynovodu:</td>
            <td className="border border-black p-1.5">
              {data.gasPipeLength ? `${data.gasPipeLength} m` : '—'}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Počet plynových spotrebičov:</td>
            <td className="border border-black p-1.5">
              {data.gasApplianceCount ? `${data.gasApplianceCount} ks` : '—'}
            </td>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Rok inštalácie:</td>
            <td className="border border-black p-1.5">{data.gasInstallationYear || '—'}</td>
          </tr>
          {data.gasAnnualConsumption && (
            <tr>
              <td className="border border-black p-1.5 font-bold bg-gray-50">Ročná spotreba plynu:</td>
              <td className="border border-black p-1.5" colSpan={3}>
                {data.gasAnnualConsumption} m³/rok
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ─── II. Výsledky prehliadky ─── */}
      <div className="font-bold text-xs uppercase tracking-wide bg-gray-200 border border-black border-b-0 p-1.5">
        II. Výsledky odbornej prehliadky a odbornej skúšky
      </div>
      <table className="w-full border-collapse border border-black mb-2 text-xs">
        <tbody>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50 w-[28%]">
              Vizuálna kontrola zariadenia:
            </td>
            <td className="border border-black p-1.5" colSpan={3}>
              {data.gasVisualInspectionResult}
            </td>
          </tr>
          <tr>
            <td className="border border-black p-1.5 font-bold bg-gray-50">Skúška plynotesnosti:</td>
            <td className="border border-black p-1.5" colSpan={3}>
              Médium:{' '}
              <span className="font-bold">{data.gasTightnessTestMedium}</span>
              {' — '}Skúšobný tlak:{' '}
              <span className="font-bold">{data.gasTightnessTestPressure} kPa</span>
              {' — '}Dĺžka trvania:{' '}
              <span className="font-bold">{data.gasTightnessTestDuration} min.</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Checklist tabuľka */}
      <table className="w-full border-collapse border border-black mb-4 text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1.5 text-left font-bold">Kontrolovaná položka</th>
            <th className="border border-black p-1.5 w-28 font-bold">Výsledok</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1.5">
              Skúška plynotesnosti plynovodnej inštalácie
            </td>
            <StatusCell value={data.gasTightnessTestResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">
              Kontrola bezpečnostných uzáverov (hlavný uzáver, spotrebičové uzávery)
            </td>
            <StatusCell value={data.gasShutoffValvesResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">Kontrola regulátorov tlaku plynu</td>
            <StatusCell value={data.gasRegulatorResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">
              Kontrola manometrov a meracích zariadení
            </td>
            <StatusCell value={data.gasManometerResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">
              Kontrola plynoměra a odberného miesta
            </td>
            <StatusCell value={data.gasMeterResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">
              Kontrola dymovodov a komínového telesa
            </td>
            <StatusCell value={data.gasChimneyResult} />
          </tr>
          <tr>
            <td className="border border-black p-1.5">
              Kontrola vetrania priestoru a prívodu spaľovacieho vzduchu
            </td>
            <StatusCell value={data.gasVentilationResult} />
          </tr>
        </tbody>
      </table>

      {/* Zistené nedostatky */}
      <div className="mb-4">
        <div className="font-bold text-xs uppercase tracking-wide mb-1">
          Zistené nedostatky a uložené opatrenia:
        </div>
        <div className="border border-black p-2 min-h-[36px] text-xs">
          {data.gasDefectsFound}
        </div>
      </div>

      {/* ─── III. Záver ─── */}
      <div className="mb-6 border-2 border-black p-4 bg-gray-50">
        <h3 className="font-bold text-sm uppercase underline mb-2">III. Celkové zhodnotenie:</h3>
        <p className="text-base font-bold text-center py-1">{data.gasConclusion}</p>
        <p className="mt-2 text-xs italic">
          Zariadenie bolo skontrolované v zmysle § 14 zákona NR SR č. 124/2006 Z.z. a vyhl. MPSVaR
          SR č. 508/2009 Z.z. (Príloha č. 3).
        </p>
        <p className="mt-2 font-bold text-xs">
          Termín nasledujúcej odbornej prehliadky a skúšky:{' '}
          <span className="underline">do {formatDate(data.nextInspectionDate)}</span>
        </p>
      </div>

      {/* ─── Podpisy ─── */}
      <div className="flex justify-between mt-8 pt-4 px-4">
        <div className="text-center">
          <div className="h-16 w-36 border-b border-black mb-2"></div>
          <p className="font-bold text-xs">Prevádzkovateľ</p>
          <p className="text-xs text-gray-500">(Podpis a pečiatka)</p>
        </div>
        <div className="text-center">
          <div className="h-16 w-36 border-b border-black mb-2 flex items-end justify-center">
            <span className="text-gray-300 text-xs mb-1">[Pečiatka RT]</span>
          </div>
          <p className="font-bold text-xs">{data.technicianName}</p>
          <p className="text-xs text-gray-500">
            Revízny technik PZ ({data.technicianLicense})
          </p>
        </div>
      </div>

      <div className="text-xs text-right mt-6 text-gray-400">
        Vygenerované aplikáciou TlakRevízie • {new Date().toLocaleDateString('sk-SK')}
      </div>
    </div>
  );
};
