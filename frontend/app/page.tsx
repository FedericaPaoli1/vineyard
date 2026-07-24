'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { fetchDegreeDays, ModelData } from '../lib/weather';

const containerStyle = { width: '100%', height: '80vh' };
const center = { lat: 45.657808639037725, lng: 13.846673204128058 };

export default function MapPage() {
  const router = useRouter();
  const [model, setModel] = useState<ModelData | null>(null);
  const [hovered, setHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchDegreeDays().then(setModel);
  }, []);

  if (!isLoaded || !model) return <div className="p-5 text-center">Caricamento mappa...</div>;

  const getMarkerColor = () => {
    if (model.status === 'RED') return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    if (model.status === 'YELLOW') return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
  };

  const handleMouseOver = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHovered(true);
  };
  const handleMouseOut = () => {
    hoverTimeoutRef.current = setTimeout(() => { setHovered(false); }, 400);
  };

  return (
    <div className="container-fluid p-0">

      <div className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
        <div className="btn-group border rounded shadow-sm">
          <button className="btn btn-sm btn-light text-success fw-bold px-3">✓ Satellite</button>
          <button className="btn btn-sm btn-white px-3 border-start">Mappa</button>
          <button className="btn btn-sm btn-white px-3 border-start">Meteo</button>
        </div>

        <div className="btn-group border rounded shadow-sm">
          <button className="btn btn-sm btn-light text-secondary px-4">Stazioni</button>
          <button className="btn btn-sm btn-white fw-bold px-4 border-start">Lotti</button>
        </div>

        <div className="d-flex align-items-center">
          <span className="text-secondary small me-2">Filtro aziende</span>
          <select className="form-select form-select-sm shadow-sm" style={{ width: '180px' }}>
            <option>Tutte le aziende</option>
          </select>
        </div>
      </div>

      <div className="position-relative" style={{ height: '85vh' }}>

        <div className="position-absolute top-0 start-0 m-3 z-index-10 d-flex gap-2" style={{ zIndex: 10 }}>
          <select className="form-select form-select-sm shadow-sm border-0 fw-semibold" style={{ width: '100px', borderRadius: '8px' }}>
            <option>Vite</option>
          </select>
          <select className="form-select form-select-sm shadow-sm border-0 fw-semibold" style={{ width: '100px', borderRadius: '8px' }}>
            <option>Oidio</option>
          </select>
        </div>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={12}
          options={{ mapTypeId: 'satellite', disableDefaultUI: true, zoomControl: true, fullscreenControl: true }}
        >
          <Marker
            position={center}
            icon={getMarkerColor()}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
            onClick={() => router.push('/model')}
          >
            {hovered && (
              <InfoWindow position={center}>
                <div
                  className="p-2 text-dark"
                  onMouseEnter={handleMouseOver}
                  onMouseLeave={handleMouseOut}
                  style={{ minWidth: '200px' }}
                >
                  <div className="mb-1">
                    <strong>RISCHIO: </strong>
                    {model.status === 'RED' && <span className="text-danger fw-bold">ALTO</span>}
                    {model.status === 'YELLOW' && <span className="text-warning fw-bold" style={{ color: '#d39e00' }}>MEDIO</span>}
                    {model.status === 'GREEN' && <span className="text-success fw-bold">ASSENTE</span>}
                  </div>

                  <div className="mb-1">
                    <strong>Gradi-Giorno: </strong> {model.todayDD.toFixed(2)}
                  </div>

                  <div>
                    <strong>Cosa devo fare? </strong>
                    {model.status === 'RED' && (
                      <a
                        href="https://wiki.wiforagri.com/wiki/assistenza"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-danger fw-bold text-decoration-underline"
                      >
                        AGISCI
                      </a>
                    )}
                    {model.status === 'YELLOW' && <span className="fw-bold" style={{ color: '#d39e00' }}>SVEGLIATI</span>}
                    {model.status === 'GREEN' && <span className="text-success fw-bold">DORMI</span>}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Marker>
        </GoogleMap>

        <div
          className="position-absolute bottom-0 start-0 m-4 px-3 py-2 bg-white rounded-pill shadow d-flex align-items-center gap-3"
          style={{ zIndex: 10, fontSize: '0.9rem' }}
        >
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28a745', display: 'inline-block' }}></span>
            <span className="text-secondary fw-semibold">Rischio assente</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffc107', display: 'inline-block' }}></span>
            <span className="text-secondary fw-semibold">Rischio medio</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc3545', display: 'inline-block' }}></span>
            <span className="text-secondary fw-semibold">Rischio alto</span>
          </div>
        </div>

      </div>
    </div>
  );
}