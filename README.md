# LIVA — Land Acquisition Intelligence & Verification Assistant

LIVA is a web-based Land Acquisition Delay Detection Platform designed to digitize and monitor the land acquisition workflow.

The platform connects landowners, project officers and administrators through a role-based workflow for land registration, document verification, grievance management, delay-risk intelligence, simulation and continuous monitoring.

---

## 1. Project Overview

LIVA provides a structured digital workflow from land registration to project monitoring.

The main workflow is:

1. Landowner / User Login
2. Search / View Own Land
3. Check whether the land is already registered
4. Registration Request if the land is not registered
5. Officer / Admin Verification
6. Approval and Project Creation
7. Project Access for the Landowner
8. Problem / Grievance Submission
9. Officer Verification of the Grievance
10. Verified Data sent to the Risk / Intelligence Engine
11. Data Extraction and Factor Identification
12. Risk Score and Threshold Calculation
13. Delay Risk and Probable Reasons
14. Risk Intelligence and Simulation
15. Action, Follow-up and Continuous Monitoring

---

## 2. Main Objective

The main objective of LIVA is to provide a centralized platform for monitoring land acquisition processes and identifying possible delays using verified project and grievance information.

The platform provides:

- Land registration workflow
- Document submission and verification
- Project creation and management
- Grievance submission
- Grievance verification
- Delay-risk intelligence
- Explainable risk information
- Digital Twin / simulation concept
- Action and follow-up tracking
- Continuous project monitoring

---

# 3. Role-Based System

LIVA provides different functionality according to the user's role.

## Landowner / User

The landowner can:

- Login to LIVA
- Search and view land information
- Check whether their land is registered
- Submit a registration request
- Upload required documents
- Track registration status
- Access approved projects
- View project information
- Submit problems or grievances
- Upload supporting evidence
- Track grievance verification
- View available project intelligence
- View project progress and monitoring information

---

## Project Officer

The project officer is responsible for verification and review.

The officer can:

- View registration requests
- Review landowner information
- Review land and project details
- Verify uploaded documents
- Add verification remarks
- Return requests for correction
- Verify grievance submissions
- Review supporting evidence
- Record findings
- Record probable causes
- Record recommended actions
- Record work status
- Record relevant delay information

---

## Administrator

The administrator handles administrative approval and project creation.

The administrator can:

- View officer-verified registration requests
- Review officer remarks
- Approve registration requests
- Reject requests
- Add administrative remarks
- Create projects after approval
- Monitor project workflow

---

# 4. Landowner Workflow

The landowner workflow starts after login.

## Step 1 — Login

The user logs into LIVA as a landowner / user.

After authentication, the user is directed to the appropriate dashboard.

---

## Step 2 — Search / View Own Land

The user can search for their land using available information such as:

- Survey number
- Location
- Village
- Project information

The system can also provide map-based viewing where supported.

---

## Step 3 — Check Land Registration

The system checks whether the land is already registered in LIVA.

### If the land is already registered

The user can:

- Open the existing project
- View project details
- View current status
- View tracking information
- Submit a problem or grievance

### If the land is not registered

The user is directed to the registration request form.

---

# 5. Land Registration Request

The landowner submits a registration request containing land and applicant information.

The request includes:

- Land details
- Location details
- Ownership information
- Supporting documents

Required document categories are:

1. Ownership Proof
2. 7/12 Extract / Land Record
3. Identity Proof

The frontend provides forms for entering the information and uploading documents.

---

# 6. Registration Verification

After the registration request is submitted, the request goes through verification.

The registration status can move through:

- SUBMITTED
- UNDER_VERIFICATION
- RETURNED
- OFFICER_VERIFIED
- APPROVED
- REJECTED

The officer verifies the submitted documents and land information.

The officer can add verification remarks.

---

# 7. Correction and Resubmission

If the submitted information or documents require correction, the request can be returned or rejected.

The user can then:

1. Open the request
2. Review the officer / administrator remarks
3. Correct the information
4. Replace or resubmit documents
5. Submit the request again

The request remains traceable through its existing request record and review history.

---

# 8. Administrative Approval

After successful officer verification, the request moves to administrative review.

The administrator reviews:

- Land details
- Applicant information
- Uploaded documents
- Officer verification
- Officer remarks

The administrator can either:

- Approve the request
- Reject the request

If approved, the system proceeds to project creation.

---

# 9. Project Creation

After approval, LIVA creates a project for the verified land acquisition request.

The project receives a unique LIVA Project ID.

Example:

`LIVA-PRJ-027`

The approved landowner then receives access to the project workspace.

---

# 10. Project Workspace

The project workspace is organized around a specific land acquisition project.

The main project sections are:

- Overview
- Delay Intelligence
- Summary
- Digital Twin
- Simulator
- Grievances

