import axios from "axios";
import { AppError } from "../middleware/errorHandler.js";
import { logger } from "../utils/logger.js";

// File extensions and patterns to ignore
const IGNORED_DIRS = [
  "node_modules",
  ".git",
  ".github",
  "dist",
  "build",
  ".next",
  ".output",
  ".tanstack",
  "coverage",
  "vendor",
  ".turbo",
  ".vscode",
  ".idea",
];

const IGNORED_EXTENSIONS = new Set([
  // Images & media
  "png", "jpg", "jpeg", "gif", "svg", "ico", "webp", "avif",
  "mp4", "webm", "mp3", "wav", "ogg",
  // Fonts
  "woff", "woff2", "ttf", "eot", "otf",
  // Binaries & archives
  "exe", "dll", "so", "dylib", "bin", "zip", "tar", "gz", "7z", "pdf",
  // Maps & minified
  "map", "min.js", "min.css",
  // Locks
  "lock", "lockb",
]);

const IGNORED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
  "cargo.lock",
  "poetry.lock",
  "gemfile.lock",
  "composer.lock",
]);

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "go", "rs", "java", "rb", "php",
  "c", "cpp", "h", "hpp", "cs", "swift", "kt", "scala", "json", "md",
  "yaml", "yml", "sql", "sh", "html", "css",
]);

const MAX_FILE_SIZE = 100 * 1024; // 100 KB
const MAX_TOTAL_CONTEXT_CHARS = 80000; // ~20k tokens safe limit

/**
 * Extracts owner and repo from a GitHub URL or short path
 */
export function parseGitHubUrl(url) {
  if (!url || typeof url !== "string") {
    throw new AppError("GitHub URL is required.", 400);
  }

  const cleaned = url.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
  const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (match) {
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "").replace(/\/$/, "");
    return { owner, repo };
  }

  // Handle owner/repo format directly
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return {
      owner: parts[0],
      repo: parts[1].replace(/\.git$/, "").replace(/\/$/, ""),
    };
  }

  throw new AppError("Invalid GitHub repository format. Expected: github.com/owner/repo", 400);
}

/**
 * Creates GitHub API axios instance with optional auth token
 */
function createGitHubClient() {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CodeQuiz-Backend",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }

  return axios.create({
    baseURL: "https://api.github.com",
    headers,
    timeout: 15000,
  });
}

/**
 * Scores file importance so key architecture files are prioritized
 */
function getFilePriority(path) {
  const lower = path.toLowerCase();
  if (lower === "readme.md") return 100;
  if (lower === "package.json" || lower === "go.mod" || lower === "cargo.toml") return 95;
  if (lower.includes("routes") || lower.includes("api/")) return 90;
  if (lower.includes("controller") || lower.includes("service")) return 85;
  if (lower.includes("store") || lower.includes("model") || lower.includes("schema")) return 80;
  if (lower.includes("middleware") || lower.includes("auth")) return 75;
  if (lower.startsWith("src/") || lower.startsWith("lib/")) return 70;
  return 50;
}

/**
 * Fetches repository structure and extracts key source files
 */
export async function fetchRepoContext(repoUrl) {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const client = createGitHubClient();

  logger.info(`Fetching GitHub repo: ${owner}/${repo}`);

  // 1. Get repository metadata to know default branch
  let defaultBranch = "main";
  try {
    const repoRes = await client.get(`/repos/${owner}/${repo}`);
    defaultBranch = repoRes.data.default_branch || "main";
  } catch (err) {
    if (err.response?.status === 404) {
      throw new AppError(`GitHub repository ${owner}/${repo} was not found or is private.`, 404);
    }
    if (err.response?.status === 403) {
      throw new AppError("GitHub API rate limit exceeded. Set GITHUB_TOKEN in server/.env to increase limit.", 429);
    }
    logger.warn(`Could not fetch repo metadata for ${owner}/${repo}, trying default branch 'main'`);
  }

  // 2. Fetch git tree recursively
  let treeItems = [];
  try {
    const treeRes = await client.get(`/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    treeItems = treeRes.data.tree || [];
  } catch (err) {
    // If 'main' failed, try 'master'
    if (defaultBranch === "main") {
      try {
        const fallbackRes = await client.get(`/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        defaultBranch = "master";
        treeItems = fallbackRes.data.tree || [];
      } catch (fbErr) {
        throw new AppError(`Failed to fetch file tree for ${owner}/${repo}: ${fbErr.message}`, 400);
      }
    } else {
      throw new AppError(`Failed to fetch file tree for ${owner}/${repo}: ${err.message}`, 400);
    }
  }

  // 3. Filter valid source files
  const filtered = treeItems.filter((item) => {
    if (item.type !== "blob") return false;
    const path = item.path;

    // Check directory exclusions
    const parts = path.split("/");
    if (parts.some((p) => IGNORED_DIRS.includes(p.toLowerCase()))) return false;

    // Check filename exclusions
    const filename = parts[parts.length - 1];
    if (IGNORED_FILENAMES.has(filename.toLowerCase())) return false;

    // Check extension or special files
    const lowerFilename = filename.toLowerCase();
    const isSpecialTextFile =
      lowerFilename === "readme" ||
      lowerFilename.startsWith("readme.") ||
      lowerFilename === "dockerfile" ||
      lowerFilename === "makefile";

    const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() : null;
    if (ext && IGNORED_EXTENSIONS.has(ext)) return false;
    if (!isSpecialTextFile && (!ext || !CODE_EXTENSIONS.has(ext))) return false;

    // Check file size (if provided in tree)
    if (item.size && item.size > MAX_FILE_SIZE) return false;

    return true;
  });

  if (filtered.length === 0) {
    throw new AppError(`No readable source code files found in repository ${owner}/${repo}.`, 400);
  }

  // 4. Sort by priority
  filtered.sort((a, b) => getFilePriority(b.path) - getFilePriority(a.path));

  // 5. Select top files up to safe context limit
  let combinedContext = `REPOSITORY: ${owner}/${repo}\nDEFAULT BRANCH: ${defaultBranch}\n\n`;
  const selectedFiles = [];

  for (const file of filtered) {
    if (combinedContext.length >= MAX_TOTAL_CONTEXT_CHARS) break;

    try {
      // Fetch raw content
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`;
      const rawRes = await axios.get(rawUrl, {
        timeout: 8000,
        transformResponse: [(data) => data], // Keep raw string
      });

      const content = typeof rawRes.data === "string" ? rawRes.data : JSON.stringify(rawRes.data);
      if (content.length > MAX_FILE_SIZE) continue;

      const fileSnippet = `\n--- FILE: ${file.path} ---\n${content.slice(0, 8000)}\n`;
      if (combinedContext.length + fileSnippet.length <= MAX_TOTAL_CONTEXT_CHARS) {
        combinedContext += fileSnippet;
        selectedFiles.push(file.path);
      }
    } catch (err) {
      logger.debug(`Could not fetch raw file ${file.path}: ${err.message}`);
    }
  }

  logger.info(`Successfully fetched ${selectedFiles.length} files for ${owner}/${repo}`);

  return {
    codebaseName: `${owner}/${repo}`,
    codeContext: combinedContext,
    filesUsed: selectedFiles,
  };
}
