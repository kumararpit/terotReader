import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Calendar, Clock, Upload, User, Mail, Heart, HelpCircle, FileText, Smartphone, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';

export const BookingForm = ({ service, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: '',
    sessionType: '',
    readingFocus: '',
    partnerName: '',
    partnerDob: '',
    questions: '',
    situation: '',
    slot: '',
    email: '',
    picture: null,
    isEmergency: false,
    bookingDate: ''
  });

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === 'picture') {
      setFormData({ ...formData, [name]: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isDelivered = service.title.includes('Delivered');
  const isLive = service.title.includes('Live');
  const isAura = service.title.includes('Aura');

  // Slot Logic
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (isLive && formData.bookingDate && formData.sessionType) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const baseUrl = process.env.REACT_APP_BACKEND_URL?.replace(/\/api\/?$/, '').replace(/\/$/, '');
          let duration = 20;
          if (formData.sessionType === '40_min') duration = 40;

          // 1. Fetch Selected Date Slots
          const typeParam = formData.isEmergency ? 'emergency' : 'regular';

          const p1 = axios.get(`${baseUrl}/api/slots?date=${formData.bookingDate}&available_only=true&duration=${duration}&type=${typeParam}`);

          let promises = [p1];

          // 2. If Emergency, Fetch Next Day too
          if (formData.isEmergency) {
            const dateObj = new Date(formData.bookingDate);
            dateObj.setDate(dateObj.getDate() + 1);
            const nextDateStr = format(dateObj, 'yyyy-MM-dd');
            const p2 = axios.get(`${baseUrl}/api/slots?date=${nextDateStr}&available_only=true&duration=${duration}&type=emergency`);
            promises.push(p2);
          }

          const results = await Promise.all(promises);

          // Combine
          let combined = results[0].data;
          if (results.length > 1) {
            combined = [...combined, ...results[1].data];
          }

          setAvailableSlots(combined);

        } catch (error) {
          console.error('Error fetching slots:', error);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };

      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [isLive, formData.sessionType, formData.bookingDate, formData.isEmergency]);

  // Filter slots based on emergency status
  const filteredSlots = availableSlots.filter((slot) => {
    // Note: We already filtered by Type and Date in the API call above.
    return true;
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">

        {/* Common Fields */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--color-primary)]" /> Full Name *
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
            placeholder="John Doe"
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[var(--color-primary)]" /> Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none transition-all"
            placeholder="your@email.com"
            onChange={handleChange}
          />
        </div>

        {!isAura && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--color-primary)]" /> Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                required
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                onChange={handleChange}
              />
              <p className="text-xs text-red-400 mt-1">* Must be 18+ to book</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-primary)]" /> Gender *
              </label>
              <select
                name="gender"
                required
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--color-primary)]" /> Session Type *
              </label>
              <select
                name="sessionType"
                required
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                onChange={handleChange}
              >
                <option value="">Select Option</option>
                {isDelivered ? (
                  <>
                    <option value="3_questions">3 Questions</option>
                    <option value="5_questions">5 Questions</option>
                  </>
                ) : (
                  <>
                    <option value="20_min">20 Minutes</option>
                    <option value="40_min">40 Minutes</option>
                  </>
                )}
              </select>
            </div>

            {/* Reading Focus */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[var(--color-primary)]" /> Reading Focus *
              </label>
              <select
                name="readingFocus"
                required
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                onChange={handleChange}
              >
                <option value="">Select Topic</option>
                <option value="love">Love & Relationships</option>
                <option value="career">Career & Finance</option>
                <option value="other">Other / Mixed</option>
              </select>
              <p className="text-xs text-amber-600 mt-1">Note: Questions related to serious health conditions/illnesses are not accepted.</p>
            </div>

            {/* Partner Details */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Partner/Other Person's Name (Optional)</label>
              <input
                type="text"
                name="partnerName"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                placeholder="If applicable"
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Their DOB (Optional)</label>
              <input
                type="date"
                name="partnerDob"
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                onChange={handleChange}
              />
            </div>
          </>
        )}

        {/* Aura Specific Fields */}
        {isAura && (
          <div className="md:col-span-2 space-y-4">

            {/* Minimalist Upload Header */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--color-primary)]" /> Upload Your Photo *
              </label>
            </div>

            {/* Main Upload Box - Clean & Centered */}
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-purple-400 hover:bg-purple-50/30 transition-all group cursor-pointer relative bg-white items-center justify-center flex flex-col gap-3">
              <input
                type="file"
                name="picture"
                accept="image/*"
                required
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File size must be less than 5MB");
                      e.target.value = "";
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, auraImage: reader.result }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {formData.auraImage ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <p className="font-medium text-slate-800">Photo Uploaded Successfully</p>
                  <p className="text-xs text-slate-500 mt-1">Ready to submit</p>
                </div>
              ) : (
                <div className="text-center group-hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <p className="font-semibold text-slate-700">Click to upload your photo</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG/PNG (Max 5MB)</p>
                </div>
              )}
            </div>

            {/* Collapsible Guidelines */}
            <details className="group rounded-xl border border-gray-100 bg-gray-50/50 open:bg-white open:shadow-sm open:border-purple-100 transition-all duration-300">
              <summary className="flex items-center gap-3 p-4 cursor-pointer list-none text-sm font-medium text-slate-600 hover:text-purple-700 select-none">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">i</div>
                View Photo Guidelines & Example
                <span className="ml-auto transform group-open:rotate-180 transition-transform duration-300">
                  ▼
                </span>
              </summary>

              <div className="p-6 pt-0 border-t border-transparent group-open:border-gray-100 animate-in fade-in duration-300">
                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  {/* Reference Image */}
                  <div className="w-full md:w-32 flex-shrink-0">
                    <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-white shadow-md relative">
                      <img
                        src="/assets/aura_reference.jpeg"
                        alt="Example"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-1">Reference Style</p>
                  </div>

                  {/* Text Rules */}
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-700 text-sm mb-2">For Best Results:</h4>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Use a plain, light-colored background
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Ensure even lighting on your face and body
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Keep a natural, relaxed posture
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        Wear simple, solid-colored clothing
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            {/* Questions for Aura (Optional or Specific?) - User didn't specify, but assume standard questions needed? 
                Mock data says "Predictions...". Usually aura needs specific concerns. 
                Let's keep the standard Text Areas for Aura too, but maybe simplified?
                User only asked for Image Upload. Let's keep common text areas below.
            */}
          </div>
        )}

        {/* Live Specific - Slot Selection */}
        {isLive && (
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-2">
              {/* Booking Date Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--color-primary)]" /> Select Booking Date *
                </label>
                <input
                  type="date"
                  name="bookingDate"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none"
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-primary)]" /> Select Available Slot *
                </label>

                {loadingSlots ? (
                  <div className="text-sm text-gray-500 italic">Loading slots...</div>
                ) : !formData.sessionType ? (
                  <div className="text-sm text-gray-500 italic">Please select a session type to view duration-specific slots.</div>
                ) : !formData.bookingDate ? (
                  <div className="text-sm text-gray-500 italic">Please select a date to view available slots.</div>
                ) : filteredSlots.length === 0 ? (
                  <div className="text-sm text-red-500 bg-red-50 p-4 rounded-lg border border-red-100">
                    No {formData.isEmergency ? 'emergency' : 'regular'} slots available for this date.
                    {formData.isEmergency ? ' Emergency slots must be within the next 24 hours (or next day).' : ' Please check another date.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredSlots.map((slot) => {
                      const slotValue = `${slot.date}T${slot.time}`;
                      const isTomorrow = slot.date !== formData.bookingDate;

                      return (
                        <button
                          key={slot.id || slotValue}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, slot: slotValue }));
                          }}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center justify-center ${formData.slot === slotValue
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                        >
                          <div className="text-lg">{slot.time}</div>
                          {isTomorrow && <div className="text-xs font-bold text-amber-300">Next Day</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-xl border border-red-100">
              <input
                type="checkbox"
                name="isEmergency"
                id="isEmergency"
                checked={formData.isEmergency}
                onChange={handleChange}
                className="w-5 h-5 text-red-500 rounded focus:ring-red-500 border-gray-300"
              />
              <label htmlFor="isEmergency" className="text-sm text-gray-700 cursor-pointer">
                <span className="font-semibold text-red-600 block">Request Emergency Slot</span>
                <span className="text-xs">Prioritized scheduling (Higher Rate). Includes next day slots.</span>
              </label>
            </div>
          </div>
        )}

        {/* Text Areas */}
        {!isAura && (
          <>
            {!isLive && (
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--color-primary)]" /> Your Questions *
                </label>
                <textarea
                  name="questions"
                  required
                  className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none min-h-[100px]"
                  placeholder="Type your questions here (Max 300 words)..."
                  onChange={handleChange}
                ></textarea>
                <p className="text-xs text-gray-500 text-right">Max 300 words</p>
              </div>
            )}

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" /> Situation Description *
              </label>
              <textarea
                name="situation"
                required
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200 outline-none min-h-[150px]"
                placeholder="Describe your situation in detail (Max 500 words)..."
                onChange={handleChange}
              ></textarea>
              <p className="text-xs text-gray-500 text-right">Max 500 words</p>
            </div>
          </>
        )}

      </div>

      <div className="pt-6">
        <Button type="submit" className="w-full btn-primary py-4 text-lg">
          Proceed to Payment
        </Button>
      </div>
    </form >
  );
};