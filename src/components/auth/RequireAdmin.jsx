import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { usePermissions, usePersona } from '../../context/PersonaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// Route guard for admin-only routes. Non-admins are redirected to /workspace
// with a toast explaining why. The redirect happens once on mount; the
// landing screen below only renders during the brief redirect transition.

export default function RequireAdmin({ children }) {
  const permissions = usePermissions();
  const { persona } = usePersona();
  const { showToast } = useToast();

  useEffect(() => {
    if (!permissions.canAccessAdmin) {
      showToast(`Admin Hub is restricted — ${persona.name} doesn't have admin access`, 'info');
    }
  }, [permissions.canAccessAdmin, persona.name, showToast]);

  if (!permissions.canAccessAdmin) {
    return <Navigate to="/workspace" replace />;
  }

  return children;
}

// Standalone "access denied" view — used if we ever want to show a friendly
// message instead of redirecting. Currently unused; kept for completeness.
export function AccessDeniedView({ feature = 'this area' }) {
  const { persona } = usePersona();
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center">
          <ShieldOff size={20} className="text-warning" />
        </div>
        <h1 className="text-lg font-semibold text-text-primary mb-2">
          Access restricted
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          {feature} is restricted to RevOps Admins. Your current role ({persona.role})
          doesn't have admin permissions. Contact your platform administrator if you
          need access.
        </p>
      </div>
    </div>
  );
}
