import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import AkteurePage from '@/pages/AkteurePage';
import AkteureDetailPage from '@/pages/AkteureDetailPage';
import BedeutungsknotenPage from '@/pages/BedeutungsknotenPage';
import BedeutungsknotenDetailPage from '@/pages/BedeutungsknotenDetailPage';
import KnotenbeziehungenPage from '@/pages/KnotenbeziehungenPage';
import KnotenbeziehungenDetailPage from '@/pages/KnotenbeziehungenDetailPage';
import ExterneObjektePage from '@/pages/ExterneObjektePage';
import ExterneObjekteDetailPage from '@/pages/ExterneObjekteDetailPage';
import BedeutungsverknuepfungenPage from '@/pages/BedeutungsverknuepfungenPage';
import BedeutungsverknuepfungenDetailPage from '@/pages/BedeutungsverknuepfungenDetailPage';
import BedeutungsereignissePage from '@/pages/BedeutungsereignissePage';
import BedeutungsereignisseDetailPage from '@/pages/BedeutungsereignisseDetailPage';
import PublicFormAkteure from '@/pages/public/PublicForm_Akteure';
import PublicFormBedeutungsknoten from '@/pages/public/PublicForm_Bedeutungsknoten';
import PublicFormKnotenbeziehungen from '@/pages/public/PublicForm_Knotenbeziehungen';
import PublicFormExterneObjekte from '@/pages/public/PublicForm_ExterneObjekte';
import PublicFormBedeutungsverknuepfungen from '@/pages/public/PublicForm_Bedeutungsverknuepfungen';
import PublicFormBedeutungsereignisse from '@/pages/public/PublicForm_Bedeutungsereignisse';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/6a58d592d41d51dcf339b82e" element={<PublicFormAkteure />} />
              <Route path="public/6a58d598b5197f8a71859836" element={<PublicFormBedeutungsknoten />} />
              <Route path="public/6a58d59945d4b015c290e16a" element={<PublicFormKnotenbeziehungen />} />
              <Route path="public/6a58d5999b474d0c231e8c4c" element={<PublicFormExterneObjekte />} />
              <Route path="public/6a58d59a91aa765b8b8ef82e" element={<PublicFormBedeutungsverknuepfungen />} />
              <Route path="public/6a58d59a950bc3b73c446a47" element={<PublicFormBedeutungsereignisse />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="akteure" element={<AkteurePage />} />
                <Route path="akteure/:id" element={<AkteureDetailPage />} />
                <Route path="bedeutungsknoten" element={<BedeutungsknotenPage />} />
                <Route path="bedeutungsknoten/:id" element={<BedeutungsknotenDetailPage />} />
                <Route path="knotenbeziehungen" element={<KnotenbeziehungenPage />} />
                <Route path="knotenbeziehungen/:id" element={<KnotenbeziehungenDetailPage />} />
                <Route path="externe-objekte" element={<ExterneObjektePage />} />
                <Route path="externe-objekte/:id" element={<ExterneObjekteDetailPage />} />
                <Route path="bedeutungsverknuepfungen" element={<BedeutungsverknuepfungenPage />} />
                <Route path="bedeutungsverknuepfungen/:id" element={<BedeutungsverknuepfungenDetailPage />} />
                <Route path="bedeutungsereignisse" element={<BedeutungsereignissePage />} />
                <Route path="bedeutungsereignisse/:id" element={<BedeutungsereignisseDetailPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
                {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
