import { useAppStore } from '../../store/useAppStore'
import { FeedbackHistory } from './FeedbackHistory'

export function HistoryPanel() {
  const isHistoryPanelOpen = useAppStore((s) => s.isHistoryPanelOpen)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)

  if (!isHistoryPanelOpen) return null

  return (
    <div
      data-testid="history-panel"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: '380px',
        backgroundColor: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>Feedback History</h2>
        <button
          data-testid="history-panel-close"
          aria-label="Close history panel"
          onClick={() => setHistoryPanelOpen(false)}
          style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', lineHeight: 1, padding: '2px 6px' }}
        >
          ×
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <FeedbackHistory />
      </div>
    </div>
  )
}
