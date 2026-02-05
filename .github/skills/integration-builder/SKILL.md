---
name: integration-builder
description: Guidelines for building integrations for MIMRAI
---

# Integration Builder Skill

## Base File Structure

packages/integration - This is main directory where all integration packages are stored.
packages/integration/src/{integration-name} - Each integration has its own directory named after the integration.
packages/integration/src/{integration-name}/index.ts - The main entry point for the integration.
packages/integration/src/{integration-name}/handle.ts - Contains a handler function that processes incoming data in form of messages (mostly webhooks or events)
packages/integration/src/{integration-name}/{functionality}.ts - Additional files that contain specific functionalities related to the integration. For example, authentication, fetching data, submitting data, etc.
packages/integration/src/registry.ts - A registry file that exports all available integrations for easy access and management. This file is used in the UI and other parts of the system to list and utilize the integrations.

## Integrations in MIMRAI DB

Integrations are driven by the following tables in the MIMRAI database:

- integrations: Stores the basic information about each integration instance, including its type, name, and team association. There is also a config field that holds the integration-specific configuration in JSON format.
- integrationUserLink: Manages the association between users and their linked integration accounts. This table is essential for integrations that require user-specific authentication or data access. There is also a config field that holds the user-link specific configuration in JSON format. And auth related fields such as accessToken, refreshToken, expiresAt, etc.

## Creating a New Integration

1. Create a new directory under `packages/integration/src/` named after your integration.
2. Create an `index.ts` file in the new directory. This file should export the main handler function and any other necessary functions.
3. Implement the `handle.ts` if the integration requires processing incoming messages.
4. Add any additional files needed for specific functionalities of the integration.
5. Ensure that your integration follows the coding standards and practices used in the existing integrations.

## Using the integration within MIMRAI

### Registering the Integration

To use the integration within MIMRAI, you need to register it in the `packages/integration/src/registry.ts` file. This allows the system to recognize and utilize your integration.

Every integration can have a `configSchema` that defines the configuration options available for that integration using Zod.

Integrations can have their own UI components for configuration and interaction:

- apps/dashboard/src/components/integrations/{integration-name} - UI components specific to the integration.
  Usually include unless the integration has no configuration or UI needs the following files:
- config.tsx - Component for rendering the configuration form.
- link.tsx - Component for rendering the login/linking interface.
- install.tsx - Component for rendering the installation interface.

We always use `useZodForm` to create forms based on the Zod schema defined in the integration package. And use shadcn UI components for consistent styling from packages/ui.

### Auth guide

If your integration requires user authentication, you will need to implement the necessary OAuth or token-based authentication flows. Store the authentication tokens and related information in the `integrationUserLink` table.

callbacks and token refresh logic that needs endpoints in the MIMRAI API server should be implemented in:

- apps/api/src/rest/routers/{integration-name}.ts

We use Hono as the web framework for the API server. Look at existing integrations for examples of how to implement authentication flows.

### Integrations as AI Agent tools

Integrations can also be used as tools for AI Agents within MIMRAI. To enable this functionality, ensure that your integration exposes the necessary methods. And implement the corresponding tool interface in:

- apps/api/src/ai/tools/{functionality}.ts

Then include the tool in the agent's toolset in `integrationToolRegistry` in:

- apps/api/src/ai/tools/tool-registry.ts
