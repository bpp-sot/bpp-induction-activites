import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const slugify = (name: string): string =>
  name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "") || "learner";

export const downloadCertificate = async (
  element: HTMLElement,
  learnerName: string,
): Promise<void> => {
  await document.fonts.ready;
  const exportElement = element.cloneNode(true) as HTMLElement;
  exportElement.classList.add("certificate-export");
  document.body.append(exportElement);
  try {
    const canvas = await html2canvas(exportElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FFFFFF",
      width: 1123,
      height: 794,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
    pdf.save(`BPP-Induction-Certificate-${slugify(learnerName)}.pdf`);
  } finally {
    exportElement.remove();
  }
};
