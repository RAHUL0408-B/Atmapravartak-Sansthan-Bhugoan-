/**
 * csvExport.js
 * Lightweight CSV export utility for filtered member data.
 * Called from MemberList.jsx — exports exactly what is displayed.
 */

/**
 * Calculate age from date of birth string or Date object.
 * @param {string|Date} dob
 * @returns {number|string}
 */
const calcAge = (dob) => {
    if (!dob) return '-';
    try {
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return '-';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    } catch {
        return '-';
    }
};

/**
 * Escape a value for safe CSV embedding.
 * Wraps in quotes if the value contains comma, quote, or newline.
 * @param {any} val
 * @returns {string}
 */
const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

/**
 * Export an array of member objects to a .csv file download.
 * Mirrors the columns shown in MemberList table.
 *
 * @param {Array}  members  - The filtered+sorted members array
 * @param {string} filename - Desired filename (default: members_list.csv)
 */
export const exportToCSV = (members, filename = 'members_list.csv') => {
    // BOM so Excel opens Marathi text correctly as UTF-8
    const BOM = '\uFEFF';

    const headers = [
        'अ.क्र.',
        'अनु.दिनांक',
        'सभासदाचे नाव',
        'गाव',
        'पोस्ट',
        'तालुका',
        'जिल्हा',
        'राज्य',
        'वय',
        'मोबाईल नंबर',
        'पत्ता'
    ];

    const rows = members.map((m, index) => {
        const addressParts = [
            m.address_line1_marathi || m.address_line1 || '',
            m.address_line2_marathi || m.address_line2 || ''
        ].filter(Boolean);

        return [
            index + 1,
            m.joining_date || '-',
            m.full_name_marathi || m.full_name || '-',
            m.city_marathi || m.city || '-',
            m.post_office_marathi || m.post_office || '-',
            m.taluka_marathi || m.taluka || '-',
            m.district_marathi || m.district || '-',
            m.state_marathi || m.state || '-',
            calcAge(m.date_of_birth),
            m.mobile || '-',
            addressParts.join(', ') || '-'
        ].map(escapeCsv).join(',');
    });

    const csvContent = BOM + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
