import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Orbit,
  TriangleAlert,
} from "lucide-react";

import {
  useSearchParams,
} from "react-router";

import {
  motion,
} from "motion/react";

import DigitalTwinPanel from "../components/simulation/DigitalTwinPanel";
import ProjectContextBanner from "../components/project/ProjectContextBanner";


type ProjectOption = {
  id: string;
  name: string;

  state: string | null;
  district: string | null;

  sector: string | null;
  line_ministry: string | null;
  image: string | null;

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
            record.projectId ??
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
              record.projectName ??
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

          image:
            typeof record.image ===
              "string"
              ? record.image
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
  ,
  setProjectsError,
] = useState("");


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


        const [projectResponse, livaResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/projects`),
          fetch(`${API_BASE_URL}/api/liva/projects`),
        ]);

        const projectPayload = projectResponse.status === "fulfilled" && projectResponse.value.ok
          ? await projectResponse.value.json()
          : [];
        const livaPayload = livaResponse.status === "fulfilled" && livaResponse.value.ok
          ? await livaResponse.value.json()
          : [];
        if (projectResponse.status === "rejected" && livaResponse.status === "rejected") {
          throw new Error("Unable to load projects.");
        }


        if (!active) {
          return;
        }


        const normalized = [
          ...normalizeProjects(projectPayload),
          ...normalizeProjects(livaPayload).map((project) => ({
            ...project,
            isDemo: false,
          })),
        ].filter((project, index, all) => all.findIndex((candidate) => candidate.id === project.id) === index);


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

  // If no project is present in the URL, use the first loaded
  // project as the active project so the selector is always visible.
  const activeProjectId =
    selectedProjectId ||
    projects[0]?.id ||
    "";

  const selectedProject =
    useMemo(
      () =>
        projects.find(
          (
            project,
          ) =>
            project.id ===
            activeProjectId,
        ),
      [
        projects,
        activeProjectId,
      ],
    );


 


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
        {/* PROJECT CONTEXT */}
        {/* ================================================= */}

        {selectedProject && (
          <div className="mt-5">
            <ProjectContextBanner
              project={{
                id: selectedProject.id,
                name: selectedProject.name,
                district: selectedProject.district,
                state: selectedProject.state,
                sector: selectedProject.sector,
                lineMinistry: selectedProject.line_ministry,
                image: selectedProject.image,
              }}
              projects={projects.map((item) => ({
                id: item.id,
                name: item.name,
                district: item.district,
                state: item.state,
                sector: item.sector,
                lineMinistry: item.line_ministry,
                image: item.image,
              }))}
              onProjectChange={changeProject}
              label="ACTIVE PROJECT"
            />
          </div>
        )}

        {/* ================================================= */}
        {/* SIMULATOR INTRO */}
        {/* ================================================= */}

        

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
          !activeProjectId
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
                Select one of the current sourced projects
                from the project banner above. LIVA will
                establish its operational baseline and allow
                temporary what-if interventions without
                changing the live project records.
              </p>

            </motion.section>
          )
        }

      </div>

    </main>
  );
}
