import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { json } from "node:stream/consumers";
import { z } from "zod";
import { id } from "zod/v4/locales";

const server = new McpServer({
    name: "project-manager",
    version: "1.0.0",
    description: "A project manager for managing projects and tasks.",
})

// TOOLS 
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

// GET GITHUB REPOSOTORIES
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