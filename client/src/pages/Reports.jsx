import React, { useState, useEffect, useMemo } from 'react';
import { getMembers } from '../services/memberService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

// ─── COLORS ──────────────────────────────────────────────────────────────────
const BRAND = '#cc5500';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// ─── TABS CONFIG ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'डॅशबोर्ड', en: 'Dashboard' },
  { id: 'district', label: 'जिल्हा अहवाल', en: 'District' },
  { id: 'village', label: 'गाव अहवाल', en: 'Village' },
  { id: 'maharashtra', label: 'MH सारांश', en: 'MH Summary' },
  { id: 'hierarchical', label: 'श्रेणीबद्ध', en: 'Hierarchical' },
  { id: 'growth', label: 'वाढ अहवाल', en: 'Growth' },
  { id: 'gender', label: 'लिंग अहवाल', en: 'Gender' },
  { id: 'search', label: 'शोध अहवाल', en: 'Search' },
  { id: 'top', label: 'शीर्ष अहवाल', en: 'Top Reports' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const parseDate = (raw) => {
  if (!raw) return null;
  if (raw?.toDate) return raw.toDate();
  const d = new Date(raw);
  return isNaN(d) ? null : d;
};

const fmt = (n) => (n ?? 0).toLocaleString('en-IN');

const monthLabel = (ym) => {
  const [y, m] = ym.split('-');
  return new Date(y, +m - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
};

// ─── SMALL UI ATOMS ──────────────────────────────────────────────────────────

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', gap: '12px' }}>
    <div style={{ width: '40px', height: '40px', border: `4px solid #f3f3f3`, borderTop: `4px solid ${BRAND}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
    <p style={{ color: '#888', fontSize: '14px' }}>अहवाल लोड होत आहे…</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Badge = ({ children, color = BRAND }) => (
  <span style={{ background: color, color: '#fff', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
    {children}
  </span>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, sublabel, value, sub, icon, accent }) => (
  <div style={{
    background: '#fff', borderRadius: '12px', padding: '18px 20px',
    borderLeft: `4px solid ${accent || BRAND}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '140px', flex: '1 1 140px'
  }}>
    <div style={{ fontSize: '22px' }}>{icon}</div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: accent || BRAND, lineHeight: 1 }}>{fmt(value)}</div>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>{label}</div>
    {sublabel && <div style={{ fontSize: '11px', color: '#888' }}>{sublabel}</div>}
    {sub && <div style={{ fontSize: '12px', color: '#555' }}>{sub}</div>}
  </div>
);

// ─── FILTER BAR ──────────────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, onReset, districts, villages, showSearch }) => {
  const sel = (name, opts, placeholder) => (
    <select name={name} value={filters[name]} onChange={onChange}
      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', background: '#fff', minWidth: '130px' }}>
      <option value="">{placeholder}</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#555', marginRight: '4px' }}>🔽 फिल्टर:</span>
      {sel('district', districts, '🗺️ सर्व जिल्हे')}
      {sel('village', villages, '🏘️ सर्व गावे')}
      <select name="status" value={filters.status} onChange={onChange}
        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', background: '#fff' }}>
        <option value="">⚡ सर्व स्थिती</option>
        <option value="active">✅ सक्रिय</option>
        <option value="inactive">❌ निष्क्रिय</option>
      </select>
      <select name="gender" value={filters.gender} onChange={onChange}
        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', background: '#fff' }}>
        <option value="">👤 सर्व लिंग</option>
        <option value="Male">पुरुष</option>
        <option value="Female">स्त्री</option>
        <option value="Other">इतर</option>
      </select>
      <input type="date" name="joinDateStart" value={filters.joinDateStart} onChange={onChange}
        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
      <span style={{ color: '#aaa' }}>–</span>
      <input type="date" name="joinDateEnd" value={filters.joinDateEnd} onChange={onChange}
        style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
      {showSearch && (
        <input type="text" name="searchTerm" value={filters.searchTerm} onChange={onChange}
          placeholder="🔍 नाव / मोबाईल / ID शोधा…"
          style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', minWidth: '220px', flex: '1' }} />
      )}
      <button onClick={onReset}
        style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#f3f4f6', fontSize: '13px', cursor: 'pointer', fontWeight: 600, color: '#555' }}>
        ↺ रीसेट
      </button>
    </div>
  );
};

