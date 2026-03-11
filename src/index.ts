import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { appendRepos } from "./utils/files.js";
import { PROJECT_ANALYSIS_PROMPT, SKILL_EXTRACTOR_PROMPT, EFFORT_ESTIMATOR_PROMPT, RED_FLAG_DETECTOR_PROMPT, QUICK_SCAN_PROMPT } from "./utils/prompts.js";


const server = new McpServer({
    name: "project-manager",
    version: "1.0.0",
    description: "A project manager for managing projects and tasks.",
})

// TOOLS 

// CREATE PROJECT
server.registerTool(
    "create-project",
    {
        description: "Create a new project with a name and description.",
        inputSchema: z.object({
            name: z.string().min(1).describe("The name of the project."),
            description: z.string().min(1).describe("A brief description of the project."),
        }),
    },
    async ({ name, description }, _extra) => {
        try {
            console.error("PROJECT-MANAGER: Creating project:", { name, description });

            // TODO - Implement actual project creation logic here (e.g., save to database)

            const result = {
                status: "success",
                project: { name, description },
                message: `Project "${name}" created successfully`,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (err) {
            const error = {
                status: "error",
                error: String(err),
                message: "Failed to create project",
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(error, null, 2),
                    },
                ],
            };
        }
    }
);

// GET GITHUB REPOSOTORIES IN JSON
server.registerTool(
    "get-github-repositories-json",
    {
        description: "Get a list of GitHub repositories for a given user.",
        inputSchema: z.object({
            username: z
                .string()
                .min(1)
                .describe("The GitHub username to fetch repositories for."),
        }),
    },
    async ({ username }, _extra) => {
        try {
            console.error(
                "PROJECT-MANAGER: Fetching GitHub repositories for user:",
                username
            );

            const response = await fetch(
                `https://api.github.com/users/${username}/repos`,
                {
                    headers: {
                        "User-Agent": "MCP-Project-Manager",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const repos = await response.json();

            const repositories = repos.map((repo: any, i: number) => ({
                id: i + 1,
                name: repo.name,
                url: repo.html_url,
                description: repo.description,
            }));

            // SAVE REPOSITORIES TO FILE IN "C:\Users\Administrator\myprojects\project-manager\build\data\${username}-repos.json"
            try {
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const outputPath = path.join(
                    __dirname,
                    "../build/data",
                    `project-repos.json`
                );

                // append to file if exists, otherwise create new file
                await appendRepos(outputPath, repositories);

                console.error(
                    `PROJECT-MANAGER: Saved repositories to ${outputPath}`
                );
            } catch (error) {
                console.error(
                    "PROJECT-MANAGER: Failed to save repositories to file:",
                    error
                );

            }


            const result = {
                status: "success",
                message: `Fetched ${repositories.length} repositories for user "${username}"`,
                repositories,
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        } catch (err) {
            const error = {
                status: "error",
                error: String(err),
                message: "Failed to fetch GitHub repositories",
            };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(error, null, 2),
                    },
                ],
            };
        }
    }
);

// GET GITHUB REPOSOTORIES IN MARKDOWN
server.registerTool(
    "get-github-repositories-markdown",
    {
        description: "Get a list of GitHub repositories for a given user.",
        inputSchema: z.object({
            username: z.string().min(1).describe("The GitHub username."),
        }),
    },
    async ({ username }) => {
        try {
            const response = await fetch(
                `https://api.github.com/users/${username}/repos`,
                {
                    headers: { "User-Agent": "MCP-Project-Manager" },
                }
            );

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.statusText}`);
            }

            const repos = await response.json();

            const repositories = repos.map((repo: any, i: number) => ({
                id: i + 1,
                name: repo.name,
                url: repo.html_url,
                description: repo.description ?? "",
            }));

            const markdownTable = [
                "| # | Repository | Description | Link |",
                "|---|---|---|---|",
                ...repositories.map(
                    (r: { id: number; name: string; description: string; url: string }) =>
                        `| ${r.id} | ${r.name} | ${r.description.replace(/\|/g, "\\|")} | ${r.url} |`
                ),
            ].join("\n");

            const result = `### GitHub Repositories for **${username}**

${markdownTable}

Total: ${repositories.length} repositories
`;

            return {
                content: [
                    {
                        type: "text",
                        text: result,
                    },
                ],
            };
        } catch (err) {
            return {
                content: [
                    {
                        type: "text",
                        text: `❌ Failed to fetch repositories: ${String(err)}`,
                    },
                ],
            };
        }
    }
);

// MCP RESOURCE 
server.registerResource(
    "project-resource",
    "rules://all",
    {
        title: "Project Resource",
        description: "Example project resource",
        mimeType: "application/json",
    },
    async (uri, _extra: any) => {
        const uriString = uri.toString();
        console.error("PROJECT-MANAGER: Fetching resource for URI:", uriString);

        // Extra is the username passed in the input of the tool, we can use it to customize the resource fetching logic.


        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const dataPath = path.join(__dirname, "./data", `project-repos.json`);
        const rules = await fs.promises.readFile(dataPath, "utf-8");

        return {
            contents: [
                {
                    uri: uriString,
                    mimeType: "application/json",
                    text: rules,
                },
            ],
        };
    }
);

// MCP PROMPTS
server.registerPrompt(
    "system-requirements-specification-srs",
    {
        title: "SRS Generation",
        description: "Analyse & Generate a System Requirements Specification",
        argsSchema: {
            details: z.string().min(1).describe("The project or job description to analyze for SRS generation."),
            stack: z.string().optional().describe("The technology stack to consider for the project (e.g., React, Node.js, AWS, etc.)."),
            resume: z.string().optional().describe("A brief resume or summary of the developer's background."),
            analysisDepth: z.enum(["quick", "standard", "deep"]).optional().default("standard").describe("Depth of analysis:e.g. quick, standard, or deep."),
            focusArea: z.enum(["technical", "business", "risk", "effort", "fit", "all"]).optional().default("all").describe("E.g. technical, business, risk, effort, fit, or all."),
            industry: z.string().optional().describe("Industry or business vertical (e.g., FinTech, HealthTech, E-commerce, Blockchain, web3)."),
            projectType: z.enum(["greenfield", "legacy", "migration", "integration", "maintenance", "unknown"]).optional().default("unknown").describe("Nature of the project. E.g. greenfield (new project), legacy (existing codebase), migration (moving to new tech), integration (connecting systems), maintenance (ongoing support), or unknown."),
        }
    },
    async ({ details, stack, resume, analysisDepth = "standard", focusArea = "all", industry, projectType }) => {

        // Build enriched context block
        const contextBlock = [
            `PROJECT DETAILS:\n${details}`,
            stack ? `TECH STACK CONTEXT:\n${stack}` : null,
            resume ? `CANDIDATE RESUME / BACKGROUND:\n${resume}` : null,
            industry ? `INDUSTRY VERTICAL: ${industry}` : null,
            projectType !== "unknown" ? `PROJECT TYPE: ${projectType}` : null,
        ].filter(Boolean).join("\n\n---\n\n");

        // Select analysis prompts based on depth & focus
        const analysisPrompts: string[] = [];

        if (analysisDepth === "quick") {
            analysisPrompts.push(QUICK_SCAN_PROMPT);
        } else {
            // Standard and deep always include full project analysis
            if (focusArea === "all" || focusArea === "technical" || focusArea === "business" || focusArea === "fit") {
                analysisPrompts.push(PROJECT_ANALYSIS_PROMPT);
            }
            if (focusArea === "all" || focusArea === "technical" || focusArea === "fit") {
                analysisPrompts.push(SKILL_EXTRACTOR_PROMPT);
            }
            if (analysisDepth === "deep") {
                if (focusArea === "all" || focusArea === "effort") {
                    analysisPrompts.push(EFFORT_ESTIMATOR_PROMPT);
                }
                if (focusArea === "all" || focusArea === "risk") {
                    analysisPrompts.push(RED_FLAG_DETECTOR_PROMPT);
                }
            }
        }

        // Build combined instruction
        const combinedInstructions = analysisPrompts.join("\n\n========================================\n\n");

        // Final SRS generation instruction appended after analysis
        const srsInstruction = `
========================================
## FINAL OUTPUT: SYSTEM REQUIREMENTS SPECIFICATION (SRS)

Using all of the analysis above as your foundation, generate a structured SRS document with these sections:

1. **Introduction**
   - Project overview, purpose, scope, and definitions

2. **Overall Description**
   - Product perspective, key features, user classes, constraints

3. **Specific Requirements**
   - Functional requirements (organized by module/feature)
   - Non-functional requirements (performance, security, scalability, compliance)
   - External interface requirements (APIs, integrations, 3rd-party services)

4. **Tools & Technologies**
   - Recommended stack with justification
   - Infrastructure and deployment considerations

5. **Timeline & Budget**
   - Phase-by-phase breakdown with milestones
   - Effort estimates and resource requirements
   - Budget range recommendation

6. **Risk Register**
   - Top risks with likelihood, impact, and mitigation strategies

7. **Open Questions & Assumptions**
   - Unresolved ambiguities that need stakeholder input

Format using clear headings, bullet points, and tables where appropriate.
`;

        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `${combinedInstructions}\n\n${srsInstruction}\n\n========================================\nINPUT CONTEXT:\n\n${contextBlock}`,
                    }
                }
            ]
        };
    }
);

// FOLLOW-UP PROMPT FOR SRS REFINEMENT BASED ON STAKEHOLDER FEEDBACK
server.registerPrompt(
    "followup-srs",
    {
        title: "SRS-REFINEMENT",
        description: "Follow-up query on System Requirements Specification above",
        argsSchema: {
            feedback: z.string().min(1).describe("Stakeholder feedback, questions, or requests for clarification regarding the previously generated SRS."),
        }
    },
    async ({ feedback }) => {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `STAKEHOLDER FEEDBACK / QUESTION: Based on the feedback provided: ${feedback} Generate an application cover lettter. Please analyze the feedback in the context of the previously generated SRS and provide a refined version of the SRS that addresses the feedback. Highlight any changes made and explain how they address the stakeholder's concerns. If there are ambiguities in the feedback, identify them and suggest possible interpretations or follow-up questions to clarify the stakeholder's intent. Make it brief between 150 - 200 words. Use simple English in bullet/point format.`,
                    }
                }
            ]
        };
    }
);
// SERVER EXEXUTING
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("PROJECT-MANAGER: Server is running on stdio ...\n");
}

// MAIN
main().catch((error) => {
    console.error("PROJECT-MANAGER: An error occurred:", error);
    process.exit(1);
});