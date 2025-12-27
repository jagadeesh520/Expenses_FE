import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Extract table data from HTML table element, properly handling rowspan and colspan
 * Uses a grid-based approach to ensure proper alignment
 */
const extractTableData = (tableElement) => {
  const thead = tableElement.querySelector('thead');
  const tbody = tableElement.querySelector('tbody');
  const tfoot = tableElement.querySelector('tfoot');

  // Collect all rows in order
  const allRows = [];
  if (thead) {
    thead.querySelectorAll('tr').forEach(tr => allRows.push(tr));
  }
  if (tbody) {
    tbody.querySelectorAll('tr').forEach(tr => allRows.push(tr));
  }
  if (tfoot) {
    tfoot.querySelectorAll('tr').forEach(tr => allRows.push(tr));
  }

  if (allRows.length === 0) return [];

  // Calculate maximum columns by analyzing the table structure
  let maxCols = 0;
  allRows.forEach(tr => {
    let colCount = 0;
    tr.querySelectorAll('td, th').forEach(cell => {
      const colspan = parseInt(cell.getAttribute('colspan') || '1');
      colCount += colspan;
    });
    maxCols = Math.max(maxCols, colCount);
  });

  // Ensure we have at least some columns
  if (maxCols === 0) maxCols = 1;

  // Create a 2D grid to represent the table
  const grid = [];
  // Track which cells are occupied by rowspan from previous rows
  const rowspanCells = {}; // key: "row_col" -> value

  // Process each row
  for (let rowIndex = 0; rowIndex < allRows.length; rowIndex++) {
    const tr = allRows[rowIndex];
    const row = new Array(maxCols).fill(null);
    const occupied = new Array(maxCols).fill(false);

    // First, fill in cells that are occupied by rowspan from previous rows
    for (let col = 0; col < maxCols; col++) {
      const key = `${rowIndex}_${col}`;
      if (rowspanCells[key]) {
        row[col] = rowspanCells[key];
        occupied[col] = true;
      }
    }

    // Now process the actual cells in this row
    let cellIndex = 0;
    const cells = tr.querySelectorAll('td, th');
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      
      // Find the next available column
      let colIndex = 0;
      while (colIndex < maxCols && occupied[colIndex]) {
        colIndex++;
      }

      if (colIndex >= maxCols) break;

      const text = cell.textContent.trim();
      const colspan = parseInt(cell.getAttribute('colspan') || '1');
      const rowspan = parseInt(cell.getAttribute('rowspan') || '1');

      // Fill this cell and all columns it spans
      for (let c = 0; c < colspan && (colIndex + c) < maxCols; c++) {
        row[colIndex + c] = text;
        occupied[colIndex + c] = true;
      }

      // If this cell has rowspan, mark the cells in future rows
      if (rowspan > 1) {
        for (let r = 1; r < rowspan; r++) {
          const futureRowIndex = rowIndex + r;
          for (let c = 0; c < colspan && (colIndex + c) < maxCols; c++) {
            const futureKey = `${futureRowIndex}_${colIndex + c}`;
            rowspanCells[futureKey] = text;
          }
        }
      }
    }

    // Fill any remaining null cells with empty strings
    for (let c = 0; c < maxCols; c++) {
      if (row[c] === null) {
        row[c] = '';
      }
    }

    grid.push(row);
  }

  return grid;
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

    // Determine header rows from thead
    const thead = tableElement.querySelector('thead');
    let headerRowCount = 1;
    if (thead) {
        headerRowCount = thead.querySelectorAll('tr').length;
    }
    
    // For PDF, we'll use the last header row as the column headers
    // and include other header rows in the body with special styling
    const headerRows = data.slice(0, headerRowCount);
    const bodyRows = data.slice(headerRowCount);
    
    // Use the last header row as the main header
    const mainHeader = headerRows[headerRows.length - 1] || [];
    
    // Combine other header rows with body rows
    const allBodyRows = headerRows.length > 1 
      ? [...headerRows.slice(0, -1), ...bodyRows]
      : bodyRows;

    // Calculate table options
    const tableOptions = {
      head: [mainHeader],
      body: allBodyRows,
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
      // Style the first few rows (additional header rows) differently
      didParseCell: function (data) {
        if (headerRows.length > 1 && data.row.index < headerRows.length - 1) {
          data.cell.styles.fillColor = [200, 220, 240];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 7;
        }
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
