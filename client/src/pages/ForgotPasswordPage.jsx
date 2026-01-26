import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('पासवर्ड रीसेट लिंक तुमच्या ईमेलवर पाठवली आहे. कृपया तुमचा इनबॉक्स तपासा.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            let errorMessage = 'पासवर्ड रीसेट अयशस्वी. कृपया पुन्हा प्रयत्न करा.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'या ईमेलसह कोणतेही खाते आढळले नाही.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'अवैध ईमेल पत्ता.';
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
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
                    पासवर्ड विसरलात?
                </h2>

                <p className="text-center" style={{
                    color: 'var(--text-light)',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem'
                }}>
                    Forgot Password
                </p>

                {/* Decorative Divider */}
                <div className="decorative-divider" style={{ margin: '20px 0' }}></div>

                <p className="text-center" style={{
                    color: 'var(--text-color)',
                    marginBottom: '1.5rem',
                    fontSize: '0.95rem'
                }}>
                    तुमचा ईमेल पत्ता प्रविष्ट करा आणि आम्ही तुम्हाला पासवर्ड रीसेट करण्यासाठी लिंक पाठवू.
                </p>

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

                {message && (
                    <div style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '12px',
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        border: '1px solid #86efac'
                    }}>
                        {message}
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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            marginTop: '10px'
                        }}
                        disabled={loading}
                    >
                        {loading ? 'पाठवत आहे...' : 'रीसेट लिंक पाठवा (Send Reset Link)'}
                    </button>
                </form>

                <div className="decorative-divider" style={{ margin: '25px 0' }}></div>

                <div className="text-center mt-4">
                    <p style={{ color: 'var(--text-color)' }}>
                        <Link to="/login" style={{
                            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--gold-color) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            fontWeight: 'bold',
                            textDecoration: 'underline'
                        }}>← लॉगिनवर परत जा (Back to Login)</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
