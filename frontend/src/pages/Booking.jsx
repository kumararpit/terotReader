import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BookingForm } from '../components/BookingForm';
import { TermsModal } from '../components/TermsModal';
import { services } from '../mock';
import { ArrowLeft } from 'lucide-react';

const Booking = () => {
    const { serviceId } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [showTerms, setShowTerms] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [bookingData, setBookingData] = useState(null);

    useEffect(() => {
        // Find service by ID
        const foundService = services.find(s => s.id === parseInt(serviceId));
        if (foundService) {
            setService(foundService);
        } else {
            // Redirect to home if service not found
            navigate('/');
        }
    }, [serviceId, navigate]);

    const handleFormSubmit = (data) => {
        setBookingData(data);
        setShowTerms(true);
    };

    const handleAcceptTerms = () => {
        setShowTerms(false);
        // Navigate to payment page, potentially passing data via state
        navigate('/payment', { state: { service, bookingData } });
    };

    if (!service) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-500 hover:text-[var(--color-primary)] transition-colors mb-8"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Services
                    </button>

                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-[var(--color-text-heading)] mb-4">
                            Book Your <span className="text-[var(--color-primary)]">{service.title}</span>
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Please fill out the form below to schedule your session. All information provided is strictly confidential.
                        </p>
                    </div>

                    <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-purple-900/5 border border-white/60">
                        <BookingForm service={service} onSubmit={handleFormSubmit} />
                    </div>

                </div>
            </main>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={handleAcceptTerms}
            />

            <Footer />
        </div>
    );
};

export default Booking;
