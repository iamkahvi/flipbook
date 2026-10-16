const html = await Bun.file(new URL("../index.html", import.meta.url)).text();
const template = await Bun.file(new URL("../index.template.html", import.meta.url)).text();
const build = await Bun.file(new URL("./build.mjs", import.meta.url)).text();
const devServer = await Bun.file(new URL("./dev.mjs", import.meta.url)).text();
const packageConfig = JSON.parse(await Bun.file(new URL("../package.json", import.meta.url)).text());
const expectedHtml = template.replace(
  "__MANIFEST_URL__",
  JSON.stringify("https://cdn.kahvipatel.com/newsletter-assets/manifest.json")
);
if (html !== expectedHtml) throw new Error("index.html must be the built template with its configured manifest URL");

for (const marker of [
  "<style>",
  "<title>flipbook</title>",
  "object-fit: contain",
  "const defaultManifestUrl =",
  "Array.isArray(loadedManifest) ? { images: loadedManifest } : loadedManifest",
  "const defaultPageTitle = \"flipbook\"",
  "let manifestTitle = defaultPageTitle;",
  "function configuredManifestUrl()",
  "function isSupportedImageUrl(url)",
  "function isSupportedVideoUrl(url)",
  "let assets = []",
  'const entries = Object.hasOwn(manifest, "items") ? manifest.items : manifest.images',
  'const type = Object.hasOwn(entry, "type") ? entry.type : "image"',
  'video.preload = "metadata"',
  'video.playsInline = true',
  'videoNavigation.hidden = asset.type !== "video"',
  'retryVideo.addEventListener("click"',
  'viewer.dataset.mediaType = asset.type',
  'window.addEventListener("keydown", (event) => {',
  'video.pause();',
  'videoError.hidden = false;',
  'fetch(manifestUrl, { cache: "no-store" })',
  "function srcsetFor(asset)",
  "function applyPreviewSource(target, asset)",
  "preloadImage.decode()",
  "const preloadAhead = 2",
  "const preloadBehind = 1",
  'throw new Error("Set an HTTP(S) manifest URL")',
  'throw new Error("Manifest title must be a string")',
  'const entries = Object.hasOwn(manifest, "items") ? manifest.items : manifest.images',
  "document.title = manifestTitle;",
  'event.key.toLowerCase() === "h"',
  'event.key.toLowerCase() === "l"',
  'viewer.addEventListener("pointerdown"',
  "const edgeTapFraction = 1 / 3",
  "horizontalPosition < edgeTapFraction",
  "horizontalPosition > 1 - edgeTapFraction",
  ".caption[hidden]",
  "font-size: clamp(1rem, 2vw, 1.75rem)",
  "font-family: monospace",
  "captionText.textContent = text",
  'id="loading"',
  "Arc from loading.dev",
  "function setLoading(isLoading)",
  "setLoading(true);",
  "setLoading(false);",
  "pointer-events: none"
]) {
  if (!html.includes(marker)) throw new Error(`Missing ${marker} from index.html`);
}

if (!template.includes("__MANIFEST_URL__")) {
  throw new Error("index.template.html must include the manifest URL placeholder");
}
if (html.includes('src="app.js"') || html.includes('href="styles.css"')) {
  throw new Error("index.html must not depend on external application files");
}
for (const marker of ["caption-input", "captionMode", "localCaptions", "exportManifest"]) {
  if (html.includes(marker)) throw new Error(`Caption editing code must not include ${marker}`);
}

for (const [name, command] of Object.entries(packageConfig.scripts)) {
  if (!command.startsWith("bun ")) {
    throw new Error(`${name} must run with Bun, not another runtime`);
  }
}
for (const marker of ["const indexFile = Bun.file", "Bun.serve({", "pathname === \"/\""]) {
  if (!devServer.includes(marker)) throw new Error(`Missing ${marker} from scripts/dev.mjs`);
}

for (const marker of [
  "Build requires an HTTP(S) manifest URL",
  "Array.isArray(loadedManifest) ? { images: loadedManifest } : loadedManifest",
  'throw new Error("Manifest title must be a string")',
  'const entries = Object.hasOwn(manifest, "items") ? manifest.items : manifest.images',
  'Manifest contains both "items" and legacy "images"',
  "function invalidItemReason(entry)",
  'if (reason) console.warn(`Skipping manifest item ${index + 1}: ${reason}`)',
  "const response = await fetch(manifestUrl)",
  "function isSupportedUrl(url, extensions)",
  'poster must be an HTTP(S) image URL',
  "manifestUrl.href"
]) {
  if (!build.includes(marker)) throw new Error(`Missing ${marker} from scripts/build.mjs`);
}

const captionStyles = html.match(/\.caption \{(.*?)\n\}/s)?.[1];
const captionTextStyles = html.match(/\.caption-text \{(.*?)\n\}/s)?.[1];
if (!captionStyles || !captionTextStyles) {
  throw new Error("Could not find caption styles");
}
for (const marker of ["position: absolute", "bottom: 0", "left: 0", "width: fit-content"]) {
  if (!captionStyles.includes(marker)) {
    throw new Error(`Caption must be overlaid in the bottom-left corner: ${marker}`);
  }
}
if (captionStyles.includes("padding")) {
  throw new Error("The caption container must not add padding around the text");
}
for (const marker of ["display: inline", "background: #fff"]) {
  if (!captionTextStyles.includes(marker)) {
    throw new Error(`Caption text must supply its own white background: ${marker}`);
  }
}
console.log("Validated the standalone flipbook viewer and its remote-manifest build configuration.");
