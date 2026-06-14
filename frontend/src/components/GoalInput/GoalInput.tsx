import { useState } from 'react'
import { useCreateGoal } from '../../hooks'
import type { Goal } from '../../types'

export function GoalInput() {
  const [text, setText] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [priority, setPriority] = useState<Goal['priority']>('medium')
  const { mutate: createGoal, isPending } = useCreateGoal()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    createGoal(
      { text: text.trim(), timeframe: timeframe.trim() || undefined, priority },
      { onSuccess: () => { setText(''); setTimeframe('') } }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200 space-y-2">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Goal</h2>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Run a 5K in 8 weeks"
        disabled={isPending}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          placeholder="Timeframe (e.g. 4 weeks)"
          disabled={isPending}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Goal['priority'])}
          disabled={isPending}
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={!text.trim() || isPending}
        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Scheduling…' : 'Schedule with AI'}
      </button>
    </form>
  )
}
