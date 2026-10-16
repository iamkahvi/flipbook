# flipbook

flipbook displays an ordered collection of images and videos from a JSON manifest.

It is a static web application. It uses one HTML file and one JSON manifest file. flipbook loads the manifest when the page opens. You can change the manifest without building the HTML file again.

flipbook shows the complete image or video frame. It does not crop or resize media.

## Requirements

flipbook requires only [Bun](https://bun.sh/). Bun builds `index.html`, runs the checks, and provides the local development server.

## Set the media list

The manifest is a JSON document at an HTTP or HTTPS URL. This URL is the source of truth for flipbook.

Use an `items` array for an ordered mixture of images and videos. An object manifest can also contain a title; flipbook uses it for the browser page title and defaults to `flipbook`. Entries without `type` are treated as images for backward compatibility; use `"type": "video"` for video entries. The legacy `images` array and bare-array manifests remain supported. If both `items` and `images` are present, flipbook uses `items` and warns that it ignored `images`.

```json
{
  "title": "Media collection",
  "items": [
    {
      "url": "https://images.example.com/covers/image-001.jpg",
      "caption": "A photograph"
    },
    {
      "type": "video",
      "url": "https://videos.example.com/clip-001.mp4",
      "poster": "https://images.example.com/posters/clip-001.webp",
      "caption": "A short clip"
    }
  ]
}
```

Supported image types are AVIF, GIF, JPEG/JPG, PNG, SVG, and WebP. Images may provide a `preview` and a width-qualified `srcset` of responsive derivatives.

Videos must be direct MP4 files encoded with H.264 video and AAC audio. A `poster` image is optional. The viewer uses native browser controls, does not autoplay, and asks browsers to play inline. It pauses and resets a video when navigating away. Video items have persistent previous/next buttons; image items retain left/right edge-tap navigation. Invalid or unsupported entries are skipped with a console warning, and displayed numbering and URL hashes count only the remaining supported items.

### Responsive images and previews

`url` remains the required fallback image. Add `preview` and `srcset` to avoid downloading a large original before the viewer can show anything. `preview` should be a small image of the same content. `srcset` candidates must be the same image at strictly increasing pixel widths, preferably encoded as AVIF or WebP.

```json
{
  "url": "https://images.example.com/photos/beach-original.jpg",
  "preview": "https://images.example.com/photos/beach-preview.webp",
  "srcset": [
    { "url": "https://images.example.com/photos/beach-960.avif", "width": 960 },
    { "url": "https://images.example.com/photos/beach-1600.avif", "width": 1600 },
    { "url": "https://images.example.com/photos/beach-2560.avif", "width": 2560 }
  ],
  "caption": "Caption text"
}
```

The viewer selects an appropriate `srcset` candidate for the viewport and device pixel ratio. It displays `preview` while the selected full image is loading and decoding. Without these optional fields, it continues to load `url` exactly as before.

Generate and host the derivative files before publishing the manifest. flipbook does not resize a remote original in the browser or upload files to an image service.

For video hosting, serve MP4 files with `Content-Type: video/mp4` and support HTTP byte-range requests (`Accept-Ranges: bytes`) so the browser can seek and buffer efficiently. These are publisher/CDN requirements; flipbook does not probe for them. Cross-origin media playback does not require CORS. The H.264/AAC codec and hosting configuration are the publisher's responsibility.

In normal mode, flipbook reads captions from the manifest. It does not provide controls to change them.

## Build flipbook

`index.template.html` is the build template. Build flipbook with the manifest URL:

```sh
bun run build -- https://images.example.com/manifest.json
```

The build checks the manifest. It then writes a standalone `index.html`. The built file loads the same manifest URL at run time.

To set a different output file, run the build script directly:

```sh
bun scripts/build.mjs https://images.example.com/manifest.json dist/index.html
```

Deploy `index.html`. Keep the manifest available at its URL.

### Allow the browser to read the manifest

If `index.html` and the manifest use different origins (for example, `http://localhost:8000` and `https://cdn.example.com`), the manifest server must return a CORS header that permits the viewer to read the JSON:

```http
Access-Control-Allow-Origin: *
```

Use `*` only when the manifest is intentionally public. Alternatively, allow the specific origin where you host flipbook, such as `https://viewer.example.com`.

This permission is needed because flipbook's JavaScript reads the manifest JSON. Normal image display with `<img>` does not need CORS; browsers allow pages to display cross-origin images by default.

## Set the manifest source

flipbook selects its manifest URL in this order:

1. The `manifest` URL parameter.
2. The `flipbook:manifest-url` value in browser local storage.
3. The URL set when you build `index.html`.

For example, this URL loads another manifest:

```text
https://viewer.example/?manifest=https%3A%2F%2Fimages.example.com%2Fmanifest.json
```

To save a manifest URL in the current browser, run this command in the browser developer console. Then reload the page.

```js
localStorage.setItem("flipbook:manifest-url", "https://images.example.com/manifest.json")
```

## Run flipbook locally

Build flipbook with a manifest URL. Then start a local web server:

```sh
bun run dev
```

Open <http://localhost:8000> in a browser.

## Use flipbook

Use these controls in normal mode:

| Action | Control |
| --- | --- |
| Show the previous item | Left Arrow, `H`, or tap the left third of an image; use the previous button on videos |
| Show the next item | Right Arrow, `L`, or tap the right third of an image; use the next button on videos |
| Use the browser media menu | Press and hold the middle third of the current media |
| Show the first image | `Home` |
| Show the last image | `End` |
| Enter or leave full-screen mode | `F` |

The URL fragment identifies the current item. For example, `#3` opens the third supported item. You can bookmark or share this URL.

A caption appears in the bottom-left corner of the media. On videos it sits above the native controls. The caption text has a white background. Long captions wrap inside the viewport.

## Test flipbook

Run the checks:

```sh
bun run test
```
