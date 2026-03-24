import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  if (!invoice || invoice.userId !== session.userId) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const date = invoice.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Generate PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const primary = [20, 112, 142]; // #14708E
  const dark = [30, 30, 30];
  const gray = [120, 120, 120];
  const lightGray = [200, 200, 200];

  // ─── HEADER ───────────────────────────────────────
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text("KODEX", 20, 30);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Crypto Trading Platform", 20, 36);

  // Invoice title (right aligned)
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("INVOICE", pageWidth - 20, 28, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text(invoice.invoiceNumber, pageWidth - 20, 35, { align: "right" });
  doc.text(date, pageWidth - 20, 41, { align: "right" });

  // ─── SEPARATOR ────────────────────────────────────
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.3);
  doc.line(20, 48, pageWidth - 20, 48);

  // ─── BILL TO ──────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("BILL TO", 20, 60);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(`${invoice.user.firstName} ${invoice.user.lastName}`, 20, 68);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text(invoice.user.email, 20, 74);

  // Status (right aligned)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("STATUS", pageWidth - 20, 60, { align: "right" });

  const statusText = invoice.status.toUpperCase();
  const statusColor: [number, number, number] = invoice.status === "paid" ? [16, 185, 129] : invoice.status === "refunded" ? [239, 68, 68] : [245, 158, 11];

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(statusText, pageWidth - 20, 68, { align: "right" });

  // ─── TABLE ────────────────────────────────────────
  const tableY = 90;

  // Header row
  doc.setFillColor(249, 250, 251);
  doc.rect(20, tableY, pageWidth - 40, 10, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("DESCRIPTION", 25, tableY + 7);
  doc.text("AMOUNT", pageWidth - 25, tableY + 7, { align: "right" });

  // Header bottom border
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.line(20, tableY + 10, pageWidth - 20, tableY + 10);

  // Data row
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text(invoice.plan, 25, tableY + 20);

  doc.setFont("helvetica", "bold");
  doc.text(`${invoice.amount.toFixed(2)} EUR`, pageWidth - 25, tableY + 20, { align: "right" });

  // Row bottom border
  doc.setDrawColor(243, 244, 246);
  doc.line(20, tableY + 25, pageWidth - 20, tableY + 25);

  // ─── TOTAL ────────────────────────────────────────
  doc.setDrawColor(dark[0], dark[1], dark[2]);
  doc.setLineWidth(0.8);
  doc.line(pageWidth - 90, tableY + 35, pageWidth - 20, tableY + 35);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(dark[0], dark[1], dark[2]);
  doc.text("TOTAL", pageWidth - 90, tableY + 44);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text(`${invoice.amount.toFixed(2)} EUR`, pageWidth - 20, tableY + 44, { align: "right" });

  // ─── FOOTER ───────────────────────────────────────
  const footerY = 230;

  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.3);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("Thank you for your subscription to Kodex.", pageWidth / 2, footerY + 10, { align: "center" });
  doc.text("This invoice was generated automatically.", pageWidth / 2, footerY + 16, { align: "center" });

  if (invoice.stripePaymentId) {
    doc.setFontSize(8);
    doc.text(`Payment ID: ${invoice.stripePaymentId}`, pageWidth / 2, footerY + 24, { align: "center" });
  }

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Kodex-Invoice-${invoice.invoiceNumber}.pdf"`,
      "Cache-Control": "no-cache",
    },
  });
}
