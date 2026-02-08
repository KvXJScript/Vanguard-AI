// Simple GitHub API client for public repositories
// Uses native fetch (Node 18+)

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface FileContent {
  path: string;
  content: string;
}

const GITHUB_API_BASE = "https://api.github.com";

export async function fetchRepoTree(owner: string, repo: string, branch = "main"): Promise<GitHubTreeItem[]> {
  // 1. Get the branch SHA to ensure we get the latest tree
  const branchRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`, {
    headers: { "User-Agent": "Vanguard-AI-Code-Intelligence" }
  });
  
  if (!branchRes.ok) {
     if (branch === "main") return fetchRepoTree(owner, repo, "master");
     throw new Error(`Failed to fetch branch ${branch}: ${branchRes.statusText}`);
  }
  
  const branchData = await branchRes.json();
  const treeSha = branchData.commit.commit.tree.sha;

  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
    headers: { "User-Agent": "Vanguard-AI-Code-Intelligence" }
  });

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch tree: ${treeRes.statusText}`);
  }

  const treeData = await treeRes.json();
  
  // Filter for relevant code files (exclude node_modules, dist, etc.)
  // This is a naive filter, but works for MVP
  const validExtensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".c", ".cpp"];
  const ignorePatterns = ["node_modules/", "dist/", "build/", ".git/", "package-lock.json", "yarn.lock"];

  return treeData.tree.filter((item: GitHubTreeItem) => {
    if (item.type !== "blob") return false;
    if (ignorePatterns.some(p => item.path.includes(p))) return false;
    return validExtensions.some(ext => item.path.endsWith(ext));
  });
}

export async function fetchFileContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Vanguard-AI-Code-Intelligence" }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch file content: ${res.statusText}`);
  }

  const data = await res.json();
  // GitHub API returns content in Base64
  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return data.content; // Should unlikely happen for blobs via this endpoint but possible
}
