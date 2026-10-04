import React, { useState, useEffect } from 'react';
import { Search, Filter, ShieldAlert, RefreshCw, Layers, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function CveExplorer({ onSelectCve }) {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('ALL');
  const [totalCount, setTotalCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  const VENDORS = ['ALL', 'Palo Alto', 'Cisco', 'Apple', 'Microsoft', 'Ivanti', 'Fortinet', 'Google', 'Apache'];

  const fetchCves = async () => {
    setLoading(true);
    try {
      const vendorParam = vendorFilter !== 'ALL' ? `&vendor=${encodeURIComponent(vendorFilter)}` : '';
      const res = await fetch(`${API_BASE_URL || 'http://127.0.0.1:8000'}/api/cves?limit=100${vendorParam}`);
      if (res.ok) {
        const data = await res.json();
        setCves(data.cves || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch CVE records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCves();
  }, [vendorFilter]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('Initiating live CISA KEV Sync...');
    try {
      const res = await fetch(`${API_BASE_URL || 'http://127.0.0.1:8000'}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 300 })
      });
      if (res.ok) {
        setSyncStatus('Sync initiated in background. Refreshing in 3s...');
        setTimeout(() => {
          fetchCves();
          setSyncing(false);
          setSyncStatus('Vector database synchronized!');
          setTimeout(() => setSyncStatus(''), 4000);
        }, 3000);
      }
    } catch (e) {
      setSyncStatus('Sync failed: ' + e.message);
      setSyncing(false);
    }
  };

  const filteredCves = cves.filter(item => {
    const text = (item.cve_id + ' ' + item.vendor + ' ' + item.product + ' ' + item.text).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{
      maxWidth: '1600px',
      margin: '0 auto',
      padding: '1.5rem',
      height: 'calc(100vh - 75px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem'
    }}>
      {/* Control Bar */}
      <div style={{
        background: 'rgba(11, 17, 29, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        {/* Search */}
        <div style={{
          position: 'relative',
          flex: '1 1 320px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} color="var(--accent-cyan)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search CVEs by ID, Vendor, Product, or exploit technique..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '10px 14px 10px 38px',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Vendor Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Vendor:
          </span>
          {VENDORS.map(v => (
            <button
              key={v}
              onClick={() => setVendorFilter(v)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                border: vendorFilter === v ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                background: vendorFilter === v ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                color: vendorFilter === v ? 'var(--accent-cyan)' : 'var(--text-dim)',
                transition: 'all 0.2s'
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Sync Feed Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {syncStatus && (
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
              {syncStatus}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 255, 157, 0.15))',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={syncing ? 'radar-sweep' : ''} />
            <span>Sync CISA Feed</span>
          </button>
        </div>
      </div>

      {/* Grid of CVE Intelligence Cards */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '1rem',
        alignContent: 'start'
      }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--accent-cyan)' }}>
            <RefreshCw size={28} className="radar-sweep" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)' }}>Loading threat intelligence from Qdrant...</p>
          </div>
        ) : filteredCves.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-mono)' }}>No matching CVE entries found for "{searchTerm}"</p>
          </div>
        ) : (
          filteredCves.map((cve, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCve(cve)}
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(0, 229, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-cyan)'
                  }}>
                    {cve.cve_id}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-rose)',
                    background: 'rgba(255, 42, 95, 0.12)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    KEV EXPLOITED
                  </span>
                </div>

                {/* Vendor & Product */}
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  {cve.vendor} • {cve.product}
                </div>

                {/* Description Snippet */}
                <p style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  {cve.text}
                </p>
              </div>

              {/* Action Link Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-emerald)'
              }}>
                <span>Inspect Vector Payload</span>
                <ExternalLink size={13} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
