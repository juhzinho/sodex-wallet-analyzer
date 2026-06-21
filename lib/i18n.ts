// ─── Lightweight i18n (no external libs) ─────────────────────────────────
// Pure data + helpers. NO React and NO "use client" here, so this module can
// also be imported on the server (e.g. to localize streamed progress text).
// The React Context layer lives in components/I18nProvider.tsx.

export type Locale = "en" | "pt-BR" | "es";

export const LOCALES: Locale[] = ["en", "pt-BR", "es"];

export const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  en:      { flag: "🇺🇸", label: "English" },
  "pt-BR": { flag: "🇧🇷", label: "Português" },
  es:      { flag: "🇪🇸", label: "Español" },
};

// Map an app locale to the BCP-47 tag used by Intl for number/date formatting.
export function numberLocale(locale: Locale): string {
  return locale === "pt-BR" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US";
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as string[]).includes(v);
}

// ─── Translation tables ───────────────────────────────────────────────────
// Technical trading terms kept in English across all locales per spec:
// PnL, Long, Short, Maker, Taker, Funding, Perps, Spot.

const en = {
  // Hero / WalletInput
  "hero.titlePrefix": "WALLET ",
  "hero.titleAccent": "ANALYTICS",
  "hero.subtitle": "Paste any SoDEX wallet address to instantly visualise complete trading history — PnL, volume, fees, win rate and more.",
  "input.paste": "PASTE",
  "input.analyse": "ANALYSE",
  "input.scanning": "SCANNING",
  "input.errEmpty": "Enter a wallet address to analyse.",
  "input.errInvalid": "Invalid address — must be a 42-character 0x… hex string.",
  "pill.volume": "Volume",
  "pill.winRate": "Win Rate",
  "pill.fees": "Fees",
  "pill.trades": "Trades",

  // Loading
  "loading.default": "SCANNING WALLET...",
  "loading.subtitle": "Fetching complete on-chain history",

  // Error
  "error.title": "Analysis Failed",
  "error.retry": "Try Again",
  "error.notFound": "Wallet not found or has no trading history on SoDEX.",
  "error.invalidAddress": "Invalid Ethereum address.",
  "error.connectionLost": "Connection to analysis stream lost.",
  "error.unknown": "Unknown error",

  // Dashboard — header
  "dash.analysing": "Analysing Wallet",
  "dash.tradesTotal": "{n} trades total",
  "dash.fetched": "fetched {date}",
  "dash.newSearch": "← New Search",

  // Sections
  "section.campaignVolume": "Campaign Volume",
  "section.overview": "Overview",
  "section.profits": "Profits & Net PnL",
  "section.openCampaign": "Open Positions & Campaign",
  "section.charts": "Charts",
  "section.positions": "Positions",
  "section.tradeHistory": "Trade History",
  "section.spotOverview": "Spot Overview",
  "section.spotTradeHistory": "Spot Trade History",
  "section.combinedOverview": "Combined Overview",

  // Cards — campaign
  "card.weeklyVolume": "Weekly Volume",
  "card.monthlyVolume": "Monthly Volume",
  "card.weeklySince": "since Fri 21:00 BRT",
  "card.monthlyLast30": "last 30 days",
  "card.tradesToday": "Trades Today",
  "card.tradesTodaySub": "campaign day (21:00 BRT)",
  "reset.days": "resets in {d}d {h}h",
  "reset.hours": "resets in {h}h {m}m",

  // Cards — overview
  "card.volume": "Volume",
  "card.volumeSub": "{n} fills",
  "card.realisedPnl": "Realised PnL",
  "card.realisedPnlSub": "Net: {v}",
  "card.unrealisedPnl": "Unrealised PnL",
  "card.unrealisedPnlSub": "Open positions",
  "card.fees": "Fees",
  "card.feesSub": "Maker + taker",
  "card.funding": "Funding",
  "card.received": "Received",
  "card.paid": "Paid",
  "card.winRate": "Win Rate",
  "card.winRateSub": "{w}W / {l}L",

  // Cards — open interest / duration
  "card.openInterest": "Open Interest",
  "card.openInterestSub": "{n} open position(s)",
  "card.openInterestTwa": "weekly time-weighted avg",
  "card.positionDuration": "Position Duration",
  "dur.average": "Average",
  "dur.median": "Median",
  "dur.shortest": "Shortest",
  "dur.longest": "Longest",

  // Stat panels
  "stat.performance": "Performance",
  "stat.bestTrade": "Best Trade",
  "stat.worstTrade": "Worst Trade",
  "stat.avgWin": "Avg Win",
  "stat.avgLoss": "Avg Loss",
  "stat.tradeStats": "Trade Stats",
  "stat.totalFills": "Total Fills",
  "stat.lossRate": "Loss Rate",
  "stat.positions": "Positions",
  "stat.direction": "Direction",
  "stat.longVolume": "Long Volume",
  "stat.shortVolume": "Short Volume",
  "stat.longFills": "Long Fills",
  "stat.shortFills": "Short Fills",
  "stat.pnlBreakdown": "P&L Breakdown",
  "stat.realised": "Realised",
  "stat.unrealised": "Unrealised",
  "stat.netPnl": "Net PnL",
  "stat.grossProfit": "Total Profit",
  "stat.grossLoss": "Total Loss",
  "stat.pnlBeforeFees": "PnL Before Fees",
  "stat.pnlAfterFees": "Net PnL (After Fees)",
  "stat.netPnlAfterFees": "Total Result",
  "card.grossProfit": "Gross Profit",
  "card.grossProfitSub": "{n} winning positions",
  "card.grossLoss": "Gross Loss",
  "card.grossLossSub": "{n} losing positions",
  "card.pnlBeforeFees": "PnL Before Fees",
  "card.pnlBeforeFeesSub": "Price result only — fees not deducted",
  "card.pnlAfterFees": "Net PnL (After Fees)",
  "card.pnlAfterFeesSub": "Fees of {v} already included",
  "card.netPnlAfterFees": "Total Result",
  "card.netPnlAfterFeesSub": "Realised + unrealised + funding",

  // Charts
  "chart.tradesPerDay": "Trades per day",
  "chart.tradesPerDaySub": "Last 14 campaign days (21:00 BRT)",
  "chart.cumPnl": "Cumulative PnL",
  "chart.cumPnlSub": "Realised PnL + funding",
  "chart.longVsShort": "Long vs Short",
  "chart.tradeCount": "Trade count",
  "chart.dailyVolume": "Daily Volume",
  "chart.dailyVolumeSub": "Perps notional volume",
  "chart.volumeByMarket": "Volume by Market",
  "chart.top8": "Top 8 markets",
  "chart.top8Spot": "Top 8 spot markets",
  "chart.buyVsSell": "Buy vs Sell",
  "chart.buyVsSellSub": "Trade count distribution",
  "chart.noData": "NO DATA",
  // tooltips / legends
  "tt.cumulative": "Cumulative",
  "tt.daily": "Daily",
  "tt.trades": "Trades",
  "tt.volume": "Volume",
  "tt.share": "Share",

  // Tables — shared
  "table.filterSymbol": "Filter symbol…",
  "table.all": "ALL",
  "table.page": "Page {p} / {total}",
  // Trades table
  "table.tradeHistory": "Trade History",
  "table.tradesCount": "{n} trades",
  "table.colDate": "Date",
  "table.colSymbol": "Symbol",
  "table.colSide": "Side",
  "table.colPrice": "Price",
  "table.colSize": "Size",
  "table.colVolume": "Volume",
  "table.colFee": "Fee",
  "table.colPnl": "PnL",
  "table.noTrades": "No trades found",
  // Positions table
  "table.positions": "Positions",
  "table.positionsClosed": "{n} closed positions",
  "table.positionsCount": "{n} positions",
  "table.colClosed": "Closed",
  "table.colEntry": "Entry",
  "table.colClose": "Close",
  "table.colDuration": "Duration",
  "table.noPositions": "No positions found",

  // Spot
  "spot.noTrades": "No spot trades found for this wallet",
  "card.spotVolume": "Spot Volume",
  "card.spotFees": "Spot Fees",
  "card.buyVolume": "Buy Volume",
  "card.sellVolume": "Sell Volume",
  "card.tradesN": "{n} trades",
  "card.buysN": "{n} buys",
  "card.sellsN": "{n} sells",

  // Total tab
  "card.totalVolume": "Total Volume",
  "card.totalFees": "Total Fees",
  "card.perpsPlusSpot": "Perps + Spot",
  "card.totalTradesN": "{n} total trades",
  "card.perpsOnly": "Perps only",
  "panel.perps": "Perps",
  "panel.spot": "Spot",
  "panel.combined": "Combined",
  "row.volume": "Volume",
  "row.fees": "Fees",
  "row.trades": "Trades",
  "row.winRate": "Win Rate",
  "row.netPnl": "Net PnL",
  "row.buyVol": "Buy Vol",
  "row.sellVol": "Sell Vol",
  "row.totalVolume": "Total Volume",
  "row.totalFees": "Total Fees",
  "row.totalTrades": "Total Trades",
  "row.perpsShare": "Perps Share",
  "row.spotShare": "Spot Share",

  // Language selector
  "lang.label": "Language",

  // Server-streamed progress
  "progress.connecting": "Connecting...",
  "progress.trades": "Fetching trades",
  "progress.positions": "Fetching positions",
  "progress.spot": "Fetching spot trades",
  "progress.analysing": "Analysing data...",
  "progress.page": "{label}... page {page} ({count} records)",
} as const;

