import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Ticket,
    Megaphone,
    Rocket,
    RefreshCcw,
    Check,
    X,
    Edit2,
    Trash2,
    Percent,
    Tag
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const PromotionsTab = () => {
    const [services, setServices] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [activeCampaign, setActiveCampaign] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Forms
    const [newPromo, setNewPromo] = useState({ code: '', discount_type: 'percentage', discount_value: '', usage_limit: 100 });
    const [newCampaign, setNewCampaign] = useState({ message: '', discount_percentage: '', expiry_date: '' });

    const baseUrl = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'http://localhost:8000';

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [sRes, pRes, cRes] = await Promise.all([
                axios.get(`${baseUrl}/api/services`),
                axios.get(`${baseUrl}/api/promotions`),
                axios.get(`${baseUrl}/api/campaign`)
            ]);
            setServices(sRes.data);
            setPromotions(pRes.data);
            setActiveCampaign(cRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    const handleUpdateService = async (id, field, value) => {
        try {
            await axios.put(`${baseUrl}/api/services/${id}`, { [field]: value });
            toast.success("Service updated");
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error("Update failed");
        }
    };

    const handleInitDefaults = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`${baseUrl}/api/services/init`);
            toast.success(res.data.message);
            fetchData();
        } catch (error) {
            toast.error("Failed to initialize defaults");
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePromo = async (e) => {
        e.preventDefault();
        if (newPromo.discount_type === 'percentage' && newPromo.discount_value > 100) {
            toast.error("Percentage discount cannot exceed 100%");
            return;
        }
        try {
            await axios.post(`${baseUrl}/api/promotions`, newPromo);
            toast.success("Promotion created");
            setNewPromo({ code: '', discount_type: 'percentage', discount_value: '', usage_limit: 100 });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to create promotion");
        }
    };

    const handleDeletePromo = async (id) => {
        if (!window.confirm("Delete this promotion?")) return;
        try {
            await axios.delete(`${baseUrl}/api/promotions/${id}`);
            toast.success("Promotion deleted");
            fetchData();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleSetCampaign = async (e) => {
        e.preventDefault();
        if (newCampaign.discount_percentage > 100) {
            toast.error("Discount percentage cannot exceed 100%");
            return;
        }
        if (activeCampaign) {
            if (!window.confirm("A global campaign is already active. Proceeding will deactivate the current one. Continue?")) {
                return;
            }
        }
        try {
            const payload = {
                ...newCampaign,
                expiry_date: new Date(newCampaign.expiry_date).toISOString()
            };
            await axios.post(`${baseUrl}/api/campaign`, payload);
            toast.success("Global Campaign Active!");
            setNewCampaign({ message: '', discount_percentage: '', expiry_date: '' });
            fetchData();
        } catch (error) {
            toast.error("Failed to set campaign");
        }
    };

    const handleDeleteCampaign = async (id) => {
        if (!window.confirm("End this global campaign?")) return;
        try {
            await axios.delete(`${baseUrl}/api/campaign/${id}`);
            toast.success("Campaign deactivated");
            fetchData();
        } catch (error) {
            toast.error("Failed to deactivate campaign");
        }
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currency || 'EUR' }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Global Campaign Manager */}
                    <section className="bg-background/50 backdrop-blur-sm rounded-3xl border border-primary/5 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-primary/5 flex items-center gap-4 bg-primary/5">
                            <div className="h-10 w-10 bg-primary text-secondary rounded-xl flex items-center justify-center shadow-md">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-heading font-bold text-primary">Global Campaign</h2>
                                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Site-wide announcement & rewards</p>
                            </div>
                        </div>
                        <div className="p-8">
                            {activeCampaign ? (
                                <div className="mb-10 relative group">
                                    <div className="absolute inset-0 bg-secondary/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative border border-secondary/20 rounded-2xl p-8 bg-background shadow-xl overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 -mr-16 -mt-16 rounded-full" />
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <Rocket className="w-4 h-4 text-secondary" />
                                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Live Now</span>
                                                </div>
                                                <h4 className="font-heading font-bold text-2xl text-primary leading-tight">{activeCampaign.message}</h4>
                                                <div className="flex items-center gap-4">
                                                    <div className="px-4 py-2 bg-primary rounded-xl text-secondary font-bold text-sm shadow-lg shadow-primary/10">
                                                        Up to {activeCampaign.discount_percentage}% OFF
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] font-medium text-primary/40">
                                                        <RefreshCcw className="w-3.5 h-3.5 animate-spin-slow" />
                                                        Expires: {new Date(activeCampaign.expiry_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="text-primary/20 hover:text-destructive transition-all p-3 hover:bg-destructive/5 rounded-full"
                                                onClick={() => handleDeleteCampaign(activeCampaign.id)}
                                                title="Terminate Campaign"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-10 border border-dashed border-primary/20 rounded-2xl p-12 text-center bg-primary/5 flex flex-col items-center gap-3">
                                    <Megaphone className="w-8 h-8 text-primary/10" />
                                    <p className="text-primary/40 font-heading font-bold text-lg">System Standby: No Active Campaign</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-primary/5" />
                                    Launch New Campaign
                                    <div className="h-px flex-1 bg-primary/5" />
                                </h3>
                                <form onSubmit={handleSetCampaign} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold text-primary/60 uppercase ml-1">Message</Label>
                                        <Input
                                            className="w-full bg-background border-primary/10 rounded-xl focus:border-secondary h-12 px-5 transition-all"
                                            placeholder="e.g. Celestial Event: Flash Sale Active!"
                                            value={newCampaign.message}
                                            onChange={e => setNewCampaign({ ...newCampaign, message: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-primary/60 uppercase ml-1">Discount Percentage</Label>
                                            <div className="relative">
                                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/20 w-4 h-4" />
                                                <Input
                                                    className="w-full bg-background border-primary/10 rounded-xl focus:border-secondary h-12 transition-all"
                                                    placeholder="20"
                                                    type="number"
                                                    value={newCampaign.discount_percentage}
                                                    onChange={e => setNewCampaign({ ...newCampaign, discount_percentage: e.target.value })}
                                                    required
                                                    min="1" max="100"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-bold text-primary/60 uppercase ml-1">Expiry Date</Label>
                                            <Input
                                                className="w-full bg-background border-primary/10 rounded-xl focus:border-secondary h-12 px-5 transition-all"
                                                type="date"
                                                value={newCampaign.expiry_date}
                                                onChange={e => setNewCampaign({ ...newCampaign, expiry_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-primary hover:bg-primary/95 text-secondary font-bold h-14 rounded-2xl shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                        Activate Site-Wide Campaign
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>

                    {/* Service Pricing Manager */}
                    <section className="bg-background/50 backdrop-blur-sm rounded-3xl border border-primary/5 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-primary/5 bg-primary/5">
                            <h2 className="text-lg font-heading font-bold text-primary">Service Pricing</h2>
                            <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Global baseline rates</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-primary/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Offering</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest">Price Point</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-primary/40 uppercase tracking-widest text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-primary/5">
                                    {services.map((service) => (
                                        <tr key={service.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4 font-heading font-bold text-primary text-sm">{service.name}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-primary/60">{service.category}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-primary italic">
                                                {editingId === service.id ? (
                                                    <Input
                                                        type="number"
                                                        className="w-24 h-9 bg-background border-primary/10 rounded-lg focus:border-secondary"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    formatCurrency(service.amount, service.currency)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {editingId === service.id ? (
                                                    <div className="flex justify-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-green-600 hover:bg-green-50 rounded-lg"
                                                            onClick={() => handleUpdateService(service.id, 'amount', parseFloat(editValue))}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <button
                                                            className="h-8 w-8 text-destructive/60 hover:bg-destructive/10 flex items-center justify-center rounded-lg transition-all"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-secondary hover:text-primary hover:bg-secondary/10 font-bold rounded-lg transition-all"
                                                        onClick={() => {
                                                            setEditingId(service.id);
                                                            setEditValue(service.amount);
                                                        }}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Modify
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {services.length === 0 && (
                                        <tr>
                                            <td className="px-6 py-16 text-center" colSpan="4">
                                                <div className="flex flex-col items-center gap-4">
                                                    <RefreshCcw className="w-10 h-10 text-primary/10" />
                                                    <p className="text-primary/30 font-medium italic">Chronicles are empty. Initialize defaults?</p>
                                                    <button
                                                        onClick={handleInitDefaults}
                                                        className="inline-flex items-center gap-3 px-6 py-2.5 bg-primary text-secondary rounded-xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/10"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                        Populate System
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                <div className="space-y-8 h-full">
                    <section className="bg-background/50 backdrop-blur-md rounded-3xl border border-primary/5 shadow-xl overflow-hidden flex flex-col h-full ring-1 ring-primary/5">
                        <div className="p-6 bg-primary/5 border-b border-primary/5 flex items-center gap-4">
                            <div className="h-10 w-10 bg-primary text-secondary rounded-xl flex items-center justify-center shadow-lg">
                                <Tag className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-heading font-bold text-primary">Promo Codes</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] mb-4">Forge New Code</h3>
                                    <form onSubmit={handleCreatePromo} className="space-y-4 p-5 bg-background rounded-2xl border border-primary/10 shadow-inner">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-primary/50 uppercase ml-1">Promo Code</Label>
                                            <Input
                                                className="w-full bg-background border-primary/10 rounded-xl text-sm focus:border-secondary h-11 px-4 transition-all"
                                                placeholder="e.g. VIP2026"
                                                value={newPromo.code}
                                                onChange={e => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-primary/50 uppercase ml-1">Type</Label>
                                                <select
                                                    className="w-full h-11 bg-background border border-primary/10 rounded-xl text-xs focus:border-secondary px-3 appearance-none transition-all"
                                                    value={newPromo.discount_type}
                                                    onChange={e => setNewPromo({ ...newPromo, discount_type: e.target.value })}
                                                >
                                                    <option value="percentage">Percent</option>
                                                    <option value="fixed">Fixed</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-primary/50 uppercase ml-1">Discount</Label>
                                                <Input
                                                    className="w-full bg-background border-primary/10 rounded-xl text-sm focus:border-secondary h-11 px-4 transition-all"
                                                    placeholder="10"
                                                    type="number"
                                                    value={newPromo.discount_value}
                                                    onChange={e => setNewPromo({ ...newPromo, discount_value: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-bold text-primary/50 uppercase ml-1">Usage Quota</Label>
                                            <Input
                                                className="w-full bg-background border-primary/10 rounded-xl text-sm focus:border-secondary h-11 px-4 transition-all"
                                                type="number"
                                                value={newPromo.usage_limit}
                                                onChange={e => setNewPromo({ ...newPromo, usage_limit: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-primary/95 text-secondary font-bold h-12 rounded-xl transition-all shadow-md active:scale-95"
                                        >
                                            Create Promo
                                        </button>
                                    </form>
                                </div>
                                <div className="h-px bg-primary/5" />
                                <div>
                                    <h3 className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em] mb-5">Active Promos</h3>
                                    <div className="space-y-4">
                                        {promotions.filter(p => p.is_active).map(promo => (
                                            <div key={promo.id} className="group p-4 rounded-2xl border border-primary/5 bg-background/50 hover:bg-background hover:border-secondary/30 transition-all relative overflow-hidden shadow-sm">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-secondary to-transparent" />
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-heading font-black text-primary tracking-wide text-sm">{promo.code}</span>
                                                        <span className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-0.5">
                                                            Up to {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `€${promo.discount_value}`} OFF
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="text-primary/10 hover:text-destructive transition-all p-2 rounded-full hover:bg-destructive/5"
                                                        onClick={() => handleDeletePromo(promo.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-primary/30 uppercase tracking-tighter">
                                                        <span>Utilization</span>
                                                        <span>{promo.used_count} / {promo.usage_limit}</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-primary/5 rounded-full overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full bg-secondary shadow-[0_0_8px_rgba(184,134,11,0.5)] transition-all duration-1000"
                                                            style={{ width: `${Math.min((promo.used_count / promo.usage_limit) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {promotions.length === 0 && (
                                            <div className="py-12 text-center rounded-2xl border border-dashed border-primary/10 bg-primary/5 opacity-50">
                                                <Tag className="w-6 h-6 text-primary/20 mx-auto mb-3" />
                                                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest leading-loose">No active protocols detected</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PromotionsTab;
