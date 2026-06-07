import React, { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import { IntroAnimation } from './components/IntroAnimation'

import Dashboard from './pages/Dashboard'
import LogStream from './pages/LogStream'
import AnomalyHistory from './pages/AnomalyHistory'
import RAGKnowledgeBase from './pages/RAGKnowledgeBase'
import SelfHealingActions from './pages/SelfHealingActions'
import SystemHealth from './pages/SystemHealth'
import Settings from './pages/Settings'

export default function App() {
  const [introOver, setIntroOver] = useState(false)
  const [systemStatus, setSystemStatus] = useState('nominal')
  const [incidentCount, setIncidentCount] = useState(0)
  const handleIntroDone = useCallback(() => setIntroOver(true), [])

  return (
    <BrowserRouter>
      {!introOver && <IntroAnimation onDone={handleIntroDone} />}
      <div
        className="flex flex-col h-screen overflow-hidden transition-opacity duration-500"
        style={{ opacity: introOver ? 1 : 0 }}
      >
        <Topbar systemStatus={systemStatus} incidentCount={incidentCount} />
        <div className="flex flex-1 min-h-0">
          <Sidebar systemStatus={systemStatus} />
          <main className="flex-1 min-w-0 overflow-hidden" style={{ background: '#000' }}>
            <Routes>
              <Route path="/" element={
                <Dashboard
                  onSystemStatus={setSystemStatus}
                  onIncidentCount={setIncidentCount}
                />
              } />
              <Route path="/logs"      element={<LogStream />} />
              <Route path="/history"   element={<AnomalyHistory />} />
              <Route path="/knowledge" element={<RAGKnowledgeBase />} />
              <Route path="/actions"   element={<SelfHealingActions />} />
              <Route path="/health"    element={<SystemHealth />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
