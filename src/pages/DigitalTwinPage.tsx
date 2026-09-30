import { useSearchParams } from "react-router";

import DigitalTwinOverview from "../components/digitalTwin/DigitalTwinOverview";
import "../styles/digital-twin.css";

export default function DigitalTwinPage() {
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("projectId");

  return (
    <div className="dt-page">
      <main>
        <DigitalTwinOverview
          initialProjectId={projectId}
        />
      </main>
    </div>
  );
}