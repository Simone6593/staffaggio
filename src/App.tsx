/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent } from 'react';
import { SUPPORT_TYPES } from './constants';
import { SupportType, CalculationResult, CalculationConfig } from './types';
import { Info, Trash2, Edit2, Save, Download, Upload, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [selectedSupport, setSelectedSupport] = useState<SupportType>(SUPPORT_TYPES[0]);
  const [config, setConfig] = useState<CalculationConfig>({
    nomeCalcolo: '',
    G: 2.0, Q: 0.5, interasse: 2.0,
    Z: 5.0, H: 20.0, ag: 0.25, S: 1.2, qa: 2.0,
    Rd: 5.0
  });
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [editingResultId, setEditingResultId] = useState<string | null>(null);

  // Aggiorna qa automaticamente quando cambia il tipo di supporto
  const handleSupportChange = (id: string) => {
    const support = SUPPORT_TYPES.find(s => s.id === id) || SUPPORT_TYPES[0];
    setSelectedSupport(support);
    setConfig(prev => ({ ...prev, qa: id === 'tip-1' ? 2.0 : 1.0 }));
  };

  const handleVerify = () => {
    const Wa = (config.G + config.Q) * config.interasse;
    const Sa = config.ag * config.S * (1 + 2 * (config.Z / config.H));
    const Fa = (Sa * Wa * 1.0) / config.qa;
    const edSLU = 1.35 * config.G + 1.5 * config.Q;
    const edSLV = 1.0 * config.G + 1.0 * config.Q + Fa;
    const Ed = Math.max(edSLU, edSLV);
    const u = Ed / config.Rd;

    const newResult: CalculationResult = {
      id: editingResultId || crypto.randomUUID(),
      config: { ...config },
      nomeSupporto: selectedSupport.nome,
      wa: Wa, sa: Sa, fa: Fa, edSLU, edSLV, ed: Ed, u,
      esito: u <= 1.0 ? 'Conforme' : 'Non Conforme',
      qa: config.qa
    };

    if (editingResultId) {
      setResults(prev => prev.map(r => r.id === editingResultId ? newResult : r));
      setEditingResultId(null);
    } else {
      setResults(prev => [newResult, ...prev]);
    }
    
    // Reset config
    setConfig({
        nomeCalcolo: '',
        G: 2.0, Q: 0.5, interasse: 2.0,
        Z: 5.0, H: 20.0, ag: 0.25, S: 1.2, qa: 2.0,
        Rd: 5.0
    });
  };

  const deleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  const handleEdit = (result: CalculationResult) => {
    setConfig(result.config);
    setSelectedSupport(SUPPORT_TYPES.find(s => s.nome === result.nomeSupporto) || SUPPORT_TYPES[0]);
    setEditingResultId(result.id);
  };

  const downloadResults = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "calcoli.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const uploadResults = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setResults(json);
      } catch (err) {
        alert("Errore nel caricamento del file");
      }
    };
    reader.readAsText(file);
  };

  const exportAllToPDF = () => {
    const doc = new jsPDF();
    
    results.forEach((result, index) => {
      if (index > 0) doc.addPage();
      
      const support = SUPPORT_TYPES.find(s => s.nome === result.nomeSupporto);
      const date = new Date().toLocaleDateString();

      // Header
      doc.setFontSize(18);
      doc.text("Rapporto di Calcolo Sismico", 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Progetto: ${result.config.nomeCalcolo || 'N/A'}`, 10, 25);
      doc.text(`Data: ${date}`, 10, 32);

      // Dettagli Supporto
      if (support) {
        doc.setFontSize(14);
        doc.text("Dettagli Supporto", 10, 45);
        autoTable(doc, {
          startY: 50,
          head: [['Parametro', 'Valore']],
          body: [
            ['Nome', support.nome],
            ['Descrizione', support.descrizioneTecnica],
            ['Quota Baricentro (m)', support.z.toString()],
            ['Passo Calcolo (m)', support.passoCalcolo.toString()],
            ['Interasse Posa (m)', support.interassePosa.toString()]
          ],
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      // Parametri di Calcolo
      doc.setFontSize(14);
      doc.text("Parametri di Calcolo", 10, (doc as any).lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Parametro', 'Valore']],
        body: [
          ['Peso Proprio G (kN)', result.config.G.toString()],
          ['Carico Variabile Q (kN)', result.config.Q.toString()],
          ['Interasse (m)', result.config.interasse.toString()],
          ['Quota Z (m)', result.config.Z.toString()],
          ['Altezza H (m)', result.config.H.toString()],
          ['Acc. Sismica ag (g)', result.config.ag.toString()],
          ['Coeff. S', result.config.S.toString()],
          ['Fattore qa', result.config.qa.toString()],
          ['Resistenza Rd (kN)', result.config.Rd.toString()]
        ],
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] }
      });

      // Risultati e Verifica
      doc.setFontSize(14);
      doc.text("Risultati e Verifica", 10, (doc as any).lastAutoTable.finalY + 10);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: [['Parametro', 'Valore']],
        body: [
          ['Peso Elemento Wa (kN)', result.wa.toFixed(2)],
          ['Acc. Massima Sa', result.sa.toFixed(2)],
          ['Forza Sismica Fa (kN)', result.fa.toFixed(2)],
          ['Sollecitazione SLU (kN)', result.edSLU.toFixed(2)],
          ['Sollecitazione SLV (kN)', result.edSLV.toFixed(2)],
          ['Sollecitazione Progetto Ed (kN)', result.ed.toFixed(2)],
          ['Coeff. Sfruttamento u', result.u.toFixed(2)],
          ['Esito Verifica', result.esito]
        ],
        theme: 'striped',
        headStyles: { fillColor: result.esito === 'Conforme' ? [39, 174, 96] : [231, 76, 60] }
      });
    });
    
    doc.save(`tutti_i_calcoli_report.pdf`);
  };

  const exportToPDF = (result: CalculationResult) => {
    const doc = new jsPDF();
    const support = SUPPORT_TYPES.find(s => s.nome === result.nomeSupporto);
    const date = new Date().toLocaleDateString();

    // Header
    doc.setFontSize(18);
    doc.text("Rapporto di Calcolo Sismico", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Progetto: ${result.config.nomeCalcolo || 'N/A'}`, 10, 25);
    doc.text(`Data: ${date}`, 10, 32);

    // Dettagli Supporto
    if (support) {
      doc.setFontSize(14);
      doc.text("Dettagli Supporto", 10, 45);
      autoTable(doc, {
        startY: 50,
        head: [['Parametro', 'Valore']],
        body: [
          ['Nome', support.nome],
          ['Descrizione', support.descrizioneTecnica],
          ['Quota Baricentro (m)', support.z.toString()],
          ['Passo Calcolo (m)', support.passoCalcolo.toString()],
          ['Interasse Posa (m)', support.interassePosa.toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      });
    }

    // Parametri di Calcolo
    doc.setFontSize(14);
    doc.text("Parametri di Calcolo", 10, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Parametro', 'Valore']],
      body: [
        ['Peso Proprio G (kN)', result.config.G.toString()],
        ['Carico Variabile Q (kN)', result.config.Q.toString()],
        ['Interasse (m)', result.config.interasse.toString()],
        ['Quota Z (m)', result.config.Z.toString()],
        ['Altezza H (m)', result.config.H.toString()],
        ['Acc. Sismica ag (g)', result.config.ag.toString()],
        ['Coeff. S', result.config.S.toString()],
        ['Fattore qa', result.config.qa.toString()],
        ['Resistenza Rd (kN)', result.config.Rd.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] }
    });

    // Risultati e Verifica
    doc.setFontSize(14);
    doc.text("Risultati e Verifica", 10, (doc as any).lastAutoTable.finalY + 10);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Parametro', 'Valore']],
      body: [
        ['Peso Elemento Wa (kN)', result.wa.toFixed(2)],
        ['Acc. Massima Sa', result.sa.toFixed(2)],
        ['Forza Sismica Fa (kN)', result.fa.toFixed(2)],
        ['Sollecitazione SLU (kN)', result.edSLU.toFixed(2)],
        ['Sollecitazione SLV (kN)', result.edSLV.toFixed(2)],
        ['Sollecitazione Progetto Ed (kN)', result.ed.toFixed(2)],
        ['Coeff. Sfruttamento u', result.u.toFixed(2)],
        ['Esito Verifica', result.esito]
      ],
      theme: 'striped',
      headStyles: { fillColor: result.esito === 'Conforme' ? [39, 174, 96] : [231, 76, 60] }
    });
    
    doc.save(`${result.config.nomeCalcolo || 'calcolo'}_report.pdf`);
  };

  const fieldDescriptions: Record<string, string> = {
    G: "Peso proprio dell'elemento (kN)",
    Q: "Carico variabile applicato (kN)",
    interasse: "Distanza tra i supporti (m)",
    Z: "Quota del baricentro dell'elemento (m)",
    H: "Altezza totale dell'edificio (m)",
    ag: "Accelerazione sismica del sito (g)",
    S: "Coefficiente di amplificazione stratigrafica",
    qa: "Fattore di comportamento (duttilità)",
    Rd: "Resistenza di progetto del componente (kN)"
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] p-8 font-sans">
      <header className="mb-8 border-b border-[#141414] pb-4">
        <h1 className="text-3xl font-serif italic">Staffaggio Impianti Verifier</h1>
        <p className="text-sm opacity-60 uppercase tracking-widest">Motore di Calcolo NTC 2018</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-xl shadow-sm border border-[#141414]/10">
          <h2 className="col-header mb-4">Input Dati Progetto</h2>
          
          <div className="mb-4">
            <label className="block text-xs uppercase opacity-50 mb-1">Tipo Fissaggio</label>
            <select 
              className="w-full p-2 border border-[#141414] rounded font-mono"
              onChange={(e) => handleSupportChange(e.target.value)}
              value={selectedSupport.id}
            >
              {SUPPORT_TYPES.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-xs uppercase opacity-50 mb-1">Nome Calcolo</label>
            <input 
              type="text"
              value={config.nomeCalcolo}
              onChange={(e) => setConfig({...config, nomeCalcolo: e.target.value})}
              className="w-full p-2 border border-[#141414] rounded font-mono"
              placeholder="Es: Mensola Piano 1"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {[
              {key: 'G', label: 'Peso G (kN)'}, {key: 'Q', label: 'Carico Q (kN)'}, {key: 'interasse', label: 'Interasse (m)'},
              {key: 'Z', label: 'Quota Z (m)'}, {key: 'H', label: 'Altezza H (m)'}, {key: 'ag', label: 'Acc. ag (g)'},
              {key: 'S', label: 'Amplif. S'}, {key: 'qa', label: 'Fatt. qa'}, {key: 'Rd', label: 'Resistenza Rd (kN)'}
            ].map((field) => (
              <div key={field.key} className="relative" onMouseEnter={() => setHoveredField(field.key)} onMouseLeave={() => setHoveredField(null)}>
                <label className="block text-xs uppercase opacity-50 mb-1 cursor-help underline decoration-dotted">{field.label}</label>
                <input 
                  type="number"
                  value={config[field.key as keyof typeof config]}
                  onChange={(e) => setConfig({...config, [field.key]: parseFloat(e.target.value)})}
                  className="w-full p-2 border border-[#141414] rounded font-mono"
                />
                {hoveredField === field.key && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 p-2 bg-[#141414] text-[#E4E3E0] text-xs rounded shadow-lg w-48">
                    {fieldDescriptions[field.key]}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleVerify}
            className="w-full bg-[#141414] text-[#E4E3E0] p-3 rounded-lg font-bold hover:bg-opacity-80 transition"
          >
            {editingResultId ? 'Aggiorna Calcolo' : 'Esegui Calcolo Automatico'}
          </button>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-[#141414]/10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="col-header">Risultati Calcoli</h2>
            <div className="flex gap-2">
              <button onClick={exportAllToPDF} className="p-2 hover:bg-zinc-200 rounded text-blue-700" title="Esporta tutti in PDF"><FileText className="w-4 h-4"/></button>
              <button onClick={downloadResults} className="p-2 hover:bg-zinc-200 rounded" title="Scarica JSON"><Download className="w-4 h-4"/></button>
              <label className="p-2 hover:bg-zinc-200 rounded cursor-pointer" title="Carica JSON">
                <Upload className="w-4 h-4"/>
                <input type="file" className="hidden" accept=".json" onChange={uploadResults} />
              </label>
            </div>
          </div>
          <div className="space-y-6">
            {results.map((res, idx) => (
              <div key={idx} className="border border-[#141414]/10 p-2 rounded-lg mb-2 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">{res.config.nomeCalcolo || 'Calcolo senza nome'}</h3>
                    <p className="text-[10px] italic opacity-70">({res.nomeSupporto})</p>
                    <div className={`px-1.5 py-0.5 rounded font-bold ${res.esito === 'Conforme' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                      {res.esito}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => exportToPDF(res)} className="p-1 hover:bg-zinc-200 rounded text-blue-600"><FileText className="w-4 h-4"/></button>
                    <button onClick={() => handleEdit(res)} className="p-1 hover:bg-zinc-200 rounded"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => deleteResult(res.id)} className="p-1 hover:bg-red-200 rounded text-red-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] bg-zinc-50 p-1 rounded">
                  <p>Wa: {res.wa.toFixed(2)}</p>
                  <p>Sa: {res.sa.toFixed(2)}</p>
                  <p>Fa: {res.fa.toFixed(2)}</p>
                  <p>SLU: {res.edSLU.toFixed(2)}</p>
                  <p>SLV: {res.edSLV.toFixed(2)}</p>
                  <p>Ed: {res.ed.toFixed(2)}</p>
                  <p>u: {res.u.toFixed(2)}</p>
                  <p>qa: {res.qa}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-12 text-xs opacity-50 border-t pt-4">
        <Info className="inline w-4 h-4 mr-1" />
        Disclaimer: Questo strumento esegue calcoli basati su NTC 2018 semplificate. Verificare sempre i risultati con software certificati.
      </footer>
    </div>
  );
}
