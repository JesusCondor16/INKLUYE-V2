import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { html?: string };
    const html: string = body.html ?? "";

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer: Buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    const uint8 = new Uint8Array(pdfBuffer);

    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(uint8.byteLength),
        "Content-Disposition": "inline; filename=syllabus.pdf",
      },
    });
  } catch (error: unknown) {
    console.error("PDF ERROR:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error generando PDF", detail },
      { status: 500 }
    );
  }
}
