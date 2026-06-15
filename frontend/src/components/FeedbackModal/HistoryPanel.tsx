import { useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { FeedbackHistory } from './FeedbackHistory'
import { Modal } from '../ui'

export function HistoryPanel() {
  const isHistoryPanelOpen  = useAppStore((s) => s.isHistoryPanelOpen)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)
  const setSelectedTaskId   = useAppStore((s) => s.setSelectedTaskId)

  // Mutual exclusion: close TaskDetail when HistoryPanel opens
  useEffect(() => {
    if (isHistoryPanelOpen) setSelectedTaskId(null)
  }, [isHistoryPanelOpen, setSelectedTaskId])

  return (
    <Modal
      isOpen={isHistoryPanelOpen}
      onClose={() => setHistoryPanelOpen(false)}
      title="Feedback History"
      maxWidth="560px"
      panelTestId="history-panel"
      closeTestId="history-panel-close"
    >
      <FeedbackHistory />
    </Modal>
  )
}
