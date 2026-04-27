import ExcelJS from 'exceljs';
import { marathiLocations } from '../data/marathiLocationMapping';

// 1. Prepare Data with ExcelJS for styling
export const exportToExcel = async (members, filename = 'members_list.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Register');

    // Define Columns
    worksheet.columns = [
        { header: 'अ.क्र.', key: 'sr', width: 8 },
        { header: 'अनु.दिनांक', key: 'date', width: 15 },
        { header: 'सभासदाचे नाव', key: 'name', width: 35 },
        { header: 'गाव', key: 'village', width: 20 },
        { header: 'पोस्ट', key: 'post', width: 20 },
        { header: 'तालुका', key: 'taluka', width: 20 },
        { header: 'जिल्हा', key: 'district', width: 20 },
        { header: 'राज्य', key: 'state', width: 10 },
        { header: 'मोबाईल नंबर', key: 'mobile', width: 15 },
        { header: 'पत्ता', key: 'address', width: 30 }
    ];

    // 3. Add Custom Styled Headers
    // Trust Name
    worksheet.insertRow(1, ["", "", "आत्मप्रवर्तक संस्था भुगांव"]);
    worksheet.mergeCells('C1:J1');
    const trustRow = worksheet.getRow(1);
    trustRow.getCell(3).font = { size: 18, bold: true, color: { argb: 'FF000000' } };
    trustRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    trustRow.height = 30;

    // Register Title
    worksheet.insertRow(2, ["", "", "प्राथमिक सदस्य नोंद ( उपदेशी यादी ) रजिस्टर"]);
    worksheet.mergeCells('C2:J2');
    const titleRow = worksheet.getRow(2);
    titleRow.getCell(3).font = { size: 14, bold: true };
    titleRow.getCell(3).alignment = { horizontal: 'center' };
    titleRow.height = 20;

    // Date
    const today = new Date().toLocaleDateString('en-GB');
    worksheet.insertRow(3, ["", "", `दिनांक ${today} पर्यंतची यादी`]);
    worksheet.mergeCells('C3:J3');
    const dateRow = worksheet.getRow(3);
    dateRow.getCell(3).font = { size: 11, italic: true };
    dateRow.getCell(3).alignment = { horizontal: 'center' };

    worksheet.insertRow(4, []); // Empty spacing row

    // Re-apply column headers to row 5 (ExcelJS columns move down when rows are inserted)
    const headerRow = worksheet.getRow(5);
    headerRow.values = worksheet.columns.map(c => c.header);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // 4. Add Data
    members.forEach((m, index) => {
        const row = worksheet.addRow({
            sr: index + 1,
            date: m.joining_date || '-',
            name: m.full_name_marathi || m.full_name,
            village: m.city_marathi || m.city,
            post: m.post_office_marathi || m.post_office || '-',
            taluka: m.taluka_marathi || m.taluka,
            district: m.district_marathi || m.district,
            state: m.state_marathi || (m.state === 'Maharashtra' ? 'महा.' : m.state),
            mobile: m.mobile || '-',
            address: m.address_line1_marathi || m.address_line1 || '-'
        });

        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // 6. Save File using Browser Blob
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

// Simplified functional approach for PDF with better formatting
// Note: Real Marathi support in jsPDF requires a custom font file (CDAC-GIST or similar) to be loaded.
// Since we cannot easily add a 500KB+ font string here, we will try to default to a cleaner layout 
// and warn if characters don't render. 
// However, the user specifically asked for "best format".
// We will try to add a small subset or rely on the browser's ability if possible, but jsPDF is strict.
// STRATEGY: We will add a fallback English column if Marathi fails, but we will TRY to render Marathi.
// IMPORTANT: Without a font file, Marathi WILL show as garbage characters in standard jsPDF.
// I will attempt to inject a standard open-source Marathi-compatible font (NotoSans) if I can, 
// but for this constraints, I will ensure the LAYOUT is perfect (Headline, Columns).

export const exportToPDF = (members, filename = 'members_list.pdf') => {
    // Strategy: Create a hidden printable document to leverage browser's native Marathi rendering.
    // This is the "Best Format" approach as it preserves fonts, colors, and layout perfectly.

    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString();

    const htmlContent = `
        <html>
            <head>
                <title>Member List - ${dateStr}</title>
                <style>
                    body { font-family: 'Inter', sans-serif, 'Arial Unicode MS'; padding: 40px; color: #333; }
                    .header { border-bottom: 2px solid #FF9933; margin-bottom: 30px; padding-bottom: 10px; }
                    .trust-name { color: #FF9933; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                    .subtitle { color: #666; font-size: 16px; margin-bottom: 20px; }
                    .meta { color: #999; font-size: 12px; text-align: right; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #FF9933; color: white; text-align: left; padding: 12px; font-size: 14px; }
                    td { border-bottom: 1px solid #eee; padding: 12px; font-size: 13px; }
                    tr:nth-child(even) { background-color: #fafafa; }
                    @media print {
                        .no-print { display: none; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="trust-name">आत्मप्रवर्तक संस्था भुगांव</div>
                    <div class="subtitle">सदस्य यादी (Trust Member Management Portal - Member List)</div>
                    <div class="meta">Generated on: ${dateStr} | Total Members: ${members.length}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>पूर्ण नाव (Full Name)</th>
                            <th>पत्ता (Address)</th>
                            <th>गाव / शहर (City)</th>
                            <th>तालुका (Taluka)</th>
                            <th>जिल्हा (District)</th>
                            <th>मोबाईल (Mobile)</th>
                            <th>नोंदणी तारीख (Date)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(m => {
        const line1 = m.address_line1_marathi || m.address_line1 || '';
        const line2 = m.address_line2_marathi || m.address_line2 || '';
        const fullAddress = line2 ? `${line1}, ${line2}` : line1;

        return `
                            <tr>
                                <td>${m.full_name_marathi || m.full_name}</td>
                                <td>${fullAddress}</td>
                                <td>${m.city_marathi || m.city}</td>
                                <td>${m.taluka_marathi || m.taluka}</td>
                                <td>${m.district_marathi || m.district}</td>
                                <td>${m.mobile || '-'}</td>
                                <td>${m.joining_date || '-'}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 40px; text-align: center; color: #999; font-size: 10px;">
                    This is a computer generated report from Shri Sant Videhi Motiram Baba Atmapravartak Mandal Portal.
                </div>
                <script>
                    window.onload = () => {
                        window.print();
                        // Optional: window.close();
                    };
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
};

export const exportCollectorsToExcel = async (collectors, filename = 'collectors_list.xlsx') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Collectors');

    // Define Columns
    worksheet.columns = [
        { header: 'अ.क्र. (Sr No)', key: 'sr', width: 8 },
        { header: 'संकलक नाव (Collector Name)', key: 'name', width: 30 },
        { header: 'मोबाईल (Mobile)', key: 'mobile', width: 15 },
        { header: 'कार्यक्षेत्र - जिल्हा (District)', key: 'district', width: 25 }, // Combined or Primary
        { header: 'कार्यक्षेत्र - तालुका (Taluka)', key: 'taluka', width: 25 },   // Combined or Primary
        { header: 'नियुक्त गावे (Assigned Villages)', key: 'villages', width: 60 },
    ];

    // Add Title Row
    worksheet.insertRow(1, ["", "संकलक यादी (Collectors List)"]);
    worksheet.mergeCells('B1:F1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(2).font = { size: 16, bold: true };
    titleRow.getCell(2).alignment = { horizontal: 'center' };

    // Add Date
    const today = new Date().toLocaleDateString('en-GB');
    worksheet.insertRow(2, ["", `दिनांक: ${today}`]);
    worksheet.mergeCells('B2:F2');
    const dateRow = worksheet.getRow(2);
    dateRow.getCell(2).alignment = { horizontal: 'center' };

    worksheet.insertRow(3, []);

    // Style Header Row (now at row 4)
    const headerRow = worksheet.getRow(4);
    headerRow.values = worksheet.columns.map(c => c.header);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9933' } // Orange matching theme
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Helper to translate
    const toMarathi = (text) => {
        if (!text) return '-';
        return marathiLocations[text] || text;
    };

    // Add Data
    collectors.forEach((c, index) => {
        // Parse assigned_villages to determine structure
        let locations = [];
        let primaryDistrict = '-';
        let primaryTaluka = '-';
        let villageDetails = '';

        if (Array.isArray(c.assigned_villages) && c.assigned_villages.length > 0) {
            // Check if it's the New Format (Array of Objects)
            if (typeof c.assigned_villages[0] === 'object') {
                locations = c.assigned_villages;

                // Format for Excel Cell
                // We will list each location block
                villageDetails = locations.map(loc => {
                    const dist = toMarathi(loc.district);
                    const tal = toMarathi(loc.taluka);
                    const vills = loc.villages.map(v => toMarathi(v)).join(', ');
                    return `[${dist} - ${tal}]: ${vills}`;
                }).join('\n\n'); // Double newline for separation

                // For the dedicated District/Taluka columns, we can either:
                // 1. Show "Multiple"
                // 2. Show the first one
                // 3. List all

                // Let's list unique districts/talukas
                const uniqueDistricts = [...new Set(locations.map(l => toMarathi(l.district)))].join(', ');
                const uniqueTalukas = [...new Set(locations.map(l => toMarathi(l.taluka)))].join(', ');

                primaryDistrict = uniqueDistricts;
                primaryTaluka = uniqueTalukas;

            } else {
                // Old Format (String Array) - Use root district/taluka
                primaryDistrict = toMarathi(c.district);
                primaryTaluka = toMarathi(c.taluka);

                // Translate all villages
                const mappedVillages = c.assigned_villages.map(v => toMarathi(v)).join(', ');
                villageDetails = mappedVillages;
            }
        } else if (typeof c.assigned_villages === 'string') {
            // CSV string fallback
            primaryDistrict = toMarathi(c.district);
            primaryTaluka = toMarathi(c.taluka);
            villageDetails = c.assigned_villages.split(',').map(v => v.trim()).map(v => toMarathi(v)).join(', ');
        }

        const row = worksheet.addRow({
            sr: index + 1,
            name: c.name,
            mobile: c.mobile || '-',
            district: primaryDistrict,
            taluka: primaryTaluka,
            villages: villageDetails
        });

        row.eachCell(cell => {
            cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Save File
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};
