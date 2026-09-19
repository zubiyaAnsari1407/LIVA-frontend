import { useEffect } from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router";

import {
  AuthProvider,
} from "./auth/AuthContext";

import ProtectedRoute from "./auth/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import AccessPage from "./pages/AccessPage";

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


function RouteScroll() {
  const {
    pathname,
    hash,
  } = useLocation();

  useEffect(() => {
    const frame =
      requestAnimationFrame(() => {
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
      cancelAnimationFrame(
        frame,
      );
  }, [
    pathname,
    hash,
  ]);

  return null;
}


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RouteScroll />

        <Routes>

          {/* ========================= */}
          {/* PUBLIC ROUTES */}
          {/* ========================= */}

          {/* Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage />
            }
          />

          {/* Role Access Page */}
          <Route
            path="/access"
            element={
              <AccessPage />
            }
          />


          {/* ========================= */}
          {/* DASHBOARD */}
          {/* ========================= */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                permission="dashboard.view"
              >
                <DashboardPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* PROJECTS */}
          {/* ========================= */}

          <Route
            path="/projects"
            element={
              <ProtectedRoute
                permission="projects.view"
              >
                <ProjectsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/preview"
            element={
              <ProtectedRoute
                permission="projects.view"
              >
                <Navigate
                  to="/projects/demo"
                  replace
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute
                permission="projects.view"
              >
                <ProjectLensPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* ACQUISITION WORKFLOW */}
          {/* ========================= */}

          <Route
            path="/parcels"
            element={
              <ProtectedRoute
                permission="workflow.view"
              >
                <ParcelsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ownership-survey"
            element={
              <ProtectedRoute
                permission="workflow.view"
              >
                <OwnershipSurveyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute
                permission="documents.view"
              >
                <DocumentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/litigation"
            element={
              <ProtectedRoute
                permission="workflow.view"
              >
                <LitigationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compensation"
            element={
              <ProtectedRoute
                permission="workflow.view"
              >
                <CompensationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rehabilitation"
            element={
              <ProtectedRoute
                permission="workflow.view"
              >
                <RehabilitationPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* ACTION CENTRE */}
          {/* ========================= */}

          <Route
            path="/actions"
            element={
              <ProtectedRoute
                permission="actions.view"
              >
                <ActionPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* DELAY INTELLIGENCE */}
          {/* ========================= */}

          <Route
            path="/intelligence"
            element={
              <ProtectedRoute
                permission="risk.view"
              >
                <IntelligencePage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* DIGITAL TWIN */}
          {/* ========================= */}

          <Route
            path="/simulator"
            element={
              <ProtectedRoute
                permission="simulation.view"
              >
                <SimulatorPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* REPORTS */}
          {/* ========================= */}

          <Route
            path="/reports"
            element={
              <ProtectedRoute
                permission="reports.view"
              >
                <ReportsPage />
              </ProtectedRoute>
            }
          />


          {/* ========================= */}
          {/* UNKNOWN ROUTE */}
          {/* ========================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}