import React from 'react';
import { Database, Cpu, ShieldCheck, Zap, Lock, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ArchitectureView() {
  const steps = [
    {
      num: "01",
      title: "Data Sourcing & Standardization",
      icon: <Database size={24} color="var(--accent-cyan)" />,
      badge: "CISA KEV Catalog",
      desc: "Live ingestion of verified Known Exploited Vulnerabilities catalog formatted into structured threat intelligence vectors with vendor, product, CVSS, and mandatory mitigation dates."
    },
    {
      num: "02",
      title: "Local Dense Embedding (768-dim)",
      icon: <Zap size={24} color="var(--accent-emerald)" />,
      badge: "BAAI/bge-base-en-v1.5",
      desc: "High-precision vectorization running entirely locally in-memory. Eliminates API costs, guarantees sub-20ms embedding latency, and operates securely on-premise."
    },
    {
      num: "03",
      title: "Vector Similarity Search",
      icon: <Cpu size={24} color="var(--accent-cyan)" />,
      badge: "Qdrant Vector DB",
      desc: "HNSW indexed cosine similarity space running in Docker container with persistent disk storage. Fast Top-K nearest-neighbor extraction across threat vectors."
    },
    {
      num: "04",
      title: "Anti-Hallucination Grounding",
      icon: <ShieldCheck size={24} color="var(--accent-emerald)" />,
      badge: "Strict Citation Guardrails",
      desc: "Strict source-delimited system prompting constraints that reject ungrounded CVE claims and require exact [Source: CVE-XXXX-XXXX] bracketed citations for every statement."
    },
    {
      num: "05",
      title: "Ultra-Fast LLM Inference",
      icon: <Terminal size={24} color="var(--accent-cyan)" />,
      badge: "Groq LPU Engine",
      desc: "Hardware-accelerated LPU inference via Groq delivering instant response generation with zero hallucination and structured remediation guidance."
    }
  ];

  return (
    <div style={{
      maxWidth: '1300px',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      height: 'calc(100vh - 75px)',
      overflowY: 'auto'
    }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 255, 157, 0.05))',
        border: '1px solid var(--border-cyan)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 0 30px rgba(0, 229, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={28} color="var(--accent-cyan)" />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: '#ffffff'
          }}>
            CYBERRAG NEURAL PIPELINE ARCHITECTURE
          </h1>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.92rem', maxWidth: '850px', lineHeight: 1.6 }}>
          Designed specifically for Security Operations Centers (SOC) and Threat Intelligence analysts who require 100% verified, source-backed CVE analysis without AI hallucination.
        </p>
      </div>

      {/* Step by Step Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        {steps.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Number Pill */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 900,
              color: 'var(--accent-cyan)',
              opacity: 0.8,
              minWidth: '40px'
            }}>
              {s.num}
            </div>

            {/* Icon Box */}
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid var(--border-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {s.icon}
            </div>

            {/* Description */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  {s.title}
                </h3>
                <span style={{
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(0, 255, 157, 0.1)',
                  border: '1px solid var(--border-emerald)',
                  color: 'var(--accent-emerald)',
                  fontWeight: 600
                }}>
                  {s.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
