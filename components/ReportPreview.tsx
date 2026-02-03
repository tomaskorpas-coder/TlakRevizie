import React from 'react';
import { InspectionReport } from '../types';

interface ReportPreviewProps {
  data: InspectionReport;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ data }) => {
  return (
    <div id="report-preview-content" className="bg-white p-8 max-w-[210mm] mx-auto text-black text-sm leading-tight shadow-xl print:shadow-none print:w-full print:max-w-none">
      
      {/* Header */}
      <div className="text-center font-bold text-lg mb-6 border-b-2 border-black pb-2">
        Správa o odbornej prehliadke a skúške tlakovej nádoby stabilnej
        <br />
        <span className="text-sm font-normal">podľa vyhl. MPSVaR SR č. 508/2009 Z.z. a STN 69 0012</span>
      </div>

      {/* Table 1: General Info */}
      <table className="w-full border-collapse border border-black mb-4">
        <tbody>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-100 w-1/4">Prevádzkovateľ:</td>
            <td className="border border-black p-2 w-3/4">
              <div className="font-bold">{data.operatorName}</div>
              <div>{data.operatorAddress}</div>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 font-bold bg-gray-100">Prevádzka:</td>
            <td className="border border-black p-2">
              <div className="font-bold">{data.siteName}</div>
              <div>{data.siteAddress}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 2: Technical Data */}
      <div className="grid grid-cols-2 gap-0 border border-black mb-4">
        {/* Left Column */}
        <div className="border-r border-black">
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Druh skúšky:</span>
            <span>Vnútorná, Tlaková</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Dátum vykonania:</span>
            <span>{data.reportDate}</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between bg-yellow-50 print:bg-transparent">
            <span className="font-bold">Ďalšia prehliadka:</span>
            <span className="font-bold">{data.nextInspectionDate}</span>
          </div>
           <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Číslo správy:</span>
            <span>{data.reportNumber}</span>
          </div>
           <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Technik:</span>
            <span>{data.technicianName}</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Osvedčenie:</span>
            <span>{data.technicianLicense}</span>
          </div>
        </div>
        {/* Right Column */}
        <div>
           <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Výrobca:</span>
            <span>{data.manufacturer}</span>
          </div>
           <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Typ TNS:</span>
            <span>{data.tnsType}</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Výr. číslo:</span>
            <span>{data.serialNumber}</span>
          </div>
           <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Rok výroby:</span>
            <span>{data.yearOfManufacture}</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Objem:</span>
            <span>{data.volumeLiters} L</span>
          </div>
          <div className="p-1 border-b border-black flex justify-between">
            <span className="font-bold">Tlak (PS):</span>
            <span>{data.nominalPressure} MPa</span>
          </div>
        </div>
      </div>

      {/* Section: Measurements Description */}
      <div className="mb-4">
        <p className="mb-2">
          <span className="font-bold">Vnútorná prehliadka:</span> Vykonaná skúškou tesnosti a meraním hrúbky steny ultrazvukovým prístrojom {data.ultrasonicDevice}.
          Preverený bol vnútorný plášť nádoby a klenuté dná.
        </p>
        <p className="mb-2 font-bold underline">Namerané hodnoty hrúbky steny (v mm):</p>
        
        {/* Diagram Representation for Print */}
        <div className="flex justify-center items-center gap-8 border border-gray-300 p-4 rounded mb-2">
            <div className="w-32 h-48 border-2 border-black rounded-[2rem] relative flex items-center justify-center">
                <span className="text-xs absolute top-2 text-gray-500">Horné dno</span>
                <span className="font-bold absolute top-6 bg-white px-1">{data.measurements.topHead}</span>
                
                <span className="font-bold absolute top-16 left-[-10px] bg-white px-1">{data.measurements.shellTop}</span>
                <span className="font-bold bg-white px-1 z-10">{data.measurements.shellMiddle}</span>
                <span className="font-bold absolute bottom-16 right-[-10px] bg-white px-1">{data.measurements.shellBottom}</span>
                
                <span className="text-xs absolute bottom-2 text-gray-500">Dolné dno</span>
                <span className="font-bold absolute bottom-6 bg-white px-1">{data.measurements.bottomHead}</span>
            </div>
            <div className="text-sm">
                <ul className="list-disc pl-4">
                    <li>Horné dno: <b>{data.measurements.topHead} mm</b></li>
                    <li>Plášť (min): <b>{Math.min(
                        parseFloat(data.measurements.shellTop || '99'),
                        parseFloat(data.measurements.shellMiddle || '99'),
                        parseFloat(data.measurements.shellBottom || '99')
                    ).toFixed(2)} mm</b></li>
                    <li>Dolné dno: <b>{data.measurements.bottomHead} mm</b></li>
                </ul>
            </div>
        </div>
        <p>Minimálna nameraná hodnota: <b>{data.minMeasurement} mm</b>.</p>
      </div>

      {/* Section: Test Results */}
      <div className="mb-4 border-t border-black pt-2">
        <p className="mb-1"><span className="font-bold">Skúška tesnosti:</span> Vykonaná médiom {data.medium} o tlaku {data.pressureTestValue} MPa.</p>
        <p className="mb-1"><span className="font-bold">Kontrolný manometer:</span> {data.pressureGauge}.</p>
        <p className="mb-1"><span className="font-bold">Zistenia:</span> {data.visualInspectionResult}</p>
      </div>

       {/* Section: Conclusion */}
       <div className="mb-8 border-2 border-black p-4 bg-gray-50">
        <h3 className="font-bold text-lg underline mb-2">Celkové zhodnotenie:</h3>
        <p className="text-lg font-bold text-center">{data.conclusion}</p>
        <p className="mt-2 text-xs italic">Zariadenie je schopné bezpečnej prevádzky podľa § 9 ods. 1 zákona NR SR č. 124/2006 Z.z.</p>
        <p className="mt-1 font-bold">Termín nasledujúcej odbornej prehliadky: do {data.nextInspectionDate}</p>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-12 pt-8 px-8">
        <div className="text-center">
            <div className="h-16 w-32 border-b border-black mb-2"></div>
            <p className="font-bold">Prevádzkovateľ</p>
            <p className="text-xs">(Podpis a pečiatka)</p>
        </div>
         <div className="text-center">
            <div className="h-16 w-32 border-b border-black mb-2 flex items-end justify-center">
                <span className="text-gray-300 text-xs mb-1">[Pečiatka RT]</span>
            </div>
            <p className="font-bold">{data.technicianName}</p>
            <p className="text-xs">Revízny technik ({data.technicianLicense})</p>
        </div>
      </div>

      <div className="text-xs text-right mt-8 text-gray-400">
        Vygenerované aplikáciou TlakRevízie • {new Date().toLocaleDateString('sk-SK')}
      </div>
    </div>
  );
};