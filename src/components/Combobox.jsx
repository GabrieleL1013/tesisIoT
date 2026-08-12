import React, { useState, useEffect, useRef } from 'react';

export default function Combobox({
  value = '',
  onChange,
  options = [],
  placeholder = 'Buscar o seleccionar...',
  allowCreate = true,
  createLabelPrefix = 'CREAR SENSOR',
  noOptionsMessage = 'No se encontraron coincidencias',
  onCreate,
  disabled = false,
  className = '',
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef(null);

  // Normalize options array into [{ label, value, original }]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        label: opt.name || opt.label || opt.key_name || String(opt.id || ''),
        value: opt.id !== undefined ? opt.id : (opt.value !== undefined ? opt.value : opt.key_name),
        original: opt
      };
    }
    return { label: String(opt), value: String(opt), original: opt };
  });

  // Keep input synchronized with controlled value prop ONLY when closed (not user-typing)
  useEffect(() => {
    if (isOpen) return; // don't overwrite while user is actively typing / dropdown open
    if (typeof value === 'object' && value !== null) {
      setInputValue(value.name || value.label || value.key_name || '');
    } else {
      const match = normalizedOptions.find((o) => String(o.value) === String(value) || String(o.label) === String(value));
      setInputValue(match ? match.label : String(value || ''));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on input text
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = normalizedOptions.some(
    (opt) => opt.label.toLowerCase() === inputValue.trim().toLowerCase()
  );

  const showCreateOption = allowCreate && inputValue.trim().length > 0 && !exactMatch;

  const handleSelect = (opt) => {
    setInputValue(opt.label);
    setIsOpen(false);
    if (onChange) {
      onChange(opt.original !== undefined ? opt.original : opt);
    }
  };

  const handleCreate = () => {
    const nameToCreate = inputValue.trim();
    setIsOpen(false);
    if (onCreate) {
      onCreate(nameToCreate);
    } else if (onChange) {
      onChange({ name: nameToCreate, label: nameToCreate, value: nameToCreate, isNew: true });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (showCreateOption) {
        handleCreate();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`combobox-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={inputValue}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          style={{
            width: '100%',
            padding: '9px 34px 9px 12px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            fontSize: '0.9rem',
            color: '#1e293b',
            background: disabled ? '#f8fafc' : '#ffffff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
        />
        <span
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            right: '10px',
            cursor: disabled ? 'default' : 'pointer',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1200,
            padding: '4px 0'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <div
                key={opt.value + '-' + idx}
                onClick={() => handleSelect(opt)}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  color: '#1e293b',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span>{opt.label}</span>
                {opt.original && opt.original.is_standard && (
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>
                    estándar
                  </span>
                )}
              </div>
            ))
          ) : !showCreateOption ? (
            <div style={{ padding: '10px 14px', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {noOptionsMessage}
            </div>
          ) : null}

          {showCreateOption && (
            <div
              onClick={handleCreate}
              style={{
                padding: '9px 14px',
                cursor: 'pointer',
                fontSize: '0.88rem',
                color: '#2563eb',
                fontWeight: '700',
                background: 'rgba(37, 99, 235, 0.06)',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(37, 99, 235, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(37, 99, 235, 0.06)')}
            >
              <span>✨ {createLabelPrefix} "{inputValue.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
