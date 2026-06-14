import { useAppStore } from '../../store/useAppStore'
import { FeedbackHistory } from './FeedbackHistory'
import { Button } from '../ui'

export function HistoryPanel() {
  const isHistoryPanelOpen = useAppStore((s) => s.isHistoryPanelOpen)
  const setHistoryPanelOpen = useAppStore((s) => s.setHistoryPanelOpen)

  if (!isHistoryPanelOpen) return null

  return (
    <div
      data-testid="history-panel"
      className="fixed right-0 top-14 bottom-0 w-[360px] bg-bg-surface border-l border-border-default flex flex-col animate-slide-in z-[60] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-default flex-shrink-0">
        <h2 className="text-text-primary font-semibold">Feedback History</h2>
        <Button
          data-testid="history-panel-close"
          variant="ghost"
          size="sm"
          aria-label="Close history panel"
          onClick={() => setHistoryPanelOpen(false)}
        >
          ✕
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <FeedbackHistory />
      </div>
    </div>
  )
}
