import {
  ChevronDown,
  FileText,
  Layers3,
  MapPin,
} from "lucide-react";

export type ProjectContextProject = {
  id: string;
  name: string;
  district?: string | null;
  state?: string | null;
  sector?: string | null;
  lineMinistry?: string | null;
  image?: string | null;
};

type ProjectContextBannerProps = {
  project: ProjectContextProject;
  projects?: ProjectContextProject[];
  onProjectChange?: (projectId: string) => void;
  label?: string;
};

const DEFAULT_PROJECT_IMAGE = "/images/liva-land.png";

export default function ProjectContextBanner({
  project,
  projects = [],
  onProjectChange,
  label = "ACTIVE PROJECT",
}: ProjectContextBannerProps) {
  const location = [project.district, project.state]
    .filter(Boolean)
    .join(", ");

  const imageSrc =
    project.image?.trim() || DEFAULT_PROJECT_IMAGE;

  return (
    <section className="relative isolate min-h-[260px] w-full overflow-hidden rounded-2xl border border-[#173f35] bg-[#123d34] shadow-[0_8px_30px_rgba(18,61,52,0.12)]">
      {/* Project image */}
      <img
        src={imageSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          event.currentTarget.src = DEFAULT_PROJECT_IMAGE;
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,35,29,0.94)_0%,rgba(10,52,43,0.78)_48%,rgba(10,43,36,0.45)_100%)]" />

      {/* Bottom subtle fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[260px] flex-col justify-between gap-8 p-6 lg:flex-row lg:items-end lg:p-8">
        {/* Left */}
        <div className="max-w-[760px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d7bc7b]">
            {label}
          </p>

          <h1 className="mt-3 max-w-[720px] text-2xl font-semibold leading-tight tracking-[-0.035em] text-white lg:text-[32px]">
            {project.name}
          </h1>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-xs text-white/80">
            {location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-[#d7bc7b]" />
                {location}
              </span>
            )}

            {project.sector && (
              <span className="inline-flex items-center gap-1.5">
                <Layers3 size={14} className="text-[#d7bc7b]" />
                {project.sector}
              </span>
            )}

            {project.lineMinistry && (
              <span className="inline-flex items-center gap-1.5">
                <FileText size={14} className="text-[#d7bc7b]" />
                {project.lineMinistry}
              </span>
            )}
          </div>
        </div>

        {/* Right selector */}
        {projects.length > 0 && onProjectChange && (
          <div className="w-full shrink-0 lg:w-[330px]">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
              Select project
            </p>

            <div className="relative">
              <select
                value={project.id}
                onChange={(event) =>
                  onProjectChange(event.target.value)
                }
                aria-label="Select project"
                className="h-12 w-full appearance-none rounded-xl border border-white/20 bg-[#0d3028]/85 px-4 pr-11 text-sm font-medium text-white outline-none backdrop-blur-md transition hover:border-white/35 focus:border-[#d7bc7b]"
              >
                {projects.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[#123d34] text-white"
                  >
                    {item.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={17}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/70"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}