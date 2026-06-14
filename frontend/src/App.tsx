import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Calendar } from './components/Calendar'
import { GoalInput } from './components/GoalInput'
import { FeedbackModal } from './components/FeedbackModal'
import { useGoals } from './hooks'
import { useCalendarStore } from './store'

const queryClient = new QueryClient()

function AppLayout() {
  const { data: goals = [] } = useGoals()
  const { currentView, setCurrentView } = useCalendarStore()

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold text-blue-600 tracking-tight">Calendr.ai</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI-powered scheduling</p>
        </div>
        <GoalInput />
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Goals ({goals.length})
          </h2>
          {goals.length === 0 ? (
            <p className="text-sm text-gray-300">No goals yet. Add one above.</p>
          ) : (
            <ul className="space-y-2">
              {goals.map((goal) => (
                <li key={goal.id} className="text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-700">{goal.text}</span>
                  {goal.timeframe !== undefined && (
                    <span className="text-xs text-gray-400 ml-1">· {goal.timeframe}</span>
                  )}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                      goal.priority === 'high'
                        ? 'bg-red-100 text-red-600'
                        : goal.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {goal.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2 shrink-0">
          {(['week', 'day', 'goals'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </nav>
        <main className="flex-1 overflow-hidden">
          {(currentView === 'week' || currentView === 'day') && <Calendar />}
          {currentView === 'goals' && (
            <p className="text-center text-gray-400 text-sm mt-16">
              Goal-focused view coming soon.
            </p>
          )}
        </main>
      </div>

      <FeedbackModal />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout />
    </QueryClientProvider>
  )
}
