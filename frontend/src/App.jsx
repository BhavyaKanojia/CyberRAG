import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ThreatChat from './components/ThreatChat';
import CveExplorer from './components/CveExplorer';
import ArchitectureView from './components/ArchitectureView';
import CveModal from './components/CveModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedCve, setSelectedCve] = useState(null);
  const [health, setHealth] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      } else {
        setHealth({ status: 'degraded', qdrant_connected: false });
      }
    } catch (e) {
      setHealth({ status: 'offline', qdrant_connected: false, error: e.message });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Cyber Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onRefreshHealth={fetchHealth}
        isRefreshing={isRefreshing}
      />

      {/* Main Active View */}
      <main style={{ flex: 1, position: 'relative' }}>
        {activeTab === 'chat' && <ThreatChat onSelectCve={setSelectedCve} />}
        {activeTab === 'explorer' && <CveExplorer onSelectCve={setSelectedCve} />}
        {activeTab === 'arch' && <ArchitectureView />}
      </main>

      {/* Interactive CVE Detail Modal */}
      {selectedCve && (
        <CveModal
          cve={selectedCve}
          onClose={() => setSelectedCve(null)}
        />
      )}
    </div>
  );
}
