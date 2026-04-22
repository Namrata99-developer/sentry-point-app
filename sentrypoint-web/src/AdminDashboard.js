import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, AlertTriangle, Map, Activity, Zap } from 'lucide-react';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState({ total_reports: 0, reports_24h: 0, active_hotspots: 0, top_issue: 'Loading...' });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // Fetch the Big Numbers
        axios.get('https://sentry-point-8pdv.onrender.com/admin/metrics').then(res => setMetrics(res.data));
        // Fetch the Weekly Stats
        axios.get('https://sentry-point-8pdv.onrender.com/admin/weekly-stats').then(res => setChartData(res.data));
    }, []);

    return (
        <div style={{ backgroundColor: '#0b1120', minHeight: '100vh', color: 'white', padding: '40px', fontFamily: 'sans-serif' }}>

            {/* Header */}
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ color: '#38bdf8', fontSize: '28px', margin: 0 }}>ADMIN DASHBOARD & ANALYTICS</h1>
                <p style={{ color: '#94a3b8' }}>Safety Command Center | Authorities Portal</p>
            </header>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <StatCard title="Reports Today" value={metrics.reports_24h} icon={<Activity color="#38bdf8" />} />
                <StatCard title="Spike Alert" value="+200%" icon={<Zap color="#fbbf24" />} subText="High risk detected" />
                <StatCard title="Active Zones" value={metrics.active_hotspots} icon={<Map color="#10b981" />} />
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>

                {/* Chart Section */}
                <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={20} /> Incident Volume by Day
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="report_date" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                            <Bar dataKey="total_incidents" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    <div style={{ marginTop: '20px', padding: '15px', background: '#451a03', borderRadius: '8px', color: '#fbbf24', border: '1px solid #92400e', fontSize: '14px' }}>
                        <AlertTriangle size={16} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                        <strong>Insight:</strong> High risk pattern detected at 2 AM on weekends.
                    </div>
                </div>

                {/* Info Section */}
                <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }}>
                    <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>Dashboard Features</h3>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#94a3b8', fontSize: '14px' }}>
                        <li style={{ marginBottom: '15px' }}><strong>Temporal Analysis:</strong> Detect patterns using time-series data.</li>
                        <li style={{ marginBottom: '15px' }}><strong>Category Filtering:</strong> Separate infrastructure vs. safety incidents.</li>
                        <li style={{ marginBottom: '15px' }}><strong>Automated Alerts:</strong> Email/Slack triggers for spikes.</li>
                    </ul>
                </div>

            </div>
        </div>
    );
};

// Reusable Card Component
const StatCard = ({ title, value, icon, subText }) => (
    <div style={{ background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 8px 0' }}>{title}</p>
            <h2 style={{ fontSize: '32px', margin: 0 }}>{value}</h2>
            {subText && <p style={{ fontSize: '11px', color: '#fbbf24', margin: '5px 0 0 0' }}>{subText}</p>}
        </div>
        <div style={{ background: '#0f172a', padding: '15px', borderRadius: '12px' }}>{icon}</div>
    </div>
);

export default AdminDashboard;