// ─── DATA TABLE ──────────────────────────────────────────────────────────────
const DataTable = ({ columns, rows, emptyMsg = 'माहिती उपलब्ध नाही' }) => (
  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: BRAND, color: '#fff' }}>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>#</th>
          {columns.map(c => (
            <th key={c} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '30px', color: '#aaa' }}>{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '9px 12px', color: '#888', fontWeight: 600 }}>{i + 1}</td>
              {row.map((cell, j) => <td key={j} style={{ padding: '9px 12px', color: '#333' }}>{cell ?? '—'}</td>)}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

// ─── SECTION BLOCK ───────────────────────────────────────────────────────────
const SectionBlock = ({ title, children, accent }) => (
  <div style={{ marginBottom: '28px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ width: '4px', height: '22px', borderRadius: '4px', background: accent || BRAND }} />
      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#222' }}>{title}</h4>
    </div>
    {children}
  </div>
);

// ─── CHART WRAPPER ───────────────────────────────────────────────────────────
const ChartCard = ({ title, children, height = 240 }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', flex: '1 1 300px', minWidth: '280px' }}>
    <div style={{ fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '14px', borderBottom: '1px solid #f0f0f0', paddingBottom: '10px' }}>{title}</div>
    <div style={{ height }}>{children}</div>
  </div>
);

// ─── SUMMARY ROW ─────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
    <span style={{ fontSize: '14px', color: '#555' }}>{label}</span>
    <Badge color={accent || BRAND}>{fmt(value)}</Badge>
  </div>
);

// ─── EXPORT HELPERS ──────────────────────────────────────────────────────────
const buildPDF = (title, columns, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.setTextColor(204, 85, 0);
  doc.text(`Atma Protection Foundation — ${title}`, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 23);
  doc.autoTable({ startY: 28, head: [['#', ...columns]], body: rows.map((r, i) => [i + 1, ...r]), theme: 'grid', headStyles: { fillColor: [204, 85, 0] }, styles: { fontSize: 9 } });
  doc.save(`APF_${title.replace(/\s+/g, '_')}.pdf`);
};

const buildExcel = (title, columns, rows) => {
  const ws = XLSX.utils.aoa_to_sheet([['#', ...columns], ...rows.map((r, i) => [i + 1, ...r])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));
  XLSX.writeFile(wb, `APF_${title.replace(/\s+/g, '_')}.xlsx`);
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Reports = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openDistrict, setOpenDistrict] = useState(null);

  const [filters, setFilters] = useState({
    district: '', village: '', status: '', gender: '',
    joinDateStart: '', joinDateEnd: '', searchTerm: ''
  });

  // ── FETCH ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await getMembers();
        const mapped = data.map(m => ({
          ...m,
          district: m.district_marathi || m.district || '',
          village: m.city_marathi || m.city || m.village || '',
          name: m.full_name_marathi || m.full_name || m.firstName || '',
          status: ((m.status || 'active').toLowerCase() === 'active') ? 'active' : 'inactive',
          gender: m.gender || 'Other',
        }));
        setMembers(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── FILTER OPTIONS ────────────────────────────────────────────────────────
  const allDistricts = useMemo(() => [...new Set(members.map(m => m.district).filter(Boolean))].sort(), [members]);
  const allVillages = useMemo(() => {
    const src = filters.district ? members.filter(m => m.district === filters.district) : members;
    return [...new Set(src.map(m => m.village).filter(Boolean))].sort();
  }, [members, filters.district]);

  // ── APPLY FILTERS ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return members.filter(m => {
      if (filters.district && m.district !== filters.district) return false;
      if (filters.village && m.village !== filters.village) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.gender && m.gender !== filters.gender) return false;
      const d = parseDate(m.joining_date || m.created_at);
      if (filters.joinDateStart && d && d < new Date(filters.joinDateStart)) return false;
      if (filters.joinDateEnd && d) {
        const end = new Date(filters.joinDateEnd); end.setHours(23, 59, 59);
        if (d > end) return false;
      }
      if (activeTab === 'search' && filters.searchTerm) {
        const t = filters.searchTerm.toLowerCase();
        return (m.name || '').toLowerCase().includes(t)
          || (m.mobile || '').includes(t)
          || (m.district || '').toLowerCase().includes(t)
          || (m.village || '').toLowerCase().includes(t)
          || (m.memberId || m.id || '').toString().includes(t);
      }
      return true;
    });
  }, [members, filters, activeTab]);

  // ── DERIVED DATA ──────────────────────────────────────────────────────────
  const now = new Date();

  const districtStats = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!m.district) return;
      if (!map[m.district]) map[m.district] = { district: m.district, total: 0, active: 0, inactive: 0, villages: new Set() };
      map[m.district].total++;
      map[m.district][m.status === 'active' ? 'active' : 'inactive']++;
      if (m.village) map[m.district].villages.add(m.village);
    });
    return Object.values(map).map(d => ({ ...d, villageCount: d.villages.size })).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const villageStats = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!m.village) return;
      if (!map[m.village]) map[m.village] = { village: m.village, district: m.district || '', total: 0, active: 0, inactive: 0 };
      map[m.village].total++;
      map[m.village][m.status === 'active' ? 'active' : 'inactive']++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  const growthByMonth = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      const d = parseDate(m.joining_date || m.created_at);
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ month: monthLabel(k), raw: k, count: v }));
  }, [filtered]);

  const growthByYear = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      const d = parseDate(m.joining_date || m.created_at);
      if (!d) return;
      const y = d.getFullYear();
      if (y < 1900 || y > 2050) return; // Ignore invalid years
      const yStr = y.toString();
      map[yStr] = (map[yStr] || 0) + 1;
    });
    return Object.entries(map).sort().map(([y, v]) => ({ year: y, count: v }));
  }, [filtered]);

  const genderStats = useMemo(() => {
    const c = { Male: 0, Female: 0, Other: 0 };
    filtered.forEach(m => {
      const g = (m.gender || '').toLowerCase();
      if (g === 'male' || g === 'पुरुष') c.Male++;
      else if (g === 'female' || g === 'स्त्री') c.Female++;
      else c.Other++;
    });
    return [
      { name: 'पुरुष (Male)', value: c.Male },
      { name: 'स्त्री (Female)', value: c.Female },
      { name: 'इतर (Other)', value: c.Other },
    ].filter(d => d.value > 0);
  }, [filtered]);

  const newThisMonth = useMemo(() => filtered.filter(m => {
    const d = parseDate(m.joining_date || m.created_at);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length, [filtered]);

  const activeCount = filtered.filter(m => m.status === 'active').length;
  const inactiveCount = filtered.length - activeCount;

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters(p => ({ ...p, [name]: value, ...(name === 'district' ? { village: '' } : {}) }));
  };

  const resetFilters = () => setFilters({ district: '', village: '', status: '', gender: '', joinDateStart: '', joinDateEnd: '', searchTerm: '' });

  // ── EXPORT ────────────────────────────────────────────────────────────────
  const getExportData = () => {
    switch (activeTab) {
      case 'district':
        return { title: 'District Report', cols: ['जिल्हा', 'एकूण', 'सक्रिय', 'निष्क्रिय', 'गावे'], rows: districtStats.map(d => [d.district, d.total, d.active, d.inactive, d.villageCount]) };
      case 'village':
        return { title: 'Village Report', cols: ['गाव', 'जिल्हा', 'एकूण', 'सक्रिय', 'निष्क्रिय'], rows: villageStats.map(v => [v.village, v.district, v.total, v.active, v.inactive]) };
      case 'growth':
        return { title: 'Growth Report', cols: ['महिना', 'नवीन सदस्य'], rows: growthByMonth.map(g => [g.month, g.count]) };
      case 'gender':
        return { title: 'Gender Report', cols: ['लिंग', 'एकूण'], rows: genderStats.map(g => [g.name, g.value]) };
      default:
        return { title: 'Member Report', cols: ['नाव', 'मोबाईल', 'जिल्हा', 'गाव', 'स्थिती'], rows: filtered.map(m => [m.name, m.mobile || '', m.district, m.village, m.status]) };
    }
  };

  const handlePDF = () => { const { title, cols, rows } = getExportData(); buildPDF(title, cols, rows); };
  const handleExcel = () => { const { title, cols, rows } = getExportData(); buildExcel(title, cols, rows); };

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading) return <Loader />;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f4f6fb', minHeight: '100vh', padding: '24px' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: BRAND }}>📊 अहवाल आणि विश्लेषण</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>Reports & Analytics — Atma Protection Foundation</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="d-print-none">
          <ExportBtn onClick={handlePDF} icon="📄" label="PDF Export" color="#ef4444" />
          <ExportBtn onClick={handleExcel} icon="📊" label="Excel Export" color="#10b981" />
          <ExportBtn onClick={() => window.print()} icon="🖨️" label="Print" color="#6b7280" />
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="d-print-none">
        <FilterBar
          filters={filters} onChange={handleFilter} onReset={resetFilters}
          districts={allDistricts} villages={allVillages}
          showSearch={activeTab === 'search'}
        />
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '22px', padding: '6px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb' }} className="d-print-none">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === t.id ? 800 : 500,
              background: activeTab === t.id ? BRAND : 'transparent',
              color: activeTab === t.id ? '#fff' : '#555',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT PANEL ── */}
      <div style={{ background: '#fff', borderRadius: '14px', padding: '26px', border: '1px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Row */}
            <SectionBlock title="एकूण आकडेवारी — Summary Metrics">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
                <StatCard label="एकूण सदस्य" sublabel="Total Members" value={filtered.length} icon="👥" accent="#3b82f6" />
                <StatCard label="सक्रिय सदस्य" sublabel="Active Members" value={activeCount} icon="✅" accent="#10b981" />
                <StatCard label="निष्क्रिय" sublabel="Inactive Members" value={inactiveCount} icon="❌" accent="#ef4444" />
                <StatCard label="एकूण जिल्हे" sublabel="Total Districts" value={districtStats.length} icon="🗺️" accent="#f59e0b" />
                <StatCard label="एकूण गावे" sublabel="Total Villages" value={villageStats.length} icon="🏘️" accent="#8b5cf6" />
                <StatCard label="नवीन या महिन्यात" sublabel="New This Month" value={newThisMonth} icon="📅" accent="#06b6d4" />
              </div>
            </SectionBlock>

            {/* Charts */}
            <SectionBlock title="आलेख विश्लेषण — Chart Analysis">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <ChartCard title="🗺️ जिल्हानुसार सदस्य — District-wise Members">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtStats.slice(0, 8)} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="district" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill={BRAND} radius={[4, 4, 0, 0]} name="एकूण" />
                      <Bar dataKey="active" fill="#10b981" radius={[4, 4, 0, 0]} name="सक्रिय" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="📈 मासिक वाढ — Monthly Growth">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthByMonth.slice(-12)} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke={BRAND} strokeWidth={2} dot={{ r: 3 }} name="नवीन सदस्य" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="👤 लिंगानुसार — Gender Breakdown" height={220}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {genderStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </SectionBlock>
          </div>
        )}

        {/* ══ DISTRICT ═══════════════════════════════════════════════════════ */}
        {activeTab === 'district' && (
          <div>
            <SectionBlock title="जिल्हा अहवाल — District Report">
              <DataTable
                columns={['जिल्हा (District)', 'एकूण सदस्य', 'सक्रिय', 'निष्क्रिय', 'एकूण गावे']}
                rows={districtStats.map(d => [
                  <button onClick={() => setOpenDistrict(openDistrict === d.district ? null : d.district)}
                    style={{ background: 'none', border: 'none', color: BRAND, cursor: 'pointer', fontWeight: 700, fontSize: '13px', textAlign: 'left', padding: 0 }}>
                    {openDistrict === d.district ? '▼ ' : '▶ '}{d.district}
                  </button>,
                  <Badge color="#3b82f6">{fmt(d.total)}</Badge>,
                  <Badge color="#10b981">{fmt(d.active)}</Badge>,
                  <Badge color="#ef4444">{fmt(d.inactive)}</Badge>,
                  fmt(d.villageCount)
                ])}
              />
            </SectionBlock>

            {/* Expandable member list */}
            {openDistrict && (
              <SectionBlock title={`👥 ${openDistrict} — सदस्य यादी`} accent="#3b82f6">
                <DataTable
                  columns={['नाव', 'मोबाईल', 'गाव', 'स्थिती']}
                  rows={filtered.filter(m => m.district === openDistrict).map(m => [
                    m.name, m.mobile || '—', m.village || '—',
                    <Badge color={m.status === 'active' ? '#10b981' : '#ef4444'}>{m.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}</Badge>
                  ])}
                />
              </SectionBlock>
            )}
          </div>
        )}

        {/* ══ VILLAGE ════════════════════════════════════════════════════════ */}
        {activeTab === 'village' && (
          <div>
            <SectionBlock title="गाव अहवाल — Village Report">
              <DataTable
                columns={['गाव (Village)', 'जिल्हा', 'एकूण सदस्य', 'सक्रिय', 'निष्क्रिय']}
                rows={villageStats.map(v => [
                  v.village, v.district,
                  <Badge color="#3b82f6">{fmt(v.total)}</Badge>,
                  <Badge color="#10b981">{fmt(v.active)}</Badge>,
                  <Badge color="#ef4444">{fmt(v.inactive)}</Badge>,
                ])}
              />
            </SectionBlock>

            {filters.village && (
              <SectionBlock title={`👥 ${filters.village} — सदस्य यादी`} accent="#8b5cf6">
                <DataTable
                  columns={['नाव', 'मोबाईल', 'जिल्हा', 'स्थिती']}
                  rows={filtered.map(m => [
                    m.name, m.mobile || '—', m.district || '—',
                    <Badge color={m.status === 'active' ? '#10b981' : '#ef4444'}>{m.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}</Badge>
                  ])}
                />
              </SectionBlock>
            )}
          </div>
        )}

        {/* ══ MAHARASHTRA SUMMARY ════════════════════════════════════════════ */}
        {activeTab === 'maharashtra' && (
          <div style={{ maxWidth: '500px' }}>
            <SectionBlock title="महाराष्ट्र सारांश — Maharashtra Summary">
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                <SummaryRow label="एकूण जिल्हे (Total Districts)" value={districtStats.length} accent="#f59e0b" />
                <SummaryRow label="एकूण गावे (Total Villages)" value={villageStats.length} accent="#8b5cf6" />
                <SummaryRow label="एकूण सदस्य (Total Members)" value={filtered.length} accent="#3b82f6" />
                <SummaryRow label="सक्रिय सदस्य (Active Members)" value={activeCount} accent="#10b981" />
                <SummaryRow label="निष्क्रिय सदस्य (Inactive Members)" value={inactiveCount} accent="#ef4444" />
                <SummaryRow label="या महिन्यातील नवीन (New This Month)" value={newThisMonth} accent="#06b6d4" />
              </div>
            </SectionBlock>
          </div>
        )}

        {/* ══ HIERARCHICAL ══════════════════════════════════════════════════ */}
        {activeTab === 'hierarchical' && (
          <SectionBlock title="श्रेणीबद्ध अहवाल — Maharashtra → District → Village → Members">
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>▶ जिल्ह्यावर क्लिक करा विस्तारण्यासाठी</div>
            {districtStats.map(d => (
              <div key={d.district} style={{ marginBottom: '10px', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                <div onClick={() => setOpenDistrict(openDistrict === d.district ? null : d.district)}
                  style={{
                    background: openDistrict === d.district ? BRAND : '#f8f9fa', color: openDistrict === d.district ? '#fff' : '#222',
                    padding: '12px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '14px'
                  }}>
                  <span>🗺️ {d.district}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Badge color={openDistrict === d.district ? 'rgba(255,255,255,0.3)' : '#3b82f6'}>{d.total} सदस्य</Badge>
                    <Badge color={openDistrict === d.district ? 'rgba(255,255,255,0.3)' : '#8b5cf6'}>{d.villageCount} गावे</Badge>
                    <span>{openDistrict === d.district ? '▲' : '▼'}</span>
                  </div>
                </div>
                {openDistrict === d.district && (
                  <div style={{ padding: '12px 18px', background: '#fafafa' }}>
                    {villageStats.filter(v => v.district === d.district).map(v => (
                      <div key={v.village} style={{ marginLeft: '16px', marginBottom: '12px', borderLeft: `3px solid ${BRAND}`, paddingLeft: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: '#333' }}>
                          🏘️ {v.village}
                          <span style={{ marginLeft: '8px' }}><Badge color="#3b82f6">{v.total}</Badge></span>
                          <span style={{ marginLeft: '4px' }}><Badge color="#10b981">{v.active}</Badge></span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {members.filter(m => m.district === d.district && m.village === v.village).map(m => (
                            <span key={m.id || m.memberId}
                              style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', color: '#555' }}>
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </SectionBlock>
        )}

        {/* ══ GROWTH ════════════════════════════════════════════════════════ */}
        {activeTab === 'growth' && (
          <div>
            <SectionBlock title="मासिक वाढ अहवाल — Monthly Growth Report">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <ChartCard title="📈 मासिक सदस्य वाढ (Monthly)" height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthByMonth} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} name="नवीन सदस्य" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="📅 वार्षिक वाढ (Yearly)" height={260}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthByYear} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="नवीन सदस्य" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <DataTable
                columns={['महिना (Month)', 'नवीन सदस्य (New Members)']}
                rows={growthByMonth.map(g => [g.month, <Badge color={BRAND}>{g.count}</Badge>])}
              />
            </SectionBlock>
            <SectionBlock title="वार्षिक अहवाल — Yearly Report">
              <DataTable
                columns={['वर्ष (Year)', 'नवीन सदस्य (New Members)']}
                rows={growthByYear.map(g => [g.year, <Badge color="#8b5cf6">{g.count}</Badge>])}
              />
            </SectionBlock>
          </div>
        )}

        {/* ══ GENDER ════════════════════════════════════════════════════════ */}
        {activeTab === 'gender' && (
          <div>
            <SectionBlock title="लिंग अहवाल — Gender Report">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: '0 0 auto' }}>
                  <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                    <StatCard label="पुरुष (Male)" value={genderStats.find(g => g.name.includes('Male'))?.value || 0} icon="👨" accent="#3b82f6" />
                    <StatCard label="स्त्री (Female)" value={genderStats.find(g => g.name.includes('Female'))?.value || 0} icon="👩" accent="#ec4899" />
                    <StatCard label="इतर (Other)" value={genderStats.find(g => g.name.includes('Other'))?.value || 0} icon="🧑" accent="#8b5cf6" />
                  </div>
                  <DataTable
                    columns={['लिंग (Gender)', 'एकूण सदस्य', 'टक्केवारी %']}
                    rows={genderStats.map(g => [
                      g.name,
                      <Badge color={BRAND}>{g.value}</Badge>,
                      `${filtered.length ? ((g.value / filtered.length) * 100).toFixed(1) : 0}%`
                    ])}
                  />
                </div>
                <ChartCard title="लिंगानुसार वितरण — Gender Distribution" height={280}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {genderStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </SectionBlock>
          </div>
        )}

        {/* ══ SEARCH ════════════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <SectionBlock title="शोध अहवाल — Search Report">
            <div style={{ marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilter}
                placeholder="🔍 नाव / मोबाईल / जिल्हा / गाव / ID शोधा…"
                style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', minWidth: '300px', flex: '1' }} />
              <Badge color={BRAND}>{filtered.length} निकाल</Badge>
            </div>
            <DataTable
              columns={['नाव', 'मोबाईल', 'जिल्हा', 'गाव', 'स्थिती']}
              rows={filtered.slice(0, 150).map(m => [
                m.name, m.mobile || '—', m.district || '—', m.village || '—',
                <Badge color={m.status === 'active' ? '#10b981' : '#ef4444'}>{m.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}</Badge>
              ])}
              emptyMsg="कोणतेही सदस्य सापडले नाहीत. वेगळा शोध वापरा."
            />
            {filtered.length > 150 && (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginTop: '10px' }}>पहिले 150 निकाल दाखवले. अधिक पाहण्यासाठी Excel export करा.</p>
            )}
          </SectionBlock>
        )}

        {/* ══ TOP REPORTS ═══════════════════════════════════════════════════ */}
        {activeTab === 'top' && (
          <div>
            <SectionBlock title="शीर्ष अहवाल — Top & Bottom Reports">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <StatCard label="सर्वाधिक सदस्य — जिल्हा" sublabel="Top District"
                  value={districtStats[0]?.district || '—'} sub={`${fmt(districtStats[0]?.total || 0)} सदस्य`} icon="🏆" accent="#f59e0b" />
                <StatCard label="सर्वाधिक सदस्य — गाव" sublabel="Top Village"
                  value={villageStats[0]?.village || '—'} sub={`${fmt(villageStats[0]?.total || 0)} सदस्य`} icon="🥇" accent="#10b981" />
                <StatCard label="सर्वात कमी सदस्य — जिल्हा" sublabel="Lowest District"
                  value={districtStats[districtStats.length - 1]?.district || '—'} sub={`${fmt(districtStats[districtStats.length - 1]?.total || 0)} सदस्य`} icon="📉" accent="#ef4444" />
                <StatCard label="सर्वात कमी सदस्य — गाव" sublabel="Lowest Village"
                  value={villageStats[villageStats.length - 1]?.village || '—'} sub={`${fmt(villageStats[villageStats.length - 1]?.total || 0)} सदस्य`} icon="⬇️" accent="#6b7280" />
              </div>
            </SectionBlock>

            <SectionBlock title="📊 शीर्ष 5 जिल्हे — Top 5 Districts">
              <DataTable
                columns={['जिल्हा', 'एकूण', 'सक्रिय', 'निष्क्रिय', 'गावे']}
                rows={districtStats.slice(0, 5).map(d => [
                  d.district, <Badge color="#3b82f6">{d.total}</Badge>,
                  <Badge color="#10b981">{d.active}</Badge>,
                  <Badge color="#ef4444">{d.inactive}</Badge>,
                  d.villageCount
                ])}
              />
            </SectionBlock>
            <SectionBlock title="🏘️ शीर्ष 5 गावे — Top 5 Villages">
              <DataTable
                columns={['गाव', 'जिल्हा', 'एकूण', 'सक्रिय', 'निष्क्रिय']}
                rows={villageStats.slice(0, 5).map(v => [
                  v.village, v.district,
                  <Badge color="#3b82f6">{v.total}</Badge>,
                  <Badge color="#10b981">{v.active}</Badge>,
                  <Badge color="#ef4444">{v.inactive}</Badge>,
                ])}
              />
            </SectionBlock>
          </div>
        )}

      </div>{/* end content panel */}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          .d-print-none { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
};

// ─── EXPORT BUTTON ATOM ───────────────────────────────────────────────────────
const ExportBtn = ({ onClick, icon, label, color }) => (
  <button onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none',
      background: color, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
    }}>
    {icon} {label}
  </button>
);

export default Reports;
