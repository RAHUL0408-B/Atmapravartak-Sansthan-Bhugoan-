import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, login, signInWithGoogle } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 12px 12px 40px',
        borderRadius: 'var(--border-radius)',
        border: '2px solid #ddd',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
    };

    const iconStyle = {
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-light)',
        width: '20px',
        height: '20px',
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            position: 'relative'
        }}>
            {/* Decorative Background Elements */}
            <div style={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                fontSize: '4rem',
                color: 'var(--gold-color)',
                opacity: 0.1,
                animation: 'gentleGlow 4s ease-in-out infinite'
            }}>ॐ</div>
            <div style={{
                position: 'absolute',
                bottom: '10%',
                right: '10%',
                fontSize: '4rem',
                color: 'var(--gold-color)',
                opacity: 0.1,
                animation: 'gentleGlow 4s ease-in-out infinite 2s'
            }}>ॐ</div>

            <div className="card temple-border" style={{
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 8px 24px rgba(255, 153, 51, 0.2)',
                background: 'linear-gradient(to bottom, #ffffff 0%, #fffef9 100%)'
            }}>
                {/* Om Symbol at Top */}
                <div className="om-symbol" style={{
                    fontSize: '3rem',
                    marginBottom: '10px',
                    color: 'var(--primary-color)'
                }}>
                    ॐ
                </div>

                <h2 className="text-center mb-4" style={{
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: '700',
                    fontSize: '1.8rem'
                }}>
                    प्रशासन लॉग इन
                </h2>

                <p className="text-center" style={{
                    color: 'var(--text-light)',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                }}>
                    Admin Login
                </p>

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '20px',
                        background: 'white',
                        border: '2px solid #ddd',
                        borderRadius: 'var(--border-radius)',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.target.style.borderColor = 'var(--gold-color)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google सह साइन इन करा (Sign in with Google)</span>
                </button>

                {/* Decorative Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0',
                    gap: '10px'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--gold-light) 100%)' }}></div>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>किंवा (OR)</span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--gold-light) 0%, transparent 100%)' }}></div>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        padding: '12px',
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        border: '1px solid #fca5a5'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4" style={{ position: 'relative' }}>
                        <Mail style={iconStyle} />
                        <input
                            type="email"
                            placeholder="ईमेल (Email)"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--gold-color)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-4" style={{ position: 'relative' }}>
                        <Lock style={iconStyle} />
                        <input
                            type="password"
                            placeholder="पासवर्ड (Password)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'var(--gold-color)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 0, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#ddd';
                                e.target.style.boxShadow = 'none';
                            }}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                        <Link to="/forgot-password" style={{
                            color: 'var(--primary-color)',
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--gold-color)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}>
                            पासवर्ड विसरलात? (Forgot Password?)
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        marginTop: '10px'
                    }}
                        disabled={loading}>
                        {loading ? 'लॉग इन करत आहे...' : 'लॉग इन करा (Login)'}
                    </button>
                </form>

                <div className="decorative-divider" style={{ margin: '25px 0' }}></div>

                <div className="text-center mt-4">
                    <p style={{ color: 'var(--text-color)' }}>
                        खाते नाही? <Link to="/signup" style={{
                            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: 'bold',
                            textDecoration: 'underline'
                        }}>नवीन खाते तयार करा (Sign Up)</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
