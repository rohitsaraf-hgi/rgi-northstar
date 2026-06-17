import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePersona } from '../context/PersonaContext.jsx';
import TodaysFocus from '../components/workspace/TodaysFocus.jsx';
import ActiveThreads from '../components/workspace/ActiveThreads.jsx';
import DiscoveryRail from '../components/workspace/DiscoveryRail.jsx';
import QuickActions from '../components/workspace/QuickActions.jsx';
import RecentlySaved from '../components/workspace/RecentlySaved.jsx';
import ModuleCoverageBanner from '../components/workspace/ModuleCoverageBanner.jsx';
import Day1Workspace from '../components/workspace/Day1Workspace.jsx';
import UseCaseActivationModal from '../components/usecase/UseCaseActivationModal.jsx';
import ConfigHealthSummary from '../components/admin/ConfigHealthSummary.jsx';
import AuthoredPlaybooks from '../components/admin/AuthoredPlaybooks.jsx';
import RecentActivityLog from '../components/admin/RecentActivityLog.jsx';

// Sellers and strategists land on the workflow-shaped home (focus, threads,
// suggestions). Admins land on an operations console (health, attention,
// authored playbooks, activity) — admin work isn't workflow-shaped.

export default function WorkspaceHome() {
  const { persona, personaId } = usePersona();
  const [modalOpen, setModalOpen] = useState(false);
  const [presetUseCase, setPresetUseCase] = useState(null);

  const openNewThread = () => {
    setPresetUseCase(null);
    setModalOpen(true);
  };

  const openWithUseCase = (useCaseId) => {
    setPresetUseCase(useCaseId);
    setModalOpen(true);
  };

  const isAdmin = personaId === 'priya';
  const isNewUser = persona.isNew === true;

  // Day 1 view for brand-new sellers — replaces the standard home entirely
  if (isNewUser) {
    return (
      <>
        <motion.div
          key={personaId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Day1Workspace />
        </motion.div>
        <UseCaseActivationModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          presetUseCaseId={presetUseCase}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        key={personaId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="max-w-6xl mx-auto"
      >
        <div className="px-8 pt-8 pb-2">
          <div className="text-sm text-text-secondary">
            {isAdmin ? 'Operations console' : `Welcome back, ${persona.name.split(' ')[0]}`}
          </div>
        </div>

        {isAdmin ? (
          <>
            <ConfigHealthSummary />
            <TodaysFocus />
            <AuthoredPlaybooks onBuildNew={() => openWithUseCase('build-playbook')} />
            <ActiveThreads onNewThread={openNewThread} />
            <RecentActivityLog />
            <QuickActions onNewThread={openNewThread} />
          </>
        ) : (
          <>
            <TodaysFocus />
            <ModuleCoverageBanner />
            <ActiveThreads onNewThread={openNewThread} />
            <DiscoveryRail onActivate={openWithUseCase} />
          </>
        )}
      </motion.div>

      <UseCaseActivationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        presetUseCaseId={presetUseCase}
      />
    </>
  );
}
