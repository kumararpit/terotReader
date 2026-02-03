import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Plus, Calendar as CalendarIcon, MessageSquare, LogOut, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('admin_token'));

    // Auth Flow State
    const [needsSetup, setNeedsSetup] = useState(null);
    const [authView, setAuthView] = useState('login'); // 'login', 'forgot', 'reset'

    // Form States
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [setupData, setSetupData] = useState({ username: '', email: '', password: '' });
    const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            checkSetupStatus();
        }
    }, [isAuthenticated]);

    const checkSetupStatus = async () => {
        try {
            const res = await axios.get(`${API}/auth/setup-status`);
            setNeedsSetup(res.data.needs_setup);
        } catch (error) {
            console.error(error);
        }
    };

    // Slot State
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTime, setNewTime] = useState('');
    const [newSlotType, setNewSlotType] = useState('regular');
    const [isGenerating, setIsGenerating] = useState(false);

    // Testimonial State
    const [testimonials, setTestimonials] = useState([]);
    const [newTestimonial, setNewTestimonial] = useState({ author: '', text: '', rating: 5 });

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${API}/login`, credentials);
            localStorage.setItem('admin_token', res.data.access_token);
            setIsAuthenticated(true);
            toast.success('Welcome back');
        } catch (error) {
            toast.error('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API}/auth/setup`, setupData);
            toast.success('Admin account created! Please login.');
            setNeedsSetup(false);
            setCredentials({ username: setupData.username, password: '' });
        } catch (error) {
            toast.error('Setup failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API}/auth/forgot-password`, { email: resetData.email });
            toast.success('If registered, an OTP has been sent.');
            setAuthView('reset');
        } catch (error) {
            toast.error('Request failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await axios.post(`${API}/auth/reset-password`, {
                email: resetData.email,
                otp: resetData.otp,
                new_password: resetData.newPassword
            });
            toast.success('Password updated! Please login.');
            setAuthView('login');
        } catch (error) {
            toast.error('Reset failed: ' + (error.response?.data?.detail || 'Invalid OTP'));
        } finally {
            setIsLoading(false);
        }
    };



    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        setIsAuthenticated(false);
        toast.info('Logged out');
    };

    // Availability State
    const [availabilityWindows, setAvailabilityWindows] = useState([]);
    const [overlapData, setOverlapData] = useState(null);
    console.log('Overlap Data#########: ', overlapData);
    const handleOverlapConfirm = async () => {
        console.log('Overlap Data+++++: ', overlapData);
        if (!overlapData) return;
        console.log('Overlap Data-------: ', !overlapData);
        const { dateStr, type, detail } = overlapData;

        try {
            for (const segment of detail.proposed_segments) {
                await axios.post(`${API}/availability`, {
                    date: dateStr,
                    start_time: segment.start_time,
                    end_time: segment.end_time,
                    type: type
                });
            }
            toast.success("Adjusted availability set successfully");
            await fetchSlots();
            setOverlapData(null); // Close modal
        } catch (err) {
            console.error("Failed to add proposed segments", err);
            toast.error("Failed to set adjusted availability.");
        }
    };

    const fetchAvailability = React.useCallback(async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const res = await axios.get(`${API}/availability?date=${dateStr}`);
            setAvailabilityWindows(res.data);
        } catch (error) {
            console.error('Error fetching availability:', error);
        }
    }, [selectedDate]);

    const fetchSlots = React.useCallback(async () => {
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            // Fetch Regular AND Emergency slots? Or both merged?
            // Backend handles both if type not specified? 
            // My backend logic: if type not specified, it iterates all availability blocks! 
            // So default GET returns all valid slots.
            const res = await axios.get(`${API}/slots?date=${dateStr}`);
            setSlots(res.data);
            fetchAvailability(); // Refresh windows too
        } catch (error) {
            console.error('Error fetching slots:', error);
            toast.error('Failed to fetch slots');
        }
    }, [selectedDate, fetchAvailability]);

    // ... inside Timeline Render ...
    // We want to overlay Availability Windows.
    // Logic: Loop hours. Check if hour is inside a Window.
    // If yes, render Window Background.

    // Helper to check window
    const getWindowForHour = (h) => {
        return availabilityWindows.find(w => {
            const s = parseInt(w.start_time.split(':')[0]);
            const e = parseInt(w.end_time.split(':')[0]);
            // Simple check: hour is within start(inclusive) and end(exclusive-ish)
            return h >= s && h < e + (parseInt(w.end_time.split(':')[1]) > 0 ? 1 : 0);
        });
    };

    const createSlot = async () => {
        if (!newTime) return;
        // Frontend Duplicate Check
        if (slots.some(s => s.time === newTime)) {
            toast.error(`Slot ${newTime} already exists.`);
            return;
        }

        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await axios.post(`${API}/slots`, {
                date: dateStr,
                time: newTime,
                type: newSlotType
            });
            toast.success('Slot added successfully');
            setNewTime('');
            fetchSlots();
        } catch (error) {
            console.error('Error creating slot:', error);
            toast.error(error.response?.data?.detail || 'Failed to add slot');
        }
    };

    const setAvailability = async (start, end, type = 'regular') => {
        if (!start || !end) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        try {
            const response = await axios.post(`${API}/availability`, {
                date: dateStr,
                start_time: start,
                end_time: end,
                type: type
            });

            if (response.data.status === 'success') {
                toast.success("Availability set successfully");
                await fetchSlots();
            } else if (response.data.status === 'overlap') {
                // Handle Overlap (200 OK)
                const detail = response.data.detail;


                if (detail && detail.proposed_segments.length > 0) {
                    // Trigger Modal
                    setOverlapData({
                        dateStr,
                        type,
                        detail
                    });
                } else {
                    toast.error("Overlap detected but no alternative found.");
                }
            } else {
                // Unknown status
                toast.error("Unexpected response status");
            }
        } catch (error) {
            console.error("Set Availability Error:", error);
            const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || "Failed to set availability";
            toast.error(typeof errorMsg === 'string' ? errorMsg : "An error occurred");
        }
    };

    const deleteSlot = async (id) => {
        try {
            await axios.delete(`${API}/slots/${id}`);
            toast.success('Slot deleted');
            fetchSlots();
        } catch (error) {
            console.error('Error deleting slot:', error);
            toast.error('Failed to delete slot');
        }
    };

    const deleteBooking = async (id) => {
        if (!window.confirm("Are you sure you want to CANCEL this booking? This action cannot be undone.")) return;
        try {
            await axios.delete(`${API}/bookings/${id}`);
            toast.success('Booking cancelled successfully');
            fetchSlots();
        } catch (error) {
            console.error('Error deleting booking:', error);
            toast.error(error.response?.data?.detail || 'Failed to cancel booking');
        }
    };

    const deleteAvailability = async (id) => {
        try {
            await axios.delete(`${API}/availability/${id}`);
            toast.success('Availability deleted');
            fetchAvailability();
            fetchSlots();
        } catch (error) {
            console.error('Error deleting availability:', error);
            // Show specific backend error (e.g., active bookings constraint)
            const msg = error.response?.data?.detail || 'Failed to delete availability';
            toast.error(msg);
        }
    };

    // Helper to check if date is in the past
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const fetchTestimonials = React.useCallback(async () => {
        try {
            const res = await axios.get(`${API}/testimonials`);
            setTestimonials(res.data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSlots();
            fetchTestimonials();
        }
    }, [isAuthenticated, fetchSlots, fetchTestimonials]);

    const createTestimonial = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/testimonials`, newTestimonial);
            toast.success('Testimonial added');
            setNewTestimonial({ author: '', text: '', rating: 5 });
            fetchTestimonials();
        } catch (error) {
            toast.error('Failed to add testimonial');
        }
    };

    const deleteTestimonial = async (id) => {
        try {
            await axios.delete(`${API}/testimonials/${id}`);
            toast.success('Testimonial deleted');
            fetchTestimonials();
        } catch (error) {
            toast.error('Failed to delete testimonial');
        }
    };

    // Booking Details Modal State
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    const fetchBookingDetails = async (gcalEventId) => {
        setIsDetailsLoading(true);
        setDetailsOpen(true);
        setSelectedBooking(null); // Reset
        try {
            const res = await axios.get(`${API}/bookings/gcal/${gcalEventId}`);
            setSelectedBooking(res.data);
        } catch (error) {
            console.error("Fetch booking details failed:", error);
            toast.error("Failed to load booking details");
            setDetailsOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    // Component for Booking Details
    const BookingDetailsModal = () => (
        <AlertDialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex justify-between items-center text-xl text-purple-900">
                        Booking Details
                        <Button variant="ghost" size="sm" onClick={() => setDetailsOpen(false)}>✕</Button>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Complete information for this session.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {isDetailsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : selectedBooking ? (
                    <div className="space-y-6 pt-2">
                        {/* Header Info */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between bg-purple-50 p-4 rounded-lg">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{selectedBooking.full_name}</h3>
                                <div className="text-sm text-gray-600 flex flex-col gap-1 mt-1">
                                    <span className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /> {selectedBooking.email}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-2">
                                    {selectedBooking.status.toUpperCase()}
                                </span>
                                <div className="text-sm text-gray-500">
                                    {format(new Date(selectedBooking.preferred_date), 'PPP')}<br />
                                    {selectedBooking.preferred_time}
                                </div>
                            </div>
                        </div>

                        {/* Context */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-1 text-sm uppercase tracking-wide">Situation/Context</h4>
                                <p className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.situation_description || 'No description provided.'}</p>
                            </div>
                        </div>

                        {/* Aura Image if available */}
                        {selectedBooking.aura_image && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" /> Aura Photo
                                </h4>
                                <div className="border rounded-lg overflow-hidden bg-black/5 p-2 flex justify-center">
                                    <img
                                        src={selectedBooking.aura_image}
                                        alt="Aura"
                                        className="max-h-64 object-contain rounded-md shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 border-t pt-4">
                            <div>
                                <span className="block font-medium">Service Type:</span> {selectedBooking.service_type}
                            </div>
                            <div>
                                <span className="block font-medium">Payment:</span> {selectedBooking.amount} {selectedBooking.currency} ({selectedBooking.payment_method})
                            </div>
                            <div>
                                <span className="block font-medium">DOB:</span> {selectedBooking.date_of_birth}
                            </div>
                            <div>
                                <span className="block font-medium">Gender:</span> {selectedBooking.gender}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">No details found.</div>
                )}

                <AlertDialogFooter className="sm:justify-between gap-4 border-t pt-4 mt-4">
                    <div className="flex gap-2">
                        {/* Optional: Add Action buttons here if needed */}
                    </div>
                    <AlertDialogCancel onClick={() => setDetailsOpen(false)}>Close</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f6f1ff] relative overflow-hidden">
                {/* Mystical Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#ece4ff_0%,transparent_70%)]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9d80d6] opacity-10 blur-[100px] rounded-full" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-[#b9a3e6] opacity-20 blur-[80px] rounded-full" />

                <Card className="w-full max-w-md relative z-10 border-white/60 bg-white/80 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#b9a3e6] to-[#9d80d6] rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/50">
                            <Sparkles className="text-white h-7 w-7" />
                        </div>
                        <CardTitle className="text-center font-serif text-3xl text-[#3f3660]">
                            {needsSetup ? 'Setup Admin' : authView === 'login' ? 'Admin Portal' : authView === 'forgot' ? 'Reset Password' : 'New Password'}
                        </CardTitle>
                        <CardDescription className="text-center text-gray-500">
                            {needsSetup ? 'Create your admin account to get started' :
                                authView === 'login' ? 'Enter your credentials to access the dashboard' :
                                    authView === 'forgot' ? 'Enter your email to receive an OTP' :
                                        'Enter the OTP sent to your email'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {needsSetup ? (
                            <form onSubmit={handleSetup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">Username</Label>
                                    <Input required value={setupData.username} onChange={e => setSetupData({ ...setupData, username: e.target.value })} placeholder="admin" className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">Email</Label>
                                    <Input required type="email" value={setupData.email} onChange={e => setSetupData({ ...setupData, email: e.target.value })} placeholder="admin@example.com" className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">Password</Label>
                                    <Input required type="password" value={setupData.password} onChange={e => setSetupData({ ...setupData, password: e.target.value })} placeholder="••••••••" className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-[#b9a3e6] to-[#9d80d6] hover:opacity-90 transition-opacity text-white font-semibold py-5" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Account'}</Button>
                            </form>
                        ) : authView === 'forgot' ? (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">Registered Email</Label>
                                    <Input required type="email" value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })} placeholder="admin@example.com" className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-[#b9a3e6] to-[#9d80d6] hover:opacity-90" disabled={isLoading}>{isLoading ? 'Sending...' : 'Send OTP'}</Button>
                                <Button type="button" variant="ghost" className="w-full text-[#6b6680] hover:text-[#3f3660]" onClick={() => setAuthView('login')}>Back to Login</Button>
                            </form>
                        ) : authView === 'reset' ? (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">Enter OTP</Label>
                                    <Input required value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })} placeholder="123456" className="text-center text-2xl tracking-widest bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" maxLength={6} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[#3f3660]">New Password</Label>
                                    <Input required type="password" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} placeholder="••••••••" className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]" />
                                </div>
                                <Button type="submit" className="w-full bg-gradient-to-r from-[#b9a3e6] to-[#9d80d6] hover:opacity-90" disabled={isLoading}>{isLoading ? 'Updating...' : 'Set New Password'}</Button>
                                <Button type="button" variant="ghost" className="w-full text-[#6b6680] hover:text-[#3f3660]" onClick={() => setAuthView('login')}>Back to Login</Button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-[#3f3660]">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="admin"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-[#3f3660]">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        className="bg-white/50 border-[#b9a3e6]/30 focus:border-[#9d80d6]"
                                        required
                                    />
                                </div>
                                <div className="text-right">
                                    <button type="button" onClick={() => setAuthView('forgot')} className="text-xs text-[#9d80d6] hover:text-[#3f3660] font-medium hover:underline">Forgot Password?</button>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-[#b9a3e6] to-[#9d80d6] hover:opacity-90 text-white shadow-md transition-all duration-200 py-5"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Authenticating...' : 'Sign In'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold font-heading text-[var(--color-black)]">
                        Admin Dashboard
                    </h1>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>

                <Tabs defaultValue="slots" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-lg border border-[var(--color-grey)]">
                        <TabsTrigger value="slots" className="px-8 data-[state=active]:bg-[var(--color-soft-blue)]">
                            <CalendarIcon className="mr-2 h-4 w-4" /> Manage Slots
                        </TabsTrigger>
                        <TabsTrigger value="testimonials" className="px-8 data-[state=active]:bg-[var(--color-soft-lavender)]">
                            <MessageSquare className="mr-2 h-4 w-4" /> Testimonials
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="slots">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Left Column: Controls */}
                            <div className="space-y-6">
                                {/* 1. Date Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">1. Select Date</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => date && setSelectedDate(date)}
                                            className="rounded-md border mx-auto"
                                        />
                                    </CardContent>
                                </Card>

                                {/* 2. Set Availability */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">2. Availability</CardTitle>
                                        <CardDescription>
                                            Set working hours for {format(selectedDate, 'PPP')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Start Time (24h)</Label>
                                                <select id="genStart" className="w-full p-2 mt-1 rounded-md border text-sm bg-background" defaultValue="10:00">
                                                    {Array.from({ length: 96 }).map((_, i) => {
                                                        const h = Math.floor(i / 4).toString().padStart(2, '0');
                                                        const m = ((i % 4) * 15).toString().padStart(2, '0');
                                                        const t = `${h}:${m}`;
                                                        return <option key={t} value={t}>{t}</option>;
                                                    })}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="text-xs">End Time (24h)</Label>
                                                <select id="genEnd" className="w-full p-2 mt-1 rounded-md border text-sm bg-background" defaultValue="18:30">
                                                    {Array.from({ length: 96 }).map((_, i) => {
                                                        const h = Math.floor(i / 4).toString().padStart(2, '0');
                                                        const m = ((i % 4) * 15).toString().padStart(2, '0');
                                                        const t = `${h}:${m}`;
                                                        return <option key={t} value={t}>{t}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <Label className="text-xs">Type</Label>
                                                <select id="genType" className="w-full p-2 mt-1 rounded-md border text-sm bg-background">
                                                    <option value="regular">Regular</option>
                                                    <option value="emergency">Emergency</option>
                                                </select>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                const start = document.getElementById('genStart').value;
                                                const end = document.getElementById('genEnd').value;
                                                const type = document.getElementById('genType').value;
                                                setAvailability(start, end, type);
                                            }}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            disabled={isPastDate(selectedDate)}
                                            title={isPastDate(selectedDate) ? "Cannot set availability for past dates" : "Set availability range"}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {isPastDate(selectedDate) ? 'Cannot Modify Past' : 'Set Availability'}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* 3. Availability Status (Utilization) */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Availability Status</CardTitle>
                                        <CardDescription>Utilization for {format(selectedDate, 'PPP')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {availabilityWindows.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No availability windows set.</p>
                                        ) : (
                                            availabilityWindows.map((availWindow) => {
                                                // Calculate Utilization
                                                const startMin = parseInt(availWindow.start_time.split(':')[0]) * 60 + parseInt(availWindow.start_time.split(':')[1]);
                                                const endMin = parseInt(availWindow.end_time.split(':')[0]) * 60 + parseInt(availWindow.end_time.split(':')[1]);
                                                const totalWindowMinutes = endMin - startMin;

                                                // Calculate Booked Minutes in this Window
                                                // Filter slots that are BOOKED and overlap with this window
                                                const bookedMinutes = slots
                                                    .filter(s => s.is_booked && s.type !== 'canceled')
                                                    .reduce((acc, slot) => {
                                                        const slotStartMin = parseInt(slot.time.split(':')[0]) * 60 + parseInt(slot.time.split(':')[1]);
                                                        const slotDuration = slot.duration || 20;
                                                        const slotEndMin = slotStartMin + slotDuration;

                                                        // Check overlapping
                                                        if (slotStartMin < endMin && slotEndMin > startMin) {
                                                            // Cap overlap to window bounds
                                                            const actualStart = Math.max(startMin, slotStartMin);
                                                            const actualEnd = Math.min(endMin, slotEndMin);
                                                            return acc + (actualEnd - actualStart);
                                                        }
                                                        return acc;
                                                    }, 0);

                                                const utilizationPercent = totalWindowMinutes > 0
                                                    ? Math.min(100, Math.round((bookedMinutes / totalWindowMinutes) * 100))
                                                    : 0;

                                                return (
                                                    <div key={availWindow.id} className="border rounded-md p-3 text-sm">
                                                        <div className="flex justify-between mb-1 items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold ${availWindow.type === 'emergency' ? 'text-amber-600' : 'text-green-600'}`}>
                                                                    {availWindow.type === 'emergency' ? 'EMERGENCY' : 'REGULAR'}
                                                                </span>
                                                                <span className="text-gray-500">{availWindow.start_time} - {availWindow.end_time}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    className="h-6 w-6 text-gray-400 hover:text-red-600 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteAvailability(availWindow.id);
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Bar */}
                                                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex border border-gray-200">
                                                            <div
                                                                className="h-full bg-red-500 transition-all duration-500"
                                                                style={{ width: `${utilizationPercent}%` }}
                                                                title={`Booked: ${bookedMinutes}m`}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between mt-1 text-xs text-gray-400">
                                                            <span>Booked: {Math.round(bookedMinutes)}m</span>
                                                            <span>Free: {Math.max(0, totalWindowMinutes - bookedMinutes)}m</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Timeline View */}
                            <div className="md:col-span-2">
                                <Card className="h-full flex flex-col">
                                    <CardHeader>
                                        <CardTitle>Daily Timeline</CardTitle>
                                        <CardDescription>
                                            Visualizing {format(selectedDate, 'PPP')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 overflow-y-auto">
                                        <div className="relative border-l-2 border-gray-200 ml-4 space-y-0 pb-12">
                                            {Array.from({ length: 24 }).map((_, hour) => {
                                                const hourStr = hour.toString().padStart(2, '0') + ":00";

                                                // Filter slots in this hour
                                                // User Request: Only show Booked/Busy slots. Hide granular "Available" slots.
                                                // The "Window" is already visualized by the background color.
                                                const slotsInHour = slots.filter(s => s.time.startsWith(hour.toString().padStart(2, '0') + ":") && s.is_booked);

                                                return (
                                                    <div key={hour} className={`relative pl-8 py-4 group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${getWindowForHour(hour) ? (
                                                        getWindowForHour(hour).type === 'emergency' ? 'bg-amber-50/50' : 'bg-green-50/50'
                                                    ) : ''
                                                        }`}>
                                                        {/* Window Label (Background) */}
                                                        {getWindowForHour(hour) && (
                                                            <div className="absolute inset-0 pointer-events-none border-l-4 border-l-transparent" style={{
                                                                borderColor: getWindowForHour(hour).type === 'emergency' ? '#f59e0b' : '#16a34a'
                                                            }}>
                                                                {(parseInt(getWindowForHour(hour).start_time.split(':')[0]) === hour) && (
                                                                    <span className="absolute right-2 top-2 text-[10px] uppercase font-bold text-gray-400">
                                                                        {getWindowForHour(hour).type} Window
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Time Label */}
                                                        <span className="absolute -left-2 top-4 text-xs font-bold text-gray-400 bg-white px-1">
                                                            {hourStr}
                                                        </span>

                                                        {/* Slot Container */}
                                                        <div className="min-h-[40px] flex gap-3 flex-wrap items-center">
                                                            {slotsInHour.length === 0 ? (
                                                                // If window exists but no bookings, it's fully free (clean look).
                                                                // If no window, it's just empty.
                                                                getWindowForHour(hour) ? (
                                                                    // Optional: "Open" text or just clean space. User said "just show available window".
                                                                    // Clean space is best.
                                                                    null
                                                                ) : (
                                                                    <span className="text-xs text-gray-300 italic opacity-0 group-hover:opacity-100 transition-opacity select-none">
                                                                    </span>
                                                                )
                                                            ) : (
                                                                slotsInHour.sort((a, b) => a.time.localeCompare(b.time)).map(slot => (
                                                                    <div
                                                                        key={slot.id}
                                                                        onClick={() => {
                                                                            if (slot.is_booked && slot.type !== 'canceled') {
                                                                                fetchBookingDetails(slot.id);
                                                                            }
                                                                        }}
                                                                        className={`
                                                                            relative px-3 py-2 rounded-lg border text-sm font-medium shadow-sm flex items-center gap-2
                                                                            ${slot.type === 'canceled'
                                                                                ? 'bg-gray-100 border-gray-200 text-gray-400'
                                                                                : slot.is_booked
                                                                                    ? 'bg-red-100 border-red-300 text-red-900 cursor-pointer hover:bg-red-200 transition-colors'
                                                                                    : 'bg-gray-100'}
                                                                        `}
                                                                    >
                                                                        <div className="flex flex-col leading-tight">
                                                                            <span className={`font-bold ${slot.type === 'canceled' ? 'line-through decoration-2 decoration-gray-400' : ''}`}>
                                                                                {slot.time} <span className="text-[10px] font-normal opacity-75">({slot.duration || 20}m)</span>
                                                                            </span>
                                                                        </div>

                                                                        {/* Stickers/Tags */}
                                                                        {slot.type === 'canceled' ? (
                                                                            <div className="flex flex-col items-start gap-1">
                                                                                <span className="text-[9px] bg-gray-400 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                                                                    CANCELED
                                                                                </span>
                                                                                <span className="text-[10px] truncate max-w-[150px]">
                                                                                    {slot.booked_by.replace(/^CANCELED:\s*/, '')}
                                                                                </span>
                                                                            </div>
                                                                        ) : slot.is_booked ? (
                                                                            <div className="flex flex-col items-start gap-1">
                                                                                <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                                                                    {slot.booked_by && !slot.booked_by.startsWith('BOOKED') ? 'BUSY' : 'BOOKED'}
                                                                                </span>
                                                                                {slot.booked_by && (
                                                                                    <span className="text-[10px] truncate max-w-[150px]" title={slot.booked_by}>
                                                                                        {slot.booked_by.replace(/^BOOKED:\s*/, '')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : null}

                                                                        {/* Delete Button (Hide for Canceeled) */}
                                                                        {slot.type !== 'canceled' && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 -mr-1 ml-1 text-gray-500 hover:text-red-600 hover:bg-white/50 rounded-full"
                                                                                onClick={() => {
                                                                                    if (slot.is_booked) {
                                                                                        deleteBooking(slot.id);
                                                                                    } else {
                                                                                        deleteSlot(slot.id);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="testimonials">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Add Testimonial */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Add Testimonial</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={createTestimonial} className="space-y-4">
                                            <div>
                                                <Label>Client Name</Label>
                                                <Input
                                                    value={newTestimonial.author}
                                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                                                    placeholder="e.g. Sarah J."
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>Review Text</Label>
                                                <Textarea
                                                    value={newTestimonial.text}
                                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                                                    placeholder="What did they say?"
                                                    rows={5}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>Rating (1-5)</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={newTestimonial.rating}
                                                    onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="w-full">
                                                <Plus className="mr-2 h-4 w-4" /> Add Testimonial
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Testimonial List */}
                            <div className="md:col-span-2">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>All Testimonials</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                            {testimonials.map((t) => (
                                                <div key={t.id} className="bg-white p-4 rounded-lg border border-[var(--color-grey)] shadow-sm relative group">
                                                    <p className="text-[var(--color-dark-grey)] text-sm mb-3">"{t.text}"</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-[var(--color-deep-blue)] text-sm">- {t.author}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-yellow-400 text-sm">★ {t.rating}</span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => deleteTestimonial(t.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog open={!!overlapData} onOpenChange={(open) => !open && setOverlapData(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Overlap Detected</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-4">
                            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
                                <p className="font-semibold mb-1">Conflicts with existing blocks:</p>
                                <ul className="list-disc list-inside">
                                    {overlapData?.detail?.overlaps?.map((o, i) => (
                                        <li key={i}>{o}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100">
                                <p className="font-semibold mb-1">Proposed Available Slots:</p>
                                <p>We can instead add availability for:</p>
                                <ul className="list-disc list-inside mt-1 font-mono">
                                    {overlapData?.detail?.proposed_segments?.map((s, i) => (
                                        <li key={i}>{s.start_time} - {s.end_time}</li>
                                    ))}
                                </ul>
                            </div>

                            <p className="font-medium text-gray-900">
                                Do you want to proceed with adding only the available slots?
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleOverlapConfirm} className="bg-green-600 hover:bg-green-700">
                            Confirm & Add
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <BookingDetailsModal />
        </div >
    );
};

export default Admin;
