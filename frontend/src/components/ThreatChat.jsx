import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileCode,
  ArrowRight,
  ExternalLink,
  Trash2,
  HelpCircle,
  MessageSquareQuote
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const SUGGESTED_QUERIES = [
  { label: "Palo Alto Networks Flaws", query: "Can you explain what known vulnerabilities affect Palo Alto Networks and how to fix them in simple terms?" },
  { label: "Cisco IOS Vulnerabilities", query: "What security issues exist in Cisco IOS and what immediate steps should I take?" },
  { label: "Apple iOS/macOS Risks", query: "Tell me about recent memory vulnerabilities affecting Apple devices and what users need to do." },
  { label: "Top Emergency Actions", query: "What are the most urgent patching actions required by CISA right now?" }
];

export default function ThreatChat({ onSelectCve }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([
    {
      role: 'assistant',
      content: `👋 **Hi! I'm CyberRAG, your Threat Intelligence & CVE Assistant.**

I'm here to help you understand complex security vulnerabilities in **plain, simple language**, without confusing jargon.

### 🛡️ How I Help You:
- **Plain English Summaries:** I break down technical CVEs so you know exactly what is happening.
- **Strict Verification:** Every fact is cross-checked against official **CISA KEV** threat vectors.
- **Actionable Steps:** I give you direct, step-by-step mitigation advice and deadlines.

Click one of the suggested questions below, or ask me about any vendor, product, or CVE!`,
      sources: [],
      stats: null
    }
  ]);
  const [selectedSources, setSelectedSources] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || query;
    if (!textToSend.trim() || loading) return;

    const userMessage = { role: 'user', content: textToSend };
    setConversation(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL || 'http://127.0.0.1:8000'}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          limit: 4
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          sources: data.sources || [],
          stats: {
            time: data.execution_time_ms,
            model: data.model_used,
            chunks: data.sources?.length || 0
          }
        }
      ]);

      if (data.sources && data.sources.length > 0) {
        setSelectedSources(data.sources);
      }
    } catch (err) {
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Oops! Couldn't reach the intelligence engine.**\n\nPlease make sure the FastAPI server is running on port 8000.\n\n*Error details:* ${err.message}`,
          sources: [],
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setConversation([
      {
        role: 'assistant',
        content: `👋 **Chat refreshed!** Ask me any question about CVEs, vendors, or required security patches.`,
        sources: [],
        stats: null
      }
    ]);
    setSelectedSources([]);
  };

  // Helper to render text with clickable [Source: CVE-XXXX-XXXX] badges
  const renderFormattedContent = (content) => {
    const parts = content.split(/(\[Source:\s*CVE-[0-9]{4}-[0-9]+[^\]]*\])/gi);

    return parts.map((part, i) => {
      const match = part.match(/\[Source:\s*(CVE-[0-9]{4}-[0-9]+)/i);
      if (match) {
        const cveId = match[1];
        return (
          <button
            key={i}
            className="cve-citation-badge"
            onClick={() => onSelectCve({ cve_id: cveId, vendor: 'CISA-KEV', product: 'Threat Catalog' })}
            title={`View Threat Intelligence for ${cveId}`}
          >
            <ShieldCheck size={12} />
            {cveId}
          </button>
        );
      }

      return <span key={i} dangerouslySetInnerHTML={{ __html: formatMarkdownBasic(part) }} />;
    });
  };

  const formatMarkdownBasic = (text) => {
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3 style="color:var(--accent-cyan); font-family:var(--font-display); margin:1rem 0 0.4rem; font-size:1.02rem;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:var(--accent-cyan); font-family:var(--font-display); margin:1.2rem 0 0.5rem; font-size:1.15rem;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#ffffff; font-family:var(--font-display); margin:1.4rem 0 0.6rem; font-size:1.3rem;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#ffffff; font-weight:600;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em style="color:#cbd5e1;">$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n\n/g, '<br/><br/>');

    return formatted;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) 340px',
      gap: '1.25rem',
      height: 'calc(100vh - 75px)',
      padding: '1.25rem',
      maxWidth: '1600px',
      margin: '0 auto'
    }}>
      {/* Main Chat Stream Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(11, 17, 29, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Chat Feed Header */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquareQuote size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              THREAT INTELLIGENCE DIALOGUE
            </span>
          </div>
          <button
            onClick={handleClearChat}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '4px 8px',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={12} />
            <span>Reset Chat</span>
          </button>
        </div>

        {/* Messages List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '100%'
              }}
            >
              {/* Message Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: msg.role === 'user' ? 'var(--accent-cyan)' : 'var(--accent-emerald)'
              }}>
                {msg.role === 'user' ? (
                  <>
                    <span>YOU (Analyst)</span>
                    <Terminal size={12} />
                  </>
                ) : (
                  <>
                    <ShieldCheck size={13} color="var(--accent-emerald)" />
                    <span>CYBERRAG ASSISTANT</span>
                    {msg.stats && (
                      <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                        • {msg.stats.time}ms • {msg.stats.model.split('/')[1] || msg.stats.model}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.18), rgba(0, 255, 157, 0.1))'
                    : 'rgba(15, 23, 42, 0.85)',
                  border: msg.role === 'user'
                    ? '1px solid var(--accent-cyan)'
                    : msg.isError
                      ? '1px solid var(--accent-rose)'
                      : '1px solid var(--border-subtle)',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '1.1rem 1.3rem',
                  maxWidth: '92%',
                  boxShadow: msg.role === 'user'
                    ? '0 0 15px rgba(0, 229, 255, 0.15)'
                    : '0 4px 20px rgba(0, 0, 0, 0.4)',
                  fontSize: '0.92rem',
                  lineHeight: 1.7
                }}
                className="markdown-content"
              >
                {renderFormattedContent(msg.content)}

                {/* Sources pill footer inside assistant message */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '1.1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Verified Sources:
                    </span>
                    {msg.sources.map((src, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => onSelectCve(src)}
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(0, 229, 255, 0.08)',
                          border: '1px solid var(--border-cyan)',
                          color: 'var(--accent-cyan)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {src.cve_id} ({(src.similarity_score * 100).toFixed(0)}%)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={16} color="var(--accent-cyan)" className="radar-sweep" />
              </div>
              <div style={{
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>Consulting verified CISA threat vectors...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Quick Bar */}
        <div style={{
          padding: '0.6rem 1.25rem',
          background: 'rgba(9, 13, 22, 0.95)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Try asking:
          </span>
          {SUGGESTED_QUERIES.map((item, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSend(item.query)}
              disabled={loading}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-dim)';
              }}
            >
              <Sparkles size={11} color="var(--accent-cyan)" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div style={{
          padding: '1rem 1.25rem',
          background: 'rgba(9, 13, 22, 0.98)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <Terminal size={16} color="var(--accent-cyan)" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything (e.g. 'Explain CVE-2026-0300 in simple words', 'What steps should I take for Cisco?')..."
              disabled={loading}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px 12px 38px',
                color: '#ffffff',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={loading || !query.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              background: loading || !query.trim()
                ? 'rgba(255, 255, 255, 0.05)'
                : 'linear-gradient(135deg, #00e5ff 0%, #00ff9d 100%)',
              border: 'none',
              color: loading || !query.trim() ? 'var(--text-muted)' : '#05070b',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: loading || !query.trim() ? 'none' : '0 0 15px rgba(0, 229, 255, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <span>Ask CyberRAG</span>
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Threat Intel Inspector & Retrieved Vector Chunks Sidebar */}
      <aside style={{
        background: 'rgba(11, 17, 29, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--accent-cyan)'
            }}>
              VECTOR INTEL INSPECTOR
            </span>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(0, 229, 255, 0.1)',
            color: 'var(--accent-cyan)'
          }}>
            {selectedSources.length} Hit{selectedSources.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Chunks List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {selectedSources.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-mono)'
            }}>
              <Layers size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No active retrieval context.</p>
              <p style={{ fontSize: '0.72rem', marginTop: '6px', color: 'var(--text-dim)' }}>
                Ask a question to see the exact CISA KEV records & similarity scores used to formulate the answer.
              </p>
            </div>
          ) : (
            selectedSources.map((src, idx) => (
              <div
                key={idx}
                onClick={() => onSelectCve(src)}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                {/* Header with similarity bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: 'var(--accent-cyan)'
                  }}>
                    {src.cve_id}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-emerald)',
                    fontWeight: 700
                  }}>
                    {(src.similarity_score * 100).toFixed(1)}% Match
                  </span>
                </div>

                {/* Similarity score track */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '2px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, src.similarity_score * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))',
                    borderRadius: '2px'
                  }} />
                </div>

                {/* Product & Vendor */}
                <div style={{ fontSize: '0.75rem', color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}>
                  {src.vendor} • {src.product}
                </div>

                {/* Snippet */}
                <p style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {src.text}
                </p>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
