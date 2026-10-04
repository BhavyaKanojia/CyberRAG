import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertTriangle, Calendar, Layers, Terminal } from 'lucide-react';

export default function CveModal({ cve, onClose }) {
  if (!cve) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 11, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
        border: '1px solid var(--accent-cyan)',
        boxShadow: '0 0 35px rgba(0, 229, 255, 0.25)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-cyan)',
          paddingBottom: '0.85rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              {cve.cve_id || cve.cveID || 'CVE Intel'}
            </div>
            <span style={{
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255, 42, 95, 0.15)',
              border: '1px solid rgba(255, 42, 95, 0.4)',
              color: 'var(--accent-rose)',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)'
            }}>
              ACTIVE EXPLOITATION (CISA KEV)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Key Attributes Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Vendor / Project</span>
            <p style={{ fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>{cve.vendor || cve.vendorProject || 'N/A'}</p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Impacted Product</span>
            <p style={{ fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>{cve.product || 'N/A'}</p>
          </div>

          {cve.similarity_score !== undefined && (
            <div style={{
              background: 'rgba(0, 229, 255, 0.05)',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-cyan)'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>Neural Similarity</span>
              <p style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '2px' }}>
                {(cve.similarity_score * 100).toFixed(1)}% Match
              </p>
            </div>
          )}
        </div>

        {/* Vulnerability Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <AlertTriangle size={15} color="var(--accent-amber)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
              Vulnerability Overview & Impact
            </span>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.88rem',
            lineHeight: 1.6,
            color: '#cbd5e1'
          }}>
            {cve.text || cve.shortDescription || 'No detailed description available in this record.'}
          </div>
        </div>

        {/* CISA Official Advisory Link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <a
            href={`https://nvd.nist.gov/vuln/detail/${cve.cve_id || cve.cveID}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 255, 157, 0.15))',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--accent-cyan)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)'
            }}
          >
            NVD NIST Database <ExternalLink size={14} />
          </a>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
