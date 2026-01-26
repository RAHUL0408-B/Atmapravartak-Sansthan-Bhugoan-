import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMembers, deleteMember } from '../services/memberService';
import { Edit, Trash2, Plus, User, Download } from 'lucide-react';
import addressData from '../data/address_data.json';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const MemberList = () => {
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

    // Dropdown options
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        loadMembers();
        setDistricts(addressData.map(d => d.district));
    }, []);

    useEffect(() => {
        filterData();
    }, [members, filterDistrict, filterTaluka, filterCity, filterStartDate, filterEndDate]);

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
        let result = members;
        if (filterDistrict) result = result.filter(m => m.district === filterDistrict);
        if (filterTaluka) result = result.filter(m => m.taluka === filterTaluka);
        if (filterCity) result = result.filter(m => m.city === filterCity);

        if (filterStartDate) {
            result = result.filter(m => m.joining_date && m.joining_date >= filterStartDate);
        }
        if (filterEndDate) {
            result = result.filter(m => m.joining_date && m.joining_date <= filterEndDate);
        }

        setFilteredMembers(result);
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

    if (loading) return <div className="text-center mt-4">लोड होत आहे...</div>;

    return (
        <div>
            <div className="flex-between mb-4">
                <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>सदस्य यादी (Members List)</h2>
                <div className="flex-gap">
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

            {/* Filters */}
            <div className="card filter-grid" style={{ marginBottom: '20px' }}>
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
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ marginBottom: '10px' }}>
                <strong>एकूण सदस्य: {filteredMembers.length}</strong>
            </div>

            {filteredMembers.length === 0 ? (
                <div className="card text-center">
                    <p>कोणीही सदस्य आढळले नाहीत.</p>
                </div>
            ) : (
                <div className="member-grid">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="card">
                            <div className="member-card-header">
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    backgroundColor: '#eee',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: '15px',
                                    overflow: 'hidden'
                                }}>
                                    {member.photo_url ? (
                                        <img src={member.photo_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <User size={24} color="var(--text-light)" />
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{member.full_name_marathi || member.full_name}</h3>
                                    <small style={{ color: 'var(--text-light)' }}>
                                        {member.city_marathi || member.city}, {member.taluka_marathi || member.taluka}
                                    </small>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#555', paddingLeft: '65px' }}>
                                <p style={{ margin: '4px 0' }}><strong>मोबाईल (Mobile):</strong> {member.mobile || '-'}</p>
                                <p style={{ margin: '4px 0' }}><strong>जिल्हा (District):</strong> {member.district_marathi || member.district}</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <Link to={`/members/edit/${member.id}`} className="btn" style={{ padding: '5px 10px', backgroundColor: '#f0f0f0' }}>
                                    <Edit size={16} />
                                </Link>
                                <button onClick={() => handleDelete(member.id)} className="btn" style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MemberList;
