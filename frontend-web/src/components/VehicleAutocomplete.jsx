'use client';

import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VehicleAutocomplete({ vehicleMake, setVehicleMake, vehicleModel, setVehicleModel }) {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Make Autocomplete
  const [makeQuery, setMakeQuery] = useState(vehicleMake || '');
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [makeSuggestions, setMakeSuggestions] = useState([]);

  // States for Model Autocomplete
  const [modelQuery, setModelQuery] = useState(vehicleModel || '');
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [modelSuggestions, setModelSuggestions] = useState([]);

  const makeRef = useRef(null);
  const modelRef = useRef(null);

  // 1. Fetch vehicles on mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // El endpoint real del backend es /shop/vehicles
        const res = await fetch(`${API_BASE}/shop/vehicles`); 
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
        } else {
          console.error("No se pudo cargar la lista de vehículos", res.status);
        }
      } catch (err) {
        console.error('Error fetching vehicles:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 2. Sync with external state changes (if any)
  useEffect(() => {
    setMakeQuery(vehicleMake || '');
  }, [vehicleMake]);

  useEffect(() => {
    setModelQuery(vehicleModel || '');
  }, [vehicleModel]);

  // 3. Handle clicks outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (makeRef.current && !makeRef.current.contains(e.target)) {
        setShowMakeSuggestions(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target)) {
        setShowModelSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Update Make Suggestions
  useEffect(() => {
    if (!makeQuery.trim()) {
      setMakeSuggestions(vehicles.map(v => v.make));
      return;
    }
    const filtered = vehicles
      .map(v => v.make)
      .filter(make => make.toLowerCase().includes(makeQuery.toLowerCase()));
    setMakeSuggestions(filtered);
  }, [makeQuery, vehicles]);

  // 5. Update Model Suggestions based on selected Make
  useEffect(() => {
    const selectedVehicle = vehicles.find(v => v.make === vehicleMake);
    if (!selectedVehicle) {
      setModelSuggestions([]);
      return;
    }
    const allModels = selectedVehicle.models || [];
    if (!modelQuery.trim()) {
      setModelSuggestions(allModels);
      return;
    }
    const filtered = allModels.filter(m => m.toLowerCase().includes(modelQuery.toLowerCase()));
    setModelSuggestions(filtered);
  }, [modelQuery, vehicleMake, vehicles]);


  // Handlers
  const handleMakeSelect = (make) => {
    setMakeQuery(make);
    setVehicleMake(make);
    setShowMakeSuggestions(false);
    // Reset model when make changes
    setModelQuery('');
    setVehicleModel('');
  };

  const handleModelSelect = (model) => {
    setModelQuery(model);
    setVehicleModel(model);
    setShowModelSuggestions(false);
  };

  return (
    <div className="space-y-3 mb-4 md:mb-6">
      {/* Make Autocomplete */}
      <div className="relative" ref={makeRef}>
        <input 
          id="vehicleMake"
          type="text"
          autoComplete="off"
          value={makeQuery}
          onChange={(e) => {
            setMakeQuery(e.target.value.toUpperCase());
            // Si el usuario edita, borramos el state formal de Make hasta que seleccione uno válido (opcional)
            setVehicleMake(e.target.value.toUpperCase());
            setShowMakeSuggestions(true);
            // Reset model
            setModelQuery('');
            setVehicleModel('');
          }}
          onFocus={() => setShowMakeSuggestions(true)}
          placeholder={isLoading ? "CARGANDO MARCAS..." : "EJ: TOYOTA, NISSAN..."}
          disabled={isLoading}
          className="w-full bg-[#1A1C21] border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 px-4 text-sm md:text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/50 transition-all uppercase"
          aria-label="Marca de vehículo"
        />
        {showMakeSuggestions && makeSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-[#1A1C21] border border-white/10 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {makeSuggestions.map((make, idx) => (
              <li 
                key={idx}
                onMouseDown={() => handleMakeSelect(make)}
                className="px-4 py-3 text-sm md:text-base text-white hover:bg-[#38BDF8]/20 cursor-pointer transition-colors"
              >
                {make}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Model Autocomplete */}
      <div className="relative" ref={modelRef}>
        <input 
          id="vehicleModel"
          type="text"
          autoComplete="off"
          value={modelQuery}
          onChange={(e) => {
            setModelQuery(e.target.value.toUpperCase());
            setVehicleModel(e.target.value.toUpperCase());
            setShowModelSuggestions(true);
          }}
          onFocus={() => {
            if (vehicleMake) setShowModelSuggestions(true);
          }}
          placeholder={!vehicleMake ? "PRIMERO SELECCIONE UNA MARCA" : "MODELO (OPCIONAL)"}
          disabled={!vehicleMake || isLoading}
          className="w-full bg-[#1A1C21] border border-white/10 rounded-xl md:rounded-2xl py-4 md:py-5 px-4 text-sm md:text-base font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/50 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Modelo de vehículo"
        />
        {showModelSuggestions && vehicleMake && modelSuggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-[#1A1C21] border border-white/10 mt-1 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
            {modelSuggestions.map((model, idx) => (
              <li 
                key={idx}
                onMouseDown={() => handleModelSelect(model)}
                className="px-4 py-3 text-sm md:text-base text-white hover:bg-[#38BDF8]/20 cursor-pointer transition-colors"
              >
                {model}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
