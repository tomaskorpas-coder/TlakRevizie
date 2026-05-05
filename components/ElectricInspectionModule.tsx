import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Plus, Trash2, ChevronLeft, ChevronRight,
  Printer, Save, Zap, AlertTriangle, CheckCircle, Clock,
  FileText, Search, Loader2, AlertOctagon, ArrowLeft,
  Eye, FileDown, Sparkles, List, X, Edit2, Check, Volume2,
} from 'lucide-react';
import { EZInspectionType, EZMeasurement, EZInspection } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

// ─── Constants ────────────────────────────────────────────────────────────────

const EZ_TYPE_LABELS: Record<EZInspectionType, string> = {
  EI: 'Elektrická inštalácia',
  HN: 'Hromozvod / Bleskozod',
  RN: 'Ručné elektrické náradie',
  SP: 'Elektrické spotrebiče',
};

const EZ_TYPE_NORMS: Record<EZInspectionType, string> = {
  EI: 'STN 33 1500, STN 33 2000-6',
  HN: 'STN EN 62305-1 až 4',
  RN: 'STN 33 1600',
  SP: 'STN 33 1610',
};

const EZ_NEXT_YEARS: Record<EZInspectionType, number> = {
  EI: 5, HN: 5, RN: 1, SP: 1,
};

const addYears = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
};

const makeEmpty = (): EZInspection => ({
  id: '',
  createdAt: 0,
  electricalType: 'EI',
  inspectionKind: 'pravidelna',
  reportDate: new Date().toISOString().split('T')[0],
  reportNumber: '',
  nextInspectionDate: addYears(5),
  objectName: '',
  objectAddress: '',
  operatorName: '',
  operatorAddress: '',
  technicianName: '',
  technicianLicense: '',
  technicianLicenseValidity: '',
  nominalVoltage: '230/400 V, 50 Hz',
  systemType: 'TN-C-S',
  installedPower: '',
  protectionMethod: 'Automatickým odpojením od zdroja',
  measuringDevices: '',
  measurements: [],
  defectsFound: 'Neboli zistené žiadne závady.',
  conclusion: 'Elektrická inštalácia je schopná bezpečnej prevádzky.',
  conclusionResult: 'vyhovel',
  notes: '',
});

const STEPS = ['Základné Údaje', 'Tech. Parametre', 'Merania', 'Záver'];

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const inp = 'w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-50 focus:border-violet-500 outline-none font-bold text-slate-700 bg-white';
const sel = 'w-full p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-violet-50 focus:border-violet-500 outline-none font-bold text-slate-700 bg-white appearance-none';

// ─── Step 0: Základné údaje ───────────────────────────────────────────────────

function Step0({ ins, set }: { ins: EZInspection; set: (f: keyof EZInspection, v: any) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Typ zariadenia</label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {(['EI', 'HN', 'RN', 'SP'] as EZInspectionType[]).map(t => (
            <button key={t} onClick={() => { set('electricalType', t); set('nextInspectionDate', addYears(EZ_NEXT_YEARS[t])); }}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${ins.electricalType === t ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}>
              <div className="font-black text-sm text-slate-800">{t}</div>
              <div className="text-xs text-slate-500">{EZ_TYPE_LABELS[t]}</div>
            </button>
          ))}
        </div>
      </div>
      <Field label="Druh revízie">
        <select value={ins.inspectionKind} onChange={e => set('inspectionKind', e.target.value)} className={sel}>
          <option value="vychadzajuca">Východzia</option>
          <option value="pravidelna">Pravidelná</option>
          <option value="mimoriadna">Mimoriadna</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Dátum revízie"><input type="date" value={ins.reportDate} onChange={e => set('reportDate', e.target.value)} className={inp} /></Field>
        <Field label="Číslo správy"><input type="text" value={ins.reportNumber} onChange={e => set('reportNumber', e.target.value)} placeholder="EZ-2024/001" className={inp} /></Field>
      </div>
      <Field label="Objekt / Miesto revízie"><input type="text" value={ins.objectName} onChange={e => set('objectName', e.target.value)} placeholder="Administratívna budova, Hala A..." className={inp} /></Field>
      <Field label="Adresa objektu"><input type="text" value={ins.objectAddress} onChange={e => set('objectAddress', e.target.value)} placeholder="Hlavná 1, 811 01 Bratislava" className={inp} /></Field>
      <Field label="Prevádzkovateľ"><input type="text" value={ins.operatorName} onChange={e => set('operatorName', e.target.value)} placeholder="Firma s.r.o." className={inp} /></Field>
      <Field label="Adresa prevádzkovateľa"><input type="text" value={ins.operatorAddress} onChange={e => set('operatorAddress', e.target.value)} placeholder="Adresa firmy" className={inp} /></Field>
      <Field label="Meno revízneho technika"><input type="text" value={ins.technicianName} onChange={e => set('technicianName', e.target.value)} placeholder="Ing. Jozef Revízny" className={inp} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Číslo osvedčenia RT"><input type="text" value={ins.technicianLicense} onChange={e => set('technicianLicense', e.target.value)} placeholder="RT/01/2020/EZ" className={inp} /></Field>
        <Field label="Platnosť osvedčenia"><input type="text" value={ins.technicianLicenseValidity} onChange={e => set('technicianLicenseValidity', e.target.value)} placeholder="31.12.2026" className={inp} /></Field>
      </div>
      <Field label="Termín ďalšej revízie"><input type="date" value={ins.nextInspectionDate} onChange={e => set('nextInspectionDate', e.target.value)} className={inp} /></Field>
    </div>
  );
}

