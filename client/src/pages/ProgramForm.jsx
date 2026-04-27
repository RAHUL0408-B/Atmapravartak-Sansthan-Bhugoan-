import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProgramById, createProgram, updateProgram, uploadProgramImage } from '../services/programService';
import { Calendar, Image as ImageIcon, X } from 'lucide-react';

const ProgramForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [title, setTitle] = useState('');
    const [titleMarathi, setTitleMarathi] = useState('');
    const [description, setDescription] = useState('');
    const [descriptionMarathi, setDescriptionMarathi] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [location, setLocation] = useState('');
    const [locationMarathi, setLocationMarathi] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isEditMode) {
            loadProgram();
        }
    }, [id]);

    const loadProgram = async () => {
        setLoading(true);
        try {
            const data = await getProgramById(id);
            setTitle(data.title || '');
            setTitleMarathi(data.title_marathi || '');
            setDescription(data.description || '');
            setDescriptionMarathi(data.description_marathi || '');
            setEventDate(data.event_date || '');
            setEventTime(data.event_time || '');
            setLocation(data.location || '');
            setLocationMarathi(data.location_marathi || '');
            setImageUrl(data.image_url || '');
            if (data.image_url) setImagePreview(data.image_url);
        } catch (err) {
            console.error('Error loading program:', err);
            setError('कार्यक्रम लोड करण्यात अयशस्वी');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
        setImageUrl('');
    };

    // This is the main save function
    const saveProgram = async () => {
        console.log('=== SAVE PROGRAM CALLED ===');

        // Validation
        if (!title.trim()) {
            setError('कृपया शीर्षक प्रविष्ट करा (Please enter title)');
            return;
        }
        if (!eventDate) {
            setError('कृपया तारीख निवडा (Please select date)');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let finalImageUrl = imageUrl;

            // Upload image if new file selected
            if (imageFile) {
                console.log('Uploading image...');
                try {
                    finalImageUrl = await uploadProgramImage(imageFile);
                    console.log('Image uploaded:', finalImageUrl);
                } catch (uploadErr) {
                    console.error('Image upload failed:', uploadErr);
                    // Throw error to stop saving process so user sees the issue
                    let uploadMsg = 'फोटो अपलोड अयशस्वी. Firebase Storage सक्षम आहे का ते तपासा.';
                    if (uploadErr.message) uploadMsg += ` (${uploadErr.message})`;
                    throw new Error(uploadMsg);
                }
            }

            const programData = {
                title: title.trim(),
                title_marathi: titleMarathi.trim(),
                description: description.trim(),
                description_marathi: descriptionMarathi.trim(),
                event_date: eventDate,
                event_time: eventTime,
                location: location.trim(),
                location_marathi: locationMarathi.trim(),
                image_url: finalImageUrl
            };

            console.log('Saving program data:', programData);

            if (isEditMode) {
                console.log('Updating program:', id);
                await updateProgram(id, programData);
                setSuccess('कार्यक्रम यशस्वीरित्या अपडेट केला!');
            } else {
                console.log('Creating new program...');
                const result = await createProgram(programData);
                console.log('Program created:', result);
                setSuccess('कार्यक्रम यशस्वीरित्या जोडला!');
            }

            // Wait a moment to show success message, then navigate
            setTimeout(() => {
                navigate('/programs');
            }, 1500);

        } catch (err) {
            console.error('Save error:', err);

            let errorMsg = 'कार्यक्रम जतन करण्यात त्रुटी';
            if (err.message) {
                errorMsg = err.message;
            }
            if (err.code === 'permission-denied') {
                errorMsg = 'परवानगी नाकारली. Firestore security rules तपासा.';
            }

            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        console.log('Form submitted');
        e.preventDefault();
        saveProgram();
    };

    const handleButtonClick = () => {
        console.log('Button clicked directly');
        saveProgram();
    };

    const formGroupStyle = { marginBottom: '15px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500' };
    const inputStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '2px solid #ddd',
        fontSize: '1rem'
    };

    if (loading && isEditMode && !title) {
        return <div className="text-center">लोड होत आहे...</div>;
    }

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
                <Calendar size={28} style={{ verticalAlign: 'middle', marginRight: '10px' }} />
                {isEditMode ? 'कार्यक्रम संपादित करा' : 'नवीन कार्यक्रम जोडा'}
            </h2>

            {error && (
                <div style={{
                    color: 'white',
                    backgroundColor: '#dc2626',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div style={{
                    color: 'white',
                    backgroundColor: '#16a34a',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px'
                }}>
                    ✅ {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Image Upload Section */}
                <div style={{ ...formGroupStyle, gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>कार्यक्रम फोटो (Program Image)</label>

                    {imagePreview ? (
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                                src={imagePreview}
                                alt="Program Preview"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '8px',
                                    border: '2px solid #ddd'
                                }}
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    backgroundColor: 'rgba(255,0,0,0.8)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <label style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                            border: '2px dashed #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: '#fafafa'
                        }}>
                            <ImageIcon size={48} style={{ color: 'var(--primary-color)', marginBottom: '10px' }} />
                            <span style={{ color: 'var(--text-light)' }}>फोटो अपलोड करण्यासाठी क्लिक करा</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    )}
                </div>

                {/* Title Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>शीर्षक (Title) *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={inputStyle}
                            placeholder="Program Title in English"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>शीर्षक (मराठीत)</label>
                        <input
                            type="text"
                            value={titleMarathi}
                            onChange={(e) => setTitleMarathi(e.target.value)}
                            style={inputStyle}
                            placeholder="कार्यक्रमाचे शीर्षक मराठीत"
                        />
                    </div>
                </div>

                {/* Description Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>वर्णन (Description)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{ ...inputStyle, minHeight: '100px' }}
                            placeholder="Program description in English"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>वर्णन (मराठीत)</label>
                        <textarea
                            value={descriptionMarathi}
                            onChange={(e) => setDescriptionMarathi(e.target.value)}
                            style={{ ...inputStyle, minHeight: '100px' }}
                            placeholder="कार्यक्रमाचे वर्णन मराठीत"
                        />
                    </div>
                </div>

                {/* Date and Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>तारीख (Date) *</label>
                        <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>वेळ (Time)</label>
                        <input
                            type="time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* Location Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                        <label style={labelStyle}>स्थान (Location)</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={inputStyle}
                            placeholder="Location in English"
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>स्थान (मराठीत)</label>
                        <input
                            type="text"
                            value={locationMarathi}
                            onChange={(e) => setLocationMarathi(e.target.value)}
                            style={inputStyle}
                            placeholder="स्थान मराठीत"
                        />
                    </div>
                </div>

                {/* Buttons */}
                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                    {/* Using onClick instead of form submit to ensure it works */}
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        disabled={loading}
                        style={{
                            background: loading ? '#ccc' : 'linear-gradient(135deg, #FF9933 0%, #e65c00 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? (
                            <>
                                <span style={{
                                    display: 'inline-block',
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid white',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></span>
                                जतन करत आहे... {imageFile ? '(मोठ्या फोटोसाठी वेळ लागू शकतो)' : ''}
                            </>
                        ) : (
                            isEditMode ? 'कार्यक्रम अपडेट करा' : 'कार्यक्रम जोडा'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/programs')}
                        style={{
                            backgroundColor: '#666',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        रद्द करा (Cancel)
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ProgramForm;
