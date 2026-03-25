// Telegram message translations per language

export const TG_MESSAGES: Record<string, {
  newSignal: string;
  entry: string;
  targets: string;
  stopLoss: string;
  stopLossHit: string;
  positionClosed: string;
  news: string;
  targetReached: string;
  cryptoSignals: string;
  cryptoNews: string;
}> = {
  EN: {
    newSignal: "NEW SIGNAL",
    entry: "Entry",
    targets: "Targets",
    stopLoss: "Stop Loss",
    stopLossHit: "STOP LOSS HIT",
    positionClosed: "Position closed.",
    news: "NEWS",
    targetReached: "TARGET REACHED",
    cryptoSignals: "Crypto Signals",
    cryptoNews: "Crypto News",
  },
  FR: {
    newSignal: "NOUVEAU SIGNAL",
    entry: "Entrée",
    targets: "Objectifs",
    stopLoss: "Stop Loss",
    stopLossHit: "STOP LOSS ATTEINT",
    positionClosed: "Position fermée.",
    news: "ACTUALITÉ",
    targetReached: "OBJECTIF ATTEINT",
    cryptoSignals: "Signaux Crypto",
    cryptoNews: "Actualités Crypto",
  },
  ES: {
    newSignal: "NUEVA SEÑAL",
    entry: "Entrada",
    targets: "Objetivos",
    stopLoss: "Stop Loss",
    stopLossHit: "STOP LOSS ALCANZADO",
    positionClosed: "Posición cerrada.",
    news: "NOTICIAS",
    targetReached: "OBJETIVO ALCANZADO",
    cryptoSignals: "Señales Crypto",
    cryptoNews: "Noticias Crypto",
  },
  TR: {
    newSignal: "YENİ SİNYAL",
    entry: "Giriş",
    targets: "Hedefler",
    stopLoss: "Zarar Durdur",
    stopLossHit: "ZARAR DURDUR ULAŞILDI",
    positionClosed: "Pozisyon kapatıldı.",
    news: "HABER",
    targetReached: "HEDEF ULAŞILDI",
    cryptoSignals: "Kripto Sinyalleri",
    cryptoNews: "Kripto Haberleri",
  },
};

export function getTgMessages(lang: string) {
  return TG_MESSAGES[lang.toUpperCase()] || TG_MESSAGES.EN;
}
