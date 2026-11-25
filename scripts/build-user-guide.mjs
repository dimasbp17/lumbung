// Prints docs/user-guide/user-guide.html to public/downloads/panduan-lumbung.pdf
// using a locally installed Chrome or Edge in headless mode.
//   pnpm guide:pdf
// Set BROWSER_PATH to use a specific browser executable.
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = resolve(import.meta.dirname, "..")
const input = resolve(root, "docs/user-guide/user-guide.html")
const output = resolve(root, "public/downloads/panduan-lumbung.pdf")

// Windows install folders (env vars may be missing when run from Git Bash).
const windowsRoots = [
  process.env["ProgramFiles(x86)"],
  process.env.ProgramFiles,
  process.env.LOCALAPPDATA,
  "C:/Program Files (x86)",
  "C:/Program Files",
].filter(Boolean)

const candidates = [
  process.env.BROWSER_PATH,
  ...windowsRoots.flatMap((dir) => [
    join(dir, "Microsoft", "Edge", "Application", "msedge.exe"),
    join(dir, "Google", "Chrome", "Application", "chrome.exe"),
  ]),
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
].filter(Boolean)

const browser = candidates.find((p) => existsSync(p))
if (!browser) {
  console.error("Chrome/Edge tidak ditemukan. Set BROWSER_PATH ke file executable browser.")
  process.exit(1)
}

mkdirSync(dirname(output), { recursive: true })
execFileSync(
  browser,
  [
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    // The guide loads the Inter font from node_modules via a file:// URL.
    "--allow-file-access-from-files",
    "--virtual-time-budget=5000",
    `--print-to-pdf=${output}`,
    pathToFileURL(input).href,
  ],
  { stdio: "inherit" }
)

console.log(`PDF dibuat: ${output} (${Math.round(statSync(output).size / 1024)} KB)`)
