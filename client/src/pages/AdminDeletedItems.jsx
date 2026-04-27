import { useState, useEffect, useContext } from 'react';
import { Trash2, RefreshCw, Users, Calendar, Wallet } from 'lucide-react';
import AuthContext from '../contexts/AuthContext';
import { getDeletedMembers, restoreMember } from '../services/memberService';
import { getDeletedPrograms, restoreProgram } from '../services/programService';
import { getDeletedCollectors, restoreCollector } from '../services/collectorService';

const AdminDeletedItems = () => {
    const { isAdmin, loading: authLoading } = useContext(AuthContext);
    const [deletedItems, setDeletedItems] = useState({
        members: [],
        programs: [],
        collectors: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');

    useEffect(() => {
        if (!authLoading && isAdmin) {
            loadDeletedData();
        }
    }, [authLoading, isAdmin]);

    const loadDeletedData = async () => {
        setLoading(true);
        try {
            const [members, programs, collectors] = await Promise.all([
                getDeletedMembers(),
                getDeletedPrograms(),
                getDeletedCollectors()
            ]);
            setDeletedItems({ members, programs, collectors });
        } catch (error) {
            console.error('Error loading deleted items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (type, id) => {
        if (!window.confirm('तुम्हाला हे रेकॉर्ड पुनर्संचयित करायचे आहे का? (Do you want to restore this record?)')) return;

        try {
            if (type === 'members') await restoreMember(id);
            else if (type === 'programs') await restoreProgram(id);
            else if (type === 'collectors') await restoreCollector(id);

            // Reload data
            loadDeletedData();
        } catch (error) {
            alert('पुनर्संचयित करण्यात त्रुटी आली. (Error restoring record)');
        }
    };

    if (authLoading || loading) return <div className="text-center mt-4">लोड होत आहे...</div>;
    if (!isAdmin) return <div className="text-center mt-4">तुम्हाला या पृष्ठावर प्रवेश करण्याची परवानगी नाही.</div>;

    const renderEmpty = () => (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            कोणतेही हटवलेले आयटम सापडले नाहीत. (No deleted items found.)
        </div>
    );

    return (
        <div className="admin-deleted-items">
            <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>हटावलेले रेकॉर्ड्स (Deleted Records)</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <button
                    onClick={() => setActiveTab('members')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'members' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'members' ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}
                >
                    <Users size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> सदस्य ({deletedItems.members.length})
                </button>
                <button
                    onClick={() => setActiveTab('programs')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'programs' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'programs' ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}
                >
                    <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> कार्यक्रम ({deletedItems.programs.length})
                </button>
                <button
                    onClick={() => setActiveTab('collectors')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'collectors' ? 'var(--primary-color)' : 'transparent',
                        color: activeTab === 'collectors' ? 'white' : 'var(--text-color)',
                        cursor: 'pointer',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}
                >
                    <Wallet size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> संकलक ({deletedItems.collectors.length})
                </button>
            </div>

            {/* List */}
            <div className="card">
                {activeTab === 'members' && (
                    deletedItems.members.length === 0 ? renderEmpty() : (
                        deletedItems.members.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
                                <div>
                                    <strong>{item.full_name_marathi || item.full_name}</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>{item.city_marathi || item.city}</p>
                                </div>
                                <button
                                    onClick={() => handleRestore('members', item.id)}
                                    className="btn btn-sm"
                                    style={{ backgroundColor: 'var(--success-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <RefreshCw size={16} /> पुनर्संचयित करा (Restore)
                                </button>
                            </div>
                        ))
                    )
                )}

                {activeTab === 'programs' && (
                    deletedItems.programs.length === 0 ? renderEmpty() : (
                        deletedItems.programs.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
                                <div>
                                    <strong>{item.title}</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>{item.location} | {item.date}</p>
                                </div>
                                <button
                                    onClick={() => handleRestore('programs', item.id)}
                                    className="btn btn-sm"
                                    style={{ backgroundColor: 'var(--success-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <RefreshCw size={16} /> पुनर्संचयित करा (Restore)
                                </button>
                            </div>
                        ))
                    )
                )}

                {activeTab === 'collectors' && (
                    deletedItems.collectors.length === 0 ? renderEmpty() : (
                        deletedItems.collectors.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', borderBottom: '1px solid #eee' }}>
                                <div>
                                    <strong>{item.name}</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>{item.area}</p>
                                </div>
                                <button
                                    onClick={() => handleRestore('collectors', item.id)}
                                    className="btn btn-sm"
                                    style={{ backgroundColor: 'var(--success-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    <RefreshCw size={16} /> पुनर्संचयित करा (Restore)
                                </button>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};

export default AdminDeletedItems;