export type TranslationKey = keyof typeof en;
type Dict = Record<TranslationKey, string>;

const ptBR: Dict = {
  "hero.titlePrefix": "ANÁLISE DE ",
  "hero.titleAccent": "CARTEIRA",
  "hero.subtitle": "Cole qualquer endereço de carteira SoDEX para visualizar instantaneamente o histórico completo de trading — PnL, volume, taxas, taxa de acerto e muito mais.",
  "input.paste": "COLAR",
  "input.analyse": "ANALISAR",
  "input.scanning": "ESCANEANDO",
  "input.errEmpty": "Digite um endereço de carteira para analisar.",
  "input.errInvalid": "Endereço inválido — deve ser uma string hex 0x… de 42 caracteres.",
  "pill.volume": "Volume",
  "pill.winRate": "Taxa de Acerto",
  "pill.fees": "Taxas",
  "pill.trades": "Trades",

  "loading.default": "ESCANEANDO CARTEIRA...",
  "loading.subtitle": "Buscando histórico on-chain completo",

  "error.title": "Falha na Análise",
  "error.retry": "Tentar Novamente",
  "error.notFound": "Carteira não encontrada ou sem histórico de trading na SoDEX.",
  "error.invalidAddress": "Endereço Ethereum inválido.",
  "error.connectionLost": "Conexão com o stream de análise foi perdida.",
  "error.unknown": "Erro desconhecido",

  "dash.analysing": "Analisando Carteira",
  "dash.tradesTotal": "{n} trades no total",
  "dash.fetched": "buscado em {date}",
  "dash.newSearch": "← Nova Busca",

  "section.campaignVolume": "Volume da Campanha",
  "section.overview": "Visão Geral",
  "section.profits": "Lucros & PnL Líquido",
  "section.openCampaign": "Posições Abertas & Campanha",
  "section.charts": "Gráficos",
  "section.positions": "Posições",
  "section.tradeHistory": "Histórico de Trades",
  "section.spotOverview": "Visão Geral Spot",
  "section.spotTradeHistory": "Histórico de Trades Spot",
  "section.combinedOverview": "Visão Geral Combinada",

  "card.weeklyVolume": "Volume Semanal",
  "card.monthlyVolume": "Volume Mensal",
  "card.weeklySince": "desde sex 21:00 BRT",
  "card.monthlyLast30": "últimos 30 dias",
  "card.tradesToday": "Trades Hoje",
  "card.tradesTodaySub": "dia de campanha (21:00 BRT)",
  "reset.days": "reseta em {d}d {h}h",
  "reset.hours": "reseta em {h}h {m}m",

  "card.volume": "Volume",
  "card.volumeSub": "{n} fills",
  "card.realisedPnl": "PnL Realizado",
  "card.realisedPnlSub": "Líquido: {v}",
  "card.unrealisedPnl": "PnL Não Realizado",
  "card.unrealisedPnlSub": "Posições abertas",
  "card.fees": "Taxas",
  "card.feesSub": "Maker + taker",
  "card.funding": "Funding",
  "card.received": "Recebido",
  "card.paid": "Pago",
  "card.winRate": "Taxa de Acerto",
  "card.winRateSub": "{w}V / {l}D",

  "card.openInterest": "Posições em Aberto",
  "card.openInterestSub": "{n} posição(ões) aberta(s)",
  "card.openInterestTwa": "média semanal ponderada pelo tempo",
  "card.positionDuration": "Duração das Posições",
  "dur.average": "Média",
  "dur.median": "Mediana",
  "dur.shortest": "Mais curta",
  "dur.longest": "Mais longa",

  "stat.performance": "Desempenho",
  "stat.bestTrade": "Melhor Trade",
  "stat.worstTrade": "Pior Trade",
  "stat.avgWin": "Ganho Médio",
  "stat.avgLoss": "Perda Média",
  "stat.tradeStats": "Estatísticas",
  "stat.totalFills": "Total de Fills",
  "stat.lossRate": "Taxa de Perda",
  "stat.positions": "Posições",
  "stat.direction": "Direção",
  "stat.longVolume": "Volume Long",
  "stat.shortVolume": "Volume Short",
  "stat.longFills": "Fills Long",
  "stat.shortFills": "Fills Short",
  "stat.pnlBreakdown": "Detalhamento de P&L",
  "stat.realised": "Realizado",
  "stat.unrealised": "Não Realizado",
  "stat.netPnl": "PnL Líquido",
  "stat.grossProfit": "Lucro Total",
  "stat.grossLoss": "Prejuízo Total",
  "stat.pnlBeforeFees": "PnL Bruto (antes taxas)",
  "stat.pnlAfterFees": "PnL Líquido (após taxas)",
  "stat.netPnlAfterFees": "Resultado Total",
  "card.grossProfit": "Lucro Bruto",
  "card.grossProfitSub": "{n} posições vencedoras",
  "card.grossLoss": "Prejuízo Bruto",
  "card.grossLossSub": "{n} posições perdedoras",
  "card.pnlBeforeFees": "PnL Bruto",
  "card.pnlBeforeFeesSub": "Só movimento de preço — sem taxas",
  "card.pnlAfterFees": "PnL Líquido",
  "card.pnlAfterFeesSub": "Taxas de {v} já descontadas",
  "card.netPnlAfterFees": "Resultado Total",
  "card.netPnlAfterFeesSub": "Realizado + não realizado + funding",

  "chart.tradesPerDay": "Trades por dia",
  "chart.tradesPerDaySub": "Últimos 14 dias de campanha (21:00 BRT)",
  "chart.cumPnl": "PnL Acumulado",
  "chart.cumPnlSub": "PnL realizado + funding",
  "chart.longVsShort": "Long vs Short",
  "chart.tradeCount": "Contagem de trades",
  "chart.dailyVolume": "Volume Diário",
  "chart.dailyVolumeSub": "Volume nocional perps",
  "chart.volumeByMarket": "Volume por Mercado",
  "chart.top8": "Top 8 mercados",
  "chart.top8Spot": "Top 8 mercados spot",
  "chart.buyVsSell": "Compra vs Venda",
  "chart.buyVsSellSub": "Distribuição por nº de trades",
  "chart.noData": "SEM DADOS",
  "tt.cumulative": "Acumulado",
  "tt.daily": "Diário",
  "tt.trades": "Trades",
  "tt.volume": "Volume",
  "tt.share": "Participação",

  "table.filterSymbol": "Filtrar símbolo…",
  "table.all": "TODOS",
  "table.page": "Página {p} / {total}",
  "table.tradeHistory": "Histórico de Trades",
  "table.tradesCount": "{n} trades",
  "table.colDate": "Data",
  "table.colSymbol": "Símbolo",
  "table.colSide": "Lado",
  "table.colPrice": "Preço",
  "table.colSize": "Tamanho",
  "table.colVolume": "Volume",
  "table.colFee": "Taxa",
  "table.colPnl": "PnL",
  "table.noTrades": "Nenhum trade encontrado",
  "table.positions": "Posições",
  "table.positionsClosed": "{n} posições fechadas",
  "table.positionsCount": "{n} posições",
  "table.colClosed": "Fechada",
  "table.colEntry": "Entrada",
  "table.colClose": "Saída",
  "table.colDuration": "Duração",
  "table.noPositions": "Nenhuma posição encontrada",

  "spot.noTrades": "Nenhum trade spot encontrado para esta carteira",
  "card.spotVolume": "Volume Spot",
  "card.spotFees": "Taxas Spot",
  "card.buyVolume": "Volume de Compra",
  "card.sellVolume": "Volume de Venda",
  "card.tradesN": "{n} trades",
  "card.buysN": "{n} compras",
  "card.sellsN": "{n} vendas",

  "card.totalVolume": "Volume Total",
  "card.totalFees": "Taxas Totais",
  "card.perpsPlusSpot": "Perps + Spot",
  "card.totalTradesN": "{n} trades no total",
  "card.perpsOnly": "Apenas perps",
  "panel.perps": "Perps",
  "panel.spot": "Spot",
  "panel.combined": "Combinado",
  "row.volume": "Volume",
  "row.fees": "Taxas",
  "row.trades": "Trades",
  "row.winRate": "Taxa de Acerto",
  "row.netPnl": "PnL Líquido",
  "row.buyVol": "Vol. Compra",
  "row.sellVol": "Vol. Venda",
  "row.totalVolume": "Volume Total",
  "row.totalFees": "Taxas Totais",
  "row.totalTrades": "Trades Totais",
  "row.perpsShare": "Participação Perps",
  "row.spotShare": "Participação Spot",

  "lang.label": "Idioma",

  "progress.connecting": "Conectando...",
  "progress.trades": "Buscando trades",
  "progress.positions": "Buscando posições",
  "progress.spot": "Buscando trades spot",
  "progress.analysing": "Analisando dados...",
  "progress.page": "{label}... página {page} ({count} registros)",
};

