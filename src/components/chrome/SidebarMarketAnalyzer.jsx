// SidebarMarketAnalyzer — left navigation for the Market Analyzer module.
//
// Sections (mirrors the structure of HG's existing Market Analyzer app
// but rendered in RGI Northstar's design language):
//   MARKET ANALYZER     — Projects
//   SEGMENTATION        — Companies, Segments
//   SCORING             — Scoring Profiles  (NEW — accessible to all MA users)
//   CATALOG             — Tech & Taxonomies, Saved Collections, Export History
//
// Routing: only Priya (admin) has Market Analyzer in her switcher today.
// The Sales Co-Pilot module hand-off button surfaces at the bottom so
// it's easy to jump back to the workbook surface mid-analysis.

import { useNavigate, useLocation } from 'react-router-dom';
import {
  Folder,
  Compass,
  List as ListIcon,
  Gauge,
  Layers,
  Bookmark,
  History,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import PersonaSwitcher from './PersonaSwitcher.jsx';

function SectionLabel({ children }) {
  return (
    <div className="px-2.5 pt-4 pb-1 flex items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted/70">
        {children}
      </span>
    </div>
  );
}

function NavRow({ icon: Icon, label, active, onClick, collapsed, indent = false }) {
  if (collapsed && !Icon) return null;
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-2 ${collapsed ? 'px-2 justify-center' : indent ? 'pl-5 pr-2.5' : 'px-2.5'} py-1.5 rounded-md text-xs transition-colors ${
        active
          ? 'bg-primary/15 text-primary'
          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
      }`}
    >
      {Icon && <Icon size={13} className={`flex-shrink-0 ${active ? '' : 'opacity-80'}`} />}
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
    </button>
  );
}

export default function SidebarMarketAnalyzer({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const is = (path) => location.pathname === path;
  const startsWith = (path) => location.pathname.startsWith(path);

  return (
    <div
      className={`h-screen flex flex-col bg-bg border-r border-border/60 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-60'
      }`}
    >
      <div className="h-14 flex items-center px-3 border-b border-border/60">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors ml-auto"
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-2 py-2">
        {/* MARKET ANALYZER */}
        {!collapsed && <SectionLabel>Market Analyzer</SectionLabel>}
        <div className={collapsed ? 'pt-3 space-y-1' : 'space-y-0.5'}>
          <NavRow
            icon={Folder}
            label="Projects"
            active={startsWith('/market-analyzer/projects')}
            onClick={() => navigate('/market-analyzer/projects')}
            collapsed={collapsed}
          />
        </div>

        {/* SEGMENTATION */}
        {!collapsed && <SectionLabel>Segmentation</SectionLabel>}
        <div className="space-y-0.5">
          <NavRow
            icon={Compass}
            label="Companies"
            active={startsWith('/market-analyzer/companies')}
            onClick={() => navigate('/market-analyzer/companies')}
            collapsed={collapsed}
          />
          <NavRow
            icon={ListIcon}
            label="Segments"
            active={startsWith('/market-analyzer/segments')}
            onClick={() => navigate('/market-analyzer/segments')}
            collapsed={collapsed}
          />
        </div>

        {/* SCORING — Scoring Profiles, accessible to every Market Analyzer user. */}
        {!collapsed && <SectionLabel>Scoring</SectionLabel>}
        <div className="space-y-0.5">
          <NavRow
            icon={Gauge}
            label="Scoring Profiles"
            active={startsWith('/market-analyzer/scoring-profiles')}
            onClick={() => navigate('/market-analyzer/scoring-profiles')}
            collapsed={collapsed}
          />
        </div>

        {/* CATALOG */}
        {!collapsed && <SectionLabel>Catalog</SectionLabel>}
        <div className="space-y-0.5">
          <NavRow
            icon={Layers}
            label="Tech & Taxonomies"
            active={startsWith('/market-analyzer/tech-taxonomies')}
            onClick={() => navigate('/market-analyzer/tech-taxonomies')}
            collapsed={collapsed}
          />
          <NavRow
            icon={Bookmark}
            label="Saved Collections"
            active={startsWith('/market-analyzer/saved-collections')}
            onClick={() => navigate('/market-analyzer/saved-collections')}
            collapsed={collapsed}
          />
          <NavRow
            icon={History}
            label="Export History"
            active={startsWith('/market-analyzer/export-history')}
            onClick={() => navigate('/market-analyzer/export-history')}
            collapsed={collapsed}
          />
        </div>

        {/* PROSPECTING — quick hop into Sales Co-Pilot. */}
        {!collapsed && <SectionLabel>Prospecting</SectionLabel>}
        <div className="space-y-0.5">
          <NavRow
            icon={Sparkles}
            label="Open Sales Co-Pilot"
            active={false}
            onClick={() => navigate('/workbook')}
            collapsed={collapsed}
          />
        </div>
      </div>

      <div className="p-2 border-t border-border/60">
        <PersonaSwitcher collapsed={collapsed} />
      </div>
    </div>
  );
}
