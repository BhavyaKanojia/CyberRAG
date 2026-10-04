import React from 'react';
import { ShieldAlert, Database, Cpu, Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, health, onRefreshHealth, isRefreshing }) {
  const isHealthy = health?.status === 'healthy';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 13, 22, 0.92)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 255, 157, 0.2))',
          border: '1px solid var(--accent-cyan)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(0, 229, 255, 0.25)'
        }}>
          <ShieldAlert size={22} color="var(--accent-cyan)" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.25rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              background: 'linear-gradient(90deg, #00e5ff, #00ff9d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              CYBER<span style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>RAG</span>
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid var(--border-cyan)',
              color: 'var(--accent-cyan)'
            }}>
              v1.0 • CISA KEV
            </span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
            Anti-Hallucination Threat Intelligence Engine
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.7)',
        padding: '3px',
        borderRadius: '8px',
        border: '1px solid var(--border-subtle)'
      }}>
        {[
          { id: 'chat', label: 'SOC Threat Analyst' },
          { id: 'explorer', label: 'KEV Intelligence Feed' },
          { id: 'arch', label: 'Neural Architecture' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(0, 255, 157, 0.1))' 
                : 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-dim)',
              boxShadow: activeTab === tab.id ? '0 0 12px rgba(0, 229, 255, 0.2)' : 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Telemetry Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Qdrant Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <Database size={13} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-dim)' }}>Qdrant:</span>
          <span style={{
            color: isHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            fontWeight: 700
          }}>
            {health?.indexed_records !== undefined ? `${health.indexed_records} Vectors` : 'Offline'}
          </span>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isHealthy ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            boxShadow: isHealthy ? '0 0 8px var(--accent-emerald)' : '0 0 8px var(--accent-rose)'
          }} />
        </div>

        {/* Model Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)'
        }}>
          <Cpu size={13} color="var(--accent-emerald)" />
          <span style={{ color: 'var(--text-dim)' }}>Groq:</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>
            {health?.model_default ? health.model_default.split('/')[1] || health.model_default : 'Active'}
          </span>
        </div>

        {/* Refresh Telemetry */}
        <button
          onClick={onRefreshHealth}
          disabled={isRefreshing}
          title="Refresh Engine Telemetry"
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '5px 8px',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={14} className={isRefreshing ? 'radar-sweep' : ''} />
        </button>
      </div>
    </header>
  );
}
