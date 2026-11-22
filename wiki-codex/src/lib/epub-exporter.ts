import JSZip from "jszip";

export interface EpubChapterInput {
  id: string;
  title: string;
  subtitle?: string;
  summary?: string;
  contentMarkdown: string;
}

function escapeXml(text: string): string {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function markdownToSimpleXhtml(md: string): string {
  const lines = (md || "").split(/\r?\n/);
  const parts: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("### ")) {
      parts.push(`<h3>${escapeXml(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      parts.push(`<h2>${escapeXml(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      parts.push(`<h1>${escapeXml(line.slice(2))}</h1>`);
    } else if (line.startsWith("- ")) {
      parts.push(`<p>• ${escapeXml(line.slice(2).replace(/\*\*/g, ""))}</p>`);
    } else if (line.startsWith("> ")) {
      parts.push(`<blockquote><p>${escapeXml(line.slice(2).replace(/\*\*/g, ""))}</p></blockquote>`);
    } else {
      parts.push(`<p>${escapeXml(line.replace(/\*\*/g, "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, t, a) => a || t))}</p>`);
    }
  }
  return parts.join("\n");
}

/**
 * #41 Builds a valid standards-compliant EPUB 2/3 archive (.epub Blob / Uint8Array)
 * readable on Kindle, Apple Books, Kobo, and Android/iOS e-book apps.
 */
export async function buildCodexEpubBuffer(options: {
  bookTitle: string;
  author: string;
  description?: string;
  chapters: EpubChapterInput[];
}): Promise<Uint8Array> {
  const zip = new JSZip();
  const bookId = `urn:uuid:aethel-codex-${Date.now()}`;

  // EPUB spec requires uncompressed mimetype as first entry
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  );

  zip.file(
    "OEBPS/style.css",
    `body { font-family: Georgia, serif; line-height: 1.65; color: #1a1a1a; padding: 1em; }
h1, h2, h3 { color: #1e293b; page-break-after: avoid; }
blockquote { border-left: 3px solid #9a6b20; margin-left: 0; padding-left: 1em; color: #475569; font-style: italic; }
.subtitle { color: #64748b; font-size: 0.9em; margin-bottom: 1em; }`,
  );

  const manifestItems: string[] = [
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
  ];
  const spineItems: string[] = [];
  const navPoints: string[] = [];

  options.chapters.forEach((ch, idx) => {
    const fileId = `ch${idx + 1}`;
    const href = `${fileId}.xhtml`;
    manifestItems.push(
      `<item id="${fileId}" href="${href}" media-type="application/xhtml+xml"/>`,
    );
    spineItems.push(`<itemref idref="${fileId}"/>`);
    navPoints.push(
      `<navPoint id="nav-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="${href}"/>
    </navPoint>`,
    );

    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="vi">
<head>
  <title>${escapeXml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>${escapeXml(ch.title)}</h1>
  ${ch.subtitle ? `<p class="subtitle">${escapeXml(ch.subtitle)}</p>` : ""}
  ${ch.summary ? `<blockquote><p>${escapeXml(ch.summary)}</p></blockquote>` : ""}
  ${markdownToSimpleXhtml(ch.contentMarkdown)}
</body>
</html>`;
    zip.file(`OEBPS/${href}`, xhtml);
  });

  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(options.bookTitle)}</text></docTitle>
  <navMap>
    ${navPoints.join("\n    ")}
  </navMap>
</ncx>`,
  );

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(options.bookTitle)}</dc:title>
    <dc:creator>${escapeXml(options.author)}</dc:creator>
    <dc:language>vi</dc:language>
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    ${options.description ? `<dc:description>${escapeXml(options.description)}</dc:description>` : ""}
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`,
  );

  return zip.generateAsync({ type: "uint8array" });
}
