import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AboutThisProject } from "./pages/AboutThisProject";
import { MatchupSimulator } from "./pages/MatchupSimulator";
import { Overview } from "./pages/Overview";
import { ScoutingReport } from "./pages/ScoutingReport";
import { TeamProfile } from "./pages/TeamProfile";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <AboutThisProject /> },
      { path: "/about", element: <AboutThisProject /> },
      { path: "/overview", element: <Overview /> },
      { path: "/team-profile", element: <TeamProfile /> },
      { path: "/matchup-simulator", element: <MatchupSimulator /> },
      { path: "/scouting-report", element: <ScoutingReport /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
