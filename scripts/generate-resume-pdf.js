/**
 * generate-resume-pdf.js
 *
 * Uses Puppeteer (headless Chrome) to render the resume page and save it as a PDF.
 * Expects the Jekyll-built site to be served at http://localhost:4000.
 *
 * The browser's built-in print media is used, so .no-print elements (nav, footer, etc.)
 * are automatically hidden — exactly matching what you see in browser Print Preview.
 */

const puppeteer = require("puppeteer");
const path = require("path");

const RESUME_URL = "http://localhost:4000/resume.html";
const OUTPUT_PATH = path.join(__dirname, "..", "assets", "Casey Scruggs - Resume.pdf");

(async () => {
  console.log("Launching headless Chrome…");
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  console.log(`Loading ${RESUME_URL}…`);
  await page.goto(RESUME_URL, {
    waitUntil: "networkidle0",
    timeout: 30_000,
  });

  // Wait for web fonts (Google Fonts, Font Awesome) to finish loading
  await page.evaluateHandle("document.fonts.ready");

  console.log(`Saving PDF to ${OUTPUT_PATH}…`);
  await page.pdf({
    path: OUTPUT_PATH,
    format: "Letter",
    printBackground: false,   // matches browser Print Preview defaults
    margin: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
    },
  });

  await browser.close();
  console.log("✅ Resume PDF generated successfully.");
})().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});
