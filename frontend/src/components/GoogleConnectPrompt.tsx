import { Modal } from './ui'
import { Button } from './ui'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function GoogleConnectPrompt({ isOpen, onClose }: Props) {
  function handleConnect() {
    window.location.href = '/api/auth/google'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sync to Google Calendar?">
      <div className="space-y-6">
        <p className="text-text-secondary text-sm leading-relaxed">
          Connect your Google Calendar so your tasks are automatically added as events. You only need to do this once.
        </p>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Maybe Later</Button>
          <Button variant="primary" onClick={handleConnect}>Connect Google Calendar</Button>
        </div>
      </div>
    </Modal>
  )
}
