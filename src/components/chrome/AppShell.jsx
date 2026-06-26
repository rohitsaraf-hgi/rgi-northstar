import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar.jsx';
import TopNav from './TopNav.jsx';
import NotificationPanel from './NotificationPanel.jsx';
import UseCaseActivationModal from '../usecase/UseCaseActivationModal.jsx';
import CompanyDetailDrawer from '../company/CompanyDetailDrawer.jsx';
import PlaybookDetailDrawer from '../admin/PlaybookDetailDrawer.jsx';
import PageAgentLauncher from './PageAgentLauncher.jsx';
import { usePersona } from '../../context/PersonaContext.jsx';
import { usePageAgentControls } from '../../context/PageAgentContext.jsx';

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const { isSwitching, persona } = usePersona();
  const { open: agentOpen } = usePageAgentControls();

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* App sidebar — collapses away while the page agent is open, for a
          focused side-by-side view. */}
      <motion.div
        initial={false}
        animate={{ width: agentOpen ? 0 : collapsed ? 56 : 240 }}
        transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.3 }}
        className="flex-shrink-0 h-full overflow-hidden"
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onNewThread={() => setNewThreadOpen(true)}
        />
      </motion.div>

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onBellClick={() => setBellOpen(true)} />

        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            {isSwitching ? (
              <motion.div
                key="switching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-bg/80 backdrop-blur-sm z-20"
              >
                <div className="flex items-center gap-3 text-text-secondary">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Switching to {persona.name.split(' ')[0]}'s workspace...</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <Outlet />
        </div>
      </div>

      <NotificationPanel open={bellOpen} onClose={() => setBellOpen(false)} />
      <UseCaseActivationModal
        open={newThreadOpen}
        onClose={() => setNewThreadOpen(false)}
      />
      <CompanyDetailDrawer />
      <PlaybookDetailDrawer />
      <PageAgentLauncher />
    </div>
  );
}
