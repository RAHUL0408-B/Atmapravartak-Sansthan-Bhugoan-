import { Home, Users, Calendar, Wallet, Trash2 } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

const Navigation = () => {
    const location = useLocation();
    const { isAdmin } = useContext(AuthContext);

    const navItems = [
        { path: '/dashboard', label: 'डॅशबोर्ड', labelEn: 'Dashboard', icon: Home },
        { path: '/', label: 'सदस्य', labelEn: 'Members', icon: Users },
        { path: '/programs', label: 'कार्यक्रम', labelEn: 'Programs', icon: Calendar },
        { path: '/collectors', label: 'संकलक', labelEn: 'Collectors', icon: Wallet },
        ...(isAdmin ? [{ path: '/admin/deleted', label: 'हटवलेले', labelEn: 'Deleted', icon: Trash2 }] : [])
    ];

    return (
        <>
            <nav style={{
                background: 'linear-gradient(135deg, #e65c00 0%, #cc5500 100%)',
                padding: '0',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                position: 'relative',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    gap: '0',
                    justifyContent: 'flex-start',
                    flexWrap: 'nowrap',
                    minWidth: 'max-content'
                }}>
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <div key={item.path} style={{ display: 'flex', alignItems: 'center' }}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: 'clamp(10px, 2vw, 14px) clamp(12px, 3vw, 24px)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'transparent',
                                        borderBottom: isActive ? '4px solid #FFD700' : '4px solid transparent',
                                        transition: 'all 0.3s ease',
                                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                                        fontWeight: isActive ? '700' : '500',
                                        position: 'relative',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.15)';
                                            e.currentTarget.style.borderBottomColor = 'rgba(255,215,0,0.5)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.borderBottomColor = 'transparent';
                                        }
                                    }}
                                >
                                    <Icon size={16} style={{ animation: isActive ? 'floatIcon 2s ease-in-out infinite' : 'none', flexShrink: 0 }} />
                                    <span className="nav-label">{item.label}</span>
                                </Link>

                                {/* Decorative Divider */}
                                {index < navItems.length - 1 && (
                                    <div style={{
                                        width: '1px',
                                        height: '20px',
                                        background: 'linear-gradient(180deg, transparent 0%, rgba(255,215,0,0.4) 50%, transparent 100%)',
                                        margin: '0 2px'
                                    }}></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Decorative Bottom Border */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
                    opacity: 0.5
                }}></div>
            </nav>

            {/* Decorative Pattern Below Navigation */}
            <div style={{
                height: '4px',
                background: 'repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 8px, transparent 8px, transparent 16px)',
                opacity: 0.2
            }}></div>
        </>
    );
};

export default Navigation;
