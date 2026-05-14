import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { getMembers, deleteMember } from '../services/memberService';
import { Edit, Trash2, Plus, User, Download, Search, X, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import addressData from '../data/address_data.json';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { exportToCSV } from '../utils/csvExport';

const MemberList = () => {
    const { isAdmin } = useContext(AuthContext);
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterTaluka, setFilterTaluka] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterAge, setFilterAge] = useState('');

    // New Filters
    const [filterRegistrationOrder, setFilterRegistrationOrder] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [filterAgeGroup, setFilterAgeGroup] = useState('');
    const [filterYear, setFilterYear] = useState('');

    // Global search
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const searchDebounceRef = useRef(null);

    // Sorting
    const [sortField, setSortField] = useState('');
    const [sortDir, setSortDir] = useState('asc');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Dropdown options
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        loadMembers();
        setDistricts(addressData.map(d => d.district));
    }, []);

    // Debounce global search input
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setSearchTerm(globalSearch);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(searchDebounceRef.current);
    }, [globalSearch]);

    useEffect(() => {
        filterData();
        setCurrentPage(1);
    }, [members, filterDistrict, filterTaluka, filterCity, filterStartDate, filterEndDate, filterAge, filterRegistrationOrder, filterGender, filterAgeGroup, filterYear, searchTerm, sortField, sortDir]);

    // Update Talukas when District changes
    useEffect(() => {
        if (filterDistrict) {
            const selectedDistrict = addressData.find(d => d.district === filterDistrict);
            setTalukas(selectedDistrict ? selectedDistrict.talukas.map(t => t.name) : []);
            setFilterTaluka('');
            setFilterCity('');
        } else {
            setTalukas([]);
        }
    }, [filterDistrict]);

    // Update Cities when Taluka changes
    useEffect(() => {
        if (filterDistrict && filterTaluka) {
            const selectedDistrict = addressData.find(d => d.district === filterDistrict);
            const selectedTaluka = selectedDistrict?.talukas.find(t => t.name === filterTaluka);
            setCities(selectedTaluka ? selectedTaluka.cities : []);
            setFilterCity('');
        } else {
            setCities([]);
        }
    }, [filterTaluka, filterDistrict]);

    const calculateAge = (dob) => {
        if (!dob) return null;
        try {
            const birthDate = new Date(dob);
            if (isNaN(birthDate.getTime())) return null;
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        } catch (e) {
            return null;
        }
    };

    const uniqueYears = useMemo(() => {
        const years = members
            .map(m => {
                const date = m.joining_date ? new Date(m.joining_date) : null;
                return date && !isNaN(date.getTime()) ? date.getFullYear() : null;
            })
            .filter(y => y !== null && y > 1900 && y < 2100);
        return [...new Set(years)].sort((a, b) => b - a);
    }, [members]);

    const loadMembers = async () => {
        try {
            const data = await getMembers();
            setMembers(data);
        } catch (err) {
            setError('सदस्य लोड करण्यास अयशस्वी');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = [...members];

        // ── Existing column filters ──
        if (filterDistrict) result = result.filter(m => m.district === filterDistrict);
        if (filterTaluka)   result = result.filter(m => m.taluka === filterTaluka);
        if (filterCity)     result = result.filter(m => m.city === filterCity);
        if (filterStartDate) result = result.filter(m => m.joining_date && m.joining_date >= filterStartDate);
        if (filterEndDate)   result = result.filter(m => m.joining_date && m.joining_date <= filterEndDate);
        if (filterAge) {
            result = result.filter(m => {
                const age = calculateAge(m.date_of_birth);
                return age !== null && age.toString() === filterAge;
            });
        }
        if (filterGender) result = result.filter(m => m.gender === filterGender);
        if (filterAgeGroup) {
            result = result.filter(m => {
                const age = calculateAge(m.date_of_birth);
                if (age === null) return false;
                if (filterAgeGroup === '18-25') return age >= 18 && age <= 25;
                if (filterAgeGroup === '26-35') return age >= 26 && age <= 35;
                if (filterAgeGroup === '36-50') return age >= 36 && age <= 50;
                if (filterAgeGroup === '50+')   return age > 50;
                return true;
            });
        }
        if (filterYear) {
            result = result.filter(m => {
                const date = m.joining_date ? new Date(m.joining_date) : null;
                return date && !isNaN(date.getTime()) && date.getFullYear().toString() === filterYear;
            });
        }

        // ── Global live search across all text fields ──
        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            result = result.filter(m => {
                const addr = [m.address_line1, m.address_line1_marathi, m.address_line2, m.address_line2_marathi].filter(Boolean).join(' ');
                return [
                    m.full_name, m.full_name_marathi,
                    m.city, m.city_marathi,
                    m.post_office, m.post_office_marathi,
                    m.taluka, m.taluka_marathi,
                    m.district, m.district_marathi,
                    m.state, m.state_marathi,
                    m.mobile, m.pincode,
                    m.joining_date, addr
                ].some(val => val && val.toString().toLowerCase().includes(q));
            });
        }

        // ── Registration order sort (existing) ──
        if (filterRegistrationOrder === 'first') {
            result = result.slice().sort((a, b) => (a.created_at?.seconds ?? 0) - (b.created_at?.seconds ?? 0));
        } else if (filterRegistrationOrder === 'latest') {
            result = result.slice().sort((a, b) => (b.created_at?.seconds ?? 0) - (a.created_at?.seconds ?? 0));
        }

        // ── Column sort (overrides registration order if both set) ──
        if (sortField) {
            result = result.slice().sort((a, b) => {
                let aVal = '', bVal = '';
                if (sortField === 'name')     { aVal = a.full_name_marathi || a.full_name || ''; bVal = b.full_name_marathi || b.full_name || ''; }
                else if (sortField === 'date')     { aVal = a.joining_date || ''; bVal = b.joining_date || ''; }
                else if (sortField === 'city')     { aVal = a.city_marathi || a.city || ''; bVal = b.city_marathi || b.city || ''; }
                else if (sortField === 'taluka')   { aVal = a.taluka_marathi || a.taluka || ''; bVal = b.taluka_marathi || b.taluka || ''; }
                else if (sortField === 'district') { aVal = a.district_marathi || a.district || ''; bVal = b.district_marathi || b.district || ''; }
                else if (sortField === 'state')    { aVal = a.state_marathi || a.state || ''; bVal = b.state_marathi || b.state || ''; }
                else if (sortField === 'mobile')   { aVal = a.mobile || ''; bVal = b.mobile || ''; }
                else if (sortField === 'age')      { aVal = calculateAge(a.date_of_birth) ?? 0; bVal = calculateAge(b.date_of_birth) ?? 0; }
                if (typeof aVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
                return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            });
        }

        setFilteredMembers(result);
    };

    // Toggle sort field/direction
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    // Sort icon helper
    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4, marginLeft: 3 }} />;
        return sortDir === 'asc'
            ? <ChevronUp size={13} style={{ color: 'var(--primary-color)', marginLeft: 3 }} />
            : <ChevronDown size={13} style={{ color: 'var(--primary-color)', marginLeft: 3 }} />;
    };

    // Pagination computed values
    const totalFiltered = filteredMembers.length;
    const totalPages = pageSize === 0 ? 1 : Math.ceil(totalFiltered / pageSize);
    const paginatedMembers = pageSize === 0
        ? filteredMembers
        : filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset button condition
    const hasActiveFilters = filterDistrict || filterTaluka || filterCity || filterStartDate ||
        filterEndDate || filterAge || filterRegistrationOrder || filterGender || filterAgeGroup || filterYear || globalSearch;

    const resetAll = () => {
        setFilterDistrict(''); setFilterTaluka(''); setFilterCity('');
        setFilterStartDate(''); setFilterEndDate(''); setFilterAge('');
        setFilterRegistrationOrder(''); setFilterGender(''); setFilterAgeGroup('');
        setFilterYear('');
        setGlobalSearch(''); setSearchTerm(''); setSortField(''); setSortDir('asc');
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        if (window.confirm('तुम्हाला नक्की हा सदस्य काढून टाकायचा आहे का?')) {
            try {
                await deleteMember(id);
                setMembers(members.filter(m => m.id !== id));
            } catch (err) {
                alert('सदस्य काढताना त्रुटी आली');
            }
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '12px' }}>
            <div className="ml-spinner" />
            <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>सदस्य लोड होत आहे...</span>
        </div>
    );

    return (
        <div>
            <div className="flex-between mb-4">
                <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>सदस्य यादी (Members List)</h2>
                <div className="flex-gap">
                    <button onClick={() => exportToCSV(filteredMembers)} className="btn" style={{ backgroundColor: '#0078d4', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> CSV
                    </button>
                    <button onClick={() => exportToExcel(filteredMembers)} className="btn" style={{ backgroundColor: '#107c41', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> Excel
                    </button>
                    <button onClick={() => exportToPDF(filteredMembers)} className="btn" style={{ backgroundColor: '#b30b00', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> PDF
                    </button>
                    <Link to="/members/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> सदस्य जोडा
                    </Link>
                </div>
            </div>

            {/* Global Search Bar */}
            <div className="card" style={{ marginBottom: '15px', padding: '12px 20px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', color: '#888' }} />
                    <input
                        type="text"
                        placeholder="येथे काहीही शोधा... (नाव, मोबाईल, जिल्हा, गाव, इ.)"
                        value={globalSearch}
                        onChange={(e) => setGlobalSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 15px 10px 40px',
                            borderRadius: '25px',
                            border: '2px solid #eee',
                            outline: 'none',
                            fontSize: '1rem',
                            transition: 'border-color 0.3s'
                        }}
                        className="global-search-input"
                    />
                    {globalSearch && (
                        <button 
                            onClick={() => setGlobalSearch('')}
                            style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#888', display: 'flex', alignItems: 'center' }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '20px' }}>
                {/* Section Label */}
                <div style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--primary-color)', fontSize: '0.9rem', borderBottom: '1px solid var(--gold-light)', paddingBottom: '8px' }}>
                    🔍 फिल्टर पर्याय (Filter Options)
                </div>
                <div className="filter-grid">
                    {/* ── Existing Filters ── */}
                    <select value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="">सर्व जिल्हे (All Districts)</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select value={filterTaluka} onChange={(e) => setFilterTaluka(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} disabled={!filterDistrict}>
                        <option value="">सर्व तालुके (All Talukas)</option>
                        {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} disabled={!filterTaluka}>
                        <option value="">सर्व गावे (All Villages)</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>पासून (From):</span>
                        <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>पर्यंत (To):</span>
                        <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>वय (Age):</span>
                        <input
                            type="number"
                            placeholder="उदा. 25"
                            value={filterAge}
                            onChange={(e) => setFilterAge(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                        />
                    </div>

                    {/* ── New Filter 1: Registration Order ── */}
                    <select
                        value={filterRegistrationOrder}
                        onChange={(e) => setFilterRegistrationOrder(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        title="नोंदणी क्रम (Registration Order)"
                    >
                        <option value="">नोंदणी क्रम (Registration Order)</option>
                        <option value="first">प्रथम नोंदणी (First Registered)</option>
                        <option value="latest">अलीकडील नोंदणी (Latest Registered)</option>
                    </select>

                    {/* ── New Filter 2: Gender ── */}
                    <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        title="लिंग (Gender)"
                    >
                        <option value="">सर्व लिंग (All Genders)</option>
                        <option value="Male">पुरुष (Male)</option>
                        <option value="Female">महिला (Female)</option>
                        <option value="Other">इतर (Other)</option>
                    </select>

                    {/* ── New Filter 3: Age Group ── */}
                    <select
                        value={filterAgeGroup}
                        onChange={(e) => setFilterAgeGroup(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        title="वय गट (Age Group)"
                    >
                        <option value="">सर्व वय गट (All Age Groups)</option>
                        <option value="18-25">१८–२५ वर्षे (18–25)</option>
                        <option value="26-35">२६–३५ वर्षे (26–35)</option>
                        <option value="36-50">३६–५० वर्षे (36–50)</option>
                        <option value="50+">५०+ वर्षे (50+)</option>
                    </select>

                    {/* ── New Filter 4: Registration Year ── */}
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        title="नोंदणी वर्ष (Year)"
                    >
                        <option value="">सर्व वर्षे (All Years)</option>
                        {uniqueYears.map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                        ))}
                    </select>

                    {/* ── New Filter 5: Village Member Count (info badge) ── */}
                    {filterCity && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--gold-light)',
                            border: '1px solid var(--gold-color)',
                            fontWeight: '600',
                            color: 'var(--secondary-color)',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap'
                        }}>
                            🏘️ {filterCity}:<span style={{ color: 'var(--primary-dark)', marginLeft: '4px' }}>{filteredMembers.length} सदस्य</span>
                        </div>
                    )}

                    {/* ── Reset All Filters ── */}
                    {hasActiveFilters && (
                        <button
                            onClick={resetAll}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '4px',
                                border: '1px solid #dc2626',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            ✕ सर्व फिल्टर साफ करा (Reset All)
                        </button>
                    )}
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="flex-between" style={{ marginBottom: '10px' }}>
                <div>
                    <strong>एकूण सदस्य: {totalFiltered}</strong>
                    {totalFiltered > 0 && pageSize > 0 && (
                        <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.9rem' }}>
                            (दाखवत आहे: {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalFiltered)})
                        </span>
                    )}
                </div>
                
                {totalFiltered > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>प्रति पृष्ठ:</span>
                        <select 
                            value={pageSize} 
                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                            style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={0}>सर्व (All)</option>
                        </select>
                    </div>
                )}
            </div>

            {totalFiltered === 0 ? (
                <div className="card text-center" style={{ padding: '20px' }}>
                    <p>कोणीही सदस्य आढळले नाहीत.</p>
                </div>
            ) : (
                <>
                    <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: '#495057', fontWeight: '600', width: '50px' }}>अ.क्र.</th>
                                    <th onClick={() => handleSort('date')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        अनु.दिनांक <SortIcon field="date" />
                                    </th>
                                    <th onClick={() => handleSort('name')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        सभासदाचे नाव <SortIcon field="name" />
                                    </th>
                                    <th onClick={() => handleSort('city')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        गाव <SortIcon field="city" />
                                    </th>
                                    <th style={{ padding: '12px', color: '#495057', fontWeight: '600' }}>पोस्ट</th>
                                    <th onClick={() => handleSort('taluka')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        तालुका <SortIcon field="taluka" />
                                    </th>
                                    <th onClick={() => handleSort('district')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        जिल्हा <SortIcon field="district" />
                                    </th>
                                    <th onClick={() => handleSort('state')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        राज्य <SortIcon field="state" />
                                    </th>
                                    <th onClick={() => handleSort('age')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        वय (Age) <SortIcon field="age" />
                                    </th>
                                    <th onClick={() => handleSort('mobile')} style={{ padding: '12px', color: '#495057', fontWeight: '600', cursor: 'pointer' }}>
                                        मोबाईल नंबर <SortIcon field="mobile" />
                                    </th>
                                    <th style={{ padding: '12px', color: '#495057', fontWeight: '600' }}>पत्ता</th>
                                    <th style={{ padding: '12px', color: '#495057', fontWeight: '600' }}>क्रिया (Actions)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedMembers.map((member, index) => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid #e9ecef' }} className="table-row-hover">
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', fontWeight: 'bold', color: '#666' }}>
                                            {pageSize === 0 ? index + 1 : (currentPage - 1) * pageSize + (index + 1)}
                                        </td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.joining_date || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#eee',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    overflow: 'hidden',
                                                    flexShrink: 0
                                                }}>
                                                    {member.photo_url ? (
                                                        <img src={member.photo_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={14} color="var(--text-light)" />
                                                    )}
                                                </div>
                                                <span style={{ fontWeight: '500' }}>{member.full_name_marathi || member.full_name}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.city_marathi || member.city || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.post_office_marathi || member.post_office || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.taluka_marathi || member.taluka || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.district_marathi || member.district || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.state_marathi || member.state || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{calculateAge(member.date_of_birth) || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>{member.mobile || '-'}</td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', maxWidth: '200px' }}>
                                            {member.address_line1_marathi || member.address_line1} {member.address_line2_marathi || member.address_line2 ? `, ${member.address_line2_marathi || member.address_line2}` : ''}
                                        </td>
                                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <Link to={`/members/edit/${member.id}`} className="btn" style={{ padding: '4px', backgroundColor: '#f0f0f0', color: '#333' }} title="संपादित करा">
                                                    <Edit size={14} />
                                                </Link>
                                                {isAdmin && (
                                                    <button onClick={() => handleDelete(member.id)} className="btn" style={{ padding: '4px', backgroundColor: '#fee2e2', color: '#dc2626' }} title="हटवा">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pageSize > 0 && totalPages > 1 && (
                        <div className="flex-between" style={{ marginTop: '20px', padding: '10px' }}>
                            <div style={{ color: '#666', fontSize: '0.9rem' }}>
                                पृष्ठ {currentPage} पैकी {totalPages}
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn"
                                    style={{ padding: '5px 12px', backgroundColor: currentPage === 1 ? '#eee' : '#fff', border: '1px solid #ddd', color: currentPage === 1 ? '#aaa' : '#333' }}
                                >
                                    मागे (Prev)
                                </button>
                                
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) pageNum = i + 1;
                                    else if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                    
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="btn"
                                            style={{ 
                                                padding: '5px 12px', 
                                                backgroundColor: currentPage === pageNum ? 'var(--primary-color)' : '#fff', 
                                                border: '1px solid #ddd', 
                                                color: currentPage === pageNum ? '#fff' : '#333' 
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn"
                                    style={{ padding: '5px 12px', backgroundColor: currentPage === totalPages ? '#eee' : '#fff', border: '1px solid #ddd', color: currentPage === totalPages ? '#aaa' : '#333' }}
                                >
                                    पुढील (Next)
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MemberList;
