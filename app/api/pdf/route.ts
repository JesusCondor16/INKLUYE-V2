import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const html: string = body.html ?? "";

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // ❌ NO lo tipamos manualmente → deja que puppeteer infiera `Buffer`
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    // Convertimos el Buffer a Uint8Array para la Web Response
    const uint8 = new Uint8Array(pdfBuffer);

    return new Response(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(uint8.byteLength),
        "Content-Disposition": "inline; filename=syllabus.pdf",
      },
    });
  } catch (error: any) {
    console.error("PDF ERROR:", error);
    return NextResponse.json(
      { error: "Error generando PDF", detail: error?.message },
      { status: 500 }
    );
  }
}
