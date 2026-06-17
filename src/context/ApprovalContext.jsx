import { createContext, useContext, useState, useCallback } from 'react';

// Approval state lives in the platform — Slack and browser are both clients
// of this same state. Resolving an approval anywhere updates everywhere.

const ApprovalContext = createContext(null);

export function ApprovalProvider({ children }) {
  // Shape: { [approvalId]: 'approve' | 'reject' }
  const [resolvedApprovals, setResolvedApprovals] = useState({});
  // Surface that resolved each approval — for attribution display
  const [resolvedSurfaces, setResolvedSurfaces] = useState({});
  // When resolved, for the timeline
  const [resolvedAt, setResolvedAt] = useState({});

  const resolveApproval = useCallback((approvalId, decision, surface = 'browser') => {
    setResolvedApprovals((prev) => ({ ...prev, [approvalId]: decision }));
    setResolvedSurfaces((prev) => ({ ...prev, [approvalId]: surface }));
    setResolvedAt((prev) => ({ ...prev, [approvalId]: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }));
  }, []);

  return (
    <ApprovalContext.Provider value={{ resolvedApprovals, resolvedSurfaces, resolvedAt, resolveApproval }}>
      {children}
    </ApprovalContext.Provider>
  );
}

export function useApprovals() {
  const ctx = useContext(ApprovalContext);
  if (!ctx) throw new Error('useApprovals must be used within ApprovalProvider');
  return ctx;
}