The project workspace is accessed using the project ID.

---

# 11. Problem / Grievance Submission

After receiving project access, the landowner can report a problem related to the land acquisition process.

The grievance form can contain:

- Problem type
- Subject
- Description
- Relevant land / project information
- Supporting documents
- Landowner remarks

Multiple grievances can be associated with the same project.

Each grievance is stored and tracked separately.

---

# 12. Grievance Verification

After submission, the project officer reviews the grievance.

The officer reviews:

- Problem details
- Supporting evidence
- Available project records
- Available land records

The officer can then record:

- Findings
- Probable cause
- Recommended action
- Work status
- Relevant delay information
- Verification remarks

The verified grievance information becomes available for the intelligence workflow.

---

# 13. Delay Intelligence Workflow

The intelligence workflow uses verified information available from the project and grievance records.

The process is:

1. Verified Data
2. Data Extraction
3. Factor Identification
4. Risk / Model Engine
5. Risk Score and Threshold
6. Delay Risk
7. Probable Reasons
8. Risk Intelligence
9. Simulation
10. Recommended Action
11. Monitoring

The purpose is to identify possible delay conditions and provide supporting reasons instead of only displaying a risk value.

---

# 14. Factors Used for Risk Intelligence

LIVA uses available and verified information.

## Land Factors

- Land area
- Location
- Available land details

## Problem / Grievance Factors

- Problem type
- Verified grievance
- Ownership / dispute information
- Work status
- Confirmed overdue information where available

## Document Factors

- Document availability
- Document verification status
- Ownership proof
- Land record
- Identity proof

## Project Factors

- Available project status
- Project stage
- Available project progress information
- Verified dependencies where supported

Unsupported information is not automatically treated as zero or negative.

---

# 15. Risk Calculation

The risk level is calculated by the model / risk engine.

The frontend can display:

- Risk score
- Risk level
- Probable delay reasons
- Supporting factors
- Relevant project information

The risk level can be represented as:

- High
- Medium
- Low

The risk category is calculated from available verified information and is not manually assigned by the landowner.

---

# 16. Explainable Risk Intelligence

LIVA is designed to provide reasons behind the predicted delay risk.

Instead of showing only a risk value, the system can show relevant factors such as:

- Ownership dispute
- Verified grievance
- Document-related issue
- Project-stage dependency
- Confirmed overdue work

The displayed explanation is based on the information available to the risk engine.

---

# 17. Digital Twin

LIVA includes a Digital Twin concept for representing the current project state and testing possible interventions.

The Digital Twin is intended to support what-if analysis.

It can be used to understand how a possible intervention may affect the project workflow.

The Digital Twin does not directly modify official project records.

---

# 18. Simulator

The simulator provides an interface for testing possible intervention scenarios.

The conceptual process is:

1. Select the current project state
2. Select an intervention
3. Run the simulation
4. Observe the simulated change
5. Compare possible outcomes
6. Support action planning

Simulation is intended for decision support and does not automatically change official project data.

---

# 19. Action and Monitoring

After risk assessment and simulation, the workflow moves towards action and monitoring.

The process is:

Risk Identified

↓

Reason Explained

↓

Possible Intervention Considered

↓

Recommended / Follow-up Action

↓

Project Monitoring

The system can be used to track progress and follow-up activities until the issue is resolved.

---

# 20. Tracking Workflow

LIVA provides a tracking timeline for the complete process.

The tracking stages are:

1. Submitted
2. Under Verification
3. Documents Verified
4. Approved
5. Project Created
6. Problem Submitted
7. Problem Verified
8. Risk Assessment
9. Action / Monitoring

This provides visibility into the current stage of the land acquisition workflow.

---

# 21. Frontend Pages

The frontend contains role-based pages and project workspaces.

## Landowner Pages

- Dashboard
- My Land / Projects
- My Requests
- Tracking
- Project Overview
- Project Summary
- Delay Intelligence
- Digital Twin
- Simulator
- Grievances

## Officer Pages

- Officer Dashboard
- Registration Request Verification
- Document Verification
- Grievance Verification
- Findings and Cause Form
- Recommended Action
- Project Monitoring

## Administrator Pages

- Administrative Review
- Registration Approval
- Registration Rejection
- Project Creation
- Project Monitoring

---

# 22. Frontend Architecture

The frontend follows a modular React + TypeScript structure.

Main folders include:

`src/auth/`

Contains authentication and role-related functionality.

`src/components/`

Contains reusable UI components, forms, navigation, workspaces and workflow components.

`src/pages/`

Contains major application screens such as:

- DashboardPage
- OfficerDashboard
- IntelligencePage
- LandownerProjectWorkspace
- SimulatorPage

`src/services/`

Contains frontend services used for communication with backend APIs.

`src/styles/`

Contains application-specific styling.

`App.tsx`

