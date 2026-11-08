#!/usr/bin/env node
/*
 * Makes the site icon files from src/assets/img/icon.svg, with headless Chrome
 * or Edge (the same browser the resume PDFs use):
 *   src/assets/img/icon-32.png           browser tab (older browsers)
 *   src/assets/img/icon-192.png          Android home screen
 *   src/assets/img/apple-touch-icon.png  iPhone home screen (charcoal square)
 *   src/favicon.ico                      the address browsers ask for on their own
 * Run it after changing icon.svg:  node scripts/make-icons.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.join(__dirname, "..");
const img = path.join(root, "src", "assets", "img");
const page = path.join(__dirname, "icons.html");

const browser = [
  process.env.CHROME_PATH,
  process.env.ProgramFiles && path.join(process.env.ProgramFiles, "Google", "Chrome", "Application", "chrome.exe"),
  process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "Microsoft", "Edge", "Application", "msedge.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find((p) => p && fs.existsSync(p));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH.");
  process.exit(1);
}

function shot(size, out, bg) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "icons-"));
  const url = `${pathToFileURL(page).href}?size=${size}${bg ? "&bg=1" : ""}`;
  try {
    execFileSync(browser, [
      "--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
      "--default-background-color=00000000", `--user-data-dir=${profile}`,
      `--window-size=${size},${size}`, `--screenshot=${out}`, url,
    ], { stdio: "ignore", timeout: 60000 });
  } finally {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch {}
  }
  console.log(`Wrote ${path.relative(root, out)}`);
}

shot(32, path.join(img, "icon-32.png"));
shot(192, path.join(img, "icon-192.png"));
shot(180, path.join(img, "apple-touch-icon.png"), true);

// favicon.ico: an .ico file can hold a PNG as is, so wrap the 32px one.
const png = fs.readFileSync(path.join(img, "icon-32.png"));
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); // reserved
head.writeUInt16LE(1, 2); // type: icon
head.writeUInt16LE(1, 4); // one image
head.writeUInt8(32, 6); // width
head.writeUInt8(32, 7); // height
head.writeUInt8(0, 8); // no palette
head.writeUInt8(0, 9); // reserved
head.writeUInt16LE(1, 10); // color planes
head.writeUInt16LE(32, 12); // bits per pixel
head.writeUInt32LE(png.length, 14); // image size
head.writeUInt32LE(22, 18); // image offset
fs.writeFileSync(path.join(root, "src", "favicon.ico"), Buffer.concat([head, png]));
console.log("Wrote src/favicon.ico");
