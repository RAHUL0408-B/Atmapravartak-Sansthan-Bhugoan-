import React, { useState, useEffect, useMemo } from 'react';
import { getMembers } from '../services/memberService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  FileText, Download, Printer, Users, MapPin, Building,
  Activity, TrendingUp, Search
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const Reports = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [filters, setFilters] = useState({
    district: '',
    village: '',
    status: '',
    gender: '',
    joinDateStart: '',
    joinDateEnd: '',
    searchTerm: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getMembers();
      // Member form saves village as 'city' and name as 'full_name'
      // We map them here for consistency in the report logic
      const mappedData = data.map(m => ({ 
        ...m, 
        village: m.village || m.city || '',
        name: m.full_name || m.firstName || '',
        status: (m.status || 'active').toLowerCase()
      }));
      setMembers(mappedData);
      setFilteredMembers(mappedData);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueDistricts = [...new Set(members.map(m => m.district).filter(Boolean))].sort();
  const uniqueVillages = [...new Set(members.map(m => m.village).filter(Boolean))].sort();

  useEffect(() => {
    applyFilters();
  }, [filters, members, activeTab]);

  const applyFilters = () => {
    let result = members;

    if (filters.district) {
      result = result.filter(m => m.district === filters.district);
    }
    if (filters.village) {
      result = result.filter(m => m.village === filters.village);
    }
    if (filters.status) {
      const s = filters.status.toLowerCase();
      result = result.filter(m => m.status === s);
    }
    if (filters.gender) {
      result = result.filter(m => m.gender === filters.gender);
    }
    
    const parseDate = (raw) => {
      if (!raw) return null;
      if (raw.toDate) return raw.toDate();
      return new Date(raw);
    };

    if (filters.joinDateStart) {
      const startDate = new Date(filters.joinDateStart);
      result = result.filter(m => {
        const d = parseDate(m.joining_date || m.created_at);
        return d && d >= startDate;
      });
    }
    if (filters.joinDateEnd) {
      const endDate = new Date(filters.joinDateEnd);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(m => {
        const d = parseDate(m.joining_date || m.created_at);
        return d && d <= endDate;
      });
    }

    if (activeTab === 'Search' && filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(m => 
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.mobile && m.mobile.includes(term)) ||
        (m.district && m.district.toLowerCase().includes(term)) ||
        (m.village && m.village.toLowerCase().includes(term)) ||
        (m.memberId && m.memberId.toString().includes(term)) ||
        (m.id && m.id.toString().includes(term))
      );
    }

    setFilteredMembers(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      district: '',
      village: '',
      status: '',
      gender: '',
      joinDateStart: '',
      joinDateEnd: '',
      searchTerm: ''
    });
  };

  // --- Data Computations ---
  
  const totalMembers = filteredMembers.length;
  const activeMembersCount = filteredMembers.filter(m => m.status === 'active').length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const newMembersThisMonth = filteredMembers.filter(m => {
    const d = (m.joining_date || m.created_at)?.toDate ? (m.joining_date || m.created_at).toDate() : new Date(m.joining_date || m.created_at);
    return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const districtData = useMemo(() => {
    const data = {};
    filteredMembers.forEach(m => {
      if (!m.district) return;
      if (!data[m.district]) data[m.district] = { district: m.district, total: 0, active: 0, inactive: 0, villages: new Set() };
      data[m.district].total += 1;
      if (m.status === 'active') data[m.district].active += 1;
      else data[m.district].inactive += 1;
      if (m.village) data[m.district].villages.add(m.village);
    });
    return Object.values(data).map(d => ({ ...d, villageCount: d.villages.size }));
  }, [filteredMembers]);

  const villageData = useMemo(() => {
    const data = {};
    filteredMembers.forEach(m => {
      if (!m.village) return;
      if (!data[m.village]) data[m.village] = { village: m.village, district: m.district || 'Unknown', total: 0, active: 0, inactive: 0 };
      data[m.village].total += 1;
      if (m.status === 'active') data[m.village].active += 1;
      else data[m.village].inactive += 1;
    });
    return Object.values(data);
  }, [filteredMembers]);

  const growthData = useMemo(() => {
    const data = {};
    filteredMembers.forEach(m => {
      const raw = m.joining_date || m.created_at;
      if (!raw) return;
      const d = raw.toDate ? raw.toDate() : new Date(raw);
      const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!data[monthYear]) data[monthYear] = { month: monthYear, members: 0 };
      data[monthYear].members += 1;
    });
    return Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredMembers]);

  const genderData = useMemo(() => {
    const data = { Male: 0, Female: 0, Other: 0 };
    filteredMembers.forEach(m => {
      const g = (m.gender || '').toLowerCase();
      if (g === 'male' || g === 'पुरुष') data.Male += 1;
      else if (g === 'female' || g === 'स्त्री') data.Female += 1;
      else data.Other += 1;
    });
    return [
      { name: 'Male', value: data.Male },
      { name: 'Female', value: data.Female },
      { name: 'Other', value: data.Other }
    ].filter(d => d.value > 0);
  }, [filteredMembers]);

  const sortedDistricts = [...districtData].sort((a, b) => b.total - a.total);
  const sortedVillages = [...villageData].sort((a, b) => b.total - a.total);

  // --- Export Functions ---
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Report: ${activeTab}`, 14, 15);
    let head = [], body = [];

    if (activeTab === 'District') {
      head = [['District', 'Total', 'Active', 'Inactive', 'Villages']];
      body = districtData.map(d => [d.district, d.total, d.active, d.inactive, d.villageCount]);
    } else if (activeTab === 'Village') {
      head = [['Village', 'District', 'Total', 'Active', 'Inactive']];
      body = villageData.map(d => [d.village, d.district, d.total, d.active, d.inactive]);
    } else if (activeTab === 'Search') {
      head = [['Name', 'Mobile', 'District', 'Village', 'Status']];
      body = filteredMembers.map(m => [m.name, m.mobile || '', m.district || '', m.village || '', m.status]);
    } else {
      head = [['Metric', 'Value']];
      body = [['Total Members', totalMembers], ['Active Members', activeMembersCount], ['Districts', districtData.length], ['Villages', villageData.length]];
    }

    doc.autoTable({ startY: 25, head: head, body: body, theme: 'grid' });
    doc.save(`Atma_${activeTab}_Report.pdf`);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredMembers.map(m => ({
      Name: m.name, Mobile: m.mobile, District: m.district, Village: m.village, Status: m.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Atma_Report.xlsx`);
  };

  if (loading) return <div className="text-center py-5">Loading Reports...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#cc5500', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={28} /> Reports & Analytics
        </h2>
        <div style={{ display: 'flex', gap: '10px' }} className="d-print-none">
          <button onClick={exportToPDF} className="btn btn-danger btn-sm">PDF</button>
          <button onClick={exportToExcel} className="btn btn-success btn-sm">Excel</button>
          <button onClick={() => window.print()} className="btn btn-secondary btn-sm">Print</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }} className="d-print-none">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <select name="district" value={filters.district} onChange={handleFilterChange} className="form-select form-select-sm" style={{ width: '150px' }}>
            <option value="">All Districts</option>
            {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select name="village" value={filters.village} onChange={handleFilterChange} className="form-select form-select-sm" style={{ width: '150px' }}>
            <option value="">All Villages</option>
            {uniqueVillages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="form-select form-select-sm" style={{ width: '120px' }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input type="date" name="joinDateStart" value={filters.joinDateStart} onChange={handleFilterChange} className="form-control form-control-sm" style={{ width: '130px' }} />
          <input type="date" name="joinDateEnd" value={filters.joinDateEnd} onChange={handleFilterChange} className="form-control form-control-sm" style={{ width: '130px' }} />
          {activeTab === 'Search' && <input type="text" name="searchTerm" value={filters.searchTerm} onChange={handleFilterChange} placeholder="Search..." className="form-control form-control-sm" style={{ width: '180px' }} />}
          <button onClick={resetFilters} className="btn btn-outline-secondary btn-sm">Reset</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }} className="d-print-none">
        {['Dashboard', 'District', 'Village', 'Maharashtra', 'Hierarchical', 'Growth', 'Gender', 'Search', 'Top'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`btn btn-sm ${activeTab === t ? 'btn-primary' : 'btn-outline-primary'}`} style={{ borderRadius: '20px', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {activeTab === 'Dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <StatCard label="Total Members" value={totalMembers} color="#e3f2fd" icon={<Users />} />
              <StatCard label="Active" value={activeMembersCount} color="#e8f5e9" icon={<Activity />} />
              <StatCard label="Districts" value={districtData.length} color="#fff3e0" icon={<Building />} />
              <StatCard label="Villages" value={villageData.length} color="#f3e5f5" icon={<MapPin />} />
              <StatCard label="New This Month" value={newMembersThisMonth} color="#e0f7fa" icon={<TrendingUp />} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <ChartBox title="District-wise Members" data={districtData.slice(0, 8)} dataKey="total" nameKey="district" />
              <ChartBox title="Monthly Growth" data={growthData} dataKey="members" nameKey="month" type="line" />
            </div>
          </div>
        )}

        {activeTab === 'District' && (
          <div>
            <ReportTable head={['District', 'Total', 'Active', 'Inactive', 'Villages']} body={districtData.map(d => [d.district, d.total, d.active, d.inactive, d.villageCount])} />
            {filters.district && (
              <div style={{ marginTop: '30px' }}>
                <h5 style={{ color: '#cc5500', marginBottom: '15px' }}>Members in {filters.district}</h5>
                <ReportTable head={['Name', 'Mobile', 'Village', 'Status']} body={filteredMembers.map(m => [m.name, m.mobile || '-', m.village || '-', m.status])} />
              </div>
            )}
          </div>
        )}
        {activeTab === 'Village' && (
          <div>
            <ReportTable head={['Village', 'District', 'Total', 'Active', 'Inactive']} body={villageData.map(d => [d.village, d.district, d.total, d.active, d.inactive])} />
            {filters.village && (
              <div style={{ marginTop: '30px' }}>
                <h5 style={{ color: '#cc5500', marginBottom: '15px' }}>Members in {filters.village}</h5>
                <ReportTable head={['Name', 'Mobile', 'District', 'Status']} body={filteredMembers.map(m => [m.name, m.mobile || '-', m.district || '-', m.status])} />
              </div>
            )}
          </div>
        )}
        {activeTab === 'Maharashtra' && (
          <div style={{ maxWidth: '400px' }}>
            <SummaryItem label="Total Districts Covered" value={districtData.length} />
            <SummaryItem label="Total Villages Covered" value={villageData.length} />
            <SummaryItem label="Total Members in Maharashtra" value={totalMembers} />
          </div>
        )}
        {activeTab === 'Hierarchical' && (
          <div>
            {districtData.map(d => (
              <div key={d.district} style={{ marginBottom: '15px', border: '1px solid #eee', borderRadius: '5px' }}>
                <div style={{ background: '#f8f9fa', padding: '10px', fontWeight: 'bold' }}>{d.district} ({d.total})</div>
                <div style={{ padding: '10px' }}>
                  {villageData.filter(v => v.district === d.district).map(v => (
                    <div key={v.village} style={{ marginLeft: '20px', borderLeft: '2px solid #ddd', paddingLeft: '10px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: '500' }}>🏘️ {v.village} ({v.total})</div>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginLeft: '15px' }}>
                        {members.filter(m => m.district === d.district && m.village === v.village).map(m => m.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Growth' && <ReportTable head={['Month', 'New Members']} body={growthData.map(d => [d.month, d.members])} />}
        {activeTab === 'Gender' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
            <ReportTable head={['Gender', 'Count']} body={genderData.map(d => [d.name, d.value])} />
            <div style={{ width: '250px', height: '250px' }}>
              <ResponsiveContainer><PieChart><Pie data={genderData} dataKey="value" nameKey="name" label>{genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </div>
          </div>
        )}
        {activeTab === 'Search' && <ReportTable head={['Name', 'Mobile', 'District', 'Village', 'Status']} body={filteredMembers.slice(0, 100).map(m => [m.name, m.mobile, m.district, m.village, m.status])} />}
        {activeTab === 'Top' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <StatCard label="Top District" value={sortedDistricts[0]?.district} subValue={`${sortedDistricts[0]?.total} members`} color="#e8f5e9" />
            <StatCard label="Top Village" value={sortedVillages[0]?.village} subValue={`${sortedVillages[0]?.total} members`} color="#e8f5e9" />
            <StatCard label="Lowest District" value={sortedDistricts[sortedDistricts.length - 1]?.district} subValue={`${sortedDistricts[sortedDistricts.length - 1]?.total} members`} color="#fff3e0" />
            <StatCard label="Lowest Village" value={sortedVillages[sortedVillages.length - 1]?.village} subValue={`${sortedVillages[sortedVillages.length - 1]?.total} members`} color="#fff3e0" />
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon, subValue }) => (
  <div style={{ background: color, padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
    <div style={{ color: '#555', marginBottom: '5px' }}>{icon}</div>
    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{value}</div>
    <div style={{ fontSize: '0.8rem', color: '#666' }}>{label}</div>
    {subValue && <div style={{ fontSize: '0.75rem', color: '#888' }}>{subValue}</div>}
  </div>
);

const ChartBox = ({ title, data, dataKey, nameKey, type = 'bar' }) => (
  <div style={{ flex: '1 1 45%', minWidth: '300px', background: '#fafafa', padding: '15px', borderRadius: '8px' }}>
    <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', textAlign: 'center' }}>{title}</div>
    <div style={{ height: '200px' }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' ? (
          <BarChart data={data}><XAxis dataKey={nameKey} tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey={dataKey} fill="#8884d8" /></BarChart>
        ) : (
          <LineChart data={data}><XAxis dataKey={nameKey} tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey={dataKey} stroke="#82ca9d" /></LineChart>
        )}
      </ResponsiveContainer>
    </div>
  </div>
);

const ReportTable = ({ head, body }) => (
  <div className="table-responsive">
    <table className="table table-sm table-bordered table-striped">
      <thead className="table-dark"><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{body.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

const SummaryItem = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
    <span>{label}</span>
    <span className="badge bg-primary">{value}</span>
  </div>
);

export default Reports;
