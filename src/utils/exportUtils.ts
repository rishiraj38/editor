import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { asBlob } from 'html-docx-js-typescript'
import { saveAs } from 'file-saver'

export const exportToPdf = async () => {
  const element = document.querySelector('.page-A4') as HTMLElement
  if (!element) {
    alert('Export Error: Content element (.page-A4) not found!')
    return
  }

  try {
    const dataUrl = await toPng(element, { 
      quality: 1.0,
      pixelRatio: 2,
    })
    
    const PDF = (jsPDF as any).default ? (jsPDF as any).default : jsPDF

    const pdf = new PDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 297
    const pdfHeight = (element.offsetHeight * imgWidth) / element.offsetWidth
    
    let heightLeft = pdfHeight
    let position = 0

    pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, pdfHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, pdfHeight)
      heightLeft -= pageHeight
    }
    
    pdf.save('document.pdf')
  } catch (error) {
    console.error('Failed to export PDF:', error)
    alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export const exportToDocx = async (htmlContent: string) => {
  if (!htmlContent) return

  try {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Document</title>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `

    const blob = await asBlob(fullHtml)
    saveAs(blob as Blob, 'document.docx')
  } catch (error) {
    console.error('Failed to export DOCX:', error)
  }
}
