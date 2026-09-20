# LIVA — Land Intelligence for Viksit Administration

 Predictive Analytics System for Early Detection of Land Acquisition Delays

LIVA is an AI-powered decision-support platform designed to help government authorities identify land acquisition projects that may face delays **before those delays become critical**.

Instead of relying only on reactive progress reporting, LIVA combines predictive analytics, Explainable AI, GIS intelligence, workflow monitoring and intervention simulation to support earlier and better decisions.

---

## Live Prototype

**Frontend:**  
https://liva-frontend.vercel.app

**Backend API:**  
https://liva-backend-hgyx.onrender.com

**Backend Repository:**  
https://github.com/zubiyaAnsari1407/LIVA-backend

---

## Problem Statement

**SIH 2026 — PS 26017**

**Predictive Analytics System for Early Detection of Land Acquisition Delays**

Land acquisition delays may occur because of issues such as:

- administrative approvals
- compensation delays
- ownership conflicts
- litigation
- incomplete documentation
- rehabilitation and resettlement
- possession-related issues
- inter-departmental coordination

LIVA brings these signals into one decision-support workflow.

---

## What LIVA Does

### Predict
Identifies projects that may be at risk of delay using ML-based risk intelligence.

### Explain
Displays the major factors contributing to the predicted risk.

### Locate
Uses GIS-based project intelligence to visualize project locations and spatial information.

### Simulate
Provides a **Delay Digital Twin / What-If Simulator** to test possible interventions before taking action.

### Act
Supports officials through recommendations, workflow actions and project monitoring.

### Monitor
Tracks land acquisition progress across stages:

**Survey → Verification → Award → Compensation → Possession**

---

## Core Features

- AI/ML-based delay risk prediction
- Explainable AI risk insights
- Project-wise risk analysis
- GIS project intelligence
- Delay Digital Twin
- What-If Intervention Simulator
- Project Lens
- Parcel management
- Ownership & Survey workflow
- Compensation monitoring
- Rehabilitation & Resettlement tracking
- Litigation / Court case tracking
- Document upload, preview and download
- Action Centre
- Project reports
- Live project creation
- Cloud image upload
- Role-based prototype views
- Responsive interface for desktop and mobile

---

## LIVA Workflow

```text
Government / Project Data
          ↓
Data Validation & Processing
          ↓
AI / ML Risk Engine
          ↓
Risk Score + Risk Explanation
          ↓
GIS Intelligence
          ↓
Delay Digital Twin
          ↓
Recommended Intervention
          ↓
Action & Continuous Monitoring

Innovation
Delay Digital Twin

Creates a decision-support representation of the land acquisition lifecycle and allows officials to test intervention scenarios.

Explainable Risk Intelligence

LIVA does not only display a risk result. It also provides the factors contributing to the risk.

GIS + AI + Workflow Intelligence

Prediction, maps, project workflows, litigation, compensation and documents are accessible through a unified platform.

Predict → Explain → Simulate → Act

The system is designed around decision-making rather than only displaying analytics.

Technology Stack

Frontend

React
TypeScript
Vite
React Router
TanStack Query
Recharts
MapLibre GL
React Map GL
Lucide React
Motion

Backend

FastAPI
Python
MongoDB Atlas

AI / ML

Scikit-learn
SHAP
Pandas
NumPy

Cloud

Vercel
Render
MongoDB Atlas
Cloudinary
Live Cloud Architecture
User
 ↓
Vercel
React + TypeScript Frontend
 ↓
Render
FastAPI Backend
 ↓
MongoDB Atlas
Cloud Database

Images → Cloudinary

The deployed prototype can receive new project records from users and persist them in the cloud database without requiring the developer's local computer to remain running.

Data Approach

LIVA separates:

Official / source-backed records
from
Demo / illustrative records

Demo records are explicitly marked and are not presented as verified government data.

The ML research layer uses official/public-authority infrastructure project information where available.

Prototype Status

Live Working Prototype

The current implementation demonstrates the complete core workflow including project management, GIS intelligence, ML risk analysis, Explainable AI, intervention simulation, workflow monitoring and cloud persistence.

Some production-scale features such as automatic model retraining, external notification services, full audit logging and backend-secured enterprise authentication are planned as future extensions.

Designed For

Government and authorized infrastructure stakeholders such as:

Land Acquisition Officers · Project Officers · District Administration · Revenue Departments · Legal Teams · Compensation & R&R Teams · Senior Decision Makers

Team

Team Paradox

Smart India Hackathon 2026
