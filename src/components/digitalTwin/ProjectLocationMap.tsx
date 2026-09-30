import {
  ExternalLink,
  Map as MapIcon,
  MapPin,
} from "lucide-react";

type ProjectLocationMapProps = {
  projectName: string;
  latitude?: number | null;
  longitude?: number | null;
  locationDisplayName?: string | null;
};

export default function ProjectLocationMap({
  projectName,
  latitude,
  longitude,
  locationDisplayName,
}: ProjectLocationMapProps) {
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  if (!hasCoordinates) {
    return (
      <section className="dt-location-card">
        <div className="dt-section-heading">
          <div>
            <span className="dt-eyebrow">
              PROJECT LOCATION
            </span>

            <h2>Where the project is located</h2>

            <p>
              Location coordinates are not currently
              available for the selected project.
            </p>
          </div>

          <MapIcon
            size={20}
            strokeWidth={1.7}
          />
        </div>

        <div className="dt-location-empty">
          <MapPin size={22} />

          <div>
            <strong>
              Location not available
            </strong>

            <span>
              Add project coordinates to display
              the GIS location.
            </span>
          </div>
        </div>
      </section>
    );
  }

  const delta = 0.045;

  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join(",");

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
      bbox,
    )}&layer=mapnik&marker=${encodeURIComponent(
      `${latitude},${longitude}`,
    )}`;

  const externalMapUrl =
    `https://www.openstreetmap.org/?mlat=${encodeURIComponent(
      latitude,
    )}&mlon=${encodeURIComponent(
      longitude,
    )}#map=14/${encodeURIComponent(
      latitude,
    )}/${encodeURIComponent(
      longitude,
    )}`;

  return (
    <section className="dt-location-card">
      <div className="dt-section-heading">
        <div>
          <span className="dt-eyebrow">
            PROJECT LOCATION
          </span>

          <h2>Where the project is located</h2>

          <p>
            GIS position of the currently selected
            project.
          </p>
        </div>

        <MapIcon
          size={20}
          strokeWidth={1.7}
        />
      </div>

      <div className="dt-location-map">
        <iframe
          title={`GIS location of ${projectName}`}
          src={mapUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="dt-location-footer">
        <div className="dt-location-info">
          <MapPin size={18} />

          <div>
            <strong>
              {locationDisplayName ||
                "Selected project location"}
            </strong>

            <span>
              {latitude.toFixed(6)},{" "}
              {longitude.toFixed(6)}
            </span>
          </div>
        </div>

        <a
          href={externalMapUrl}
          target="_blank"
          rel="noreferrer"
          className="dt-location-open"
        >
          Open map
          <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}