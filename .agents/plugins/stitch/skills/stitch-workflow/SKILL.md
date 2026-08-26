---
name: stitch-workflow
description: >-
  Automated design-to-code workflow utilizing Stitch AI and Antigravity.
  Use when the user requests generating, modernizing, or converting UI screens,
  components, and design tokens from Stitch AI into the clinic application.
---

# Stitch AI & Antigravity Workflow

This skill guides the agent on how to coordinate with Stitch AI to generate and implement modern, high-fidelity UI components.

## Workflow Execution Steps

1. **Design Formulation**:
   - Understand the component or screen requirements from the user.
   - Formulate prompt parameters for Stitch AI (specifying layout, theme tokens, color palettes, and data density).

2. **Retrieve Design Assets**:
   - Query the Stitch AI MCP tools or endpoint to fetch generated layout schemas, JSX/HTML structures, Tailwind tokens, and CSS properties.

3. **Code Synthesis & Integration**:
   - Refactor the Stitch output into modular, clean React components within `frontend/src/components/` or `frontend/src/pages/`.
   - Preserve application state management, role-based access checks, and API services (`patientService`, `visitService`, `vitalsService`, `prescriptionService`).
   - Match existing design system classes in `frontend/src/index.css`.

4. **Continuous Verification**:
   - Validate frontend compilation with `npm run build`.
   - Verify layout responsiveness and UI consistency.
