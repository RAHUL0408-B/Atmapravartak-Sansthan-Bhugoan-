import React, { useState, useEffect, useMemo } from 'react';
import { getMembers } from '../services/memberService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { 
  BarChart2, Map, Home, Activity, Users, Calendar, Search, 
  Download, Printer, Filter, RefreshCw, ChevronRight, ChevronDown,
  TrendingUp, PieChart as PieIcon, Layers, Award, TrendingDown
} from 'lucide-react';

// ─── COLORS ──────────────────────────────────────────────────────────────────
const BRAND = '#cc5500';
const SAFFRON = '#FF9933';
const GOLD = '#FFD700';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#2563eb', '#059669', '#d97706'];

// ─── TABS CONFIG ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'डॅशबोर्ड', en: 'Dashboard', icon: BarChart2 },
  { id: 'district', label: 'जिल्हा अहवाल', en: 'District', icon: Map },
  { id: 'village', label: 'गाव अहवाल', en: 'Village', icon: Home },
  { id: 'maharashtra', label: 'MH सारांश', en: 'MH Summary', icon: Activity },
  { id: 'hierarchical', label: 'श्रेणीबद्ध', en: 'Hierarchical', icon: Layers },
  { id: 'growth', label: 'वाढ अहवाल', en: 'Growth', icon: TrendingUp },
  { id: 'gender', label: 'लिंग अहवाल', en: 'Gender', icon: PieIcon },
  { id: 'search', label: 'शोध अहवाल', en: 'Search', icon: Search },
  { id: 'top', label: 'शीर्ष अहवाल', en: 'Top Reports', icon: Award },
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
    <div style={{ width: '40px', height: '40px', border: `4px solid #f3f3f3`, borderTop: `4px solid ${SAFFRON}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
    <p style={{ color: '#888', fontSize: '14px', fontWeight: 600 }}>अहवाल लोड होत आहे…</p>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Badge = ({ children, color = BRAND }) => (
  <span style={{ 
    background: color + '15', 
    color: color, 
    borderRadius: '6px', 
    padding: '4px 10px', 
    fontSize: '12px', 
    fontWeight: 700,
    border: `1px solid ${color}30`
  }}>
    {children}
  </span>
);

// ─── STAT CARD ───────────────────────────────────────────────────────────────
const StatCard = ({ label, sublabel, value, sub, icon: Icon, accent }) => {
  const isEmoji = typeof Icon === 'string';
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '24px',
      border: '1px solid #f0f0f0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px', flex: '1 1 180px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ background: accent + '15', padding: '10px', borderRadius: '12px', display: 'flex', width: '44px', height: '44px', alignItems: 'center', justifyContent: 'center' }}>
          {isEmoji ? <span style={{ fontSize: '20px' }}>{Icon}</span> : <Icon size={24} color={accent} />}
        </div>
        {sub && <div style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{sub}</div>}
      </div>
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>{typeof value === 'number' ? fmt(value) : (value || '—')}</div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#666', marginTop: '4px' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{sublabel}</div>}
      </div>
    </div>
  );
};

// ─── FILTER BAR ──────────────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, onReset, districts, villages, showSearch }) => {
  const sel = (name, opts, placeholder, Icon) => (
    <div style={{ position: 'relative', flex: '1 1 150px' }}>
      <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', display: 'flex' }}>
        <Icon size={14} />
      </div>
      <select name={name} value={filters[name]} onChange={onChange}
        style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', background: '#fff', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={(e) => e.target.style.borderColor = SAFFRON}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      >
        <option value="">{placeholder}</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#444', fontWeight: 800, fontSize: '14px', marginRight: '10px' }}>
        <Filter size={18} color={SAFFRON} /> फिल्टर:
      </div>
      
      {sel('district', districts, 'सर्व जिल्हे', Map)}
      {sel('village', villages, 'सर्व गावे', Home)}
      
      <div style={{ position: 'relative', flex: '1 1 140px' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', display: 'flex' }}>
          <Activity size={14} />
        </div>
        <select name="status" value={filters.status} onChange={onChange}
          style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', background: '#fff', outline: 'none' }}>
          <option value="">सर्व स्थिती</option>
          <option value="active">सक्रिय (Active)</option>
          <option value="inactive">निष्क्रिय (Inactive)</option>
        </select>
      </div>

      <div style={{ position: 'relative', flex: '1 1 140px' }}>
        <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', display: 'flex' }}>
          <Users size={14} />
        </div>
        <select name="gender" value={filters.gender} onChange={onChange}
          style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', background: '#fff', outline: 'none' }}>
          <option value="">सर्व लिंग</option>
          <option value="Male">पुरुष</option>
          <option value="Female">स्त्री</option>
          <option value="Other">इतर</option>
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f9fafb', padding: '2px 10px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
          <Calendar size={14} color="#888" />
          <input type="date" name="joinDateStart" value={filters.joinDateStart} onChange={onChange}
            style={{ padding: '7px 0', border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
          <span style={{ color: '#ccc' }}>—</span>
          <input type="date" name="joinDateEnd" value={filters.joinDateEnd} onChange={onChange}
            style={{ padding: '7px 0', border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }} />
        </div>
      </div>

      {showSearch && (
        <div style={{ position: 'relative', flex: '2 1 300px' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', display: 'flex' }}>
            <Search size={16} />
          </div>
          <input type="text" name="searchTerm" value={filters.searchTerm} onChange={onChange}
            placeholder="नाव / मोबाईल / जिल्हा / गाव शोधा…"
            style={{ width: '100%', padding: '9px 12px 9px 38px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none' }} />
        </div>
      )}

      <button onClick={onReset}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: '13px', cursor: 'pointer', fontWeight: 700, color: '#4b5563', transition: 'all 0.2s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
      >
        <RefreshCw size={14} /> रीसेट
      </button>
    </div>
  );
};

// ─── DATA TABLE ──────────────────────────────────────────────────────────────
const DataTable = ({ columns, rows, emptyMsg = 'माहिती उपलब्ध नाही' }) => (
  <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
          <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, color: '#4b5563', whiteSpace: 'nowrap' }}>#</th>
          {columns.map(c => (
            <th key={c} style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 800, color: '#4b5563', whiteSpace: 'nowrap' }}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontWeight: 600 }}>{emptyMsg}</td></tr>
          : rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fcfcfc', borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.1s' }} className="table-row">
              <td style={{ padding: '12px 16px', color: '#9ca3af', fontWeight: 700 }}>{i + 1}</td>
              {row.map((cell, j) => <td key={j} style={{ padding: '12px 16px', color: '#1f2937', fontWeight: 500 }}>{cell ?? '—'}</td>)}
            </tr>
          ))}
      </tbody>
    </table>
    <style>{`.table-row:hover { background-color: #f9fafb !important; }`}</style>
  </div>
);

// ─── SECTION BLOCK ───────────────────────────────────────────────────────────
const SectionBlock = ({ title, children, accent }) => (
  <div style={{ marginBottom: '32px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
      <div style={{ width: '5px', height: '24px', borderRadius: '10px', background: accent || BRAND }} />
      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#111827', letterSpacing: '0.01em' }}>{title}</h4>
    </div>
    {children}
  </div>
);

// ─── CHART WRAPPER ───────────────────────────────────────────────────────────
const ChartCard = ({ title, children, height = 300, icon: Icon, color = BRAND }) => (
  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '24px', flex: '1 1 45%', minWidth: '320px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
      {Icon && <Icon size={18} color={color} />}
      <div style={{ fontSize: '14px', fontWeight: 800, color: '#374151' }}>{title}</div>
    </div>
    <div style={{ height }}>{children}</div>
  </div>
);

// ─── SUMMARY ROW ─────────────────────────────────────────────────────────────
const SummaryRow = ({ label, value, accent, icon: Icon }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {Icon && <Icon size={18} color={accent || '#6b7280'} />}
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563' }}>{label}</span>
    </div>
    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>{fmt(value)}</div>
  </div>
);

// ─── EXPORT HELPERS ──────────────────────────────────────────────────────────
const buildPDF = (title, columns, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(204, 85, 0);
  doc.text(`Atma Protection Foundation`, 14, 20);
  
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(title, 14, 28);
  
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`दिनांक: ${new Date().toLocaleString('en-IN')}`, 14, 34);
  
  doc.autoTable({ 
    startY: 40, 
    head: [['#', ...columns]], 
    body: rows.map((r, i) => [i + 1, ...r]), 
    theme: 'grid', 
    headStyles: { fillColor: [204, 85, 0], textColor: 255, fontStyle: 'bold' }, 
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });
  doc.save(`APF_Report_${title.replace(/\s+/g, '_')}.pdf`);
};

const buildExcel = (title, columns, rows) => {
  const ws = XLSX.utils.aoa_to_sheet([['#', ...columns], ...rows.map((r, i) => [i + 1, ...r])]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `APF_Report_${title.replace(/\s+/g, '_')}.xlsx`);
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
          district: m.district_marathi || m.district || 'Unspecified',
          village: m.city_marathi || m.city || m.village || 'Unspecified',
          name: m.full_name_marathi || m.full_name || m.firstName || 'Unknown',
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
  const allDistricts = useMemo(() => [...new Set(members.map(m => m.district).filter(d => d !== 'Unspecified'))].sort(), [members]);
  const allVillages = useMemo(() => {
    const src = filters.district ? members.filter(m => m.district === filters.district) : members;
    return [...new Set(src.map(m => m.village).filter(v => v !== 'Unspecified'))].sort();
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
          || (m.village || '').toLowerCase().includes(t);
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
      if (y < 1900 || y > 2050) return;
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
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '32px 24px', animation: 'fadeIn 0.5s ease' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: `linear-gradient(135deg, ${SAFFRON}, ${BRAND})`, padding: '12px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(204, 85, 0, 0.2)' }}>
            <BarChart2 size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>अहवाल आणि विश्लेषण</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280', fontWeight: 600 }}>Atma Protection Foundation — Reports & Analytics Hub</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }} className="d-print-none">
          <ExportBtn onClick={handlePDF} icon={Download} label="PDF" color="#ef4444" />
          <ExportBtn onClick={handleExcel} icon={Layers} label="Excel" color="#10b981" />
          <ExportBtn onClick={() => window.print()} icon={Printer} label="Print" color="#6b7280" />
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
      <div style={{ 
        display: 'flex', gap: '4px', flexWrap: 'nowrap', overflowX: 'auto', 
        marginBottom: '28px', padding: '6px', background: '#fff', borderRadius: '18px', 
        border: '1px solid #e5e7eb', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none'
      }} className="d-print-none hide-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTab === t.id ? 800 : 600,
              background: activeTab === t.id ? SAFFRON : 'transparent',
              color: activeTab === t.id ? '#fff' : '#6b7280',
              transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT PANEL ── */}
      <div style={{ 
        background: '#fff', borderRadius: '24px', padding: '32px', 
        border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        minHeight: '400px'
      }}>

        {/* ══ DASHBOARD ══════════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div>
            <SectionBlock title="महत्वाचे आकडे — Key Metrics">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
                <StatCard label="एकूण सदस्य" sublabel="Total Members" value={filtered.length} icon={Users} accent="#3b82f6" />
                <StatCard label="सक्रिय सदस्य" sublabel="Active Members" value={activeCount} icon={Activity} accent="#10b981" />
                <StatCard label="एकूण जिल्हे" sublabel="Total Districts" value={districtStats.length} icon={Map} accent="#f59e0b" />
                <StatCard label="एकूण गावे" sublabel="Total Villages" value={villageStats.length} icon={Home} accent="#8b5cf6" />
                <StatCard label="नवीन या महिन्यात" sublabel="New This Month" value={newThisMonth} icon={Calendar} accent="#06b6d4" />
              </div>
            </SectionBlock>

            <SectionBlock title="आलेख आणि कल — Visual Trends">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <ChartCard title="जिल्हानुसार वितरण" icon={Map} color="#3b82f6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtStats.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="district" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total" fill={SAFFRON} radius={[6, 6, 0, 0]} barSize={35} name="एकूण" />
                      <Bar dataKey="active" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} name="सक्रिय" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                
                <ChartCard title="मासिक सदस्य वाढ" icon={TrendingUp} color="#10b981">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growthByMonth.slice(-8)}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={SAFFRON} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={SAFFRON} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="count" stroke={SAFFRON} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="नवीन सदस्य" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="गावानुसार सदस्य (Top 10)" icon={Home} color="#8b5cf6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={villageStats.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="village" type="category" tick={{ fontSize: 10, fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="total" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="एकूण" barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="लिंगानुसार वर्गीकरण" icon={PieIcon} color="#ec4899">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderStats} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5}>
                        {genderStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </SectionBlock>
          </div>
        )}

        {/* ══ DISTRICT ═══════════════════════════════════════════════════════ */}
        {activeTab === 'district' && (
          <SectionBlock title="जिल्हा निहाय अहवाल — District-wise Report">
            <DataTable
              columns={['जिल्हा नाव', 'एकूण सदस्य', 'सक्रिय', 'निष्क्रिय', 'एकूण गावे']}
              rows={districtStats.map(d => [
                <button onClick={() => setOpenDistrict(openDistrict === d.district ? null : d.district)}
                  style={{ background: 'none', border: 'none', color: SAFFRON, cursor: 'pointer', fontWeight: 800, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
                  {openDistrict === d.district ? <ChevronDown size={14}/> : <ChevronRight size={14}/>} {d.district}
                </button>,
                <Badge color="#3b82f6">{fmt(d.total)}</Badge>,
                <Badge color="#10b981">{fmt(d.active)}</Badge>,
                <Badge color="#ef4444">{fmt(d.inactive)}</Badge>,
                <div style={{ color: '#6b7280', fontWeight: 600 }}>{fmt(d.villageCount)}</div>
              ])}
            />
            {openDistrict && (
              <div style={{ marginTop: '24px', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', animation: 'fadeIn 0.3s ease' }}>
                <SectionBlock title={`👥 ${openDistrict} — सभासद तपशील`} accent="#3b82f6">
                  <DataTable
                    columns={['नाव', 'मोबाईल', 'गाव', 'स्थिती']}
                    rows={filtered.filter(m => m.district === openDistrict).map(m => [
                      <div style={{ fontWeight: 700 }}>{m.name}</div>,
                      m.mobile || '—',
                      m.village || '—',
                      <Badge color={m.status === 'active' ? '#10b981' : '#ef4444'}>{m.status === 'active' ? 'सक्रिय' : 'निष्क्रिय'}</Badge>
                    ])}
                  />
                </SectionBlock>
              </div>
            )}
          </SectionBlock>
        )}

        {/* ══ VILLAGE ════════════════════════════════════════════════════════ */}
        {activeTab === 'village' && (
          <SectionBlock title="गाव निहाय अहवाल — Village-wise Report">
            <DataTable
              columns={['गाव', 'जिल्हा', 'एकूण सदस्य', 'सक्रिय', 'निष्क्रिय']}
              rows={villageStats.map(v => [
                <div style={{ fontWeight: 700 }}>{v.village}</div>,
                <div style={{ color: '#6b7280' }}>{v.district}</div>,
                <Badge color="#3b82f6">{fmt(v.total)}</Badge>,
                <Badge color="#10b981">{fmt(v.active)}</Badge>,
                <Badge color="#ef4444">{fmt(v.inactive)}</Badge>
              ])}
            />
          </SectionBlock>
        )}

        {/* ══ MAHARASHTRA SUMMARY ════════════════════════════════════════════ */}
        {activeTab === 'maharashtra' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SectionBlock title="महाराष्ट्र राज्य सारांश — MH Summary">
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <SummaryRow label="एकूण जिल्हे" value={districtStats.length} icon={Map} accent="#f59e0b" />
                <SummaryRow label="एकूण गावे" value={villageStats.length} icon={Home} accent="#8b5cf6" />
                <SummaryRow label="एकूण सदस्य" value={filtered.length} icon={Users} accent="#3b82f6" />
                <SummaryRow label="सक्रिय सदस्य" value={activeCount} icon={Activity} accent="#10b981" />
                <SummaryRow label="निष्क्रिय सदस्य" value={inactiveCount} icon={TrendingDown} accent="#ef4444" />
                <SummaryRow label="या महिन्यातील नवीन नोंदणी" value={newThisMonth} icon={Calendar} accent="#06b6d4" />
              </div>
            </SectionBlock>
          </div>
        )}

        {/* ══ HIERARCHICAL ══════════════════════════════════════════════════ */}
        {activeTab === 'hierarchical' && (
          <SectionBlock title="श्रेणीबद्ध अहवाल — MH → District → Village">
            {districtStats.map(d => (
              <div key={d.district} style={{ marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }}>
                <div onClick={() => setOpenDistrict(openDistrict === d.district ? null : d.district)}
                  style={{
                    background: openDistrict === d.district ? SAFFRON : '#fff', color: openDistrict === d.district ? '#fff' : '#111827',
                    padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                    <Map size={18} /> {d.district}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, background: openDistrict === d.district ? 'rgba(255,255,255,0.2)' : '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                      {d.total} सदस्य • {d.villageCount} गावे
                    </span>
                    {openDistrict === d.district ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  </div>
                </div>
                {openDistrict === d.district && (
                  <div style={{ padding: '20px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                    {villageStats.filter(v => v.district === d.district).map(v => (
                      <div key={v.village} style={{ marginLeft: '12px', marginBottom: '16px', paddingLeft: '16px', borderLeft: `2px dashed ${SAFFRON}` }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '8px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Home size={14} color={SAFFRON} /> {v.village} 
                          <Badge color="#3b82f6">{v.total}</Badge>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {members.filter(m => m.district === d.district && m.village === v.village).map(m => (
                            <span key={m.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
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
            <SectionBlock title="मासिक आणि वार्षिक वाढ">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
                <ChartCard title="मासिक सदस्य वाढ (Trend)" icon={TrendingUp} color={SAFFRON}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthByMonth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 600 }} />
                      <YAxis tick={{ fontSize: 10, fontWeight: 600 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke={SAFFRON} strokeWidth={4} dot={{ r: 4, fill: SAFFRON, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="नवीन सदस्य" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="वार्षिक नोंदणी सारांश" icon={Calendar} color="#8b5cf6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthByYear}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} name="नवीन सदस्य" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <DataTable
                columns={['कालावधी (Period)', 'नवीन सदस्य संख्या']}
                rows={[
                  ...growthByYear.map(g => [<strong>वर्ष: {g.year}</strong>, <Badge color="#8b5cf6">{g.count}</Badge>]),
                  ...growthByMonth.slice(-12).map(g => [g.month, <Badge color={SAFFRON}>{g.count}</Badge>])
                ]}
              />
            </SectionBlock>
          </div>
        )}

        {/* ══ GENDER ════════════════════════════════════════════════════════ */}
        {activeTab === 'gender' && (
          <div className="fade-in">
            <SectionBlock title="लिंग अहवाल — Gender Report">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                <ChartCard title="लिंग वितरण (Gender Distribution)">
                  <ResponsiveContainer width="100%" height={300}>
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
const ExportBtn = ({ onClick, icon: Icon, label, color }) => (
  <button onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none',
      background: color, color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
    }}>
    {Icon && <Icon size={16} />} {label}
  </button>
);

export default Reports;
