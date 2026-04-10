/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addWeeks, 
  differenceInCalendarWeeks,
  parseISO,
  isToday
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Info, 
  X, 
  Check,
  Sun,
  Moon,
  Plane,
  Stethoscope,
  Plus,
  Building2,
  Pencil,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Reference: 2026-04-06 is Monday of a Morning week
const REFERENCE_DATE = new Date(2026, 3, 6); // April 6, 2026

type EventType = 'ferie' | 'malattia' | 'sabato' | 'chiusura' | null;

interface DayEvent {
  type: EventType;
  forcedShift?: 'Mattina' | 'Pomeriggio';
  note?: string;
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 9)); // Start at today in the prompt
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Record<string, DayEvent>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [viewingNote, setViewingNote] = useState<string | null>(null);

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('shift_calendar_events');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error('Failed to parse events', e);
      }
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('shift_calendar_events', JSON.stringify(events));
  }, [events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  }, [calendarStart, calendarEnd]);

  const getDefaultShift = (date: Date) => {
    const weeksDiff = differenceInCalendarWeeks(date, REFERENCE_DATE, { weekStartsOn: 1 });
    const isMorning = Math.abs(weeksDiff) % 2 === 0;
    return isMorning ? 'Mattina' : 'Pomeriggio';
  };

  const getShift = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const event = events[dateKey];
    if (event?.forcedShift) return event.forcedShift;
    return getDefaultShift(date);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date(2026, 3, 9));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    const dateKey = format(day, 'yyyy-MM-dd');
    setNoteText(events[dateKey]?.note || '');
    setIsModalOpen(true);
  };

  const saveNote = () => {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentEvent = events[dateKey] || { type: null };
    
    if (!noteText.trim() && !currentEvent.type && !currentEvent.forcedShift) {
      const newEvents = { ...events };
      delete newEvents[dateKey];
      setEvents(newEvents);
    } else {
      setEvents({
        ...events,
        [dateKey]: { ...currentEvent, note: noteText.trim() || undefined }
      });
    }
    setIsModalOpen(false);
  };

  const setDayEvent = (type: EventType) => {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentEvent = events[dateKey] || {};
    
    if (type === null) {
      if (currentEvent.forcedShift) {
        setEvents({
          ...events,
          [dateKey]: { ...currentEvent, type: null }
        });
      } else {
        const newEvents = { ...events };
        delete newEvents[dateKey];
        setEvents(newEvents);
      }
    } else {
      setEvents({
        ...events,
        [dateKey]: { ...currentEvent, type }
      });
    }
    setIsModalOpen(false);
  };

  const toggleForcedShift = () => {
    if (!selectedDate) return;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const currentEvent = events[dateKey] || {};
    const currentShift = getShift(selectedDate);
    const nextShift = currentShift === 'Mattina' ? 'Pomeriggio' : 'Mattina';
    
    // If nextShift is the default shift, we remove the override
    if (nextShift === getDefaultShift(selectedDate)) {
      const { forcedShift, ...rest } = currentEvent;
      if (Object.keys(rest).length === 0) {
        const newEvents = { ...events };
        delete newEvents[dateKey];
        setEvents(newEvents);
      } else {
        setEvents({ ...events, [dateKey]: rest as DayEvent });
      }
    } else {
      setEvents({
        ...events,
        [dateKey]: { ...currentEvent, forcedShift: nextShift }
      });
    }
    setIsModalOpen(false);
  };

  const getDayStatus = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return events[dateKey];
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-orange-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-5xl font-serif italic text-gray-900 mb-1">
              {format(currentDate, 'MMMM', { locale: it }).charAt(0).toUpperCase() + format(currentDate, 'MMMM', { locale: it }).slice(1)}
              <span className="font-sans font-bold not-italic ml-3 text-orange-500 text-3xl align-middle">{format(currentDate, 'yyyy')}</span>
            </h1>
            <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">Gestione Turni Lavoro</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-1 border-r border-gray-100 pr-2 mr-1">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
                aria-label="Mese precedente"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleToday}
                className="px-4 py-1.5 text-sm font-semibold hover:bg-gray-50 rounded-lg transition-colors"
              >
                Oggi
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-600"
                aria-label="Mese successivo"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-2 px-2">
              <CalendarIcon size={16} className="text-gray-400" />
              <input 
                type="date" 
                className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer text-gray-600"
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(parseISO(e.target.value));
                  }
                }}
                value={format(currentDate, 'yyyy-MM-dd')}
              />
            </div>
          </div>
        </header>

        {/* Calendar Grid */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) handlePrevMonth();
            else if (info.offset.x < -100) handleNextMonth();
          }}
          className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden touch-none"
        >
          {/* Weekdays */}
          <div className="grid grid-cols-7 border-bottom border-gray-100 bg-gray-50/50">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const shift = getShift(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const event = getDayStatus(day);
              const isTodayDay = isToday(day);
              const isSaturday = day.getDay() === 6;
              const isSunday = day.getDay() === 0;
              
              // Logic for showing shift:
              // - Only show shift if it's a weekday (Lun-Ven)
              // - Or if it's Saturday and marked as 'sabato'
              const showShift = (day.getDay() >= 1 && day.getDay() <= 5) || (isSaturday && event?.type === 'sabato');
              
              // Background color logic
              let bgColor = !isCurrentMonth ? 'bg-gray-50/30 opacity-40' : 'bg-white';
              if (isCurrentMonth) {
                if (event?.type === 'ferie') bgColor = 'bg-blue-50';
                else if (event?.type === 'malattia') bgColor = 'bg-red-50';
                else if (event?.type === 'sabato') bgColor = 'bg-green-50';
                else if (event?.type === 'chiusura') bgColor = 'bg-gray-100';
                else if (event?.forcedShift) bgColor = 'bg-purple-50';
              }

              const handleNoteIconClick = (e: React.MouseEvent, note: string) => {
                e.stopPropagation();
                setViewingNote(note);
              };

              return (
                <motion.div
                  key={day.toString()}
                  whileHover={{ scale: 0.98 }}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative min-h-[85px] md:min-h-[100px] p-2 border-r border-b border-gray-50 cursor-pointer transition-colors
                    ${bgColor}
                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                    hover:bg-orange-50/30
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className={`
                      text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                      ${isTodayDay ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-gray-700'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    
                    {event && (
                      <div className="flex gap-1">
                        {event.type === 'ferie' && <Plane size={14} className="text-blue-500" />}
                        {event.type === 'malattia' && <Stethoscope size={14} className="text-red-500" />}
                        {event.type === 'sabato' && <Check size={14} className="text-green-500" />}
                        {event.type === 'chiusura' && <Building2 size={14} className="text-gray-500" />}
                        {event.forcedShift && <Info size={14} className="text-purple-500" />}
                        {event.note && (
                          <button 
                            onClick={(e) => handleNoteIconClick(e, event.note!)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Pencil size={14} className="text-amber-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {showShift && !event?.type && (
                    <div className={`
                      mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter
                      ${shift === 'Mattina' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}
                    `}>
                      {shift === 'Mattina' ? 'AM' : 'PM'}
                    </div>
                  )}

                  {event?.type && (
                    <div className={`
                      mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter
                      ${event.type === 'ferie' ? 'bg-blue-100 text-blue-700' : 
                        event.type === 'malattia' ? 'bg-red-100 text-red-700' : 
                        event.type === 'sabato' ? 'bg-green-100 text-green-700' :
                        'bg-gray-200 text-gray-700'}
                    `}>
                      {event.type === 'chiusura' ? 'Chiusura' : event.type}
                    </div>
                  )}

                  {event?.forcedShift && !event.type && (
                    <div className="mt-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter bg-purple-100 text-purple-700">
                      {event.forcedShift === 'Mattina' ? 'AM' : 'PM'}
                    </div>
                  )}

                  {isSunday && !event && (
                    <div className="mt-2 px-2 py-1 text-[10px] font-medium text-gray-300 uppercase italic">
                      Riposo
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <footer className="mt-8 flex flex-wrap gap-6 justify-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span>Mattina</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
            <span>Pomeriggio</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
            <span>Turno Modificato</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane size={14} className="text-blue-500" />
            <span>Ferie</span>
          </div>
          <div className="flex items-center gap-2">
            <Stethoscope size={14} className="text-red-500" />
            <span>Malattia</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-green-500" />
            <span>Sabato Lavorativo</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-500" />
            <span>Chiusura Aziendale</span>
          </div>
          <div className="flex items-center gap-2">
            <Pencil size={14} className="text-amber-600" />
            <span>Note</span>
          </div>
        </footer>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {format(selectedDate, 'd MMMM', { locale: it })}
                    </h3>
                    <p className="text-sm text-gray-500">{format(selectedDate, 'EEEE', { locale: it })} • Turno {getShift(selectedDate)}</p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={toggleForcedShift}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-purple-100 bg-purple-50/50 hover:bg-purple-50 transition-colors text-purple-700 font-semibold"
                  >
                    <Info size={20} />
                    <span>Cambia Turno ({getShift(selectedDate) === 'Mattina' ? 'Pomeriggio' : 'Mattina'})</span>
                  </button>

                  <button 
                    onClick={() => setDayEvent('ferie')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors text-blue-700 font-semibold"
                  >
                    <Plane size={20} />
                    <span>Segna come Ferie</span>
                  </button>
                  
                  <button 
                    onClick={() => setDayEvent('malattia')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-100 bg-red-50/50 hover:bg-red-50 transition-colors text-red-700 font-semibold"
                  >
                    <Stethoscope size={20} />
                    <span>Segna come Malattia</span>
                  </button>

                  {selectedDate.getDay() === 6 && (
                    <button 
                      onClick={() => setDayEvent('sabato')}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-green-100 bg-green-50/50 hover:bg-green-50 transition-colors text-green-700 font-semibold"
                    >
                      <Check size={20} />
                      <span>Sabato Lavorativo</span>
                    </button>
                  )}

                  <button 
                    onClick={() => setDayEvent('chiusura')}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-colors text-gray-700 font-semibold"
                  >
                    <Building2 size={20} />
                    <span>Chiusura Aziendale</span>
                  </button>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Note</label>
                    <div className="relative">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Aggiungi una nota..."
                        className="w-full p-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-200 transition-all text-sm resize-none h-24"
                      />
                      <button 
                        onClick={saveNote}
                        className="absolute bottom-3 right-3 p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      const dateKey = format(selectedDate, 'yyyy-MM-dd');
                      const newEvents = { ...events };
                      delete newEvents[dateKey];
                      setEvents(newEvents);
                      setNoteText('');
                      setIsModalOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-100 transition-colors text-gray-600 font-semibold"
                  >
                    <X size={20} />
                    <span>Rimuovi tutto</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Note Viewing Modal */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Pencil size={20} />
                    <h3 className="text-lg font-bold">Nota</h3>
                  </div>
                  <button 
                    onClick={() => setViewingNote(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {viewingNote}
                </div>
                <button 
                  onClick={() => setViewingNote(null)}
                  className="w-full mt-4 p-4 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-gray-800 transition-colors"
                >
                  Chiudi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
