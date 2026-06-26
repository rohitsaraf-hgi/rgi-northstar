import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { PersonaProvider } from './context/PersonaContext.jsx';
import { AIThinkingProvider } from './context/AIThinkingContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CompanyDetailProvider } from './context/CompanyDetailContext.jsx';
import { PlaybookDetailProvider } from './context/PlaybookDetailContext.jsx';
import { ApprovalProvider } from './context/ApprovalContext.jsx';
import { DemoProvider } from './context/DemoContext.jsx';
import { ModuleDetailProvider } from './context/ModuleDetailContext.jsx';
import { TenantProvider } from './context/TenantContext.jsx';
import { PageAgentProvider } from './context/PageAgentContext.jsx';

// Wire whitespace fallback getters so getFitFor / getRGIF work for HG-universe
// accounts that aren't in the rep's CRM book.
import { wireWhitespaceFitGetters } from './data/accountOfferingFit.js';
import { wireWhitespaceRGIFGetter } from './data/workbookRGIF.js';
import {
  getWhitespaceFit,
  getAllWhitespaceFitsFor,
  getWhitespaceRGIF,
} from './data/whitespaceAccounts.js';
wireWhitespaceFitGetters({ getWhitespaceFit, getAllWhitespaceFitsFor });
wireWhitespaceRGIFGetter(getWhitespaceRGIF);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <PersonaProvider>
          <TenantProvider>
            <DemoProvider>
              <AIThinkingProvider>
                <ToastProvider>
                  <ApprovalProvider>
                    <ModuleDetailProvider>
                      <CompanyDetailProvider>
                        <PlaybookDetailProvider>
                          <PageAgentProvider>
                            <App />
                          </PageAgentProvider>
                        </PlaybookDetailProvider>
                      </CompanyDetailProvider>
                    </ModuleDetailProvider>
                  </ApprovalProvider>
                </ToastProvider>
              </AIThinkingProvider>
            </DemoProvider>
          </TenantProvider>
        </PersonaProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
