import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Compass,
  Globe,
  BarChart3,
  Target,
  Cpu,
  Activity,
} from 'lucide-react';
import { usePersona } from '../../context/PersonaContext.jsx';
import { QUICK_ACTIONS } from '../../data/personaContent.js';

const ICONS = {
  plus: Plus,
  compass: Compass,
  globe: Globe,
  'bar-chart-3': BarChart3,
  target: Target,
  cpu: Cpu,
  activity: Activity,
};

export default function QuickActions({ onNewThread }) {
  const { personaId } = usePersona();
  const navigate = useNavigate();
  const actions = QUICK_ACTIONS[personaId] || [];

  return (
    <section className="px-8 py-4 pb-12">
      <div className="flex flex-wrap gap-2">
        {actions.map((action, i) => {
          const Icon = ICONS[action.icon] || Plus;
          const handle = () => {
            if (action.target) navigate(action.target);
            else onNewThread();
          };
          return (
            <button
              key={i}
              onClick={handle}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-md text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary hover:border-border-2 transition-colors"
            >
              <Icon size={12} />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
