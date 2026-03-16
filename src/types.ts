export interface Component {
  articolo: string;
  descrizione: string;
  quantita: number;
  lunghezza?: string;
}

export interface CalculationConfig {
  nomeCalcolo: string;
  G: number;
  Q: number;
  interasse: number;
  Z: number;
  H: number;
  ag: number;
  S: number;
  qa: number;
  Rd: number;
}

export interface CalculationResult {
  id: string;
  config: CalculationConfig;
  nomeSupporto: string;
  wa: number; // Peso elemento (kN)
  sa: number; // Accelerazione massima
  fa: number; // Forza sismica (kN)
  edSLU: number; // Sollecitazione SLU (kN)
  edSLV: number; // Sollecitazione SLV (kN)
  ed: number; // Sollecitazione di progetto (kN)
  u: number;  // Coefficiente di sfruttamento
  esito: 'Conforme' | 'Non Conforme';
  qa: number;
}

export interface SupportType {
  id: string;
  nome: string;
  z: number; // Altezza quota baricentro (m)
  passoCalcolo: number; // (m)
  interassePosa: number; // (m)
  componenti: Component[];
  descrizioneTecnica: string;
}
