import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollectors, deleteCollector } from '../services/collectorService';
import { Edit, Trash2, Plus, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { exportCollectorsToExcel } from '../utils/exportUtils';

const Collectors = () => {
    const [collectors, setCollectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadCollectors();
    }, []);

    const loadCollectors = async () => {
        try {
            const data = await getCollectors();
            setCollectors(data);
        } catch (err) {
            setError('संकलक यादी लोड करण्यास अयशस्वी (Failed to load collectors)');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('तुम्हाला नक्की हा संकलक काढून टाकायचा आहे का? (Are you sure you want to delete this collector?)')) {
            try {
                await deleteCollector(id);
                setCollectors(collectors.filter(c => c.id !== id));
            } catch (err) {
                alert('संकलक काढताना त्रुटी आली');
            }
        }
    };

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) return <div className="text-center mt-4">लोड होत आहे...</div>;

    return (
        <div>
            <div className="flex-between mb-4">
                <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>संकलक यादी (Collectors List)</h2>
                <div className="flex-gap">
                    {/* Reuse existing export function if compatible, otherwise disable or implement later */}
                    <button onClick={() => exportCollectorsToExcel(collectors, 'Collectors_List.xlsx')} className="btn" style={{ backgroundColor: '#107c41', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> Excel
                    </button>
                    <Link to="/collectors/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> नवीन संकलक जोडा
                    </Link>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ overflowX: 'auto', padding: '0' }}>
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef', textAlign: 'left' }}>
                            <th style={{ padding: '15px', color: '#495057', fontWeight: '600' }}>नाव (Name)</th>
                            <th style={{ padding: '15px', color: '#495057', fontWeight: '600' }}>मोबाईल (Mobile)</th>
                            <th style={{ padding: '15px', color: '#495057', fontWeight: '600' }}>पत्ता (Address)</th>
                            <th style={{ padding: '15px', color: '#495057', fontWeight: '600', width: '40%' }}>कार्यक्षेत्र (Working Area)</th>
                            <th style={{ padding: '15px', color: '#495057', fontWeight: '600' }}>क्रिया (Actions)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {collectors.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center" style={{ padding: '20px' }}>कोणतेही संकलक आढळले नाहीत.</td>
                            </tr>
                        ) : (
                            collectors.map((collector) => (
                                <tr key={collector.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                    <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>{collector.name}</td>
                                    <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>{collector.mobile || '-'}</td>
                                    <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>{collector.address || '-'}</td>
                                    <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>
                                        {collector.assigned_villages && typeof collector.assigned_villages[0] === 'object' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {collector.assigned_villages.map((loc, idx) => (
                                                    <div key={idx} style={{
                                                        backgroundColor: '#f8f9fa',
                                                        padding: '10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #e9ecef'
                                                    }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '4px' }}>
                                                            {loc.taluka}, {loc.district}
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                                            <strong>गावे: </strong>
                                                            {loc.villages && loc.villages.length > 0
                                                                ? loc.villages.join(', ')
                                                                : <span style={{ fontStyle: 'italic', color: '#999' }}>गावे नाहीत</span>
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Backward Compatibility */
                                            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', border: '1px solid #e9ecef' }}>
                                                <div style={{ fontWeight: '600', color: 'var(--primary-color)', marginBottom: '4px' }}>
                                                    {collector.taluka}, {collector.district}
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                                    <strong>गावे: </strong>
                                                    {Array.isArray(collector.assigned_villages)
                                                        ? collector.assigned_villages.join(', ')
                                                        : (collector.assigned_villages || 'गावे नाहीत')
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 15px', verticalAlign: 'top' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <Link to={`/collectors/edit/${collector.id}`} className="btn" style={{ padding: '6px', backgroundColor: '#f0f0f0', color: '#333' }} title="संपादित करा">
                                                <Edit size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(collector.id)} className="btn" style={{ padding: '6px', backgroundColor: '#fee2e2', color: '#dc2626' }} title="हटवा">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Collectors;
