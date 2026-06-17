import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/chrome/AppShell.jsx';
import WorkspaceHome from './routes/WorkspaceHome.jsx';
import ThreadView from './routes/ThreadView.jsx';
import UseCaseLibrary from './routes/UseCaseLibrary.jsx';
import RoiDashboard from './routes/RoiDashboard.jsx';
import CollaborateView from './routes/CollaborateView.jsx';
import OnboardingFlow from './routes/OnboardingFlow.jsx';
import AdminHub from './routes/AdminHub.jsx';
import CopilotSettingsRoute from './routes/CopilotSettingsRoute.jsx';
import LibraryRoute from './routes/LibraryRoute.jsx';
import ChannelsRoute from './routes/ChannelsRoute.jsx';
import ConnectedAppsRoute from './routes/ConnectedAppsRoute.jsx';
import PlatformArchitecture from './routes/PlatformArchitectureRoute.jsx';
import AgentRegistryRoute from './routes/AgentRegistryRoute.jsx';
import WorkflowStudioRoute from './routes/WorkflowStudioRoute.jsx';
import SignalsRoute from './routes/SignalsRoute.jsx';
import SignalDetailRoute from './routes/SignalDetailRoute.jsx';
import SignalBuilderRoute from './routes/SignalBuilderRoute.jsx';
import SignalTemplatesRoute from './routes/SignalTemplatesRoute.jsx';
import OfferingsRoute from './routes/OfferingsRoute.jsx';
import ScoringModelBuilderRoute from './routes/ScoringModelBuilderRoute.jsx';
import WorkbookRoute from './routes/WorkbookRoute.jsx';
import PlaysRoute from './routes/PlaysRoute.jsx';
import WorkflowsRoute from './routes/WorkflowsRoute.jsx';
import WorkflowDetailRoute from './routes/WorkflowDetailRoute.jsx';
import WorkflowBuilderRoute from './routes/WorkflowBuilderRoute.jsx';
import WorkflowTemplatesRoute from './routes/WorkflowTemplatesRoute.jsx';
import SignupFlow from './routes/SignupFlow.jsx';
import Workbench from './routes/Workbench.jsx';
import WorkbenchLibrary from './routes/WorkbenchLibrary.jsx';
import WorkbenchResources from './routes/WorkbenchResources.jsx';
import AdminTenantEditor from './routes/AdminTenantEditor.jsx';
import TerritoryDesignRoute from './routes/TerritoryDesignRoute.jsx';
import ScoringModelsListRoute from './routes/ScoringModelsListRoute.jsx';
import AccountSettingsRoute from './routes/AccountSettingsRoute.jsx';
import UsersRoute from './routes/UsersRoute.jsx';
import TeamsRoute from './routes/TeamsRoute.jsx';
import SellerHome from './routes/SellerHome.jsx';
import AccountThread from './routes/AccountThread.jsx';
import RequireAdmin from './components/auth/RequireAdmin.jsx';
import DemoControls from './components/shared/DemoControls.jsx';
import ModuleDetailModal from './components/shared/ModuleDetailModal.jsx';
import { usePersona } from './context/PersonaContext.jsx';

function DefaultRedirect() {
  const { personaId, persona } = usePersona();
  // PLG-onboarded sellers land on the new account-driven Home.
  if (persona.plgUser) return <Navigate to="/home" replace />;
  const target = personaId === 'priya' ? '/admin' : '/workspace';
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/signup" element={<SignupFlow />} />
        <Route element={<AppShell />}>
          <Route index element={<DefaultRedirect />} />
          <Route path="/home" element={<SellerHome />} />
          <Route path="/account/:id" element={<AccountThread />} />
          <Route path="/workbook" element={<WorkbookRoute />} />
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/workbench/library" element={<WorkbenchLibrary />} />
          <Route path="/workbench/resources" element={<WorkbenchResources />} />
          <Route path="/workspace" element={<WorkspaceHome />} />
          <Route path="/thread/:id" element={<ThreadView />} />
          <Route path="/use-cases" element={<UseCaseLibrary />} />
          <Route path="/collaborate/:id" element={<CollaborateView />} />
          <Route path="/roi" element={<RoiDashboard />} />
          <Route path="/platform" element={<PlatformArchitecture />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminHub />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/copilot"
            element={
              <RequireAdmin>
                <CopilotSettingsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/apps"
            element={
              <RequireAdmin>
                <ConnectedAppsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/agents"
            element={
              <RequireAdmin>
                <AgentRegistryRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows"
            element={
              <RequireAdmin>
                <WorkflowsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows/templates"
            element={
              <RequireAdmin>
                <WorkflowTemplatesRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows/new"
            element={
              <RequireAdmin>
                <WorkflowBuilderRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows/:id"
            element={
              <RequireAdmin>
                <WorkflowDetailRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows/:id/edit"
            element={
              <RequireAdmin>
                <WorkflowBuilderRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows-legacy"
            element={
              <RequireAdmin>
                <WorkflowStudioRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/workflows-legacy/:id"
            element={
              <RequireAdmin>
                <WorkflowStudioRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/tenant"
            element={
              <RequireAdmin>
                <AdminTenantEditor />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/territory"
            element={
              <RequireAdmin>
                <TerritoryDesignRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/scoring"
            element={
              <RequireAdmin>
                <ScoringModelsListRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAdmin>
                <AccountSettingsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/settings/:section"
            element={
              <RequireAdmin>
                <AccountSettingsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <UsersRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/teams"
            element={
              <RequireAdmin>
                <TeamsRoute />
              </RequireAdmin>
            }
          />
          {/* Plays is accessible to all personas — sellers see only tenant-visible
              + their private plays; admins see everything. PlaysRoute branches
              UI based on persona role. */}
          <Route path="/admin/plays" element={<PlaysRoute />} />
          <Route path="/admin/plays/:id" element={<PlaysRoute />} />
          <Route path="/plays" element={<PlaysRoute />} />
          <Route path="/plays/:id" element={<PlaysRoute />} />
          <Route
            path="/admin/offerings"
            element={
              <RequireAdmin>
                <OfferingsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/offerings/:id"
            element={
              <RequireAdmin>
                <OfferingsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/offerings/:id/model"
            element={
              <RequireAdmin>
                <ScoringModelBuilderRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/signals"
            element={
              <RequireAdmin>
                <SignalsRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/signals/templates"
            element={
              <RequireAdmin>
                <SignalTemplatesRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/signals/new"
            element={
              <RequireAdmin>
                <SignalBuilderRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/signals/:id"
            element={
              <RequireAdmin>
                <SignalDetailRoute />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/signals/:id/edit"
            element={
              <RequireAdmin>
                <SignalBuilderRoute />
              </RequireAdmin>
            }
          />
          <Route path="/library" element={<LibraryRoute />} />
          <Route path="/channels" element={<ChannelsRoute />} />
        </Route>
      </Routes>
      <DemoControls />
      <ModuleDetailModal />
    </>
  );
}
