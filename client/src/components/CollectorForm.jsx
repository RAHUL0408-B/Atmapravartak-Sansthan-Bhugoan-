import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCollector, getCollectorById, updateCollector } from '../services/collectorService';
import { transliterateToMarathi, transliterateArray } from '../services/translationService';
import addressData from '../data/address_data.json';
import { Save, ArrowLeft, Trash2, Languages } from 'lucide-react';

const CollectorForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // Form Basic Info
    const [basicInfo, setBasicInfo] = useState({
        name: '',
        nameMarathi: '', // Store translated name
        mobile: '',
        address: '',     // Added Address
        addressMarathi: '' // Store translated address
    });

    // Location Staging (Current Selection)
    const [currentLocation, setCurrentLocation] = useState({
        district: '',
        taluka: '',
        selectedVillages: []
    });

    // List of added locations
    const [assignedLocations, setAssignedLocations] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [error, setError] = useState(null);

    // Dropdown options
    const [districts, setDistricts] = useState([]);
    const [talukas, setTalukas] = useState([]);
    const [cities, setCities] = useState([]);

    useEffect(() => {
        setDistricts(addressData.map(d => d.district));
        if (isEditMode) {
            loadCollector();
        }
    }, [isEditMode]);

    // Update Talukas when Staging District changes
    useEffect(() => {
        if (currentLocation.district) {
            const selectedDistrict = addressData.find(d => d.district === currentLocation.district);
            setTalukas(selectedDistrict ? selectedDistrict.talukas.map(t => t.name) : []);
        } else {
            setTalukas([]);
        }
    }, [currentLocation.district]);

    // Update Cities when Staging Taluka changes
    useEffect(() => {
        if (currentLocation.district && currentLocation.taluka) {
            const selectedDistrict = addressData.find(d => d.district === currentLocation.district);
            const selectedTaluka = selectedDistrict?.talukas.find(t => t.name === currentLocation.taluka);
            setCities(selectedTaluka ? selectedTaluka.cities : []);
        } else {
            setCities([]);
        }
    }, [currentLocation.taluka, currentLocation.district]);

    const loadCollector = async () => {
        try {
            setLoading(true);
            const data = await getCollectorById(id);
            setBasicInfo({
                name: data.name_english || data.name, // Support legacy
                nameMarathi: data.name,                // Main display name is Marathi
                mobile: data.mobile || '',
                address: data.address_english || '',
                addressMarathi: data.address || ''
            });

            if (data.assigned_villages && data.assigned_villages.length > 0 && typeof data.assigned_villages[0] === 'object') {
                setAssignedLocations(data.assigned_villages);
            } else if (data.assigned_villages && data.assigned_villages.length > 0) {
                // Backward compatibility
                setAssignedLocations([{
                    district: data.district,
                    taluka: data.taluka,
                    villages: data.assigned_villages
                }]);
            }
        } catch (err) {
            setError('संकलक माहिती लोड करण्यास अयशस्वी (Failed to load collector)');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBasicChange = (e) => {
        const { name, value } = e.target;
        setBasicInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Auto-transliterate on blur
    const handleBlur = async (field) => {
        const text = basicInfo[field];
        if (!text) return;

        setTranslating(true);
        try {
            const translated = await transliterateToMarathi(text);

            if (field === 'name') {
                setBasicInfo(prev => ({ ...prev, nameMarathi: translated }));
            } else if (field === 'address') {
                setBasicInfo(prev => ({ ...prev, addressMarathi: translated }));
            }
        } catch (err) {
            console.error('Translation error:', err);
        } finally {
            setTranslating(false);
        }
    };

    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setCurrentLocation(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'district' ? { taluka: '', selectedVillages: [] } : {}),
            ...(name === 'taluka' ? { selectedVillages: [] } : {})
        }));
    };

    const handleVillageToggle = (village) => {
        setCurrentLocation(prev => {
            const currentVillages = prev.selectedVillages || [];
            if (currentVillages.includes(village)) {
                return { ...prev, selectedVillages: currentVillages.filter(v => v !== village) };
            } else {
                return { ...prev, selectedVillages: [...currentVillages, village] };
            }
        });
    };

    const handleSelectAllVillages = () => {
        if (currentLocation.selectedVillages.length === cities.length) {
            setCurrentLocation(prev => ({ ...prev, selectedVillages: [] }));
        } else {
            setCurrentLocation(prev => ({ ...prev, selectedVillages: [...cities] }));
        }
    };

    const addLocation = async () => {
        if (!currentLocation.district || !currentLocation.taluka) {
            alert('कृपया जिल्हा आणि तालुका निवडा');
            return;
        }
        if (currentLocation.selectedVillages.length === 0) {
            alert('कृपया निदान एक गाव निवडा');
            return;
        }

        setTranslating(true);
        try {
            // Translate District, Taluka, and Villages to Marathi
            const districtMr = await transliterateToMarathi(currentLocation.district);
            const talukaMr = await transliterateToMarathi(currentLocation.taluka);
            const villagesMr = await transliterateArray(currentLocation.selectedVillages);

            setAssignedLocations(prev => [
                ...prev,
                {
                    district: districtMr,
                    taluka: talukaMr,
                    villages: villagesMr,
                    // Store English values for reference if needed
                    district_en: currentLocation.district,
                    taluka_en: currentLocation.taluka,
                    villages_en: currentLocation.selectedVillages
                }
            ]);

            // Reset Selection
            setCurrentLocation({
                district: '',
                taluka: '',
                selectedVillages: []
            });
        } catch (err) {
            console.error('Location translation error:', err);
            alert('भाषांतर करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
        } finally {
            setTranslating(false);
        }
    };

    const removeLocation = (index) => {
        setAssignedLocations(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Name is required
        if (!basicInfo.name && !basicInfo.nameMarathi) {
            setError('कृपया नाव प्रविष्ट करा (Please enter name)');
            setLoading(false);
            return;
        }

        if (assignedLocations.length === 0) {
            setError('कृपया कमीतकमी एक कार्यक्षेत्र जोडा');
            setLoading(false);
            return;
        }

        // Final translation check if missing
        let finalName = basicInfo.nameMarathi;
        let finalAddress = basicInfo.addressMarathi;

        if (!finalName && basicInfo.name) {
            finalName = await transliterateToMarathi(basicInfo.name);
        }
        if (!finalAddress && basicInfo.address) {
            finalAddress = await transliterateToMarathi(basicInfo.address);
        }

        const payload = {
            name: finalName || basicInfo.name, // Prefer Marathi, fallback to English
            name_english: basicInfo.name,      // Store English too
            mobile: basicInfo.mobile,
            address: finalAddress,
            address_english: basicInfo.address,
            // Top level fields from first location for compatibility
            district: assignedLocations[0].district,
            taluka: assignedLocations[0].taluka,
            assigned_villages: assignedLocations
        };

        try {
            if (isEditMode) {
                await updateCollector(id, payload);
            } else {
                await createCollector(payload);
            }
            navigate('/collectors');
        } catch (err) {
            setError('जतन करताना त्रुटी आली (Error saving data)');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex-between mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => navigate('/collectors')} className="btn" style={{ padding: '8px', backgroundColor: '#f0f0f0' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>
                        {isEditMode ? 'संकलक संपादित करा' : 'नवीन संकलक जोडा'}
                    </h2>
                </div>
            </div>

            <div className="card">
                {error && <div style={{ color: 'white', backgroundColor: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '1rem' }}>{error}</div>}

                {translating && <div style={{ color: 'var(--primary-color)', marginBottom: '10px', fontWeight: 'bold' }}>भाषांतर होत आहे... (Translating...)</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        {/* Name Fields - English & Marathi */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                पूर्ण नाव (English) <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={basicInfo.name}
                                onChange={handleBasicChange}
                                onBlur={() => handleBlur('name')}
                                required
                                className="input-style"
                                placeholder="Name in English"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                पूर्ण नाव (मराठीत) <span style={{ color: 'red' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    name="nameMarathi"
                                    value={basicInfo.nameMarathi}
                                    onChange={handleBasicChange}
                                    required
                                    className="input-style"
                                    placeholder="नाव मराठीत (Auto)"
                                />
                                {translating && <div style={{ position: 'absolute', right: '10px', top: '12px', fontSize: '0.8rem', color: '#666' }}>Translating...</div>}
                            </div>
                        </div>

                        {/* Mobile */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                मोबाईल (Mobile)
                            </label>
                            <input
                                type="tel"
                                name="mobile"
                                value={basicInfo.mobile}
                                onChange={handleBasicChange}
                                className="input-style"
                                style={{ maxWidth: '48%' }}
                                placeholder="मोबाईल नंबर"
                            />
                        </div>

                        {/* Address Fields - English & Marathi */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                पत्ता (English)
                            </label>
                            <textarea
                                name="address"
                                value={basicInfo.address}
                                onChange={handleBasicChange}
                                onBlur={() => handleBlur('address')}
                                className="input-style"
                                placeholder="Address in English"
                                rows="2"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                पत्ता (मराठीत)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    name="addressMarathi"
                                    value={basicInfo.addressMarathi}
                                    onChange={handleBasicChange}
                                    className="input-style"
                                    placeholder="पत्ता मराठीत (Auto)"
                                    rows="2"
                                />
                            </div>
                        </div>
                    </div>

                    <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #eee' }} />

                    <h3 style={{ fontSize: '1.1rem', color: '#444', marginBottom: '15px' }}>कार्यक्षेत्र जोडा (Add Working Area)</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                        जिल्हा आणि तालुका इंग्लिशमध्ये निवडा, ते आपोआप मराठीत जतन केले जातील.
                    </p>

                    <div className="form-grid" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                जिल्हा (District)
                            </label>
                            <select
                                name="district"
                                value={currentLocation.district}
                                onChange={handleLocationChange}
                                className="input-style"
                            >
                                <option value="">जिल्हा निवडा (Select District)</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                तालुका (Taluka)
                            </label>
                            <select
                                name="taluka"
                                value={currentLocation.taluka}
                                onChange={handleLocationChange}
                                className="input-style"
                                disabled={!currentLocation.district}
                            >
                                <option value="">तालुका निवडा (Select Taluka)</option>
                                {talukas.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                गावे (Villages) ({currentLocation.selectedVillages.length})
                            </label>

                            {!currentLocation.taluka ? (
                                <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '6px', border: '1px dashed #ccc', textAlign: 'center', color: '#888', fontSize: '0.9em' }}>
                                    गावे निवडण्यासाठी तालुका निवडा
                                </div>
                            ) : (
                                <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>उपलब्ध गावे (इंग्रजीत)</span>
                                        <button
                                            type="button"
                                            onClick={handleSelectAllVillages}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}
                                        >
                                            {currentLocation.selectedVillages.length === cities.length ? 'सर्व रद्द करा' : 'सर्व निवडा'}
                                        </button>
                                    </div>
                                    <div style={{ maxHeight: '150px', overflowY: 'auto', padding: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', backgroundColor: 'white' }}>
                                        {cities.map(city => (
                                            <label key={city} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={currentLocation.selectedVillages.includes(city)}
                                                    onChange={() => handleVillageToggle(city)}
                                                    style={{ width: '15px', height: '15px' }}
                                                />
                                                {city}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <button
                                type="button"
                                onClick={addLocation}
                                className="btn"
                                style={{
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    fontSize: '0.9rem'
                                }}
                                disabled={!currentLocation.taluka || currentLocation.selectedVillages.length === 0 || translating}
                            >
                                <Save size={16} />
                                {translating ? 'भाषांतर होत आहे... (Translating...)' : 'यादीत जोडा (Add & Translate)'}
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '10px', color: '#444' }}>निवडलेली कार्यक्षेत्रे (Selected Locations - Marathi)</h4>

                        {assignedLocations.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff3cd', color: '#856404', borderRadius: '6px', fontSize: '0.9rem' }}>
                                कोणतेही कार्यक्षेत्र जोडलेले नाही.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {assignedLocations.map((loc, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        padding: '12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#333' }}>
                                                {loc.taluka}, {loc.district}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                                {loc.villages.length} गावे: {loc.villages.join(', ')}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeLocation(index)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#dc3545',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}
                                            title="काढून टाका"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => navigate('/collectors')} className="btn" style={{ backgroundColor: '#f0f0f0' }}>
                            रद्द करा
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading || translating || assignedLocations.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} />
                            {loading ? 'जतन करत आहे...' : 'पूर्ण जतन करा (Save All)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CollectorForm;
