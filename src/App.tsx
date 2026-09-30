import {
  useEffect,
  type ComponentProps,
  type ReactNode,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";

import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import LivaNavigation from "./components/navigation/LivaNavigation";

import { FlashProvider } from "./context/FlashContext";

import LandingPage from "./pages/LandingPage";
import AccessPage from "./pages/AccessPage";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ParcelsPage from "./pages/ParcelsPage";
import OwnershipSurveyPage from "./pages/OwnershipSurveyPage";
import DocumentsPage from "./pages/DocumentsPage";
import LitigationPage from "./pages/LitigationPage";
import CompensationPage from "./pages/CompensationPage";
import ActionPage from "./pages/ActionsPage";
import ProjectLensPage from "./pages/ProjectLensPage";
import IntelligencePage from "./pages/IntelligencePage";
import SimulatorPage from "./pages/SimulatorPage";
import ReportsPage from "./pages/ReportsPage";
import RehabilitationPage from "./pages/RehabilitationPage";
import DigitalTwinPage from "./pages/DigitalTwinPage";


function RouteScroll() {
  const {
    pathname,
    hash,
  } = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        const target =
          document.getElementById(
            hash.slice(1),
          );

        if (target) {
          target.scrollIntoView({
            behavior:
              window.matchMedia(
                "(prefers-reduced-motion: reduce)",
              ).matches
                ? "auto"
                : "smooth",
            block: "start",
          });

          return;
        }
      }

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    });

    return () =>
      cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}


/*
|--------------------------------------------------------------------------|
| Common Navigation Layout
|--------------------------------------------------------------------------|
*/

function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <LivaNavigation />

      <div className="liva-page-content">
        {children}
      </div>
    </>
  );
}


/*
|--------------------------------------------------------------------------|
| Protected Page Wrapper
|--------------------------------------------------------------------------|
*/

type LivaPermission =
  ComponentProps<typeof ProtectedRoute>["permission"];

function ProtectedPage({
  permission,
  role,
  children,
}: {
  permission: LivaPermission;
  role?: 'admin' | 'officer' | 'landowner';
  children: ReactNode;
}) {
  return (
    <ProtectedRoute permission={permission} role={role}>
      <ProtectedLayout>
        {children}
      </ProtectedLayout>
    </ProtectedRoute>
  );
}

/*
|--------------------------------------------------------------------------|
| App
|--------------------------------------------------------------------------|
*/

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <FlashProvider>

          <RouteScroll />

          <Routes>

            {/* ===================================================== */}
            {/* PUBLIC ROUTES */}
            {/* ===================================================== */}

            <Route
              path="/"
              element={<LandingPage />}
            />

            <Route
              path="/access"
              element={<AccessPage />}
            />


            <Route
              path="/login"
              element={<LoginPage />}
            />


            {/* ===================================================== */}
            {/* DASHBOARD */}
            {/* ===================================================== */}

            <Route
              path="/dashboard"
              element={
                <ProtectedPage
                  permission="dashboard.view"
                >
                  <DashboardPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/admin/approval"
              element={
                <ProtectedPage permission="dashboard.view" role="admin">
                  <DashboardPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/officer/grievances"
              element={<ProtectedPage permission="dashboard.view"><DashboardPage /></ProtectedPage>}
            />
            <Route path="/officer/projects" element={<ProtectedPage permission="projects.view"><DashboardPage /></ProtectedPage>} />
            <Route path="/officer/projects/:projectId/:tab?" element={<ProtectedPage permission="projects.view"><DashboardPage /></ProtectedPage>} />

            <Route
              path="/landowner/projects"
              element={
                <ProtectedPage permission="dashboard.view">
                  <DashboardPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/landowner/requests"
              element={
                <ProtectedPage permission="dashboard.view">
                  <DashboardPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/landowner/tracking/:section?"
              element={
                <ProtectedPage permission="dashboard.view">
                  <DashboardPage />
                </ProtectedPage>
              }
            />

            <Route path="/landowner/requests/new" element={<ProtectedPage permission="dashboard.view"><DashboardPage /></ProtectedPage>} />
            <Route path="/landowner/requests/:requestId/edit" element={<ProtectedPage permission="dashboard.view"><DashboardPage /></ProtectedPage>} />

            <Route
              path="/landowner/projects/:projectId/:tab?"
              element={
                <ProtectedPage
                  permission="dashboard.view"
                >
                  <DashboardPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* PROJECTS */}
            {/* ===================================================== */}

            <Route
              path="/projects"
              element={
                <ProtectedPage
                  permission="projects.view"
                >
                  <ProjectsPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/projects/preview"
              element={
                <ProtectedPage
                  permission="projects.view"
                >
                  <Navigate
                    to="/projects/demo"
                    replace
                  />
                </ProtectedPage>
              }
            />

            <Route
              path="/projects/:projectId"
              element={
                <ProtectedPage
                  permission="projects.view"
                >
                  <ProjectLensPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* ACQUISITION WORKFLOW */}
            {/* ===================================================== */}

            <Route
              path="/parcels"
              element={
                <ProtectedPage
                  permission="workflow.view"
                >
                  <ParcelsPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/ownership-survey"
              element={
                <ProtectedPage
                  permission="workflow.view"
                >
                  <OwnershipSurveyPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/documents"
              element={
                <ProtectedPage
                  permission="documents.view"
                >
                  <DocumentsPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/litigation"
              element={
                <ProtectedPage
                  permission="workflow.view"
                >
                  <LitigationPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/compensation"
              element={
                <ProtectedPage
                  permission="workflow.view"
                >
                  <CompensationPage />
                </ProtectedPage>
              }
            />

            <Route
              path="/rehabilitation"
              element={
                <ProtectedPage
                  permission="workflow.view"
                >
                  <RehabilitationPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* ACTION CENTRE */}
            {/* ===================================================== */}

            <Route
              path="/actions"
              element={
                <ProtectedPage
                  permission="actions.view"
                >
                  <ActionPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* DELAY INTELLIGENCE */}
            {/* ===================================================== */}

            <Route
              path="/intelligence"
              element={
                <ProtectedPage
                  permission="risk.view"
                >
                  <IntelligencePage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* DIGITAL TWIN */}
            {/* ===================================================== */}

            <Route
              path="/digital-twin"
              element={
                <ProtectedPage
                  permission="simulation.view"
                >
                  <DigitalTwinPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* INTERVENTION SIMULATOR */}
            {/* ===================================================== */}

            <Route
              path="/simulator"
              element={
                <ProtectedPage
                  permission="simulation.view"
                >
                  <SimulatorPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* REPORTS */}
            {/* ===================================================== */}

            <Route
              path="/reports"
              element={
                <ProtectedPage
                  permission="reports.view"
                >
                  <ReportsPage />
                </ProtectedPage>
              }
            />


            {/* ===================================================== */}
            {/* UNKNOWN ROUTE */}
            {/* ===================================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />

          </Routes>

        </FlashProvider>

      </AuthProvider>
    </BrowserRouter>
  );
}