const es: Dict = {
  "hero.titlePrefix": "ANÁLISIS DE ",
  "hero.titleAccent": "CARTERA",
  "hero.subtitle": "Pega cualquier dirección de cartera SoDEX para visualizar al instante el historial completo de trading — PnL, volumen, comisiones, tasa de acierto y más.",
  "input.paste": "PEGAR",
  "input.analyse": "ANALIZAR",
  "input.scanning": "ESCANEANDO",
  "input.errEmpty": "Introduce una dirección de cartera para analizar.",
  "input.errInvalid": "Dirección inválida — debe ser una cadena hex 0x… de 42 caracteres.",
  "pill.volume": "Volumen",
  "pill.winRate": "Tasa de Acierto",
  "pill.fees": "Comisiones",
  "pill.trades": "Trades",

  "loading.default": "ESCANEANDO CARTERA...",
  "loading.subtitle": "Obteniendo historial on-chain completo",

  "error.title": "Análisis Fallido",
  "error.retry": "Reintentar",
  "error.notFound": "Cartera no encontrada o sin historial de trading en SoDEX.",
  "error.invalidAddress": "Dirección Ethereum inválida.",
  "error.connectionLost": "Se perdió la conexión con el stream de análisis.",
  "error.unknown": "Error desconocido",

  "dash.analysing": "Analizando Cartera",
  "dash.tradesTotal": "{n} trades en total",
  "dash.fetched": "obtenido {date}",
  "dash.newSearch": "← Nueva Búsqueda",

  "section.campaignVolume": "Volumen de Campaña",
  "section.overview": "Resumen",
  "section.profits": "Ganancias & PnL Neto",
  "section.openCampaign": "Posiciones Abiertas & Campaña",
  "section.charts": "Gráficos",
  "section.positions": "Posiciones",
  "section.tradeHistory": "Historial de Trades",
  "section.spotOverview": "Resumen Spot",
  "section.spotTradeHistory": "Historial de Trades Spot",
  "section.combinedOverview": "Resumen Combinado",

  "card.weeklyVolume": "Volumen Semanal",
  "card.monthlyVolume": "Volumen Mensual",
  "card.weeklySince": "desde vie 21:00 BRT",
  "card.monthlyLast30": "últimos 30 días",
  "card.tradesToday": "Trades Hoy",
  "card.tradesTodaySub": "día de campaña (21:00 BRT)",
  "reset.days": "reinicia en {d}d {h}h",
  "reset.hours": "reinicia en {h}h {m}m",

  "card.volume": "Volumen",
  "card.volumeSub": "{n} fills",
  "card.realisedPnl": "PnL Realizado",
  "card.realisedPnlSub": "Neto: {v}",
  "card.unrealisedPnl": "PnL No Realizado",
  "card.unrealisedPnlSub": "Posiciones abiertas",
  "card.fees": "Comisiones",
  "card.feesSub": "Maker + taker",
  "card.funding": "Funding",
  "card.received": "Recibido",
  "card.paid": "Pagado",
  "card.winRate": "Tasa de Acierto",
  "card.winRateSub": "{w}G / {l}P",

  "card.openInterest": "Interés Abierto",
  "card.openInterestSub": "{n} posición(es) abierta(s)",
  "card.openInterestTwa": "promedio semanal ponderado por tiempo",
  "card.positionDuration": "Duración de Posiciones",
  "dur.average": "Promedio",
  "dur.median": "Mediana",
  "dur.shortest": "Más corta",
  "dur.longest": "Más larga",

  "stat.performance": "Rendimiento",
  "stat.bestTrade": "Mejor Trade",
  "stat.worstTrade": "Peor Trade",
  "stat.avgWin": "Ganancia Media",
  "stat.avgLoss": "Pérdida Media",
  "stat.tradeStats": "Estadísticas",
  "stat.totalFills": "Total de Fills",
  "stat.lossRate": "Tasa de Pérdida",
  "stat.positions": "Posiciones",
  "stat.direction": "Dirección",
  "stat.longVolume": "Volumen Long",
  "stat.shortVolume": "Volumen Short",
  "stat.longFills": "Fills Long",
  "stat.shortFills": "Fills Short",
  "stat.pnlBreakdown": "Desglose de P&L",
  "stat.realised": "Realizado",
  "stat.unrealised": "No Realizado",
  "stat.netPnl": "PnL Neto",
  "stat.grossProfit": "Ganancia Total",
  "stat.grossLoss": "Pérdida Total",
  "stat.pnlBeforeFees": "PnL Bruto (antes comisiones)",
  "stat.pnlAfterFees": "PnL Neto (después comisiones)",
  "stat.netPnlAfterFees": "Resultado Total",
  "card.grossProfit": "Ganancia Bruta",
  "card.grossProfitSub": "{n} posiciones ganadoras",
  "card.grossLoss": "Pérdida Bruta",
  "card.grossLossSub": "{n} posiciones perdedoras",
  "card.pnlBeforeFees": "PnL Bruto",
  "card.pnlBeforeFeesSub": "Solo movimiento de precio — sin comisiones",
  "card.pnlAfterFees": "PnL Neto",
  "card.pnlAfterFeesSub": "Comisiones de {v} ya descontadas",
  "card.netPnlAfterFees": "Resultado Total",
  "card.netPnlAfterFeesSub": "Realizado + no realizado + funding",

  "chart.tradesPerDay": "Trades por día",
  "chart.tradesPerDaySub": "Últimos 14 días de campaña (21:00 BRT)",
  "chart.cumPnl": "PnL Acumulado",
  "chart.cumPnlSub": "PnL realizado + funding",
  "chart.longVsShort": "Long vs Short",
  "chart.tradeCount": "Número de trades",
  "chart.dailyVolume": "Volumen Diario",
  "chart.dailyVolumeSub": "Volumen nocional perps",
  "chart.volumeByMarket": "Volumen por Mercado",
  "chart.top8": "Top 8 mercados",
  "chart.top8Spot": "Top 8 mercados spot",
  "chart.buyVsSell": "Compra vs Venta",
  "chart.buyVsSellSub": "Distribución por nº de trades",
  "chart.noData": "SIN DATOS",
  "tt.cumulative": "Acumulado",
  "tt.daily": "Diario",
  "tt.trades": "Trades",
  "tt.volume": "Volumen",
  "tt.share": "Participación",

  "table.filterSymbol": "Filtrar símbolo…",
  "table.all": "TODOS",
  "table.page": "Página {p} / {total}",
  "table.tradeHistory": "Historial de Trades",
  "table.tradesCount": "{n} trades",
  "table.colDate": "Fecha",
  "table.colSymbol": "Símbolo",
  "table.colSide": "Lado",
  "table.colPrice": "Precio",
  "table.colSize": "Tamaño",
  "table.colVolume": "Volumen",
  "table.colFee": "Comisión",
  "table.colPnl": "PnL",
  "table.noTrades": "No se encontraron trades",
  "table.positions": "Posiciones",
  "table.positionsClosed": "{n} posiciones cerradas",
  "table.positionsCount": "{n} posiciones",
  "table.colClosed": "Cerrada",
  "table.colEntry": "Entrada",
  "table.colClose": "Cierre",
  "table.colDuration": "Duración",
  "table.noPositions": "No se encontraron posiciones",

  "spot.noTrades": "No se encontraron trades spot para esta cartera",
  "card.spotVolume": "Volumen Spot",
  "card.spotFees": "Comisiones Spot",
  "card.buyVolume": "Volumen de Compra",
  "card.sellVolume": "Volumen de Venta",
  "card.tradesN": "{n} trades",
  "card.buysN": "{n} compras",
  "card.sellsN": "{n} ventas",

  "card.totalVolume": "Volumen Total",
  "card.totalFees": "Comisiones Totales",
  "card.perpsPlusSpot": "Perps + Spot",
  "card.totalTradesN": "{n} trades en total",
  "card.perpsOnly": "Solo perps",
  "panel.perps": "Perps",
  "panel.spot": "Spot",
  "panel.combined": "Combinado",
  "row.volume": "Volumen",
  "row.fees": "Comisiones",
  "row.trades": "Trades",
  "row.winRate": "Tasa de Acierto",
  "row.netPnl": "PnL Neto",
  "row.buyVol": "Vol. Compra",
  "row.sellVol": "Vol. Venta",
  "row.totalVolume": "Volumen Total",
  "row.totalFees": "Comisiones Totales",
  "row.totalTrades": "Trades Totales",
  "row.perpsShare": "Participación Perps",
  "row.spotShare": "Participación Spot",

  "lang.label": "Idioma",

  "progress.connecting": "Conectando...",
  "progress.trades": "Obteniendo trades",
  "progress.positions": "Obteniendo posiciones",
  "progress.spot": "Obteniendo trades spot",
  "progress.analysing": "Analizando datos...",
  "progress.page": "{label}... página {page} ({count} registros)",
};

