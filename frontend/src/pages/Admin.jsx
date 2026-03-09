import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Plus, Calendar as CalendarIcon, MessageSquare, LogOut, Sparkles, Globe, Menu, X, ArrowUpDown, ChevronUp, ChevronDown, TrendingUp, Users, DollarSign, Activity, PieChart as PieChartIcon, Download } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import PromotionsTab from '../components/PromotionsTab';
import dayjs, { getUserTimezone, formatInTimeZone } from '../lib/dateUtils';
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
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "../components/ui/sheet";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAppLoaded, setIsAppLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('slots');
    const [allBookings, setAllBookings] = useState([]);
    const [isBookingsLoading, setIsBookingsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('paid');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalBookings, setTotalBookings] = useState(0);
    const [pageSize] = useState(10);
    const [sortField, setSortField] = useState('created_at');
    const [sortOrder, setSortOrder] = useState(-1);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [stats, setStats] = useState(null);
    const [isStatsLoading, setIsStatsLoading] = useState(false);

    // Auth Flow State
    const [needsSetup, setNeedsSetup] = useState(null);
    const [authView, setAuthView] = useState('login'); // 'login', 'forgot', 'reset'

    // Form States
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [setupData, setSetupData] = useState({ username: '', email: '', password: '' });
    const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.get(`${API}/auth/me`);
                if (res.data.username) {
                    setIsAuthenticated(true);
                }
            } catch (err) {
                // Not authenticated
                checkSetupStatus();
            } finally {
                setIsAppLoaded(true);
            }
        };
        initAuth();
    }, []);

    useEffect(() => {
        if (isAppLoaded && !isAuthenticated) {
            checkSetupStatus();
        }
    }, [isAuthenticated, isAppLoaded]);

    const checkSetupStatus = async () => {
        try {
            const res = await axios.get(`${API}/auth/setup-status`);
            setNeedsSetup(res.data.needs_setup);
        } catch (error) {
            console.error(error);
        }
    };

    // Slot State
    const DEFAULT_BUSINESS_TZ = "Europe/Rome";
    const [activeTZ] = useState(() => dayjs.tz.guess() || DEFAULT_BUSINESS_TZ);
    const [slots, setSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs().tz(activeTZ).toDate());
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
            await axios.post(`${API}/login`, credentials);
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



    const handleLogout = async () => {
        try {
            await axios.post(`${API}/auth/logout`);
        } catch (e) {
            console.error("Logout failed", e);
        }
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
        const todayInTZ = dayjs().tz(activeTZ).startOf('day');
        return dayjs(date).tz(activeTZ).isBefore(todayInTZ);
    };

    // Helper to check if a specific slot time is in the past
    const isSlotPast = (slot) => {
        // Use UTC if available, fallback to assuming Rome Time
        let slotDateTime;
        if (slot.start_time_utc) {
            slotDateTime = dayjs.utc(slot.start_time_utc);
        } else {
            // Fallback for slots without UTC info: assume they are in Business TZ (Rome)
            slotDateTime = dayjs.tz(`${slot.date}T${slot.time}`, activeTZ);
        }
        return slotDateTime.isBefore(dayjs().tz(activeTZ));
    };

    const fetchTestimonials = React.useCallback(async () => {
        try {
            const res = await axios.get(`${API}/testimonials`);
            setTestimonials(res.data);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        }
    }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 1 ? -1 : 1);
        } else {
            setSortField(field);
            setSortOrder(-1); // Default to Descending for new field
        }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
        return sortOrder === 1 ? <ChevronUp className="ml-1 h-3 w-3 text-secondary" /> : <ChevronDown className="ml-1 h-3 w-3 text-secondary" />;
    };

    const formatLocalDateTime = (dateStr, timeStr) => {
        if (!dateStr) return { date: 'N/A', time: '' };
        try {
            // If timeStr starts with a digit or T, it's likely a time or ISO
            // If it's a full ISO string (from slots)
            let dt;
            if (timeStr && (timeStr.includes('T') || timeStr.includes('Z') || timeStr.includes('+'))) {
                dt = new Date(timeStr.includes('T') ? timeStr : `${dateStr}T${timeStr}`);
            } else if (timeStr) {
                // Legacy or simple HH:mm
                // If we don't have TZ info, we assume UTC or Business TZ? 
                // But BookingForm sends UTC ISO now.
                dt = new Date(`${dateStr}T${timeStr}`);
            } else {
                dt = new Date(dateStr);
            }

            if (isNaN(dt.getTime())) return { date: dateStr, time: timeStr || '' };

            return {
                date: format(dt, 'yyyy-MM-dd'),
                time: format(dt, 'HH:mm')
            };
        } catch (e) {
            return { date: dateStr, time: timeStr || '' };
        }
    };

    const fetchAllBookings = React.useCallback(async () => {
        setIsBookingsLoading(true);
        try {
            const skip = (currentPage - 1) * pageSize;
            const res = await axios.get(`${API}/bookings`, {
                params: {
                    skip,
                    limit: pageSize,
                    service_type: serviceTypeFilter,
                    payment_status: statusFilter,
                    sort_by: sortField,
                    sort_order: sortOrder
                }
            });
            setAllBookings(res.data.bookings);
            setTotalBookings(res.data.total);
        } catch (error) {
            console.error('Error fetching all bookings:', error);
            toast.error('Failed to load bookings list');
        } finally {
            setIsBookingsLoading(false);
        }
    }, [currentPage, pageSize, serviceTypeFilter, statusFilter, sortField, sortOrder]);

    const fetchStats = async () => {
        setIsStatsLoading(true);
        try {
            const res = await axios.get(`${API}/admin/stats`);
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            // Non-critical toast? Dashboard usually has its own error state
        } finally {
            setIsStatsLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchSlots();
            fetchTestimonials();
            fetchAllBookings();
            fetchStats();
        }
    }, [isAuthenticated, fetchSlots, fetchTestimonials, fetchAllBookings]);

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

    const handleDownloadAura = (imageUrl, clientName) => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `Aura_${clientName.replace(/\s+/g, '_')}_${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const fetchBookingDetails = async (gcalEventId) => {
        setSelectedBooking(null); // Reset immediately
        setIsDetailsLoading(true);
        setDetailsOpen(true);
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
    const handleResendEmail = async () => {
        if (!selectedBooking) return;
        try {
            await axios.post(`${API}/bookings/${selectedBooking.booking_id}/resend-email`);
            toast.success("Confirmation email queued for resending");
        } catch (error) {
            console.error("Resend email failed:", error);
            toast.error("Failed to resend email");
        }
    };



    if (!isAppLoaded) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-primary/60 font-medium animate-pulse">Initializing Command Center...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4 py-8">
                {/* Subtle Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(184,134,11,0.05)_0%,transparent_70%)]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary opacity-5 blur-[100px] rounded-full" />
                <div className="absolute top-20 left-20 w-72 h-72 bg-secondary opacity-5 blur-[80px] rounded-full" />

                <Card className="w-full max-w-md relative z-10 border-primary/10 bg-white/80 dark:bg-slate-900/80 shadow-2xl backdrop-blur-xl">
                    <CardHeader className="space-y-1">
                        <div className="mx-auto w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-secondary/20">
                            <Sparkles className="text-secondary h-7 w-7" />
                        </div>
                        <CardTitle className="text-center font-heading text-3xl text-primary">
                            {needsSetup ? 'First Time Setup' : authView === 'login' ? 'Portal Access' : authView === 'forgot' ? 'Find Account' : 'Security Reset'}
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            {needsSetup ? 'Establish your administrator credentials' :
                                authView === 'login' ? 'Authenticate to access the command center' :
                                    authView === 'forgot' ? 'Verification code will be dispatched to your email' :
                                        'Provide the security code sent to you'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {needsSetup ? (
                            <form onSubmit={handleSetup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-primary/70">Username</Label>
                                    <Input required value={setupData.username} onChange={e => setSetupData({ ...setupData, username: e.target.value })} placeholder="admin" className="bg-background/50 border-primary/10 focus:border-secondary focus:ring-secondary/20 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-primary/70">Email Address</Label>
                                    <Input required type="email" value={setupData.email} onChange={e => setSetupData({ ...setupData, email: e.target.value })} placeholder="admin@example.com" className="bg-background/50 border-primary/10 focus:border-secondary focus:ring-secondary/20 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-primary/70">Access Password</Label>
                                    <Input required type="password" value={setupData.password} onChange={e => setSetupData({ ...setupData, password: e.target.value })} placeholder="••••••••" className="bg-background/50 border-primary/10 focus:border-secondary focus:ring-secondary/20 transition-all" />
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-md transition-all" disabled={isLoading}>{isLoading ? 'Configuring...' : 'Initialize Admin'}</Button>
                            </form>
                        ) : authView === 'forgot' ? (
                            <form onSubmit={handleForgotPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-primary/70">Verified Email Address</Label>
                                    <Input required type="email" value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })} placeholder="admin@example.com" className="bg-background/50 border-primary/10 focus:border-secondary transition-all" />
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-md transition-all" disabled={isLoading}>{isLoading ? 'Processing...' : 'Request Access Code'}</Button>
                                <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-primary" onClick={() => setAuthView('login')}>Return to Login</Button>
                            </form>
                        ) : authView === 'reset' ? (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-primary/70">Security Code</Label>
                                    <Input required value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })} placeholder="123456" className="text-center text-2xl tracking-[0.5em] bg-background/50 border-primary/10 focus:border-secondary transition-all" maxLength={6} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-primary/70">New Access Password</Label>
                                    <Input required type="password" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} placeholder="••••••••" className="bg-background/50 border-primary/10 focus:border-secondary transition-all" />
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-md transition-all" disabled={isLoading}>{isLoading ? 'Updating...' : 'Set New Password'}</Button>
                                <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-primary" onClick={() => setAuthView('login')}>Return to Login</Button>
                            </form>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-primary/70">Username</Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="admin"
                                        value={credentials.username}
                                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        className="bg-background/50 border-primary/10 focus:border-secondary transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="password" className="text-primary/70">Access Password</Label>
                                        <button type="button" onClick={() => setAuthView('forgot')} className="text-xs text-secondary hover:text-secondary/80 font-medium transition-colors">Forgot?</button>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={credentials.password}
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                        className="bg-background/50 border-primary/10 focus:border-secondary transition-all"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-xl shadow-md transition-all mt-4"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Verifying...' : 'Access Dashboard'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans">
            <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-primary/5 bg-background/80 backdrop-blur-md shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo/Title for Mobile */}
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-secondary/20">
                                <Sparkles className="text-secondary h-4 w-4" />
                            </div>
                            <span className="font-heading font-bold text-primary text-xl">Admin</span>
                        </div>

                        <nav className="hidden md:flex items-center space-x-8">
                            {[
                                { id: 'analytics', label: 'Analytics' },
                                { id: 'slots', label: 'Manage Slots' },
                                { id: 'bookings', label: 'Bookings' },
                                { id: 'testimonials', label: 'Testimonials' },
                                { id: 'promotions', label: 'Promotions' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`text-sm font-medium transition-colors duration-200 ${activeTab === tab.id
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-primary/60 hover:text-primary'
                                        } h-20 px-1`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="hidden lg:flex flex-col text-right text-[10px] text-primary/40 leading-tight">
                                <span className="flex items-center justify-end gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    Timezone: <strong className="text-primary/70">{activeTZ}</strong>
                                </span>
                            </div>
                            <Button
                                onClick={handleLogout}
                                className="hidden md:flex px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-none shadow-md hover:shadow-lg transition-all text-xs"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>

                            {/* Mobile Menu Trigger */}
                            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                                <SheetTrigger asChild className="md:hidden ml-auto">
                                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="bg-background text-foreground border-l border-primary/5 w-[280px] p-0">
                                    <SheetHeader className="sr-only">
                                        <SheetTitle>Navigation Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col h-full">
                                        <div className="p-6 space-y-8 mt-12">
                                            <div className="space-y-4">
                                                <p className="text-[10px] uppercase font-bold text-primary/40 tracking-widest pl-2">Navigation</p>
                                                {[
                                                    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
                                                    { id: 'slots', label: 'Manage Slots', icon: CalendarIcon },
                                                    { id: 'bookings', label: 'Bookings', icon: CalendarIcon },
                                                    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
                                                    { id: 'promotions', label: 'Promotions', icon: Sparkles }
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => {
                                                            setActiveTab(tab.id);
                                                            setIsMobileMenuOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                                            ? 'bg-primary text-primary-foreground shadow-md font-bold scale-[1.02]'
                                                            : 'text-primary/60 hover:bg-primary/5 hover:text-primary'
                                                            }`}
                                                    >
                                                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-secondary' : ''}`} />
                                                        <span className="text-sm">{tab.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-primary/5">
                                                <p className="text-[10px] uppercase font-bold text-primary/40 tracking-widest pl-2">Settings</p>
                                                <div className="px-4 py-3 bg-primary/5 rounded-xl space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-primary/60">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        <span>Timezone</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-primary">{activeTZ}</p>
                                                </div>
                                                <Button
                                                    onClick={() => {
                                                        handleLogout();
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    variant="outline"
                                                    className="w-full justify-start gap-3 px-4 py-3 rounded-xl border-primary/10 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Logout</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 pt-28 pb-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">

                    <TabsContent value="analytics" className="space-y-8 outline-none">
                        {isStatsLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-primary/60 font-medium">Crunching your data...</p>
                            </div>
                        ) : stats ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* KPI Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Revenue', value: `${stats.kpis.total_revenue || 0}€`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
                                        { label: 'Confirmed Bookings', value: stats.kpis.confirmed_bookings, icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
                                        { label: 'Incomplete Attempts', value: stats.kpis.pending_bookings, icon: Users, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                                        { label: 'Conversion Rate', value: `${stats.kpis.conversion_rate}%`, icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
                                    ].map((kpi, i) => (
                                        <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-bold text-primary/40 uppercase tracking-wider mb-1">{kpi.label}</p>
                                                        <h3 className="text-2xl font-heading font-bold text-primary">{kpi.value}</h3>
                                                    </div>
                                                    <div className={`p-3 rounded-2xl ${kpi.bg}`}>
                                                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Revenue Trend Line Chart */}
                                    <Card className="lg:col-span-2 shadow-sm border-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-secondary" />
                                                Revenue Trend (Last 30 Days)
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={stats.daily_trends}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            fontSize={10}
                                                            tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                                            stroke="#94A3B8"
                                                        />
                                                        <YAxis fontSize={10} stroke="#94A3B8" tickFormatter={(val) => `${val}€`} />
                                                        <RechartsTooltip
                                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#8B5CF6"
                                                            strokeWidth={3}
                                                            dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#FFF' }}
                                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Service Mix Pie Chart */}
                                    <Card className="shadow-sm border-none">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <PieChartIcon className="w-4 h-4 text-secondary" />
                                                Service Distribution
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[350px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.services}
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            {stats.services.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Booking Volume Bar Chart */}
                                <Card className="shadow-sm border-none">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-secondary" />
                                            Daily Booking Volume
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.daily_trends}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        fontSize={10}
                                                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                                        stroke="#94A3B8"
                                                    />
                                                    <YAxis fontSize={10} stroke="#94A3B8" />
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Legend verticalAlign="top" height={36} />
                                                    <Bar name="Confirmed" dataKey="confirmed" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                                    <Bar name="Not Completed" dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-primary/40 font-medium">
                                No analytics data available yet.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="slots">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all text-xs md:text-sm"
                                            disabled={isPastDate(selectedDate)}
                                            title={isPastDate(selectedDate) ? "Cannot set availability for past dates" : `Set availability in Business Time (Rome)`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {isPastDate(selectedDate) ? 'Past Date' : 'Establish Availability'}
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
                                                    <div key={availWindow.id} className="border rounded-lg p-3 text-sm bg-gray-50">
                                                        <div className="flex justify-between mb-3 items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${availWindow.type === 'emergency' ? 'bg-orange-100 text-orange-700' : 'bg-primary/5 text-primary/70'}`}>
                                                                    {availWindow.type === 'emergency' ? 'EMERGENCY' : 'REGULAR'}
                                                                </span>
                                                                <span className="text-primary/60 font-medium">{availWindow.start_time} - {availWindow.end_time}</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    className="h-7 w-7 text-primary/20 hover:text-destructive flex items-center justify-center rounded-full hover:bg-destructive/5 transition-all"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteAvailability(availWindow.id);
                                                                    }}
                                                                    title="Remove Window"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Utilization Bar */}
                                                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mt-2">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-500"
                                                                style={{ width: `${utilizationPercent}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between mt-1 text-[10px] uppercase font-bold text-gray-400">
                                                            <span>Occupied: {Math.round(bookedMinutes)}m</span>
                                                            <span>Available: {Math.max(0, totalWindowMinutes - bookedMinutes)}m</span>
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
                                    <CardContent className="flex-1 overflow-y-auto p-3 md:p-6">
                                        <div className="relative border-l-2 border-gray-200 ml-4 space-y-0 pb-12">
                                            {Array.from({ length: 24 }).map((_, hour) => {
                                                const hourStr = hour.toString().padStart(2, '0') + ":00";

                                                // Filter slots in this hour based on LOCAL browser time
                                                const slotsInHour = slots.filter(s => {
                                                    if (!s.is_booked) return false;

                                                    let slotDateTime;
                                                    if (s.start_time_utc) {
                                                        slotDateTime = dayjs.utc(s.start_time_utc).tz(activeTZ);
                                                    } else {
                                                        // Fallback for legacy slots
                                                        slotDateTime = dayjs.tz(`${s.date}T${s.time}`, activeTZ);
                                                    }

                                                    return slotDateTime.hour() === hour;
                                                });

                                                return (
                                                    <div key={hour} className={`relative pl-8 pr-4 py-4 group hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${getWindowForHour(hour) ? (
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
                                                                            if (slot.is_booked) {
                                                                                // Strip prefix for canceled slots to find by original booking_id
                                                                                const lookupId = slot.type === 'canceled' ? slot.id.replace('canceled-', '') : slot.id;
                                                                                fetchBookingDetails(lookupId);
                                                                            }
                                                                        }}
                                                                        className={`
                                                                            relative px-3 py-2 rounded-lg border text-sm font-medium shadow-sm flex items-center gap-2
                                                                            ${slot.type === 'canceled'
                                                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-pointer hover:bg-gray-200'
                                                                                : slot.is_booked
                                                                                    ? 'bg-red-100 border-red-300 text-red-900 cursor-pointer hover:bg-red-200 transition-colors'
                                                                                    : 'bg-gray-100'}
                                                                        `}
                                                                    >
                                                                        <div className="flex flex-col leading-tight">
                                                                            <span className={`font-bold ${slot.type === 'canceled' ? 'line-through decoration-2 decoration-gray-400' : ''}`}>
                                                                                {slot.start_time_utc
                                                                                    ? dayjs.utc(slot.start_time_utc).tz(activeTZ).format('HH:mm')
                                                                                    : slot.time
                                                                                } <span className="text-[10px] font-normal opacity-75">({slot.duration || 20}m)</span>
                                                                            </span>
                                                                        </div>

                                                                        {/* Stickers/Tags */}
                                                                        {slot.type === 'canceled' ? (
                                                                            <div className="flex flex-col items-start gap-1">
                                                                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                                                                    CANCELED
                                                                                </span>
                                                                                <span className="text-[10px] truncate max-w-[150px]">
                                                                                    {slot.booked_by.replace(/^CANCELED:\s*/, '')}
                                                                                </span>
                                                                            </div>
                                                                        ) : slot.is_booked ? (
                                                                            <div className="flex flex-col items-start gap-1">
                                                                                <span className="text-[9px] bg-secondary text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                                                                    {slot.booked_by && !slot.booked_by.startsWith('BOOKED') ? 'BUSY' : 'BOOKED'}
                                                                                </span>
                                                                                {slot.booked_by && (
                                                                                    <span className="text-[10px] truncate max-w-[150px]" title={slot.booked_by}>
                                                                                        {slot.booked_by.replace(/^BOOKED:\s*/, '')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ) : null}

                                                                        {/* Delete Button (Hide for Canceled or Past Slots) */}
                                                                        {slot.type !== 'canceled' && !isSlotPast(slot) && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-5 w-5 -mr-1 ml-1 text-primary/40 hover:text-destructive hover:bg-destructive/5 rounded-full"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all">
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
                                                <div key={t.id} className="bg-background/80 backdrop-blur-sm p-5 rounded-2xl border border-primary/10 shadow-sm relative group hover:border-secondary/50 transition-all">
                                                    <p className="text-primary/70 text-sm mb-4 italic leading-relaxed">"{t.text}"</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-heading font-bold text-primary text-sm tracking-wide">- {t.author}</span>
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center gap-1 text-secondary">
                                                                <span className="text-sm font-bold">{t.rating}</span>
                                                                <Sparkles className="w-3.5 h-3.5" />
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive/40 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all rounded-full"
                                                                onClick={() => deleteTestimonial(t.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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

                    <TabsContent value="bookings">
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-2xl font-heading text-primary">User Bookings</CardTitle>
                                        <CardDescription>View and manage all customer appointments</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8 bg-background/50 border-primary/10 focus:border-secondary transition-all w-full sm:w-[250px]"
                                            />
                                            <Sparkles className="absolute left-2.5 top-2.5 h-4 w-4 text-primary/40" />
                                        </div>
                                        <select
                                            value={serviceTypeFilter}
                                            onChange={(e) => {
                                                setServiceTypeFilter(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="p-2 rounded-md border border-primary/10 text-sm bg-background/50 focus:border-secondary outline-none"
                                        >
                                            <option value="all">All Services</option>
                                            <option value="live">Live Readings</option>
                                            <option value="delivered">Delivered Readings</option>
                                            <option value="aura">Aura Reading</option>
                                        </select>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => {
                                                setStatusFilter(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="p-2 rounded-md border border-primary/10 text-sm bg-background/50 focus:border-secondary outline-none"
                                        >
                                            <option value="all">All Status</option>
                                            <option value="paid">Confirmed</option>
                                            <option value="pending">Not Completed</option>
                                        </select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isBookingsLoading ? (
                                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-primary/60 font-medium">Loading user data...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0 bg-background/95 backdrop-blur-md z-10 shadow-sm">
                                                    <tr className="border-b border-primary/5 text-xs uppercase tracking-wider text-primary/40 font-bold">
                                                        <th className="px-4 py-4 pb-2">Ref ID</th>
                                                        {statusFilter !== 'pending' && <th className="px-4 py-4 pb-2">Transaction ID</th>}
                                                        <th className="px-4 py-4 pb-2">Status & Type</th>
                                                        <th className="px-4 py-4 pb-2">Client</th>
                                                        <th className="px-4 py-4 pb-2 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('preferred_date')}>
                                                            <div className="flex items-center">Date & Time <SortIcon field="preferred_date" /></div>
                                                        </th>
                                                        <th className="px-4 py-4 pb-2 text-right cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('amount')}>
                                                            <div className="flex items-center justify-end">Amount <SortIcon field="amount" /></div>
                                                        </th>
                                                        <th className="px-4 py-4 pb-2 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-primary/5">
                                                    {allBookings
                                                        .filter(b => {
                                                            const matchesSearch = b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                b.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                b.booking_id?.toLowerCase().includes(searchQuery.toLowerCase());
                                                            return matchesSearch;
                                                        })
                                                        .map((booking) => (
                                                            <tr key={booking.booking_id} className="hover:bg-primary/[0.02] transition-colors group">
                                                                <td className="px-4 py-4">
                                                                    <span className="text-xs font-mono font-bold text-primary/70">{booking.booking_id}</span>
                                                                </td>
                                                                {statusFilter !== 'pending' && (
                                                                    <td className="px-4 py-4">
                                                                        <span className="text-xs font-mono text-primary/60">
                                                                            {booking.transaction_id ? booking.transaction_id.replace('PAYID-', '') : '-'}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className={`text-[10px] w-fit font-bold px-2 py-0.5 rounded-full ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                            {booking.payment_status?.toUpperCase() || 'PENDING'}
                                                                        </span>
                                                                        <span className="text-xs text-primary/60 capitalize">
                                                                            {booking.service_type?.replace('-', ' ')}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="flex flex-col leading-tight">
                                                                        <span className="text-sm font-bold text-primary">{booking.full_name}</span>
                                                                        <span className="text-xs text-primary/50">{booking.email}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="flex flex-col leading-tight">
                                                                        {(() => {
                                                                            const { date, time } = formatLocalDateTime(booking.preferred_date, booking.preferred_time);
                                                                            return (
                                                                                <>
                                                                                    <span className="text-sm font-medium text-primary">{date}</span>
                                                                                    <span className="text-xs text-primary/40">{time}</span>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 text-right">
                                                                    <span className="text-sm font-bold text-primary">
                                                                        {booking.currency} {booking.amount}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4 text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => fetchBookingDetails(booking.booking_id)}
                                                                        className="text-secondary hover:text-secondary/80 hover:bg-secondary/10 font-bold text-xs rounded-lg"
                                                                    >
                                                                        View Details
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    {allBookings.length === 0 && (
                                                        <tr>
                                                            <td colSpan="6" className="px-4 py-20 text-center text-primary/40 italic">
                                                                No bookings found matching your criteria.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                                            <p className="text-xs text-primary/40">
                                                Showing <span className="font-bold">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-bold">{Math.min(currentPage * pageSize, totalBookings)}</span> of <span className="font-bold">{totalBookings}</span> bookings
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                                    className="text-xs font-bold border-primary/10 hover:bg-primary/5"
                                                >
                                                    Previous
                                                </Button>
                                                <div className="flex items-center px-4 bg-primary/5 rounded-md">
                                                    <span className="text-xs font-bold text-primary">Page {currentPage} of {Math.ceil(totalBookings / pageSize) || 1}</span>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={currentPage >= Math.ceil(totalBookings / pageSize)}
                                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                                    className="text-xs font-bold border-primary/10 hover:bg-primary/5"
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="promotions">
                        <PromotionsTab />
                    </TabsContent>
                </Tabs>

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
                                    {selectedBooking.questions && (
                                        <div>
                                            <h4 className="font-semibold text-gray-700 mb-1 text-sm uppercase tracking-wide">Specific Questions</h4>
                                            <p className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 whitespace-pre-wrap">{selectedBooking.questions}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Aura Image if available */}
                                {selectedBooking.aura_image && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-purple-500" /> Aura Photo
                                            </h4>
                                            <button
                                                onClick={() => handleDownloadAura(selectedBooking.aura_image, selectedBooking.full_name)}
                                                className="p-1.5 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
                                                title="Download Photo"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </button>
                                        </div>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={handleResendEmail}
                                >
                                    Resend Email
                                </Button>
                            </div>
                            <AlertDialogCancel onClick={() => setDetailsOpen(false)}>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div >
    );
};

export default Admin;