Contains the main application routing and page structure.

`index.css`

Contains the global styling configuration.

---

# 23. Frontend Technology Stack

The LIVA frontend uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- React Query
- React Hook Form
- Zod
- Lucide React
- Recharts
- MapLibre GL
- react-map-gl
- Motion / animation libraries
- REST API integration

---

# 24. Purpose of Technologies

## React

Used to build the component-based user interface.

## TypeScript

Provides type safety and structured frontend development.

## Vite

Used for frontend development and production builds.

## Tailwind CSS

Used for styling and responsive UI development.

## React Router

Used for application and project-level navigation.

## React Query

Used for API data fetching and server-state management.

## React Hook Form

Used for handling complex forms.

## Zod

Used for form validation and schema validation.

## Lucide React

Used for interface icons.

## Recharts

Used for charts and data visualization.

## MapLibre / react-map-gl

Used for map and GIS-related interfaces.

---

# 25. Backend Communication

The frontend communicates with the LIVA backend using REST APIs.

The frontend does not directly connect to MongoDB.

The main API areas include:

- Registration Requests
- Projects
- Grievances
- Risk Assessments
- Workflow Data
- Actions
- Reports
- Documents

Example API routes include:

`/api/liva/registration-requests`

`/api/liva/projects`

`/api/liva/grievances`

`/api/liva/risk-assessments`

---

# 26. API Configuration

The backend API URL is configured through the frontend environment variable:

`VITE_API_BASE_URL`

Example:

`VITE_API_BASE_URL=https://liva-backend-1.onrender.com`

The API URL can be changed depending on the development, preview or production environment.

---

# 27. Authentication and Role-Based Access

LIVA uses authentication and role-based access to provide different interfaces to different users.

The application identifies the user's role and provides the relevant workflow.

The main role categories are:

- Landowner / User
- Project Officer
- Administrator

This prevents users from being presented with workflows that belong to another role.

---

# 28. Data Handling Principles

LIVA is designed around verified and available information.

Important principles include:

- Submitted documents are treated as submitted evidence.
- Document uploads are not automatically treated as proof of a missing-document condition.
- A grievance type does not automatically imply an unrelated pending activity.
- Risk is calculated from supported and available factors.
- Unsupported metrics are not automatically represented as zero.
- Verified grievance information is separated from unverified submissions.
- Simulation does not directly modify official project records.

---

# 29. Local Development

Clone the frontend repository:

`git clone <FRONTEND_REPOSITORY_URL>`

Move into the project:

`cd LIVA-frontend`

Install dependencies:

`npm install`

Start the development server:

`npm run dev`

---

# 30. Production Build

To create a production build:

`npm run build`

The build performs TypeScript compilation and Vite production bundling.

The generated production files are placed inside:

`dist/`

---

# 31. Deployment

The LIVA frontend is deployed using Vercel.

The deployment architecture is:

GitHub Repository

↓

Vercel

↓

React + Vite Build

↓

LIVA Frontend

↓

LIVA FastAPI Backend

↓

MongoDB Database

The deployed frontend communicates with the backend using the configured `VITE_API_BASE_URL`.

---

# 32. End-to-End System Flow

The complete LIVA workflow can be summarized as:

Landowner Login

↓

Search / View Own Land

↓

Check Registration Status

↓

If Already Registered → Open Existing Project

OR

If Not Registered → Submit Registration Request

↓

Upload Ownership Proof, Land Record and Identity Proof

↓

Officer Verification

↓

Correction / Resubmission if Required

↓

Administrative Approval

↓

Project Creation

↓

Landowner Project Access

↓

Problem / Grievance Submission

↓

Officer Grievance Verification

↓

Verified Data

↓

Data Extraction

↓

Risk Factors

↓

Risk / Model Engine

↓

Risk Score and Threshold

↓

Delay Risk and Probable Reasons

↓

Risk Intelligence

↓

Digital Twin / Simulation

↓

Recommended Action / Follow-up

↓

Continuous Monitoring

---

# 33. Current LIVA Frontend Scope

The frontend currently provides the interface for the complete major workflow:

- Landowner authentication
- Land search
- Registration requests
- Document submission
- Document verification
- Correction and resubmission
- Administrative approval
- Project creation
- Project access
- Grievance submission
- Grievance verification
- Risk intelligence
- Project summary
- Digital Twin / Simulator interfaces
- Action and monitoring
- Workflow tracking

---

# 34. Project Identity

## LIVA

**Land Acquisition Intelligence & Verification Assistant**

### Platform

**Land Acquisition Delay Detection Platform**

### Core Workflow

**Predict → Explain → Locate → Simulate → Act → Monitor**

---

## Repository

LIVA Frontend Repository:

`LIVA-frontend`

The frontend is designed to work with the LIVA FastAPI backend and MongoDB data layer.
