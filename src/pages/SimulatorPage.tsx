import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  FlaskConical,
  MapPin,
  Orbit,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import {
  Link,
  useSearchParams,
} from "react-router";

import {
  motion,
} from "motion/react";

import DigitalTwinPanel from "../components/simulation/DigitalTwinPanel";


type ProjectOption = {
  id: string;
  name: string;

  state: string | null;
  district: string | null;

  sector: string | null;
  line_ministry: string | null;

  progress: number | null;

  isDemo: boolean | undefined;

  sourceName: string | null;
  sourceRecordId: string | null;
};


const API_BASE_URL =
  (
    import.meta.env.VITE_API_BASE_URL ??
    "http://127.0.0.1:8000"
  ).replace(
    /\/+$/,
    "",
  );


const UNKNOWN_LOCATION_VALUES = [
  "",
  "not specified",
  "not available",
  "not specified in paimana export",
  "unknown",
];


function cleanLocationValue(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return null;
  }

  const cleaned =
    value.trim();

  if (
    UNKNOWN_LOCATION_VALUES.includes(
      cleaned.toLowerCase(),
    )
  ) {
    return null;
  }

  return cleaned;
}


function normalizeProjects(
  payload: unknown,
): ProjectOption[] {
  let raw:
    unknown[] = [];


  if (
    Array.isArray(
      payload,
    )
  ) {
    raw =
      payload;

  } else if (
    typeof payload ===
      "object"
    &&
    payload !==
      null
  ) {
    const record =
      payload as Record<
        string,
        unknown
      >;


    if (
      Array.isArray(
        record.items,
      )
    ) {
      raw =
        record.items;

    } else if (
      Array.isArray(
        record.projects,
      )
    ) {
      raw =
        record.projects;
    }
  }


  return raw
    .map(
      (
        item,
      ) => {
        if (
          typeof item !==
            "object"
          ||
          item ===
            null
        ) {
          return null;
        }


        const record =
          item as Record<
            string,
            unknown
          >;


        const id =
          String(
            record.id ??
            record._id ??
            record.project_id ??
            "",
          );


        if (!id) {
          return null;
        }


        return {
          id,

          name:
            String(
              record.name ??
              record.project_name ??
              record.title ??
              "Untitled project",
            ),

          state:
            typeof record.state ===
              "string"
              ? record.state
              : null,

          district:
            typeof record.district ===
              "string"
              ? record.district
              : null,

          sector:
            typeof record.sector ===
              "string"
              ? record.sector
              : null,

          line_ministry:
            typeof record.line_ministry ===
              "string"
              ? record.line_ministry
              : null,

          progress:
            typeof record.progress ===
              "number"
              ? record.progress
              : null,

          isDemo:
            typeof record.isDemo ===
              "boolean"
              ? record.isDemo
              : undefined,

          sourceName:
            typeof record.sourceName ===
              "string"
              ? record.sourceName
              : null,

          sourceRecordId:
            typeof record.sourceRecordId ===
              "string"
              ? record.sourceRecordId
              : null,
        };
      },
    )
    .filter(
      (
        project,
      ): project is ProjectOption =>
        project !==
        null,
    );
}


function getProjectLocation(
  project:
    ProjectOption,
) {
  const district =
    cleanLocationValue(
      project.district,
    );

  const state =
    cleanLocationValue(
      project.state,
    );


  return [
    district,
    state,
  ]
    .filter(Boolean)
    .join(", ");
}


