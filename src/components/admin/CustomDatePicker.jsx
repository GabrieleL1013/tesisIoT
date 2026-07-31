import React, { useState, useEffect, useRef } from 'react';
import '../../styles/components/admin/CustomDatePicker.css';

export default function CustomDatePicker({ value, onChange, label, shortcutHint, minDate, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse value 'YYYY-MM-DD'
  const parseDate = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  };

  const [currentViewDate, setCurrentViewDate] = useState(parseDate(value));
  const containerRef = useRef(null);

  useEffect(() => {
    setCurrentViewDate(parseDate(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay(); // 0 = Sunday

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const getTodayStr = () => {
    const today = new Date();
    // Use local timezone for today
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const todayStr = getTodayStr();

  const renderGrid = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="date-empty"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = value === dStr;
      const isToday = todayStr === dStr;
      const isDisabled = (minDate && dStr < minDate) || (maxDate && dStr > maxDate);

      days.push(
        <button 
          key={i} 
          disabled={isDisabled}
          title={isDisabled ? (minDate && dStr < minDate ? 'No se puede seleccionar una fecha anterior a la fecha de inicio' : 'Fecha no disponible') : ''}
          className={`date-btn ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
          style={isDisabled ? { cursor: 'not-allowed', opacity: 0.35, pointerEvents: 'auto', backgroundColor: '#f8fafc', color: '#cbd5e1' } : {}}
          onClick={(e) => {
            e.stopPropagation();
            if (isDisabled) return;
            onChange(dStr);
            setIsOpen(false);
          }}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const displayFormat = value ? value.split('-').reverse().join('/') : '';

  return (
    <div className="control-item date-picker-container" ref={containerRef} style={{ position: 'relative' }}>
      <div 
        className={`control-input ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{ color: displayFormat ? '#0f172a' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
          {label && <span style={{ color: '#64748b', marginRight: '6px', fontWeight: '600' }}>{label}:</span>}
          {displayFormat || 'Seleccionar fecha'}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ color: '#64748b' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {isOpen && (
        <div className="custom-date-dropdown">
          <div className="date-header">
            <button className="date-nav-btn" onClick={(e) => { e.stopPropagation(); handlePrevMonth(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="date-month-year">{monthNames[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}</span>
            <button className="date-nav-btn" onClick={(e) => { e.stopPropagation(); handleNextMonth(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          
          <div className="date-weekdays">
            {dayNames.map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="date-grid">
            {renderGrid()}
          </div>
          {shortcutHint && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
              Atajo: <span dangerouslySetInnerHTML={{ __html: shortcutHint }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
