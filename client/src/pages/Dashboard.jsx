import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Calendar, Plus } from 'lucide-react';
import { getMembers } from '../services/memberService';
import { getCollectors } from '../services/collectorService';
import { getPrograms } from '../services/programService';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalPrograms: 0,
        totalCollectors: 0,
        recentMembers: [],
        recentPrograms: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            // Parallel data fetching for performance
            const [members, programs, collectors] = await Promise.all([
                getMembers().catch(err => { console.error('Error loading members', err); return []; }),
                getPrograms().catch(err => { console.error('Error loading programs', err); return []; }),
                getCollectors().catch(err => { console.error('Error loading collectors', err); return []; })
            ]);

            const sortedMembers = [...members].sort((a, b) =>
                new Date(b.joining_date || 0) - new Date(a.joining_date || 0)
            );

            // Sort programs by date (assuming ISO format or similar)
            const sortedPrograms = [...programs].sort((a, b) =>
                new Date(a.date || 0) - new Date(b.date || 0)
            ).filter(p => new Date(p.date) >= new Date().setHours(0, 0, 0, 0));

            setStats({
                totalMembers: members.length,
                totalPrograms: programs.length,
                totalCollectors: collectors.length,
                recentMembers: sortedMembers.slice(0, 5),
                recentPrograms: sortedPrograms.slice(0, 5)
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-4">लोड होत आहे...</div>;

    return (
        <div>
            {/* Welcome Section */}
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '5px',
                    fontWeight: '700',
                    fontSize: '2rem'
                }}>स्वागत आहे</h2>
                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>डॅशबोर्ड</p>
            </div>

            {/* Decorative Divider */}
            <div className="decorative-divider" style={{ margin: '20px 0 30px 0' }}></div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                {/* Total Members Card */}
                <div className="card corner-decoration" style={{
                    background: 'linear-gradient(135deg, #FF9933 0%, #ff7700 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '4px solid #FFD700'
                }}>
                    {/* Decorative Pattern Overlay */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(30%, -30%)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '2.8rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>
                                    {stats.totalMembers}
                                </h3>
                                <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.95, fontWeight: '600' }}>सदस्य संख्या</p>
                            </div>
                            <Users size={45} style={{ opacity: 0.3, animation: 'floatIcon 3s ease-in-out infinite' }} />
                        </div>
                        <TrendingUp size={22} style={{ marginTop: '15px', opacity: 0.9 }} />
                    </div>
                </div>

                {/* Programs Card */}
                <div className="card corner-decoration" style={{
                    background: 'linear-gradient(135deg, #4285f4 0%, #3367d6 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '4px solid #5a9fff'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(30%, -30%)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '2.8rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>{stats.totalPrograms}</h3>
                                <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.95, fontWeight: '600' }}>कार्यक्रम संख्या</p>
                            </div>
                            <Calendar size={45} style={{ opacity: 0.3, animation: 'floatIcon 3s ease-in-out infinite 0.5s' }} />
                        </div>
                        <TrendingUp size={22} style={{ marginTop: '15px', opacity: 0.9 }} />
                    </div>
                </div>

                {/* Collectors Card */}
                <div className="card corner-decoration" style={{
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    borderTop: '4px solid #d500f9'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(30%, -30%)'
                    }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '2.8rem', margin: '0 0 5px 0', fontWeight: 'bold' }}>{stats.totalCollectors}</h3>
                                <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.95, fontWeight: '600' }}>एकूण संकलक</p>
                            </div>
                            <Users size={45} style={{ opacity: 0.3, animation: 'floatIcon 3s ease-in-out infinite 1s' }} />
                        </div>
                        <TrendingUp size={22} style={{ marginTop: '15px', opacity: 0.9 }} />
                    </div>
                </div>

                {/* Add New Member Card */}
                <Link to="/members/add" style={{ textDecoration: 'none' }}>
                    <div className="card corner-decoration" style={{
                        background: 'linear-gradient(135deg, #34a853 0%, #2d8e47 100%)',
                        color: 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%',
                        borderTop: '4px solid #5ec878',
                        transition: 'all 0.3s ease'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(52, 168, 83, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '';
                        }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '140px'
                        }}>
                            <Plus size={52} style={{ marginBottom: '12px', animation: 'pulse 2s ease-in-out infinite' }} />
                            <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>नवीन सदस्य</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', opacity: 0.95 }}>नवीन सदस्य जोडा</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Decorative Divider */}
            <div className="decorative-divider" style={{ margin: '30px 0' }}></div>

            {/* Recent Members Section */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{
                        margin: 0,
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '700',
                        fontSize: '1.3rem'
                    }}>
                        <Users size={22} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-color)' }} />
                        अलीकडील सदस्य
                    </h3>
                    <Link to="/" style={{
                        color: 'var(--primary-color)',
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                    }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--gold-color)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}>
                        सर्व पहा →
                    </Link>
                </div>

                {stats.recentMembers.length === 0 ? (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
                        नवीन सदस्य जोडा
                    </p>
                ) : (
                    <div>
                        {stats.recentMembers.map((member, index) => (
                            <div
                                key={member.id}
                                style={{
                                    padding: '16px',
                                    backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                                    borderRadius: '6px',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: '3px solid var(--gold-light)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderLeftColor = 'var(--gold-color)';
                                    e.currentTarget.style.backgroundColor = '#fff9e6';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderLeftColor = 'var(--gold-light)';
                                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fafafa' : 'white';
                                }}
                            >
                                <div>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-color)' }}>{member.full_name_marathi || member.full_name}</strong>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                        {member.city_marathi || member.city}, {member.taluka_marathi || member.taluka}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-light)',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: 'var(--gold-light)',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontWeight: '500'
                                }}>
                                    {member.joining_date || '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Decorative Divider */}
            <div className="decorative-divider" style={{ margin: '30px 0' }}></div>

            {/* Upcoming Programs Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{
                        margin: 0,
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontWeight: '700',
                        fontSize: '1.3rem'
                    }}>
                        <Calendar size={22} style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-color)' }} />
                        आगामी कार्यक्रम
                    </h3>
                    <Link to="/programs" style={{
                        color: 'var(--primary-color)',
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                    }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--gold-color)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}>
                        कार्यक्रम पहा →
                    </Link>
                </div>
                {stats.recentPrograms.length === 0 ? (
                    <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>
                        नवीन कार्यक्रम जोडा
                    </p>
                ) : (
                    <div>
                        {stats.recentPrograms.map((program, index) => (
                            <div
                                key={program.id}
                                style={{
                                    padding: '16px',
                                    backgroundColor: index % 2 === 0 ? '#fafafa' : 'white',
                                    borderRadius: '6px',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: '3px solid #4285f4',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-color)' }}>{program.title}</strong>
                                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                                        {program.location} | {program.taluka}
                                    </p>
                                </div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'white',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: '#4285f4',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    fontWeight: '500'
                                }}>
                                    {program.date || '-'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