// ─── Step 1: Technické parametre ─────────────────────────────────────────────

function Step1({ ins, set }: { ins: EZInspection; set: (f: keyof EZInspection, v: any) => void }) {
  return (
    <div className="space-y-5">
      {ins.electricalType === 'EI' && (
        <>
          <Field label="Menovité napätie"><input type="text" value={ins.nominalVoltage} onChange={e => set('nominalVoltage', e.target.value)} placeholder="230/400 V, 50 Hz" className={inp} /></Field>
          <Field label="Sústava">
            <select value={ins.systemType} onChange={e => set('systemType', e.target.value)} className={sel}>
              {['TN-C', 'TN-S', 'TN-C-S', 'TT', 'IT'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Inštalovaný príkon"><input type="text" value={ins.installedPower} onChange={e => set('installedPower', e.target.value)} placeholder="napr. 15 kW" className={inp} /></Field>
          <Field label="Spôsob ochrany pred nebezpečným dotykom"><input type="text" value={ins.protectionMethod} onChange={e => set('protectionMethod', e.target.value)} className={inp} /></Field>
        </>
      )}
      {(ins.electricalType === 'RN' || ins.electricalType === 'SP') && (
        <Field label="Menovité napätie"><input type="text" value={ins.nominalVoltage} onChange={e => set('nominalVoltage', e.target.value)} placeholder="230 V, 50 Hz" className={inp} /></Field>
      )}
      <Field label="Meracie prístroje (typ, výr. číslo, platnosť kalibrácie)">
        <textarea value={ins.measuringDevices} onChange={e => set('measuringDevices', e.target.value)}
          placeholder="METREL MI 3100 SE, výr.č. 12345678, kalibrácia do 31.12.2026" rows={3} className={inp} />
      </Field>
      <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
        <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-1">Platné normy</p>
        <p className="text-sm font-bold text-slate-700">{EZ_TYPE_NORMS[ins.electricalType]}, STN 33 1500</p>
      </div>
    </div>
  );
}

// ─── Voice Recorder ───────────────────────────────────────────────────────────

function VoiceRecorder({ onSubmit, busy }: { onSubmit: (t: string) => void; busy: boolean }) {
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Hlasové zadávanie vyžaduje Chrome alebo Edge.'); return; }
    const r = new SR();
    r.lang = 'sk-SK';
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e: any) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        e.results[i].isFinal ? (fin += e.results[i][0].transcript) : (tmp += e.results[i][0].transcript);
      }
      if (fin) setText(p => (p + ' ' + fin).trim());
      setInterim(tmp);
    };
    r.onend = () => { setRecording(false); setInterim(''); recRef.current = null; };
    r.onerror = (e: any) => { if (e.error !== 'aborted') alert('Chyba: ' + e.error); setRecording(false); };
    r.start();
    setRecording(true);
    recRef.current = r;
  }, []);

  const stop = () => { recRef.current?.stop(); setRecording(false); };
  const clear = () => { setText(''); setInterim(''); };
  const submit = () => { if (text.trim()) { onSubmit(text.trim()); setText(''); setInterim(''); } };

  return (
    <div className="bg-violet-50 border-2 border-violet-200 rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-violet-600 p-2 rounded-xl"><Volume2 size={18} className="text-white" /></div>
        <div>
          <p className="font-black text-slate-800 text-sm">Hlasové zadávanie merania</p>
          <p className="text-xs text-slate-500">Stlačte mikrofón a povedzte meranie po slovensky</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-3 border border-violet-100 space-y-1">
        <p className="text-xs font-bold text-violet-500">Príklady:</p>
        <p className="text-xs text-slate-500 italic">"Odpor izolácie L-PE na okruhu kuchyňa je 2,5 megaohmu"</p>
        <p className="text-xs text-slate-500 italic">"RCD okruh 1, vybavovací prúd 18 miliampérov, čas 28 milisekúnd"</p>
        <p className="text-xs text-slate-500 italic">"Odpor PE vodiča na zásuvke č.3 je 0,12 ohmu, vyhovel"</p>
      </div>
      <div className={`min-h-14 bg-white rounded-2xl p-3 border-2 transition-colors ${recording ? 'border-red-400 shadow shadow-red-50' : 'border-slate-200'}`}>
        {text || interim
          ? <p className="text-sm text-slate-700 font-medium">{text}{interim && <span className="text-slate-400 italic"> {interim}</span>}</p>
          : <p className="text-sm text-slate-300 italic">{recording ? 'Počúvam...' : 'Tu sa zobrazí rozpoznaný text'}</p>}
      </div>
      <div className="flex gap-2">
        <button onClick={recording ? stop : start} disabled={busy}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm transition-all ${recording ? 'bg-red-500 text-white animate-pulse' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
          {recording ? 'Zastaviť' : 'Nahrávať'}
        </button>
        {text && !recording && (
          <>
            <button onClick={submit} disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white rounded-2xl font-black text-sm hover:bg-green-600 transition-all">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {busy ? 'Spracúvam...' : 'Spracovať AI'}
            </button>
            <button onClick={clear} className="p-3.5 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"><X size={18} className="text-slate-500" /></button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Measurement card ─────────────────────────────────────────────────────────

function MCard({ m, idx, onEdit, onDel }: { m: EZMeasurement; idx: number; onEdit: (m: EZMeasurement) => void; onDel: (id: string) => void }) {
  const ok = m.result === 'OK', nok = m.result === 'NOK';
  return (
    <div className={`border-2 rounded-2xl p-4 flex items-center gap-3 ${ok ? 'border-green-200 bg-green-50' : nok ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-xs font-black text-slate-400">{idx + 1}.</span>
          <span className="font-black text-slate-800 text-sm">{m.measurementType}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${ok ? 'bg-green-500 text-white' : nok ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'}`}>
            {ok ? 'Vyhovel' : nok ? 'Nevyhovel' : 'N/A'}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span className="text-slate-500">{m.location}</span>
          <span className="font-black text-slate-700">{m.value} {m.unit}</span>
          {m.requiredValue && <span className="text-slate-400">req: {m.requiredValue}</span>}
        </div>
      </div>
      <div className="flex gap-1.5 shrink-0">
        <button onClick={() => onEdit(m)} className="p-2 bg-white rounded-xl border border-slate-200 hover:border-violet-300 transition-all"><Edit2 size={14} className="text-slate-500" /></button>
        <button onClick={() => onDel(m.id)} className="p-2 bg-white rounded-xl border border-slate-200 hover:border-red-300 transition-all"><Trash2 size={14} className="text-slate-500" /></button>
      </div>
    </div>
  );
}

// ─── Edit measurement modal ───────────────────────────────────────────────────

function EditModal({ m, onSave, onClose }: { m: EZMeasurement; onSave: (m: EZMeasurement) => void; onClose: () => void }) {
  const [d, setD] = useState(m);
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800">Upraviť meranie</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><X size={18} className="text-slate-500" /></button>
        </div>
        <Field label="Typ merania"><input value={d.measurementType} onChange={e => setD(p => ({...p, measurementType: e.target.value}))} className={inp} /></Field>
        <Field label="Miesto merania"><input value={d.location} onChange={e => setD(p => ({...p, location: e.target.value}))} className={inp} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hodnota"><input value={d.value} onChange={e => setD(p => ({...p, value: e.target.value}))} className={inp} /></Field>
          <Field label="Jednotka"><input value={d.unit} onChange={e => setD(p => ({...p, unit: e.target.value}))} className={inp} /></Field>
        </div>
        <Field label="Požadovaná hodnota"><input value={d.requiredValue} onChange={e => setD(p => ({...p, requiredValue: e.target.value}))} className={inp} /></Field>
        <Field label="Výsledok">
          <div className="flex gap-2">
            {(['OK','NOK','N/A'] as const).map(r => (
              <button key={r} onClick={() => setD(p => ({...p, result: r}))}
                className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${d.result === r ? r === 'OK' ? 'bg-green-500 text-white' : r === 'NOK' ? 'bg-red-500 text-white' : 'bg-slate-500 text-white' : 'bg-white border-2 border-slate-200 text-slate-500'}`}>
                {r === 'OK' ? 'Vyhovel' : r === 'NOK' ? 'Nevyhovel' : 'N/A'}
              </button>
            ))}
          </div>
        </Field>
        <button onClick={() => onSave(d)} className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black hover:bg-violet-700 transition-all">
          <Check size={16} className="inline mr-2" />Uložiť zmeny
        </button>
      </div>
    </div>
  );
}

// ─── Report print preview ─────────────────────────────────────────────────────

function ReportPrint({ ins }: { ins: EZInspection }) {
  const fmt = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('sk-SK') : '—';
  const kindLabel = ins.inspectionKind === 'vychadzajuca' ? 'Východzia' : ins.inspectionKind === 'pravidelna' ? 'Pravidelná' : 'Mimoriadna';

  return (
    <div id="ez-report-content" className="bg-white p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-base font-black text-slate-900 uppercase leading-tight">
              SPRÁVA O ODBORNEJ PREHLIADKE<br />A ODBORNEJ SKÚŠKE
            </h1>
            <p className="text-sm font-bold text-slate-700 mt-1">{EZ_TYPE_LABELS[ins.electricalType].toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Číslo správy</p>
            <p className="text-xl font-black text-slate-900">{ins.reportNumber || '—'}</p>
            <p className="text-xs text-slate-500 mt-1">{fmt(ins.reportDate)}</p>
          </div>
        </div>
      </div>

      {/* 1. Technik */}
      <section className="mb-5">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">1. Identifikácia revízneho technika</h2>
        <table className="w-full text-sm"><tbody>
          <tr><td className="py-1 text-slate-500 w-1/3">Meno a priezvisko:</td><td className="py-1 font-bold">{ins.technicianName || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Číslo osvedčenia:</td><td className="py-1 font-bold">{ins.technicianLicense || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Platnosť osvedčenia:</td><td className="py-1 font-bold">{ins.technicianLicenseValidity || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Vydal:</td><td className="py-1 font-bold">Technická inšpekcia, a.s.</td></tr>
        </tbody></table>
      </section>

      {/* 2. Objekt */}
      <section className="mb-5">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">2. Identifikácia zariadenia / inštalácie</h2>
        <table className="w-full text-sm"><tbody>
          <tr><td className="py-1 text-slate-500 w-1/3">Prevádzkovateľ:</td><td className="py-1 font-bold">{ins.operatorName || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Adresa prevádzky:</td><td className="py-1 font-bold">{ins.operatorAddress || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Miesto revízie:</td><td className="py-1 font-bold">{ins.objectName || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Adresa:</td><td className="py-1 font-bold">{ins.objectAddress || '—'}</td></tr>
          <tr><td className="py-1 text-slate-500">Druh revízie:</td><td className="py-1 font-bold">{kindLabel}</td></tr>
          <tr><td className="py-1 text-slate-500">Použité normy:</td><td className="py-1 font-bold">{EZ_TYPE_NORMS[ins.electricalType]}, STN 33 1500</td></tr>
        </tbody></table>
      </section>

      {/* 3. Technicke udaje */}
      <section className="mb-5">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">3. Technické údaje</h2>
        <table className="w-full text-sm"><tbody>
          <tr><td className="py-1 text-slate-500 w-1/3">Menovité napätie:</td><td className="py-1 font-bold">{ins.nominalVoltage || '—'}</td></tr>
          {ins.electricalType === 'EI' && <>
            <tr><td className="py-1 text-slate-500">Sústava:</td><td className="py-1 font-bold">{ins.systemType}</td></tr>
            <tr><td className="py-1 text-slate-500">Inštalovaný príkon:</td><td className="py-1 font-bold">{ins.installedPower || '—'}</td></tr>
            <tr><td className="py-1 text-slate-500">Spôsob ochrany:</td><td className="py-1 font-bold">{ins.protectionMethod}</td></tr>
          </>}
        </tbody></table>
      </section>

      {/* 4. Meracie pristroje */}
      <section className="mb-5">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">4. Použité meracie prístroje</h2>
        <p className="text-sm font-bold text-slate-800">{ins.measuringDevices || 'Nie je uvedené'}</p>
      </section>

      {/* 5. Merania */}
      <section className="mb-5">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">5. Výsledky meraní</h2>
        {ins.measurements.length === 0
          ? <p className="text-sm text-slate-500 italic">Žiadne merania.</p>
          : <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  {['Č.','Druh merania','Miesto merania','Nameraná hodnota','Požadovaná hodnota','Výsledok'].map(h => (
                    <th key={h} className="border border-slate-300 px-2 py-1.5 text-left font-black uppercase tracking-wide text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ins.measurements.map((m, i) => (
                  <tr key={m.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-400">{i + 1}</td>
                    <td className="border border-slate-300 px-2 py-1.5 font-bold text-slate-800">{m.measurementType}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-slate-600">{m.location}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right font-black">{m.value} {m.unit}</td>
                    <td className="border border-slate-300 px-2 py-1.5 text-right text-slate-500">{m.requiredValue}</td>
                    <td className={`border border-slate-300 px-2 py-1.5 text-center font-black ${m.result === 'OK' ? 'text-green-700' : m.result === 'NOK' ? 'text-red-700' : 'text-slate-500'}`}>
                      {m.result === 'OK' ? 'VYHOVEL' : m.result === 'NOK' ? 'NEVYHOVEL' : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </section>

      {/* 6. Záver */}
      <section className="mb-8">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">6. Záver</h2>
        <table className="w-full text-sm"><tbody>
          <tr><td className="py-1.5 text-slate-500 align-top w-1/3">Zistené závady:</td><td className="py-1.5 font-bold">{ins.defectsFound}</td></tr>
          <tr><td className="py-1.5 text-slate-500 align-top">Záver:</td><td className="py-1.5 font-bold">{ins.conclusion}</td></tr>
          <tr><td className="py-1.5 text-slate-500">Výsledok revízie:</td>
            <td className="py-1.5">
              <span className={`font-black text-base uppercase ${ins.conclusionResult === 'vyhovel' ? 'text-green-700' : ins.conclusionResult === 'nevyhovel' ? 'text-red-700' : 'text-orange-700'}`}>
                {ins.conclusionResult === 'vyhovel' ? 'VYHOVELA' : ins.conclusionResult === 'nevyhovel' ? 'NEVYHOVELA' : 'PODMIENEČNE VYHOVELA'}
              </span>
            </td>
          </tr>
          <tr><td className="py-1.5 text-slate-500">Termín ďalšej revízie:</td><td className="py-1.5 font-black">{fmt(ins.nextInspectionDate)}</td></tr>
          {ins.notes && <tr><td className="py-1.5 text-slate-500 align-top">Poznámky:</td><td className="py-1.5">{ins.notes}</td></tr>}
        </tbody></table>
      </section>

      {/* Podpis */}
      <div className="border-t-2 border-slate-300 pt-6 grid grid-cols-2 gap-16">
        <div>
          <p className="text-xs text-slate-500 mb-14">Dátum a miesto:</p>
          <div className="border-b border-slate-400 w-48 mb-1" />
          <p className="text-xs text-slate-500">Podpis revízneho technika</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-14">Pečiatka:</p>
          <div className="border border-dashed border-slate-300 h-16 w-28 rounded-lg flex items-center justify-center">
            <span className="text-xs text-slate-300">pečiatka</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────

export interface ElectricInspectionModuleProps { onBack: () => void; }

export function ElectricInspectionModule({ onBack }: ElectricInspectionModuleProps) {
  type MView = 'list' | 'editor' | 'preview';
  const [view, setView] = useState<MView>('list');
  const [saved, setSaved] = useState<EZInspection[]>([]);
  const [cur, setCur] = useState<EZInspection>(makeEmpty());
  const [step, setStep] = useState(0);
  const [q, setQ] = useState('');
  const [busyVoice, setBusyVoice] = useState(false);
  const [busyConclusion, setBusyConclusion] = useState(false);
  const [editing, setEditing] = useState<EZMeasurement | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState<Omit<EZMeasurement,'id'>>({ measurementType:'', location:'', value:'', unit:'', requiredValue:'', result:'OK' });

  useEffect(() => {
    try { const s = localStorage.getItem('ez_db'); if (s) setSaved(JSON.parse(s)); } catch(_) {}
  }, []);

  useEffect(() => { localStorage.setItem('ez_db', JSON.stringify(saved)); }, [saved]);

  const set = useCallback((f: keyof EZInspection, v: any) => setCur(p => ({ ...p, [f]: v })), []);

  const saveInspection = (silent = false) => {
    let r = { ...cur };
    if (!r.id) {
      r.id = crypto.randomUUID();
      r.createdAt = Date.now();
      if (!r.reportNumber) r.reportNumber = `EZ-${new Date().getFullYear()}/${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    }
    setSaved(p => { const i = p.findIndex(x => x.id === r.id); if (i >= 0) { const u=[...p]; u[i]=r; return u; } return [r,...p]; });
    setCur(r);
    if (!silent) alert('Uložené.');
  };

  const deleteInspection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Vymazať revíziu?')) setSaved(p => p.filter(r => r.id !== id));
  };

  // Voice → Gemini → measurement
  const handleVoice = async (transcript: string) => {
    setBusyVoice(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const schema = {
        type: Type.OBJECT,
        properties: {
          measurementType: { type: Type.STRING },
          location: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
          requiredValue: { type: Type.STRING },
          result: { type: Type.STRING },
        },
        required: ['measurementType', 'value', 'unit'],
      };
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text:
          `Si expert na elektrotechnické revízie (STN 33 1500, STN 33 2000-6, STN 33 1600, STN EN 62305).
Analyzuj hlasové zadanie a extrahuj meranie. Typ revízie: ${EZ_TYPE_LABELS[cur.electricalType]}.
Zadanie: "${transcript}"

Extrahuj:
- measurementType: typ merania (napr. "Odpor izolácie L-PE", "Odpor PE vodiča", "Impedancia slučky", "RCD - vybavovací prúd", "Odpor uzemnenia")
- location: miesto (napr. "Okruh kuchyňa", "Zásuvka č.3") — ak nie je, použi "Neurčené"
- value: číslo ako string (desatinná bodka), preveď písané čísla
- unit: MΩ / Ω / kΩ / mA / ms / V / kV
- requiredValue: požiadavka normy (napr. "≥ 0.5 MΩ", "≤ 1 Ω", "≤ 30 mA") — ak nevieš, nechaj prázdne
- result: "OK" / "NOK" / "N/A"` }] },
        config: { responseMimeType: 'application/json', responseSchema: schema },
      });
      const p = JSON.parse(res.text || '{}');
      const m: EZMeasurement = {
        id: crypto.randomUUID(),
        measurementType: p.measurementType || 'Neznáme meranie',
        location: p.location || 'Neurčené',
        value: p.value || '',
        unit: p.unit || '',
        requiredValue: p.requiredValue || '',
        result: ['OK','NOK','N/A'].includes(p.result) ? p.result : 'N/A',
        rawTranscript: transcript,
      };
      setCur(prev => ({ ...prev, measurements: [...prev.measurements, m] }));
    } catch(err) {
      console.error(err);
      alert('AI spracovanie zlyhalo. Skúste znova alebo zadajte manuálne.');
    } finally { setBusyVoice(false); }
  };

  const addManual = () => {
    if (!manual.measurementType || !manual.value) return;
    setCur(p => ({ ...p, measurements: [...p.measurements, { id: crypto.randomUUID(), ...manual }] }));
    setManual({ measurementType:'', location:'', value:'', unit:'', requiredValue:'', result:'OK' });
    setShowManual(false);
  };

  const updateM = (m: EZMeasurement) => {
    setCur(p => ({ ...p, measurements: p.measurements.map(x => x.id === m.id ? m : x) }));
    setEditing(null);
  };
  const deleteM = (id: string) => setCur(p => ({ ...p, measurements: p.measurements.filter(m => m.id !== id) }));

  const generateConclusion = async () => {
    setBusyConclusion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const nokCount = cur.measurements.filter(m => m.result === 'NOK').length;
      const mList = cur.measurements.map(m => `${m.measurementType} (${m.location}): ${m.value} ${m.unit} → ${m.result}`).join('\n');
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text:
          `Si revízny technik elektrických zariadení. Vygeneruj záver revízie po slovensky.
Typ: ${EZ_TYPE_LABELS[cur.electricalType]}, Druh: ${cur.inspectionKind}
Nevyhovujúcich meraní: ${nokCount}
Merania:\n${mList || 'Žiadne'}

Odpovedz JSON s poľami:
- defectsFound: zistené závady (ak žiadne → "Neboli zistené žiadne závady.")
- conclusion: záver 1-2 vety odborne po slovensky
- conclusionResult: "vyhovel" | "nevyhovel" | "podmienecne"` }] },
        config: { responseMimeType: 'application/json' },
      });
      const r = JSON.parse(res.text || '{}');
      setCur(p => ({ ...p,
        defectsFound: r.defectsFound || p.defectsFound,
        conclusion: r.conclusion || p.conclusion,
        conclusionResult: r.conclusionResult || p.conclusionResult,
      }));
    } catch(err) {
      console.error(err);
      alert('Generovanie záverov zlyhalo. Vyplňte manuálne.');
    } finally { setBusyConclusion(false); }
  };

  const exportDOCX = () => {
    const el = document.getElementById('ez-report-content');
    if (!el) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;font-size:11pt;margin:2cm}
