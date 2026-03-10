import fs from "fs/promises";

async function appendRepos(outputPath: string, repositories: any[]) {
    let data: any[] = [];

    try {
        const file = await fs.readFile(outputPath, "utf8");
        data = JSON.parse(file);
    } catch {
        data = [];
    }

    data.push(...repositories);
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");
}
export { appendRepos };