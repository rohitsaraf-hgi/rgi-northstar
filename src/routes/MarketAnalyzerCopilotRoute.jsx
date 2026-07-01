// Market Analyzer Copilot — route wrapper.
//
// Wraps CopilotShell in MACopilotProvider so the right panel + save-
// segment writes + segment detail lookups all share one store scoped
// to this route.

import CopilotShell from '../components/marketAnalyzerCopilot/CopilotShell.jsx';
import { MACopilotProvider } from '../context/MarketAnalyzerCopilotContext.jsx';

export default function MarketAnalyzerCopilotRoute() {
  return (
    <MACopilotProvider>
      <CopilotShell />
    </MACopilotProvider>
  );
}
