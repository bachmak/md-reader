# Book Translation & Upload Guide

This guide tells you how to translate a PDF book (chapter by chapter) and upload the result to the MD Reader service as a single book.

---

## Your task

You are given a folder containing one PDF file. Your job is to:
1. Extract each chapter from the PDF as a separate piece of content
2. Translate each chapter to English
3. Save each chapter as an HTML file in the same folder
4. Upload all chapters as one book to the MD Reader service via its API

---

## Step 1 — Extract and translate chapters

Split the PDF into logical chapters. Each chapter becomes one HTML file. Translate the full text of each chapter to English, preserving all structure: headings, paragraphs, lists, code blocks, figures, and captions.

---

## Step 2 — HTML output format (important)

Output files must be **HTML fragments** — body-level content only. Do not include `<html>`, `<head>`, `<body>`, or `<style>` tags. Do not add any CSS or inline styles. The reader app applies its own typography and theming; any embedded styles will be stripped on render.

Use only standard semantic HTML elements:

| Purpose | Element |
|---------|---------|
| Chapter title | `<h1>` |
| Section headings | `<h2>`, `<h3>`, `<h4>` |
| Paragraphs | `<p>` |
| Unordered lists | `<ul>` / `<li>` |
| Ordered lists | `<ol>` / `<li>` |
| Code blocks | `<pre><code>…</code></pre>` |
| Inline code | `<code>` |
| Callouts / notes / tips | `<blockquote>` |
| Figures | `<figure>` |
| Figure captions | `<figcaption>` |
| Emphasis | `<strong>`, `<em>` |
| Tables | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` |

Do **not** use class or style attributes. Do not include `<script>` tags.

Example of a correct chapter file:

```html
<h1>System Architecture</h1>

<p>Embedded systems depend heavily on their hardware. Before writing software,
it helps to sketch a few architecture diagrams.</p>

<h2>Context Diagram</h2>

<p>The context diagram shows how the system fits into the world.</p>

<blockquote>
  <p>Keep diagrams as rough sketches — messy enough that you won't feel bad
  redrawing them.</p>
</blockquote>

<h2>Block Diagram</h2>

<p>Start with the processor in the centre. Every external chip is a box
connected to the processor via its communication method.</p>

<pre><code>spi.open()
spi.ioctl_changeFrequency(THIRTY_MHz)
</code></pre>
```

---

## Step 3 — Name files for correct chapter order

Prefix each filename with a zero-padded number. The backend sorts uploaded files alphabetically by filename to determine chapter order.

```
01_introduction.html
02_system_architecture.html
03_hardware_drivers.html
04_interrupts.html
```

Use the original chapter title (transliterated to ASCII, spaces replaced with underscores) as the name portion. Do not include the chapter number in the name portion — only in the prefix.

---

## Step 4 — Upload via API

**Endpoint:** `POST https://<host>/api/books`  
**Auth:** `Authorization: Bearer <API_KEY>`  
**Content-Type:** `multipart/form-data`

Form fields:
- `title` — the book title in English (string, required)
- `files` — one field per chapter file (repeat for each file)

Accepted file extensions: `.html`, `.htm`, `.md`, `.markdown`, `.txt`

### curl example

```bash
curl -X POST https://<host>/api/books \
  -H "Authorization: Bearer $API_KEY" \
  -F "title=Making Embedded Systems" \
  -F "files=@01_introduction.html" \
  -F "files=@02_system_architecture.html" \
  -F "files=@03_hardware_drivers.html"
```

### Success response (HTTP 200)

```json
{
  "id": "a1b2c3d4-...",
  "title": "Making Embedded Systems",
  "chapters": [
    { "id": "...", "name": "01_introduction", "type": "html", "order": 0 },
    { "id": "...", "name": "02_system_architecture", "type": "html", "order": 1 }
  ]
}
```

If any file has an unsupported extension the whole request is rejected with HTTP 400.

---

## Step 5 — Verify the upload

```bash
curl https://<host>/api/books \
  -H "Authorization: Bearer $API_KEY"
```

The response is an array of books. Confirm your book appears with the correct `title` and the expected number of chapters in the `chapters` array.

---

## Environment variables you need

| Variable | Description |
|----------|-------------|
| `API_KEY` | Secret key for Bearer auth — ask the service owner |
| `HOST` | Base URL of the MD Reader service (e.g. `https://reader.example.com`) |
