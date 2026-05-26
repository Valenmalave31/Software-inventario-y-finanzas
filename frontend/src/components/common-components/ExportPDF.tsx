import { useState } from "react";
import { Button } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportPDFProps {
	fileName?: string;
	targetSelector?: string;
}

export default function ExportPDF({
	fileName = "interfaz",
	targetSelector = "#root",
}: ExportPDFProps) {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		const target = document.querySelector(targetSelector) as HTMLElement | null;
		if (!target || isExporting) return;

		try {
			setIsExporting(true);
			window.dispatchEvent(new Event("pdf-export-start"));

			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
			await new Promise((resolve) => setTimeout(resolve, 120));

			const canvas = await html2canvas(target, {
				scale: 2,
				useCORS: true,
				backgroundColor: "#ffffff",
			});

			const imageData = canvas.toDataURL("image/png");
			const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();
			const imageWidth = pageWidth;
			const imageHeight = (canvas.height * imageWidth) / canvas.width;

			let currentHeight = imageHeight;
			let yPosition = 0;

			pdf.addImage(imageData, "PNG", 0, yPosition, imageWidth, imageHeight);
			currentHeight -= pageHeight;

			while (currentHeight > 0) {
				yPosition = currentHeight - imageHeight;
				pdf.addPage();
				pdf.addImage(imageData, "PNG", 0, yPosition, imageWidth, imageHeight);
				currentHeight -= pageHeight;
			}

			pdf.save(`${fileName}.pdf`);
		} finally {
			window.dispatchEvent(new Event("pdf-export-end"));
			setIsExporting(false);
		}
	};

	return (
		<Button
			variant="contained"
			size="small"
			color="error"
			onClick={handleExport}
			startIcon={<PictureAsPdfIcon />}
			disabled={isExporting}
			sx={{ mr: 1.5, textTransform: "none", fontWeight: 600 }}
		>
			{isExporting ? "Exportando..." : "Exportar PDF"}
		</Button>
	);
}
