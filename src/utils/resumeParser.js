import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.entry"; // local worker

// Set the PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export async function parseResume(file) {
  if (!file) throw new Error("No file provided");

  // PDF parsing
  if (file.type === "application/pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }

    console.log("PDF Text Extracted:", text);

    const nameMatch = text.match(/Name:\s*(.*)/i);
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = text.match(/(\+?\d{10,15})/);

    return {
      name: nameMatch ? nameMatch[1].trim() : "",
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
    };

  // DOCX placeholder (optional)
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    console.log("DOCX file uploaded, returning empty fields (placeholder)");
    return { name: "", email: "", phone: "" };

  } else {
    throw new Error("Unsupported file type");
  }
}
