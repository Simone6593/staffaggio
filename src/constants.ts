import { SupportType } from './types';

export const SUPPORT_TYPES: SupportType[] = [
  {
    id: 'tip-1',
    nome: 'Tip 1 - Supporto Statico e Sismico',
    z: 5.0,
    passoCalcolo: 2.0,
    interassePosa: 12.0,
    componenti: [
      { articolo: '2271451', descrizione: 'Mensola MT-BR-40 600', quantita: 2, lunghezza: '0,35' },
      { articolo: '2273643', descrizione: 'Tappo per binari MT-EC-40/50', quantita: 2 },
      { articolo: '2268505', descrizione: 'Binario di montaggio MT-40 S', quantita: 1, lunghezza: '0,3' },
      { articolo: '2293554', descrizione: 'Ancorante a vite HUS4-H 10x80 25/5/-', quantita: 4 },
      { articolo: '2399637', descrizione: 'Angle connector MT-C-LL1 FL', quantita: 2 },
    ],
    descrizioneTecnica: 'Supporto a mensola con fissaggio tramite ancoranti meccanici HUS4-H su calcestruzzo. Ideale per carichi statici e sismici in ambienti interni.',
  },
  {
    id: 'tip-2',
    nome: 'Tip 2 - Supporto Statico e Sismico',
    z: 5.0,
    passoCalcolo: 2.0,
    interassePosa: 12.0,
    componenti: [
      { articolo: '2271451', descrizione: 'Mensola MT-BR-40 600', quantita: 2, lunghezza: '0,35' },
      { articolo: '2273643', descrizione: 'Tappo per binari MT-EC-40/50', quantita: 2 },
      { articolo: '2268505', descrizione: 'Binario di montaggio MT-40 S', quantita: 1, lunghezza: '0,3' },
      { articolo: '2350549', descrizione: 'Prigioniero fil. S-BT-MF MT M10/15 AN 6', quantita: 4 },
      { articolo: '2399637', descrizione: 'Angle connector MT-C-LL1 FL', quantita: 2 },
    ],
    descrizioneTecnica: 'Supporto a mensola con fissaggio tramite prigionieri filettati S-BT-MF. Soluzione specifica per installazioni dove non è possibile o preferibile non utilizzare ancoranti meccanici tradizionali.',
  },
];
