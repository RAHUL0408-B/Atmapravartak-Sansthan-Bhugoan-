import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMemberById, createMember, updateMember } from '../services/memberService';
import addressData from '../data/address_data.json';
import { transliterateToMarathi } from '../utils/transliterationUtils';

const MemberForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        full_name: '',
        mobile: '',
        joining_date: '', // New field
        date_of_birth: '',
        address_line1: '',
        address_line2: '',
        address_line2_marathi: '', // Marathi Field
        state: 'Maharashtra',
        state_marathi: 'महाराष्ट्र', // Default
        district: '',
        district_marathi: '',
        taluka: '',
        taluka_marathi: '',
        city: '',
        city_marathi: '',
        post_office: '',
        post_office_marathi: '',
        pincode: '',
    });

    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [cities, setCities] = useState([]);

    // Track manual entry mode for each field
    const [manualEntry, setManualEntry] = useState({
        state: false,
        district: false,
        taluka: false,
        city: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setDistricts(addressData.map(d => d.district));
        if (isEditMode) loadMember(id);
    }, [id, isEditMode]);

    useEffect(() => {
        if (formData.district) {
            const selectedDistrict = addressData.find(d => d.district === formData.district);
            setTalukas(selectedDistrict ? selectedDistrict.talukas.map(t => t.name) : []);
        } else {
            setTalukas([]);
        }
    }, [formData.district]);

    useEffect(() => {
        if (formData.district && formData.taluka) {
            const selectedDistrict = addressData.find(d => d.district === formData.district);
            const selectedTaluka = selectedDistrict?.talukas.find(t => t.name === formData.taluka);
            // The JSON structure from script puts villages in 'cities' array
            setCities(selectedTaluka ? selectedTaluka.cities : []);
        } else {
            setCities([]);
        }
    }, [formData.district, formData.taluka]);

    const loadMember = async (memberId) => {
        setLoading(true);
        try {
            const data = await getMemberById(memberId);
            setFormData(data);
        } catch (err) {
            setError('सदस्याची माहिती लोड करण्यात अयशस्वी');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle "Other" selection by switching to manual mode
        if (value === 'Other') {
            setManualEntry(prev => ({ ...prev, [name]: true }));
            // Clear the value so user can type
            setFormData(prev => ({
                ...prev,
                [name]: '',
                [`${name}_marathi`]: ''
            }));

            // Should we reset children manual modes? Yes, generally good practice.
            if (name === 'district') {
                setManualEntry(prev => ({ ...prev, district: true, taluka: false, city: false }));
                setFormData(prev => ({ ...prev, district: '', taluka: '', city: '', district_marathi: '', taluka_marathi: '', city_marathi: '' }));
            }
            if (name === 'taluka') {
                setManualEntry(prev => ({ ...prev, taluka: true, city: false }));
                setFormData(prev => ({ ...prev, taluka: '', city: '', taluka_marathi: '', city_marathi: '' }));
            }
            if (name === 'city') {
                setManualEntry(prev => ({ ...prev, city: true }));
                setFormData(prev => ({ ...prev, city: '', city_marathi: '' }));
            }
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'district') {
            // If changing dropdown value, ensure manual mode is off for children (if they were relying on parent filter)
            if (!manualEntry.district) {
                setManualEntry(prev => ({ ...prev, taluka: false, city: false }));
                setFormData(prev => ({ ...prev, district: value, taluka: '', city: '', district_marathi: '', taluka_marathi: '', city_marathi: '' }));
            }
            if (value) transliterateToMarathi(value).then(m => setFormData(prev => ({ ...prev, district_marathi: m })));
        }
        else if (name === 'taluka') {
            if (!manualEntry.taluka) {
                setManualEntry(prev => ({ ...prev, city: false }));
                setFormData(prev => ({ ...prev, taluka: value, city: '', taluka_marathi: '', city_marathi: '' }));
            }
            if (value) transliterateToMarathi(value).then(m => setFormData(prev => ({ ...prev, taluka_marathi: m })));
        }
        else if (name === 'city') {
            if (value) transliterateToMarathi(value).then(m => setFormData(prev => ({ ...prev, city_marathi: m })));
        }
    };

    // Backfill Marathi fields if missing on load
    useEffect(() => {
        if (!loading && formData.full_name) {
            const backfill = async () => {
                let updates = {};
                if (formData.full_name && !formData.full_name_marathi) updates.full_name_marathi = await transliterateToMarathi(formData.full_name);
                if (formData.address_line1 && !formData.address_line1_marathi) updates.address_line1_marathi = await transliterateToMarathi(formData.address_line1);
                if (formData.address_line2 && !formData.address_line2_marathi) updates.address_line2_marathi = await transliterateToMarathi(formData.address_line2);
                if (formData.state && !formData.state_marathi) updates.state_marathi = await transliterateToMarathi(formData.state);
                if (formData.district && !formData.district_marathi) updates.district_marathi = await transliterateToMarathi(formData.district);
                if (formData.taluka && !formData.taluka_marathi) updates.taluka_marathi = await transliterateToMarathi(formData.taluka);
                if (formData.city && !formData.city_marathi) updates.city_marathi = await transliterateToMarathi(formData.city);
                if (formData.post_office && !formData.post_office_marathi) updates.post_office_marathi = await transliterateToMarathi(formData.post_office);

                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates }));
                }
            };
            backfill();
        }
    }, [loading, formData.full_name, formData.district, formData.taluka, formData.city]); // Dependencies to trigger check

    // Auto-transliterate on blur
    const handleBlur = async (e) => {
        const { name, value } = e.target;
        if (!value) return;

        let targetField = '';
        if (name === 'full_name') targetField = 'full_name_marathi';
        else if (name === 'address_line1') targetField = 'address_line1_marathi';
        else if (name === 'address_line2') targetField = 'address_line2_marathi';
        else if (name === 'state') targetField = 'state_marathi';
        else if (name === 'district') targetField = 'district_marathi';
        else if (name === 'taluka') targetField = 'taluka_marathi';
        else if (name === 'city') targetField = 'city_marathi';
        else if (name === 'post_office') targetField = 'post_office_marathi';

        // Always update Marathi when English changes, unless user cleared it explicitly?
        // We assume blur on English means "I want this translated"
        if (targetField) {
            const marathiText = await transliterateToMarathi(value);
            setFormData(prev => ({ ...prev, [targetField]: marathiText }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Double Save / Confirmation Option
        const confirmMessage = `कृपया माहिती तपासा (Please recheck data):\n\n` +
            `नाव: ${formData.full_name_marathi || formData.full_name}\n` +
            `गाव: ${formData.city_marathi || formData.city}\n` +
            `मोबाईल: ${formData.mobile || '-'}\n\n` +
            `माहिती जतन करायची आहे का? (Do you want to save this member?)`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setLoading(true);
        setError('');
        const payload = { ...formData };

        try {
            if (isEditMode) await updateMember(id, payload);
            else await createMember(payload);
            navigate('/');
        } catch (err) {
            setError(err.message || 'सदस्य जतन करण्यात त्रुटी');
        } finally {
            setLoading(false);
        }
    };

    const formGroupStyle = { marginBottom: '15px' };
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '500' };
    const inputStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: 'var(--border-radius)',
        border: '1px solid #ddd',
        fontSize: '1rem'
    };

    if (loading && isEditMode && !formData.full_name) return <div className="text-center">लोड होत आहे...</div>;

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>
                {isEditMode ? 'सदस्य माहिती संपादित करा' : 'नवीन सदस्य जोडा'}
            </h2>

            {error && <div style={{ color: 'red', marginBottom: '15px', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="full-width">
                        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>वैयक्तिक माहिती (Personal Info)</h3>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>पूर्ण नाव (English) *</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} onBlur={handleBlur} className="input-style" required placeholder="Name in English" />
                        </div>
                        <div>
                            <label style={labelStyle}>पूर्ण नाव (मराठीत) *</label>
                            <input type="text" name="full_name_marathi" value={formData.full_name_marathi} onChange={handleChange} className="input-style" placeholder="नाव मराठीत (Auto)" />
                        </div>
                    </div>

                    {/* Post field removed */}

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>मोबाईल नंबर</label>
                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="input-style" placeholder="मोबाईल नंबर (ऐच्छिक)" />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>सदस्य नोंदणी तारीख (Joining Date)</label>
                        <input type="date" name="joining_date" value={formData.joining_date} onChange={handleChange} className="input-style" />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>जन्म तारीख</label>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="input-style" />
                    </div>



                    <div className="full-width">
                        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px', marginTop: '10px' }}>पत्ता (Address)</h3>
                    </div>

                    <div className="form-group-row full-width" style={{ marginBottom: 0 }}>
                        <div>
                            <label style={labelStyle}>घर क्रमांक / गल्ली / नगर (Address Line 1) *</label>
                            <input type="text" name="address_line1" value={formData.address_line1} onChange={handleChange} onBlur={handleBlur} className="input-style" required />
                        </div>
                        <div>
                            <label style={labelStyle}>पत्ता (मराठीत) (Address in Marathi)</label>
                            <input type="text" name="address_line1_marathi" value={formData.address_line1_marathi} onChange={handleChange} className="input-style" placeholder="आपोआप मराठी होईल" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>पत्ता ओळ 2 (Address Line 2)</label>
                            <input type="text" name="address_line2" value={formData.address_line2} onChange={handleChange} onBlur={handleBlur} className="input-style" />
                        </div>
                        <div>
                            <label style={labelStyle}>पत्ता ओळ 2 (मराठीत)</label>
                            <input type="text" name="address_line2_marathi" value={formData.address_line2_marathi} onChange={handleChange} className="input-style" placeholder="आपोआप मराठी होईल" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>राज्य (State) *</label>
                            {manualEntry.state ? (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input type="text" name="state" value={formData.state} onChange={handleChange} onBlur={handleBlur} className="input-style" placeholder="Enter State" required />
                                    <button type="button" onClick={() => {
                                        setManualEntry(prev => ({ ...prev, state: false }));
                                        setFormData(prev => ({ ...prev, state: 'Maharashtra', state_marathi: 'महाराष्ट्र' }));
                                    }} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ddd', border: '1px solid #ccc', borderRadius: '4px' }}>X</button>
                                </div>
                            ) : (
                                <select name="state" value={formData.state === 'Maharashtra' ? 'Maharashtra' : (formData.state ? 'Other' : 'Maharashtra')} onChange={handleChange} className="input-style" required>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Other">+ Other / Manual</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>राज्य (मराठीत) *</label>
                            <input type="text" name="state_marathi" value={formData.state_marathi} onChange={handleChange} className="input-style" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>जिल्हा (District) *</label>
                            {manualEntry.district ? (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} onBlur={handleBlur} className="input-style" placeholder="Enter District" required />
                                    <button type="button" onClick={() => {
                                        setManualEntry(prev => ({ ...prev, district: false }));
                                        setFormData(prev => ({ ...prev, district: '', district_marathi: '' }));
                                    }} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ddd', border: '1px solid #ccc', borderRadius: '4px' }}>X</button>
                                </div>
                            ) : (
                                <select name="district" value={districts.includes(formData.district) ? formData.district : ''} onChange={handleChange} className="input-style" required>
                                    <option value="">जिल्हा निवडा</option>
                                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    <option value="Other" style={{ fontWeight: 'bold', color: 'blue' }}>+ Other / Manual</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>जिल्हा (मराठीत) *</label>
                            <input type="text" name="district_marathi" value={formData.district_marathi} onChange={handleChange} className="input-style" placeholder="आपोआप येईल" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>तालुका (Taluka) *</label>
                            {/* Show input if we have data but the value isn't in it (and is not empty), OR if we have no dropdown data but have a manual value */}
                            {manualEntry.taluka ? (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input type="text" name="taluka" value={formData.taluka} onChange={handleChange} onBlur={handleBlur} className="input-style" placeholder="Enter Taluka" required />
                                    <button type="button" onClick={() => {
                                        setManualEntry(prev => ({ ...prev, taluka: false }));
                                        setFormData(prev => ({ ...prev, taluka: '', taluka_marathi: '' }));
                                    }} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ddd', border: '1px solid #ccc', borderRadius: '4px' }}>X</button>
                                </div>
                            ) : (
                                <select name="taluka" value={talukas.includes(formData.taluka) ? formData.taluka : ''} onChange={handleChange} className="input-style" required disabled={!formData.district && !manualEntry.district}>
                                    <option value="">तालुका निवडा</option>
                                    {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                                    <option value="Other" style={{ fontWeight: 'bold', color: 'blue' }}>+ Other / Manual</option>
                                </select>
                            )}
                        </div>
                        <div>
                            <label style={labelStyle}>तालुका (मराठीत) *</label>
                            <input type="text" name="taluka_marathi" value={formData.taluka_marathi} onChange={handleChange} className="input-style" placeholder="आपोआप येईल" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>गाव / १०२ शहर (Village/City) *</label>
                            {/* Logic: Show input if value is set but not in list. */}
                            {manualEntry.city ? (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} className="input-style" placeholder="Enter Village/City" required />
                                    <button type="button" onClick={() => {
                                        setManualEntry(prev => ({ ...prev, city: false }));
                                        setFormData(prev => ({ ...prev, city: '', city_marathi: '' }));
                                    }} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#ddd', border: '1px solid #ccc', borderRadius: '4px' }}>X</button>
                                </div>
                            ) : (
                                <select
                                    name="city"
                                    value={cities.includes(formData.city) ? formData.city : ''}
                                    onChange={handleChange}
                                    className="input-style"
                                    required
                                    disabled={!formData.taluka && !manualEntry.taluka}
                                >
                                    <option value="">गाव निवडा</option>
                                    {cities.map((c, index) => (
                                        <option key={index} value={c}>{c}</option>
                                    ))}
                                    <option value="Other" style={{ fontWeight: 'bold', color: 'blue' }}>+ Other / Manual</option>
                                </select>
                            )}
                            {/* Special case: If parent (Taluka) is manual (not in list), then this dropdown will be empty/disabled. We should probably force manual mode for child fields too. */}

                        </div>
                        <div>
                            <label style={labelStyle}>गाव / शहर (मराठीत) *</label>
                            <input type="text" name="city_marathi" value={formData.city_marathi} onChange={handleChange} className="input-style" placeholder="आपोaap येईल" />
                        </div>
                    </div>

                    <div className="form-group-row full-width">
                        <div>
                            <label style={labelStyle}>पोस्ट ऑफिस (Post Office - English)</label>
                            <input type="text" name="post_office" value={formData.post_office} onChange={handleChange} onBlur={handleBlur} className="input-style" placeholder="Post Office name" />
                        </div>
                        <div>
                            <label style={labelStyle}>पोस्ट ऑफिस (मराठीत)</label>
                            <input type="text" name="post_office_marathi" value={formData.post_office_marathi} onChange={handleChange} className="input-style" placeholder="मराठीत येईल" />
                        </div>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>पिनकोड</label>
                        <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            className="input-style"
                            placeholder="पिनकोड (ऐच्छिक)"
                        />
                    </div>

                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'जतन करत आहे...' : (isEditMode ? 'माहिती अपडेट करा' : 'सदस्य जोडा')}
                    </button>
                    <button type="button" className="btn" style={{ backgroundColor: '#666', color: 'white' }} onClick={() => navigate('/')}>
                        रद्द करा
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MemberForm;
