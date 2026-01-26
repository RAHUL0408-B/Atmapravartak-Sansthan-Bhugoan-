import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react';
import { getPrograms, deleteProgram } from '../services/programService';

const Programs = () => {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            const data = await getPrograms();
            setPrograms(data);
        } catch (err) {
            setError('कार्यक्रम लोड करण्यास अयशस्वी');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('तुम्हाला नक्की हा कार्यक्रम काढून टाकायचा आहे का?')) {
            try {
                await deleteProgram(id);
                setPrograms(programs.filter(p => p.id !== id));
            } catch (err) {
                alert('कार्यक्रम काढताना त्रुटी आली');
            }
        }
    };

    if (loading) return <div className="text-center mt-4">लोड होत आहे...</div>;

    return (
        <div>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)', margin: '0 0 5px 0' }}>
                        कार्यक्रम यादी
                    </h2>
                    <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>
                        एकूण कार्यक्रम: {programs.length}
                    </p>
                </div>

                <Link to="/programs/add" className="btn btn-primary" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    textDecoration: 'none'
                }}>
                    <Plus size={18} />
                    नवीन कार्यक्रम जोडा
                </Link>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {/* Programs List or Empty State */}
            {programs.length === 0 ? (
                <div className="card text-center" style={{ padding: '80px 20px' }}>
                    <Calendar size={80} style={{ color: '#ddd', margin: '0 auto 20px' }} />
                    <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', margin: 0 }}>
                        नवीन कार्यक्रम जोडा
                    </p>
                </div>
            ) : (
                <div className="member-grid">
                    {programs.map((program) => (
                        <div key={program.id} className="card">
                            {program.image_url && (
                                <img
                                    src={program.image_url}
                                    alt={program.title_marathi || program.title}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        marginBottom: '15px'
                                    }}
                                />
                            )}

                            <h3 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: 'var(--primary-color)' }}>
                                {program.title_marathi || program.title}
                            </h3>

                            {program.description_marathi && (
                                <p style={{ color: 'var(--text-color)', marginBottom: '15px', fontSize: '0.9rem' }}>
                                    {program.description_marathi.substring(0, 100)}
                                    {program.description_marathi.length > 100 && '...'}
                                </p>
                            )}

                            <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#555' }}>
                                {program.event_date && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                                        <Calendar size={16} />
                                        <strong>तारीख:</strong> {new Date(program.event_date).toLocaleDateString('mr-IN')}
                                    </p>
                                )}
                                {program.event_time && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                                        <Clock size={16} />
                                        <strong>वेळ:</strong> {program.event_time}
                                    </p>
                                )}
                                {program.location_marathi && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0' }}>
                                        <MapPin size={16} />
                                        <strong>स्थान:</strong> {program.location_marathi}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <Link
                                    to={`/programs/edit/${program.id}`}
                                    className="btn"
                                    style={{ padding: '5px 10px', backgroundColor: '#f0f0f0', textDecoration: 'none' }}
                                >
                                    <Edit size={16} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(program.id)}
                                    className="btn"
                                    style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#dc2626' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Programs;