export const translations: Record<Locale, Dict> = {
  en,
  "pt-BR": ptBR,
  es,
};

// Replace {placeholders} from params; missing params are left untouched.
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    k in params ? String(params[k]) : `{${k}}`
  );
}

// Pure translator (usable on server). Falls back to English then to the key.
export function tr(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const table = translations[locale] ?? en;
  const raw = table[key] ?? en[key] ?? key;
  return interpolate(raw, params);
}

// ─── Persistence (cookie) + detection ─────────────────────────────────────
// localStorage can throw in sandboxed / privacy contexts, so we persist via a
// first-party cookie (works with SSR on Vercel) and keep state in React.

const COOKIE = "sodex_lang";

export function readStoredLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)sodex_lang=([^;]+)/);
  return m && isLocale(m[1]) ? (m[1] as Locale) : null;
}

export function storeLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  try {
    // 1 year, lax — readable on the client for hydration of the choice.
    document.cookie = `${COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  } catch {
    // Cookie writes blocked — silently rely on in-memory React state instead.
  }
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const l of langs) {
    const low = (l || "").toLowerCase();
    if (low.startsWith("pt")) return "pt-BR";
    if (low.startsWith("es")) return "es";
    if (low.startsWith("en")) return "en";
  }
  return "en";
}
