import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { MapPin, Image as ImageIcon, Target, Calendar, MousePointer2, List, Clock, Loader2 } from 'lucide-react';

function MapClickHandler({ setLocation, isManual }) {
  useMapEvents({
    click: (e) => {
      if (isManual) {
        setLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
      }
    },
  });
  return null;
}

function App() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(365);
  const [isManual, setIsManual] = useState(false);

  // Form State
  const [cause, setCause] = useState('Poor Lighting');
  const [customCause, setCustomCause] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState({ lat: null, lon: null });

  const fetchMapData = async () => {
    try {
      const response = await axios.get(`https://sentry-point-8pdv.onrender.com/map-data?days=${days}`);
      setClusters(response.data.clusters || []);
    } catch (error) {
      console.error("Backend offline:", error);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [days]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getMarkerColor = (timestamp) => {
    const reportDate = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - reportDate) / (1000 * 60 * 60);
    if (diffInHours <= 24) return "#ff0000";
    if (diffInHours <= 168) return "#f39c12";
    if (diffInHours <= 720) return "#8e44ad";
    return "#7f8c8d";
  };

  const handleLocate = () => {
    setIsManual(false);
    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, () => {
      alert("Please enable GPS");
    });
  };

  const handleSubmit = async () => {
    if (!location.lat || !image) {
      alert("Please select area and upload a photo!");
      return;
    }
    const finalIncidentType = isOther ? customCause : cause;
    setLoading(true);
    const formData = new FormData();
    formData.append("incident_type", finalIncidentType);
    formData.append("lat", location.lat);
    formData.append("lon", location.lon);
    formData.append("image", image);

    try {
      await axios.post('https://sentry-point-8pdv.onrender.com/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Reported successfully!");
      setCustomCause('');
      setImage(null);
      fetchMapData();
    } catch (err) {
      alert("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const getCoords = (str) => {
    if (!str) return [0, 0];
    const c = str.match(/-?\d+\.?\d*/g);
    return [parseFloat(c[1]), parseFloat(c[0])];
  };



  return (
    <div style={{ height: "100vh", width: "100%", position: 'relative', fontFamily: 'sans-serif', backgroundColor: '#f4f7f6', overflow: 'hidden' }}>

      {/* HEADER */}
      <header style={{ height: '60px', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1100 }}>
        <h2 style={{ fontSize: '20px', letterSpacing: '1px' }}>SENTRY POINT <span style={{ fontWeight: 300 }}>| Safety Network</span></h2>
      </header>

      {/* LEFT SIDEBAR: NEW REPORT */}
      <div style={{
        position: 'absolute', top: 80, left: 20, zIndex: 1000,
        background: 'white', padding: '20px', borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)', width: '280px'
      }}>

        {/* UPDATED PROXIMITY ALERT WITH KM */}
        {location.lat && (
          <div style={{ padding: '12px', background: '#fff4f4', borderRadius: '10px', marginBottom: '15px', border: '1px solid #ffcccc' }}>
            <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#e74c3c' }}>📍 Nearby Safety Check</h4>
            {(() => {
              const clustersWithDistance = clusters.map(c => {
                const [cLon, cLat] = getCoords(c.cluster_location);
                return { ...c, dist: calculateDistance(location.lat, location.lon, cLat, cLon) };
              });
              const nearby = clustersWithDistance.filter(c => c.dist <= 2).sort((a, b) => a.dist - b.dist);

              return (

                <div style={{ fontSize: '11px', color: '#2c3e50' }}>
                  {(() => {
                    // 1. Map distances and extract correct Lat/Lon
                    const clustersWithDistance = clusters.map(c => {
                      const [clusterLat, clusterLon] = getCoords(c.cluster_location);
                      const d = calculateDistance(location.lat, location.lon, clusterLat, clusterLon);
                      return { ...c, dist: d };
                    });

                    // 2. Filter with a slightly larger buffer for testing (e.g., 5km)
                    const nearby = clustersWithDistance.filter(c => c.dist <= 5).sort((a, b) => a.dist - b.dist);

                    if (nearby.length > 0) {
                      return (
                        <>
                          <b style={{ color: '#e74c3c' }}>⚠️ LOCAL ALERT</b>
                          <br />
                          Closest hotspot: <b>{nearby[0].dist.toFixed(2)} km</b>
                          <br />
                          <span style={{ color: '#7f8c8d' }}>{nearby.length} hotspots within 5km</span>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <span style={{ color: '#27ae60' }}>✅ Area looks clear.</span>
                          {/* Debugging: This helps you see if the math is working at all */}
                          {clustersWithDistance.length > 0 && (
                            <div style={{ fontSize: '9px', color: '#bdc3c7', marginTop: '5px' }}>
                              Nearest detected: {Math.min(...clustersWithDistance.map(c => c.dist)).toFixed(2)} km
                            </div>
                          )}
                        </>
                      );
                    }
                  })()}
                </div>
              );
            })()}
          </div>
        )}

        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <MapPin size={18} color="#e74c3c" /> New Report
        </h3>

        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d' }}>ISSUE TYPE</label>
        <select value={cause} onChange={(e) => { setCause(e.target.value); setIsOther(e.target.value === "Other"); }}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <option value="Poor Lighting">Poor Lighting</option>
          <option value="Harassment Hotspot">Harassment Hotspot</option>
          <option value="Isolated Area">Isolated Area</option>
          <option value="Other">Other</option>
        </select>

        {isOther && (
          <input type="text" placeholder="Describe..." value={customCause} onChange={(e) => setCustomCause(e.target.value)}
            style={{ width: '92%', padding: '10px', marginBottom: '15px', border: '1px solid #3498db', borderRadius: '8px' }} />
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
          <button onClick={handleLocate} style={{ flex: 1, padding: '10px', background: !isManual ? '#3498db' : '#f8f9fa', color: !isManual ? 'white' : '#2c3e50', border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px' }}>
            <Target size={14} /> GPS
          </button>
          <button onClick={() => setIsManual(true)} style={{ flex: 1, padding: '10px', background: isManual ? '#e67e22' : '#f8f9fa', color: isManual ? 'white' : '#2c3e50', border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px' }}>
            <MousePointer2 size={14} /> Manual
          </button>
        </div>

        <div style={{ border: '2px dashed #dcdde1', padding: '10px', textAlign: 'center', marginBottom: '15px', borderRadius: '8px' }}>
          <input type="file" onChange={(e) => setImage(e.target.files[0])} style={{ display: 'none' }} id="pic" />
          <label htmlFor="pic" style={{ cursor: 'pointer', color: '#7f8c8d' }}>
            <ImageIcon size={20} /><br /><span style={{ fontSize: '11px' }}>{image ? image.name : "Attach Photo"}</span>
          </label>
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : "SUBMIT REPORT"}
        </button>
      </div>

      {/* RIGHT SIDEBAR: ACTIVITY FEED WITH KM */}
      <div style={{ position: 'absolute', top: 80, right: 20, zIndex: 1000, background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', width: '300px', maxHeight: '75vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <List size={20} color="#3498db" /> Activity Feed
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clusters.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#bdc3c7', fontSize: '13px' }}>No reports found.</p>
          ) : (
            clusters.sort((a, b) => new Date(b.latest_report) - new Date(a.latest_report)).map((c, i) => {
              let distanceStr = "";
              if (location.lat) {
                const [cLon, cLat] = getCoords(c.cluster_location);
                distanceStr = `${calculateDistance(location.lat, location.lon, cLat, cLon).toFixed(1)} km away`;
              }

              return (
                <div key={i} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `5px solid ${getMarkerColor(c.latest_report)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '13px' }}>{c.incident_types}</div>
                    {distanceStr && <span style={{ fontSize: '10px', color: '#7f8c8d', background: '#eee', padding: '2px 5px', borderRadius: '4px' }}>{distanceStr}</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '4px' }}>{c.incident_count} reports • Updated: {new Date(c.latest_report).toLocaleDateString()}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* BOTTOM TIME SLIDER */}
      <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'white', padding: '12px 30px', borderRadius: '50px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Calendar size={18} color="#3498db" />
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{days} Day View</span>
        <input type="range" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} style={{ cursor: 'pointer' }} />
      </div>

      <MapContainer center={[22.5, 88.3]} zoom={13} style={{ height: "calc(100vh - 60px)", width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler setLocation={setLocation} isManual={isManual} />
        {location.lat && <CircleMarker center={[location.lat, location.lon]} radius={8} fillColor="#3498db" color="white" fillOpacity={1} />}
        {clusters.map((c, i) => (
          <CircleMarker key={i} center={getCoords(c.cluster_location)} radius={14 + (c.incident_count * 1.5)} fillColor={getMarkerColor(c.latest_report)} color="white" weight={2} fillOpacity={0.7}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <b style={{ color: getMarkerColor(c.latest_report) }}>{new Date(c.latest_report) > new Date(Date.now() - 86400000) ? "🚨 LIVE" : "📁 HISTORY"}</b>
                <div style={{ fontSize: '12px' }}>{c.incident_count} reports</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;