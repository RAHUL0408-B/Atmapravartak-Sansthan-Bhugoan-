import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import AuthContext from '../contexts/AuthContext';

const Header = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <header style={{
                background: 'linear-gradient(135deg, #FF9933 0%, #e65c00 100%)',
                color: 'white',
                padding: '1rem 0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                borderBottom: '3px solid #FFD700',
                position: 'relative'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '0 10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '0' }}>
                        <img
                            src="/Trust_logo.png"
                            alt="Trust Logo"
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                border: '3px solid #FFD700',
                                boxShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 4px 8px rgba(0,0,0,0.3)',
                                animation: 'pulse 3s ease-in-out infinite',
                                flexShrink: 0
                            }}
                        />

                        <h1 style={{
                            fontSize: 'clamp(0.9rem, 2.5vw, 1.5rem)',
                            margin: 0,
                            flex: 1,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            fontWeight: '700',
                            lineHeight: '1.3',
                            minWidth: '0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            श्री संत विदेही मोतीराम बाबा आत्मप्रवर्तक संस्थान भुगांव पंढरपूर - सदस्य पोर्टल
                        </h1>
                    </div>

                    {user && (
                        <button
                            onClick={handleLogout}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                border: '2px solid rgba(255,215,0,0.5)',
                                transition: 'all 0.3s ease',
                                fontWeight: '600',
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255,215,0,0.3)';
                                e.target.style.borderColor = '#FFD700';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.2)';
                                e.target.style.borderColor = 'rgba(255,215,0,0.5)';
                            }}
                        >
                            <LogOut size={16} />
                            <span>बाहेर पडा</span>
                        </button>
                    )}
                </div>

                {/* Decorative Bottom Border */}
                <div style={{
                    position: 'absolute',
                    bottom: '-3px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #FF9933 0%, #FFD700 25%, #FFD700 75%, #FF9933 100%)',
                    boxShadow: '0 2px 4px rgba(255, 215, 0, 0.3)'
                }}></div>
            </header>

            {/* Decorative Pattern Below Header */}
            <div style={{
                height: '8px',
                background: 'repeating-linear-gradient(90deg, #FFD700 0px, #FFD700 10px, transparent 10px, transparent 20px)',
                opacity: 0.3
            }}></div>
        </>
    );
};

export default Header;