export default function SimulatorPage() {
  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();


  /*
   * Supports BOTH:
   *
   * /simulator?projectId=...
   * /simulator?project=...
   *
   * This keeps GIS, Projects and older links compatible.
   */
  const selectedProjectId =
    searchParams.get(
      "projectId",
    )
    ??
    searchParams.get(
      "project",
    )
    ??
    "";


  const [
    projects,
    setProjects,
  ] =
    useState<
      ProjectOption[]
    >(
      [],
    );


  const [
    loadingProjects,
    setLoadingProjects,
  ] =
    useState(true);


  const [
    projectsError,
    setProjectsError,
  ] =
    useState("");


  // =========================================================
  // LOAD PROJECTS
  // =========================================================

  useEffect(() => {
    let active =
      true;


    async function loadProjects() {
      try {
        setLoadingProjects(
          true,
        );

        setProjectsError(
          "",
        );


        const response =
          await fetch(
            `${API_BASE_URL}/api/projects`,
          );


        if (
          !response.ok
        ) {
          throw new Error(
            "Unable to load projects.",
          );
        }


        const payload =
          await response.json();


        if (!active) {
          return;
        }


        const normalized =
          normalizeProjects(
            payload,
          );


        setProjects(
          normalized,
        );


      } catch (
        error
      ) {
        if (!active) {
          return;
        }


        setProjects(
          [],
        );


        setProjectsError(
          error instanceof
            Error
            ? error.message
            : (
              "Unable to load projects."
            ),
        );


      } finally {
        if (active) {
          setLoadingProjects(
            false,
          );
        }
      }
    }


    void loadProjects();


    return () => {
      active =
        false;
    };

  }, []);


  // =========================================================
  // SELECTED PROJECT
  // =========================================================

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (
            project,
          ) =>
            project.id ===
            selectedProjectId,
        ),
      [
        projects,
        selectedProjectId,
      ],
    );


  const selectedLocation =
    selectedProject
      ? getProjectLocation(
          selectedProject,
        )
      : "";


  const invalidProject =
    Boolean(
      selectedProjectId,
    )
    &&
    !loadingProjects
    &&
    !selectedProject;


  // =========================================================
  // CHANGE PROJECT
  // =========================================================

  function changeProject(
    projectId: string,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      );


    // Remove legacy GIS parameter.
    next.delete(
      "project",
    );


    if (
      projectId
    ) {
      next.set(
        "projectId",
        projectId,
      );

    } else {
      next.delete(
        "projectId",
      );
    }


    setSearchParams(
      next,
    );
  }


  return (
    <main
      className="
        min-h-screen
        bg-[#f4f7f1]
        text-[#173f35]
      "
    >

      {/* ================================================= */}
      {/* NAV */}
      {/* ================================================= */}

      <header
        className="
          sticky
          top-0
          z-40
          border-b
          border-white/10
          bg-[#143f35]
          text-white
          shadow-sm
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[72px]
            max-w-[1500px]
            items-center
            justify-between
            px-5
            lg:px-8
          "
        >

          <div
            className="
              flex
              items-center
              gap-8
            "
          >

            <Link
              to="/dashboard"
              className="
                text-2xl
                font-bold
                tracking-[-0.04em]
              "
            >
              Liva.
            </Link>


            <nav
              className="
                hidden
                items-center
                gap-6
                text-sm
                font-medium
                md:flex
              "
            >

              <Link
                to="/dashboard"
                className="
                  text-white/70
                  transition
                  hover:text-white
                "
              >
                Overview
              </Link>


              <Link
                to="/projects"
                className="
                  text-white/70
                  transition
                  hover:text-white
                "
              >
                Projects
              </Link>


              <Link
                to={
                  selectedProjectId
                    ? `/intelligence?project=${encodeURIComponent(
                        selectedProjectId,
                      )}`
                    : "/intelligence"
                }
                className="
                  text-white/70
                  transition
                  hover:text-white
                "
              >
                Intelligence
              </Link>


              <span
                className="
                  border-b-2
                  border-[#d1b66f]
                  py-6
                "
              >
                Digital Twin
              </span>


              <Link
                to="/actions"
                className="
                  text-white/70
                  transition
                  hover:text-white
                "
              >
                Action Centre
              </Link>

            </nav>

          </div>


          <Link
            to="/dashboard"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-white/80
              transition
              hover:text-white
            "
          >
            <ArrowLeft
              size={15}
            />

            Dashboard
          </Link>

        </div>
      </header>


      <div
        className="
          mx-auto
          max-w-[1500px]
          px-5
          py-6
          lg:px-8
        "
      >

        {/* ================================================= */}
        {/* BREADCRUMB */}
        {/* ================================================= */}

        <p
          className="
            text-xs
            font-medium
            text-[#718078]
          "
        >
          Workspace

          <span
            className="
              mx-2
              text-[#b1bbb4]
            "
          >
            /
          </span>

          Digital Twin & Simulator
        </p>


        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <motion.section
          initial={{
            opacity:
              0,

            y:
              12,
          }}
          animate={{
            opacity:
              1,

            y:
              0,
          }}
          transition={{
            duration:
              0.4,
          }}
          className="
            relative
            mt-5
            overflow-hidden
            rounded-[30px]
            bg-[#173f35]
            px-6
            py-8
            text-white
            shadow-[0_20px_55px_rgba(23,63,53,0.16)]
            md:px-9
            md:py-10
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-32
              h-96
              w-96
              rounded-full
              border
              border-white/10
            "
          />


          <div
            className="
              pointer-events-none
              absolute
              right-16
              top-8
              h-60
              w-60
              rounded-full
              bg-[#d1b66f]/10
              blur-3xl
            "
          />


          <div
            className="
              relative
              grid
              gap-8
              lg:grid-cols-[1fr_430px]
              lg:items-end
            "
          >

            {/* LEFT */}

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-[#d8c58f]
                "
              >
                <Orbit
                  size={15}
                />

                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.22em]
                  "
                >
                  Model · Intervene · Compare
                </span>
              </div>


              <h1
                className="
                  mt-4
                  max-w-3xl
                  text-3xl
                  font-semibold
                  leading-tight
                  tracking-[-0.04em]
                  md:text-[42px]
                "
              >
                Test interventions
                <br />

                before taking action.
              </h1>


              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  leading-6
                  text-white/60
                "
              >
                Build a temporary scenario from the selected
                project's current LIVA records, modify
                operational assumptions and compare the
                resulting risk state.
              </p>


              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  gap-2
                "
              >

                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.06]
                    px-3
                    py-2
                    text-xs
                    text-white/65
                  "
                >
                  <ShieldCheck
                    size={13}
                    className="
                      text-[#d8c58f]
                    "
                  />

                  Live records unchanged
                </span>


                <span
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/10
                    bg-white/[0.06]
                    px-3
                    py-2
                    text-xs
                    text-white/65
                  "
                >
                  <FlaskConical
                    size={13}
                    className="
                      text-[#d8c58f]
                    "
                  />

                  What-if scenario
                </span>

              </div>

            </div>


            {/* =========================================== */}
            {/* PROJECT SELECTOR */}
            {/* =========================================== */}

            <div>

              <label
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.17em]
                  text-[#d8c58f]
                "
              >
                Simulation project
              </label>


              <div
                className="
                  relative
                  mt-2
                "
              >

                <select
                  value={
                    selectedProjectId
                  }
                  disabled={
                    loadingProjects
                    ||
                    Boolean(
                      projectsError,
                    )
                  }
                  onChange={(
                    event,
                  ) =>
                    changeProject(
                      event.target.value,
                    )
                  }
                  className="
                    w-full
                    appearance-none
                    rounded-2xl
                    border
                    border-white/15
                    bg-white/[0.08]
                    px-4
                    py-3.5
                    pr-10
                    text-sm
                    font-semibold
                    text-white
                    outline-none
                    backdrop-blur
                    transition
                    focus:border-[#d1b66f]/70
                  "
                >

                  <option
                    value=""
                    className="
                      text-[#173f35]
                    "
                  >
                    {
                      loadingProjects
                        ? (
                          "Loading projects..."
                        )
                        : projectsError
                          ? (
                            "Projects unavailable"
                          )
                          : (
                            "Select a project"
                          )
                    }
                  </option>


                  {
                    projects.map(
                      (
                        project,
                      ) => (
                        <option
                          key={
                            project.id
                          }
                          value={
                            project.id
                          }
                          className="
                            text-[#173f35]
                          "
                        >
                          {
                            project.name
                          }
                        </option>
                      ),
                    )
                  }

                </select>


                <ChevronDown
                  size={17}
                  className="
                    pointer-events-none
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    text-white/60
                  "
                />

              </div>


              {
                projectsError
                &&
                (
                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      gap-2
                      text-xs
                      text-[#f1c6ba]
                    "
                  >
                    <TriangleAlert
                      size={13}
                    />

                    {
                      projectsError
                    }
                  </div>
                )
              }


              {
                selectedProject
                &&
                (
                  <motion.div
                    initial={{
                      opacity:
                        0,

                      y:
                        5,
                    }}
                    animate={{
                      opacity:
                        1,

                      y:
                        0,
                    }}
                    className="
                      mt-3
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.05]
                      p-3
                    "
                  >

                    <div
                      className="
                        flex
                        items-start
                        gap-2
                      "
                    >
                      <Building2
                        size={14}
                        className="
                          mt-0.5
                          shrink-0
                          text-[#d8c58f]
                        "
                      />


                      <div
                        className="
                          min-w-0
                        "
                      >
                        <div
                          className="
                            truncate
                            text-xs
                            font-semibold
                            text-white
                          "
                        >
                          {
                            selectedProject.name
                          }
                        </div>


                        {
                          selectedProject.sector
                          &&
                          (
                            <div
                              className="
                                mt-1
                                text-[10px]
                                text-white/50
                              "
                            >
                              {
                                selectedProject.sector
                              }
                            </div>
                          )
                        }
                      </div>
                    </div>


                    {
                      selectedLocation
                      &&
                      (
                        <div
                          className="
                            mt-2
                            flex
                            items-center
                            gap-2
                            text-[10px]
                            text-white/50
                          "
                        >
                          <MapPin
                            size={12}
                          />

                          {
                            selectedLocation
                          }
                        </div>
                      )
                    }


                    {
                      !selectedLocation
                      &&
                      (
                        <div
                          className="
                            mt-2
                            text-[10px]
                            text-white/40
                          "
                        >
                          Geographic location not supplied in
                          the PAIMANA source export.
                        </div>
                      )
                    }


                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        gap-3
                        border-t
                        border-white/10
                        pt-3
                      "
                    >

                      <Link
                        to={`/projects/${encodeURIComponent(
                          selectedProject.id,
                        )}`}
                        className="
                          inline-flex
                          items-center
                          gap-1
                          text-[10px]
                          font-bold
                          text-white/70
                          transition
                          hover:text-white
                        "
                      >
                        Project

                        <ArrowRight
                          size={11}
                        />
                      </Link>


                      <Link
                        to={`/intelligence?project=${encodeURIComponent(
                          selectedProject.id,
                        )}`}
                        className="
                          inline-flex
                          items-center
                          gap-1
                          text-[10px]
                          font-bold
                          text-white/70
                          transition
                          hover:text-white
                        "
                      >
                        Intelligence

                        <ArrowRight
                          size={11}
                        />
                      </Link>


                      <Link
                        to="/dashboard#dashboard-map"
                        className="
                          inline-flex
                          items-center
                          gap-1
                          text-[10px]
                          font-bold
                          text-[#d8c58f]
                          transition
                          hover:text-[#ead8a5]
                        "
                      >
                        GIS

                        <ArrowRight
                          size={11}
                        />
                      </Link>

                    </div>

                  </motion.div>
                )
              }

            </div>

          </div>

        </motion.section>


        {/* ================================================= */}
        {/* INVALID PROJECT */}
        {/* ================================================= */}

        {
          invalidProject
          &&
          (
            <motion.section
              initial={{
                opacity:
                  0,

                y:
                  12,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              className="
                mt-6
                rounded-[28px]
                border
                border-[#eadfc8]
                bg-white
                px-6
                py-12
                text-center
                shadow-[0_12px_40px_rgba(23,63,53,0.05)]
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#fff7e8]
                  text-[#9a7227]
                "
              >
                <TriangleAlert
                  size={24}
                />
              </div>


              <h2
                className="
                  mt-4
                  text-xl
                  font-semibold
                  text-[#173f35]
                "
              >
                Project not found
              </h2>


              <p
                className="
                  mx-auto
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#748179]
                "
              >
                The linked project is no longer available.
                Select one of the current PAIMANA projects
                above.
              </p>

            </motion.section>
          )
        }


        {/* ================================================= */}
        {/* DIGITAL TWIN */}
        {/* ================================================= */}

        {
          selectedProject
          &&
          (
            <motion.section
              key={
                selectedProject.id
              }
              initial={{
                opacity:
                  0,

                y:
                  14,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              transition={{
                duration:
                  0.4,
              }}
              className="
                mt-6
              "
            >

              <DigitalTwinPanel
                projectId={
                  selectedProject.id
                }
              />

            </motion.section>
          )
        }


        {/* ================================================= */}
        {/* EMPTY */}
        {/* ================================================= */}

        {
          !selectedProjectId
          &&
          !loadingProjects
          &&
          (
            <motion.section
              initial={{
                opacity:
                  0,

                y:
                  12,
              }}
              animate={{
                opacity:
                  1,

                y:
                  0,
              }}
              className="
                mt-6
                rounded-[28px]
                border
                border-[#dce5da]
                bg-white
                px-6
                py-14
                text-center
                shadow-[0_12px_40px_rgba(23,63,53,0.05)]
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#edf3eb]
                  text-[#52705f]
                "
              >
                <Orbit
                  size={25}
                />
              </div>


              <p
                className="
                  mt-5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-[#947b49]
                "
              >
                Digital Twin workspace
              </p>


              <h2
                className="
                  mt-2
                  text-xl
                  font-semibold
                  text-[#173f35]
                "
              >
                Select a project to create a scenario
              </h2>


              <p
                className="
                  mx-auto
                  mt-2
                  max-w-xl
                  text-sm
                  leading-6
                  text-[#748179]
                "
              >
                Select one of the current sourced projects.
                LIVA will establish its operational baseline
                and allow temporary what-if interventions
                without changing the live project records.
              </p>

            </motion.section>
          )
        }

      </div>

    </main>
  );
}