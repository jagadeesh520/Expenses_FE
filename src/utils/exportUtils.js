import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Extract table data from HTML table element, handling rowspan and colspan
 */
const extractTableData = (tableElement) => {
  const rows = [];
  const thead = tableElement.querySelector('thead');
  const tbody = tableElement.querySelector('tbody');
  const tfoot = tableElement.querySelector('tfoot');

  // Extract headers
  if (thead) {
    const headerRows = thead.querySelectorAll('tr');
    headerRows.forEach(tr => {
      const row = [];
      tr.querySelectorAll('th').forEach(th => {
        const text = th.textContent.trim();
        const colspan = parseInt(th.getAttribute('colspan') || '1');
        const rowspan = parseInt(th.getAttribute('rowspan') || '1');
        
        // Add the cell text
        row.push(text);
        
        // Add empty cells for colspan
        for (let i = 1; i < colspan; i++) {
          row.push('');
        }
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });
  }

  // Extract body rows
  if (tbody) {
    tbody.querySelectorAll('tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td, th').forEach(cell => {
        const text = cell.textContent.trim();
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        
        row.push(text);
        
        // Add empty cells for colspan
        for (let i = 1; i < colspan; i++) {
          row.push('');
        }
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });
  }

  // Extract footer rows
  if (tfoot) {
    tfoot.querySelectorAll('tr').forEach(tr => {
      const row = [];
      tr.querySelectorAll('td, th').forEach(cell => {
        const text = cell.textContent.trim();
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        
        row.push(text);
        
        // Add empty cells for colspan
        for (let i = 1; i < colspan; i++) {
          row.push('');
        }
      });
      if (row.length > 0) {
        rows.push(row);
      }
    });
  }

  return rows;
};

/**
 * Export table to Excel format
 */
export const exportTableToExcel = (tableElement, filename) => {
  try {
    const data = extractTableData(tableElement);
    
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const maxCols = Math.max(...data.map(row => row.length));
    const colWidths = [];
    for (let i = 0; i < maxCols; i++) {
      let maxWidth = 10;
      data.forEach(row => {
        if (row[i] && row[i].toString().length > maxWidth) {
          maxWidth = Math.min(row[i].toString().length, 50);
        }
      });
      colWidths.push({ wch: maxWidth });
    }
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(wb, finalFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export table to Excel. Please try again.');
  }
};

/**
 * Export table to PDF format
 */
export const exportTableToPDF = (tableElement, filename, title) => {
  try {
    const data = extractTableData(tableElement);
    
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add title if provided
    if (title) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(title, 14, 15);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
    }

    // Prepare table data
    const headers = data[0] || [];
    const body = data.slice(1);

    // Calculate table options
    const tableOptions = {
      head: [headers],
      body: body,
      startY: title ? 25 : 15,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { top: 15, right: 14, bottom: 15, left: 14 },
      tableWidth: 'wrap'
    };

    // Add table to PDF
    doc.autoTable(tableOptions);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalFilename = `${filename}_${timestamp}.pdf`;

    // Save PDF
    doc.save(finalFilename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Failed to export table to PDF. Please try again.');
  }
};

/**
 * Get table title from card header
 */
export const getTableTitle = (cardElement) => {
  const header = cardElement.querySelector('.card-header h5');
  return header ? header.textContent.trim() : 'Table';
};

