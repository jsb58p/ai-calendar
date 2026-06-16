import { useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { useAppStore } from '../../store/useAppStore'
import type { FeedbackEntry } from '../../types'

// ─── Sub-components ──────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: FeedbackEntry }) {
  const [expanded, setExpanded] = useState(false)

  const dateStr = new Date(entry.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const needsExpander = entry.notes.length > 100 || entry.notes.includes('\n')

  return (
    <View className="py-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-text-muted text-xs font-mono">{dateStr}</Text>
        <Text style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 2 }}>
          {'★'.repeat(entry.rating)}
          {'☆'.repeat(5 - entry.rating)}
        </Text>
      </View>
      {entry.notes ? (
        <>
          <Text
            className="text-text-secondary text-sm leading-5"
            numberOfLines={expanded ? undefined : 2}
          >
            {entry.notes}
          </Text>
          {needsExpander && (
            <TouchableOpacity
              onPress={() => setExpanded((e) => !e)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <Text className="text-accent text-xs mt-1">
                {expanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FeedbackHistory() {
  const feedback     = useAppStore((s) => s.feedback)
  const activeGoalId = useAppStore((s) => s.activeGoalId)

  const entries = feedback
    .filter((e) => e.scheduleId === activeGoalId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (entries.length === 0) {
    return (
      <Text className="text-text-muted text-sm text-center py-4">
        No feedback yet. Submit your first review from the Calendar tab.
      </Text>
    )
  }

  return (
    <FlatList
      data={entries}
      keyExtractor={(e: FeedbackEntry) => e.id}
      scrollEnabled={false}
      renderItem={({ item }: { item: FeedbackEntry }) => <EntryRow entry={item} />}
      ItemSeparatorComponent={() => <View className="h-px bg-border-default" />}
    />
  )
}
