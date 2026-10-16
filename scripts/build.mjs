const [manifestSource, outputPath = "index.html"] = process.argv.slice(2);
const templatePath = new URL("../index.template.html", import.meta.url);
const imageExtensions = /\.(avif|gif|jpe?g|png|svg|webp)$/i;
const videoExtensions = /\.mp4$/i;

function isSupportedUrl(url, extensions) {
  try {
    if (typeof url !== "string") return false;
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) && extensions.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isSupportedImageUrl(url) {
  return isSupportedUrl(url, imageExtensions);
}

function isSupportedVideoUrl(url) {
  return isSupportedUrl(url, videoExtensions);
}

function invalidItemReason(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return "entry must be an object";

  const type = Object.hasOwn(entry, "type") ? entry.type : "image";
  if (type !== "image" && type !== "video") return `unsupported type ${JSON.stringify(type)}`;
  if (type === "video" && !isSupportedVideoUrl(entry.url)) return "video URL must be an HTTP(S) MP4";
  if (type === "image" && !isSupportedImageUrl(entry.url)) return "unsupported HTTP(S) image URL";
  if (Object.hasOwn(entry, "caption") && typeof entry.caption !== "string") return "caption must be a string";

  if (type === "video") {
    if (Object.hasOwn(entry, "poster") && !isSupportedImageUrl(entry.poster)) {
      return "poster must be an HTTP(S) image URL";
    }
    return null;
  }

  if (Object.hasOwn(entry, "preview") && !isSupportedImageUrl(entry.preview)) {
    return "preview must be an HTTP(S) image URL";
  }
  const srcset = entry.srcset || [];
  if (!Array.isArray(srcset)) return "srcset must be an array";
  let previousWidth = 0;
  for (const candidate of srcset) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)
      || !isSupportedImageUrl(candidate.url)
      || !Number.isSafeInteger(candidate.width) || candidate.width <= previousWidth) {
      return "invalid srcset candidate";
    }
    previousWidth = candidate.width;
  }
  return null;
}

if (!manifestSource) {
  throw new Error("Build requires an HTTP(S) manifest URL");
}

let manifestUrl;
try {
  manifestUrl = new URL(manifestSource);
} catch {
  throw new Error("Build requires a valid HTTP(S) manifest URL");
}
if (!/^https?:$/.test(manifestUrl.protocol)) {
  throw new Error("Build requires an HTTP(S) manifest URL");
}

let manifest;
try {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  const loadedManifest = await response.json();
  manifest = Array.isArray(loadedManifest) ? { images: loadedManifest } : loadedManifest;
} catch (error) {
  throw new Error(`Could not read manifest ${manifestUrl.href}: ${error.message}`);
}

if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
  throw new Error("Manifest must be an object or an array");
}
if (Object.hasOwn(manifest, "title") && typeof manifest.title !== "string") {
  throw new Error("Manifest title must be a string");
}
if (Object.hasOwn(manifest, "items") && Object.hasOwn(manifest, "images")) {
  console.warn('Manifest contains both "items" and legacy "images"; ignoring "images".');
}
const entries = Object.hasOwn(manifest, "items") ? manifest.items : manifest.images;
if (!Array.isArray(entries)) {
  throw new Error('Manifest must contain an "items" or "images" array');
}
for (const [index, entry] of entries.entries()) {
  const reason = invalidItemReason(entry);
  if (reason) console.warn(`Skipping manifest item ${index + 1}: ${reason}`);
}

const template = await Bun.file(templatePath).text();
const placeholder = "__MANIFEST_URL__";
if (!template.includes(placeholder)) {
  throw new Error("Template is missing the manifest URL placeholder");
}

const html = template.replace(placeholder, JSON.stringify(manifestUrl.href));
await Bun.write(outputPath, html);
console.log(`Built ${outputPath}; it will load ${manifestUrl.href} at runtime`);
