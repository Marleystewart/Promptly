// ─────────────────────────────────────────────────────────────────────────
// Résumé file reader — turns an uploaded PDF / DOCX / TXT into plain text.
//
// EVERYTHING HERE RUNS IN THE BROWSER. The file is never uploaded, never sent
// to an API, never written to a server. That is the whole point: the privacy
// promise on the form ("your résumé never leaves this device") has to stay
// literally true, so parsing happens locally or not at all.
//
// PDF  → pdf.js, self-hosted in assets/vendor and imported ONLY when someone
//        actually uploads a PDF (it's ~1.7MB, so it must not touch page load).
//        Self-hosted rather than CDN so the app keeps making zero third-party
//        requests — /how-it-works publishes that claim.
// DOCX → a .docx is a zip; we read its central directory, inflate
//        word/document.xml with the browser's own DecompressionStream, and
//        strip the XML. No library needed.
// TXT  → read as-is.
// ─────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const MAX_BYTES = 10 * 1024 * 1024; // 10MB — a résumé is never bigger
  const MAX_CHARS = 8000;             // matches the cap applied to pasted text

  // ── helpers ─────────────────────────────────────────────────────────────

  function extensionOf(name) {
    const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
    return match ? match[1] : "";
  }

  // Collapse the ragged whitespace that PDF/DOCX extraction always produces,
  // without destroying the line structure that makes a résumé readable.
  function tidy(text) {
    return String(text || "")
      .replace(/\r\n?/g, "\n")
      .replace(/ /g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function decodeEntities(text) {
    return String(text)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&amp;/g, "&"); // last, so "&amp;lt;" doesn't double-decode
  }

  // ── PDF ─────────────────────────────────────────────────────────────────

  let pdfLibPromise = null;

  function loadPdfLib() {
    // Cached: a student re-uploading shouldn't re-download the library.
    if (!pdfLibPromise) {
      pdfLibPromise = import("./assets/vendor/pdf.min.mjs").then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = "./assets/vendor/pdf.worker.min.mjs";
        return lib;
      }).catch((error) => {
        pdfLibPromise = null; // let a later attempt retry rather than staying broken
        throw error;
      });
    }
    return pdfLibPromise;
  }

  async function readPdf(file) {
    const lib = await loadPdfLib();
    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await lib.getDocument({
      data,
      // Text extraction only — don't let a crafted PDF pull remote resources
      // or run anything. (pdf.js has no JS execution here regardless.)
      isEvalSupported: false,
      disableAutoFetch: true,
    }).promise;

    const pages = [];
    for (let n = 1; n <= doc.numPages; n += 1) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      let line = "";
      const lines = [];
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        line += item.str;
        // pdf.js marks the end of a visual line; without this every page
        // collapses into one unreadable run-on string.
        if (item.hasEOL) {
          lines.push(line);
          line = "";
        }
      }
      if (line) lines.push(line);
      pages.push(lines.join("\n"));
      page.cleanup();
    }
    doc.destroy();
    return pages.join("\n\n");
  }

  // ── DOCX ────────────────────────────────────────────────────────────────

  async function inflateRaw(bytes) {
    // deflate-raw is what zip stores; supported in all current browsers.
    if (typeof DecompressionStream !== "function") {
      throw new Error("unsupported-browser");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // Pull one named file out of a zip using the central directory (the reliable
  // path — local headers can omit sizes when a data descriptor is used).
  async function readZipEntry(buffer, wantedName) {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    // End of central directory: scan backwards for its signature.
    let eocd = -1;
    const scanStart = Math.max(0, bytes.length - 66560); // 64KB comment max + header
    for (let i = bytes.length - 22; i >= scanStart; i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("not-a-zip");

    const entryCount = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);

    for (let i = 0; i < entryCount; i += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));

      if (name === wantedName) {
        // Jump to the local header to find where the data actually starts —
        // its extra field length can differ from the central directory's.
        if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error("bad-zip-entry");
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        const data = bytes.subarray(dataStart, dataStart + compressedSize);
        if (method === 0) return data;          // stored
        if (method === 8) return inflateRaw(data); // deflate
        throw new Error("unsupported-compression");
      }
      offset += 46 + nameLength + extraLength + commentLength;
    }
    throw new Error("entry-not-found");
  }

  // Word's XML → text. Paragraph and break tags become newlines BEFORE tags are
  // stripped, otherwise the whole document flattens into one line.
  function docxXmlToText(xml) {
    return decodeEntities(
      String(xml)
        .replace(/<w:tab\b[^>]*\/?>/g, "\t")
        .replace(/<w:br\b[^>]*\/?>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
    );
  }

  async function readDocx(file) {
    const buffer = await file.arrayBuffer();
    const xml = await readZipEntry(buffer, "word/document.xml");
    return docxXmlToText(new TextDecoder().decode(xml));
  }

  // ── entry point ─────────────────────────────────────────────────────────

  // Returns { ok: true, text, truncated } or { ok: false, reason }.
  // `reason` is a student-facing sentence, not an error code.
  async function extractResumeText(file) {
    if (!file) return { ok: false, reason: "No file selected." };
    if (file.size > MAX_BYTES) {
      return { ok: false, reason: "That file is over 10MB. Try exporting a smaller PDF." };
    }
    if (file.size === 0) return { ok: false, reason: "That file looks empty." };

    const ext = extensionOf(file.name);
    let raw = "";

    try {
      if (ext === "pdf") {
        raw = await readPdf(file);
      } else if (ext === "docx") {
        raw = await readDocx(file);
      } else if (ext === "txt" || ext === "md" || ext === "rtf") {
        raw = await file.text();
        // RTF is mostly control words; strip the obvious ones so the text is usable.
        if (ext === "rtf") {
          raw = raw.replace(/\\par[d]?/g, "\n").replace(/\{\\\*?[^{}]*\}/g, "").replace(/\\[a-z]+-?\d* ?/gi, "");
        }
      } else if (ext === "doc") {
        return { ok: false, reason: "Old .doc files can’t be read here. Save it as PDF or .docx and try again." };
      } else if (ext === "pages") {
        return { ok: false, reason: "Pages files can’t be read here. In Pages: File → Export To → PDF, then upload that." };
      } else {
        return { ok: false, reason: "Upload a PDF, .docx, or .txt file." };
      }
    } catch (error) {
      if (error && error.message === "unsupported-browser") {
        return { ok: false, reason: "This browser can’t open .docx files. Upload a PDF instead." };
      }
      console.error("Promptly: résumé parse failed", error);
      return {
        ok: false,
        reason: ext === "pdf"
          ? "That PDF couldn’t be read. If it’s a scan or photo, paste the text instead."
          : "That file couldn’t be read. Try a PDF, or paste the text instead.",
      };
    }

    const text = tidy(raw);

    // A scanned/image-only PDF parses "successfully" but yields almost nothing.
    // Say so plainly instead of silently saving an empty résumé.
    if (text.replace(/\s/g, "").length < 40) {
      return {
        ok: false,
        reason: ext === "pdf"
          ? "No text found — that PDF is probably a scan or an image. Paste your résumé text instead."
          : "No readable text found in that file. Paste your résumé text instead.",
      };
    }

    return {
      ok: true,
      text: text.slice(0, MAX_CHARS),
      truncated: text.length > MAX_CHARS,
    };
  }

  // ── education details ───────────────────────────────────────────────────
  // A résumé already states the school, the major, and the graduation year, so
  // asking the student to retype them is busywork. These are only ever used to
  // fill fields the student left blank, and they can edit anything we get wrong.

  const DEGREE_LINE = /\b(?:bachelor(?:'s)?(?: of)?(?: arts| science| business administration| engineering| fine arts)?|master(?:'s)?(?: of)?(?: arts| science)?|b\.?a\.?|b\.?s\.?|b\.?b\.?a\.?|m\.?s\.?|associate(?:'s)?)\b[\s:,\-–—]*(?:in|of)?[\s:,\-–—]*([A-Za-z][A-Za-z&/' -]{2,44})/i;
  const MAJOR_LABEL = /\bmajors?\b[\s:,\-–—]+([A-Za-z][A-Za-z&/' -]{2,44})/i;
  const SCHOOL_LINE = /^[^\n]*\b(?:university|college|institute of technology|polytechnic)\b[^\n]*$/im;
  const MONTHS = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\b/gi;

  // Trim the trailing date/location noise that sits on the same line as a
  // degree ("Political Science May 2028" → "Political Science").
  function cleanMajor(value) {
    let major = String(value || "")
      .replace(MONTHS, " ")
      .replace(/\b(19|20)\d{2}\b/g, " ")
      .replace(/\b(?:expected|anticipated|graduation|grad|candidate|present)\b/gi, " ")
      .replace(/[|,;•]+.*$/, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\s\-–—:]+$/, "")
      .trim();
    // A real major is a couple of words, not a sentence fragment.
    if (major.split(/\s+/).length > 5) major = major.split(/\s+/).slice(0, 5).join(" ");
    return major.length >= 3 ? major : "";
  }

  function detectEducation(text) {
    const source = String(text || "");
    const result = { school: "", major: "", gradYear: "" };

    const majorMatch = source.match(MAJOR_LABEL) || source.match(DEGREE_LINE);
    if (majorMatch) result.major = cleanMajor(majorMatch[1]);

    const schoolMatch = source.match(SCHOOL_LINE);
    if (schoolMatch) {
      // Keep just the institution, dropping the city/state that trails it.
      const line = schoolMatch[0].replace(/\s{2,}/g, " ").trim();
      const name = line.match(/([A-Z][A-Za-z.&'-]*(?:\s+[A-Z][A-Za-z.&'-]*)*\s+(?:University|College|Institute of Technology|Polytechnic))/);
      result.school = (name ? name[1] : line).slice(0, 80).trim();
    }

    // Graduation year: the furthest-out year mentioned, which for a student
    // résumé is the expected graduation rather than a past job.
    const years = (source.match(/\b20\d{2}\b/g) || []).map(Number);
    if (years.length) {
      const latest = Math.max(...years);
      const thisYear = new Date().getFullYear();
      if (latest >= thisYear - 1 && latest <= thisYear + 8) result.gradYear = String(latest);
    }
    return result;
  }

  window.PromptlyResume = { extractResumeText, detectEducation, MAX_CHARS };
})();
