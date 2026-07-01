// MarketAnalyzerCopilotContext — shared in-memory state for the
// Copilot prototype's engagement layer.
//
// Hoists savedSegments + alerts state out of CopilotShell so:
//   - the right panel can read savedSegments live
//   - save-segment follow-ups can write new segments and the panel
//     updates without prop-drilling
//   - the notification center can mark alerts read / dismiss them
//   - the Segment Detail View can look up details by id
//
// State is in-memory only (resets on refresh) — matches the spec's
// "no real persistence" rule for the prototype.

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { userContext } from '../data/marketAnalyzerCopilot/userContext.js';
import { ALERT_TEMPLATES, NOTIFICATION_GUARDRAIL } from '../data/marketAnalyzerCopilot/alerts.js';
import { SEGMENT_DETAILS, defaultSegmentDetail } from '../data/marketAnalyzerCopilot/segmentDetail.js';

const MACopilotContext = createContext(null);

// Hydrate alerts from userContext.alerts + the alert template registry,
// joining the two so each alert is renderable without a second lookup.
function buildInitialAlerts() {
  return userContext.alerts.map((a) => {
    const tpl = ALERT_TEMPLATES[a.type] || {};
    return {
      id: a.id,
      type: a.type,
      read: a.read,
      daysAgo: a.daysAgo,
      icon: tpl.icon || 'bell',
      accent: tpl.accent || 'sky',
      headline: tpl.headline || a.type,
      detail: tpl.detail || '',
      action: tpl.action || null,
    };
  });
}

let segmentSeq = 1000;
function nextSegmentId() {
  segmentSeq += 1;
  return `s-saved-${segmentSeq}`;
}

export function MACopilotProvider({ children }) {
  const [savedSegments, setSavedSegments] = useState(() => userContext.savedSegments);
  const [segmentDetailRegistry, setSegmentDetailRegistry] = useState(
    () => ({ ...SEGMENT_DETAILS }),
  );
  const [alerts, setAlerts] = useState(buildInitialAlerts);

  const addSegment = useCallback((segment) => {
    const id = segment.id || nextSegmentId();
    const created = {
      id,
      name: segment.name,
      motion: segment.motion || 'new_logo',
      motionColor: segment.motionColor || 'emerald',
      accountCount: segment.accountCount || 0,
      monthOverMonth: segment.monthOverMonth || '—',
      monthOverMonthDirection: segment.monthOverMonthDirection || 'flat',
      spendTrend: segment.spendTrend || [10, 10, 10, 10, 10, 10, 10],
      intentActivity: segment.intentActivity || 'pending',
      lastRefreshed: segment.lastRefreshed || 'just now',
      isNew: true,
    };
    setSavedSegments((prev) => [created, ...prev]);
    setSegmentDetailRegistry((prev) => ({
      ...prev,
      [id]: defaultSegmentDetail(created),
    }));
    return created;
  }, []);

  const getSegment = useCallback(
    (segmentId) => savedSegments.find((s) => s.id === segmentId) || null,
    [savedSegments],
  );

  const getSegmentDetail = useCallback(
    (segmentId) => segmentDetailRegistry[segmentId] || null,
    [segmentDetailRegistry],
  );

  const markAlertRead = useCallback((alertId) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
  }, []);

  const dismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  const value = useMemo(
    () => ({
      savedSegments,
      addSegment,
      getSegment,
      getSegmentDetail,
      alerts,
      unreadAlertCount: alerts.filter((a) => !a.read).length,
      markAlertRead,
      dismissAlert,
      guardrail: NOTIFICATION_GUARDRAIL,
      trackedCompetitors: userContext.trackedCompetitors,
    }),
    [savedSegments, addSegment, getSegment, getSegmentDetail, alerts, markAlertRead, dismissAlert],
  );

  return <MACopilotContext.Provider value={value}>{children}</MACopilotContext.Provider>;
}

export function useMACopilot() {
  const ctx = useContext(MACopilotContext);
  if (!ctx) {
    throw new Error('useMACopilot must be used within a <MACopilotProvider>');
  }
  return ctx;
}