h1{font-size:13pt;font-weight:bold;text-transform:uppercase}
h2{font-size:9pt;font-weight:bold;text-transform:uppercase;color:#666;border-bottom:1px solid #ccc;padding-bottom:3px;margin-top:16px}
table{border-collapse:collapse;width:100%;font-size:10pt}
td,th{padding:3px 6px}th{background:#f0f0f0;font-weight:bold}
.mTable td,.mTable th{border:1px solid #ccc}
</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Revizia_${cur.reportNumber || 'export'}.doc`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const statusBadge = (d: string) => {
    const t = new Date(d).getTime(), now = Date.now(), mo = 864e5 * 30;
    if (t < now) return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><AlertOctagon size={10}/>Exspirované</span>;
    if (t < now + mo) return <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Clock size={10}/>Končí platnosť</span>;
    return <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><CheckCircle size={10}/>V poriadku</span>;
  };

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (view === 'preview') return (
    <div className="min-h-screen bg-slate-50">
      <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => setView('editor')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold">
            <ChevronLeft size={20}/> Späť
          </button>
          <div className="flex gap-3">
            <button onClick={exportDOCX} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm">
              <FileDown size={16}/> DOCX
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm">
              <Printer size={16}/> Tlačiť / PDF
            </button>
          </div>
        </div>
      </div>
      <div className="print-only">
        <ReportPrint ins={cur} />
      </div>
      <div className="no-print">
        <ReportPrint ins={cur} />
      </div>
    </div>
  );

  // ── EDITOR ─────────────────────────────────────────────────────────────────
  if (view === 'editor') return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <nav className="bg-white border-b border-slate-200 px-4 py-3.5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm">
            <ChevronLeft size={20}/> Zoznam
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-violet-600 p-1.5 rounded-lg"><Zap size={14} className="text-white"/></div>
            <span className="font-black text-slate-900 text-sm">{cur.reportNumber || 'Nová revízia'}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => saveInspection(true)} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold">
              <Save size={14}/> Uložiť
            </button>
            <button onClick={() => { saveInspection(true); setView('preview'); }}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-lg shadow-violet-200">
              <Eye size={14}/> Náhľad
            </button>
          </div>
        </div>
      </nav>

      {/* Steps */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button onClick={() => setStep(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${i === step ? 'bg-violet-600 text-white' : i < step ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>
                {i+1}. {s}
              </button>
              {i < STEPS.length-1 && <ChevronRight size={12} className="text-slate-300 shrink-0"/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-6">
        {step === 0 && <Step0 ins={cur} set={set}/>}
        {step === 1 && <Step1 ins={cur} set={set}/>}

        {/* KROK 2: MERANIA */}
        {step === 2 && (
          <div className="space-y-5">
            <VoiceRecorder onSubmit={handleVoice} busy={busyVoice}/>
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-800">Merania ({cur.measurements.length})</h3>
              <button onClick={() => setShowManual(p => !p)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition-all">
                <Plus size={14}/> Manuálne
              </button>
            </div>

            {showManual && (
              <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 space-y-4">
                <h4 className="font-black text-slate-700 text-sm">Manuálne zadanie</h4>
                <Field label="Typ merania"><input value={manual.measurementType} onChange={e => setManual(p=>({...p,measurementType:e.target.value}))} placeholder="Odpor izolácie L-PE" className={inp}/></Field>
                <Field label="Miesto"><input value={manual.location} onChange={e => setManual(p=>({...p,location:e.target.value}))} placeholder="Okruh kuchyňa" className={inp}/></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Hodnota"><input value={manual.value} onChange={e => setManual(p=>({...p,value:e.target.value}))} placeholder="2.5" className={inp}/></Field>
                  <Field label="Jednotka"><input value={manual.unit} onChange={e => setManual(p=>({...p,unit:e.target.value}))} placeholder="MΩ" className={inp}/></Field>
                </div>
                <Field label="Požadovaná hodnota"><input value={manual.requiredValue} onChange={e => setManual(p=>({...p,requiredValue:e.target.value}))} placeholder="≥ 0.5 MΩ" className={inp}/></Field>
                <Field label="Výsledok">
                  <div className="flex gap-2">
                    {(['OK','NOK','N/A'] as const).map(r => (
                      <button key={r} onClick={() => setManual(p=>({...p,result:r}))}
                        className={`flex-1 py-3 rounded-2xl font-black text-sm transition-all ${manual.result===r ? r==='OK'?'bg-green-500 text-white':r==='NOK'?'bg-red-500 text-white':'bg-slate-500 text-white':'bg-white border-2 border-slate-200 text-slate-500'}`}>
                        {r==='OK'?'Vyhovel':r==='NOK'?'Nevyhovel':'N/A'}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="flex gap-3">
                  <button onClick={addManual} className="flex-1 bg-violet-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-violet-700 transition-all"><Check size={14} className="inline mr-2"/>Pridať</button>
                  <button onClick={() => setShowManual(false)} className="px-5 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">Zrušiť</button>
                </div>
              </div>
            )}

            {editing && <EditModal m={editing} onSave={updateM} onClose={() => setEditing(null)}/>}

            {cur.measurements.length === 0
              ? <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="bg-slate-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"><List size={28} className="text-slate-300"/></div>
                  <p className="font-bold text-slate-500 text-sm">Zatiaľ žiadne merania</p>
                  <p className="text-xs text-slate-400 mt-1">Použite hlasové zadávanie alebo manuálny vstup</p>
                </div>
              : <div className="space-y-3">
                  {cur.measurements.map((m, i) => {
                    const card = <MCard m={m as EZMeasurement} idx={i} onEdit={setEditing} onDel={deleteM}/>;
                    return React.cloneElement(card, { key: m.id });
                  })}
                </div>
            }
          </div>
        )}

        {/* KROK 3: ZÁVER */}
        {step === 3 && (
          <div className="space-y-5">
            <button onClick={generateConclusion} disabled={busyConclusion}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-violet-200 transition-all disabled:opacity-60">
              {busyConclusion ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
              {busyConclusion ? 'Generujem...' : 'AI: Vygenerovať záver z meraní'}
            </button>
            <Field label="Zistené závady">
              <textarea value={cur.defectsFound} onChange={e => set('defectsFound',e.target.value)} rows={3} className={inp}/>
            </Field>
            <Field label="Text záver revízie">
              <textarea value={cur.conclusion} onChange={e => set('conclusion',e.target.value)} rows={3} className={inp}/>
            </Field>
            <Field label="Celkový výsledok">
              <div className="flex gap-3">
                {(['vyhovel','nevyhovel','podmienecne'] as const).map(r => (
                  <button key={r} onClick={() => set('conclusionResult',r)}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all ${cur.conclusionResult===r ? r==='vyhovel'?'bg-green-500 text-white shadow-green-200 shadow-lg':r==='nevyhovel'?'bg-red-500 text-white shadow-red-200 shadow-lg':'bg-orange-500 text-white shadow-orange-200 shadow-lg':'bg-white border-2 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                    {r==='vyhovel'?'Vyhovel':r==='nevyhovel'?'Nevyhovel':'Podmienečne'}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Termín ďalšej revízie">
              <input type="date" value={cur.nextInspectionDate} onChange={e => set('nextInspectionDate',e.target.value)} className={inp}/>
            </Field>
            <Field label="Poznámky">
              <textarea value={cur.notes} onChange={e => set('notes',e.target.value)} rows={2} placeholder="Doplňujúce poznámky..." className={inp}/>
            </Field>
            <button onClick={() => { saveInspection(true); setView('preview'); }}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-violet-200 transition-all mt-2">
              <Eye size={18}/> Zobraziť správu
            </button>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={() => setStep(p => Math.max(0,p-1))} disabled={step===0}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-slate-200 font-black text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all text-sm">
            <ChevronLeft size={18}/> Späť
          </button>
          {step < STEPS.length-1
            ? <button onClick={() => setStep(p => p+1)}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-600 text-white font-black shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all text-sm">
                Ďalej <ChevronRight size={18}/>
              </button>
            : <button onClick={() => { saveInspection(true); setView('preview'); }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-green-500 text-white font-black shadow-lg shadow-green-200 hover:bg-green-600 transition-all text-sm">
                <FileText size={18}/> Správa
              </button>
          }
        </div>
      </div>
    </div>
  );

  // ── LIST ───────────────────────────────────────────────────────────────────
  const filtered = saved.filter(r =>
    r.operatorName.toLowerCase().includes(q.toLowerCase()) ||
    r.objectName.toLowerCase().includes(q.toLowerCase()) ||
    r.reportNumber.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={20} className="text-slate-500"/>
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-violet-600 p-2 rounded-xl"><Zap size={20} className="text-white"/></div>
              <div>
                <h1 className="font-black text-xl tracking-tight leading-none">EZ Revízie</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elektrické zariadenia</span>
              </div>
            </div>
          </div>
          <button onClick={() => { setCur(makeEmpty()); setStep(0); setView('editor'); }}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-violet-100 transition-all">
            <Plus size={18}/> <span className="hidden sm:inline">Nová revízia</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label:'Celkom', val: saved.length, color:'slate', Icon: FileText },
            { label:'Platné', val: saved.filter(r=>new Date(r.nextInspectionDate).getTime()>Date.now()+864e5*30).length, color:'green', Icon: CheckCircle },
            { label:'Exspirované', val: saved.filter(r=>new Date(r.nextInspectionDate).getTime()<Date.now()).length, color:'red', Icon: AlertTriangle },
          ].map(({ label, val, color, Icon }) => (
            <div key={label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <span className={`text-${color}-500 text-[10px] font-black uppercase tracking-widest`}>{label}</span>
              <div className="flex items-end justify-between mt-1">
                <span className={`text-3xl font-black text-${color === 'slate' ? 'slate-900' : color+'-600'}`}>{val}</span>
                <div className={`bg-${color}-50 p-2 rounded-lg text-${color}-400`}><Icon size={20}/></div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
          <input type="text" placeholder="Hľadať prevádzkovateľa, objekt, číslo správy..." value={q} onChange={e => setQ(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 shadow-sm focus:ring-4 focus:ring-violet-50 focus:border-violet-500 outline-none text-sm font-medium"/>
        </div>

        <div className="space-y-4">
          {filtered.length === 0
            ? <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="bg-violet-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Zap size={36} className="text-violet-300"/></div>
                <h3 className="text-xl font-bold text-slate-700">Žiadne EZ revízie</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">Vytvorte novú revíziu s hlasovým zadávaním meraní.</p>
                <button onClick={() => { setCur(makeEmpty()); setStep(0); setView('editor'); }}
                  className="mt-6 bg-violet-600 text-white font-black px-8 py-3 rounded-2xl hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all">
                  Vytvoriť prvú revíziu
                </button>
              </div>
            : filtered.map(r => {
                const t = new Date(r.nextInspectionDate).getTime(), now = Date.now(), mo = 864e5*30;
                const border = t < now ? 'border-l-4 border-red-400' : t < now+mo ? 'border-l-4 border-orange-400' : 'border-l-4 border-green-400';
                return (
                  <div key={r.id} onClick={() => { setCur(r); setStep(0); setView('editor'); }}
                    className={`bg-white rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all ${border} pl-4 pr-5 py-4 flex items-center justify-between gap-4`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="bg-violet-100 text-violet-700 text-[10px] px-2 py-0.5 rounded-full font-black">{r.electricalType}</span>
                        <span className="font-black text-slate-800 truncate">{r.operatorName || '(Bez prevádzkovateľa)'}</span>
                        {statusBadge(r.nextInspectionDate)}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                        <span>{r.objectName}</span>
                        <span>{r.reportNumber}</span>
                        <span>{r.reportDate}</span>
                        <span>{r.measurements.length} meraní</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={e => { e.stopPropagation(); setCur(r); setView('preview'); }}
                        className="p-2 bg-slate-50 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all">
                        <Eye size={16} className="text-slate-400"/>
                      </button>
                      <button onClick={e => deleteInspection(r.id, e)}
                        className="p-2 bg-slate-50 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                        <Trash2 size={16} className="text-slate-400"/>
                      </button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </main>
    </div>
  );
}
