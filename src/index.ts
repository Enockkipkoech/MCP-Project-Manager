import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { appendRepos } from "./utils/files.js";


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