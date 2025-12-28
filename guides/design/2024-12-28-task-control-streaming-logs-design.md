# Task Control & Real-time Streaming Logs Design

**Date:** 2024-12-28
**Status:** Design Complete
**Author:** Claude (via brainstorming session)

## Overview

Enhance the Kanban board's Logs tab to provide real-time visibility into AI agent execution with interactive controls for managing stuck/failed tasks. Transform the static log viewer into a control center for task execution lifecycle management.

## Problem Statement

The current Logs tab in TaskDetailModal has critical UX gaps:

1. **No real-time streaming** - Logs appear frozen during execution, giving no indication of what the AI is doing
2. **Insufficient detail** - Only shows phase-level summaries, not raw AI request/response or tool calls
3. **No execution control** - Cannot stop running tasks from the Logs tab
4. **No recovery paths** - When planning fails/gets stuck, no way to retry or re-plan
5. **Poor error visibility** - Failed tasks don't show clear error state on Kanban cards

These issues make it impossible to debug stuck tasks (like the auth error case) or recover from failures without manual intervention.

## Solution Architecture

### Three-Layer System

```
┌──────────────────────────────────────────────────────────┐
│ 1. Real-time Log Streaming (IPC-based)                  │
│    Python → Electron Main → React Frontend              │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ 2. Interactive Phase Controls                           │
│    Per-phase Stop/Retry/Re-plan buttons                 │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ 3. Card Error Overlays                                  │
│    Visual error state on Kanban cards with quick actions│
└──────────────────────────────────────────────────────────┘
```

### Design Principles

**Progressive Disclosure**
- Quick actions (Stop) visible on phase headers
- Detailed logs expandable per entry type
- Error overlays show critical info without cluttering

**Clear State Management**
- Failed ≠ Backlog (failure is distinct, requires action)
- Error states persist in logs for debugging
- Auto-clear successful logs, preserve failure logs

**Graceful Recovery**
- Every failure has clear recovery path (Retry/Re-plan)
- Multiple re-plan strategies for different scenarios
- Stop doesn't just kill - marks failure and enables recovery

## Component Design

### 1. Enhanced Logs Tab Structure

Keep collapsible phase sections (Planning/Coding/Validation) but add:
- **Streaming log entries** with type-specific rendering
- **Per-phase controls** (Stop/Retry/Re-plan)
- **Status badges** (Pending/Running/Completed/Failed)
- **Progress indicators** (elapsed time, AI model/thinking level)

```
┌─────────────────────────────────────────────────────────┐
│ Logs Tab                                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ▼ Planning                   ● Running    [Stop]        │
│   2m 34s • Opus • High thinking                         │
│                                                          │
│   Logs (streaming):                                     │
│   [12:34:56] 🔵 Starting planner agent...               │
│   [12:34:57] 🔵 Loading spec from spec.md              │
│   [12:34:58] 🔼 AI Request (2,453 tokens)    [Expand]  │
│   [12:35:02] 🔽 AI Response (1,234 tokens)   [Expand]  │
│   [12:35:03] 🔧 Tool: Read clickhouse/client.go         │
│   [12:35:05] ✅ Plan created (3 phases, 12 tasks)      │
│   ● Streaming...                                        │
│                                                          │
│ ▶ Coding                                     Pending    │
│                                                          │
│ ▶ Validation                                 Pending    │
└─────────────────────────────────────────────────────────┘
```

### 2. Phase Header Component

**Structure:**
```tsx
<PhaseHeader>
  {/* Left: Phase info */}
  <ChevronDown /> {/* Collapse toggle */}
  <PhaseIcon /> {/* Planning/Coding/Validation icon */}
  <span>Planning</span>
  <StatusBadge variant="running">● Running</StatusBadge>

  {/* Progress info - dynamic from task.metadata */}
  <span className="text-muted">
    {elapsedTime} • {phaseConfig.model} • {phaseConfig.thinking}
  </span>

  {/* Right: Controls (context-aware) */}
  {status === 'running' && <StopButton />}
  {status === 'failed' && (
    <>
      <RetryButton />
      {phase === 'planning' && <ReplanDropdown />}
    </>
  )}
  {status === 'completed' && phase === 'planning' && <ReplanDropdown />}
</PhaseHeader>
```

**Control Visibility Rules:**
- **Running** → Stop button only
- **Failed** → Retry button + Re-plan dropdown (planning phase only)
- **Completed** → Re-plan dropdown (planning phase only)

**Phase config resolution:**
```ts
const phaseConfig = getPhaseConfig(task.metadata, 'planning');
// Returns: { model: "Opus", thinking: "High" }
// Supports auto profiles (different per phase) and manual profiles (same for all)
```

### 3. Log Entry Types

Six distinct entry types with type-specific rendering:

**System Message** (Gray)
```
[12:34:56] 🔵 Starting planner agent...
```

**AI Request** (Blue, expandable)
```
[12:34:58] 🔼 AI Request (2,453 input tokens)     [Expand ▼]

[Expanded]
{
  "model": "claude-opus-4-5-20251101",
  "max_tokens": 4096,
  "thinking": { "type": "enabled", "budget_tokens": 10000 },
  "messages": [...]
}
```

**AI Response** (Green, expandable)
```
[12:35:02] 🔽 AI Response (1,234 output • 856 thinking tokens)  [Expand ▼]

[Expanded]
[Thinking Block]
Let me analyze the codebase structure...
The client.go file has multiple responsibilities...

[Response]
I'll create a 3-phase implementation plan:
Phase 1: Extract connection management...
```

**Tool Call** (Purple, expandable)
```
[12:35:03] 🔧 Tool: Read clickhouse/client.go     [Expand ▼]

[Expanded]
Input: { "file_path": "/path/to/clickhouse/client.go" }
Output: [517 lines of code...]
```

**Error** (Red)
```
[12:35:10] ❌ Error: auth_unavailable: no auth available
           HTTP 500: OAuth token has expired
```

**Success** (Green)
```
[12:35:15] ✅ Implementation plan created (3 phases, 12 subtasks)
```

### 4. IPC Streaming Implementation

**Architecture Flow:**
```
Python Backend (structured logs)
    ↓ stdout (JSON)
Electron Main (captures & parses)
    ↓ IPC events
React Frontend (real-time display)
```

**Python: Structured Log Emission**

New file: `apps/backend/core/stream_logger.py`
```python
class StreamLogger:
    def __init__(self, phase: str):
        self.phase = phase  # 'planning', 'coding', 'validation'

    def log(self, type: str, message: str, detail: dict = None, tokens: dict = None):
        entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "phase": self.phase,
            "type": type,
            "message": message,
            "detail": detail,
            "tokens": tokens
        }
        print(f"__AGENT_LOG__{json.dumps(entry)}", flush=True)

    def ai_request(self, model, thinking, prompt_tokens, messages):
        self.log("ai_request", f"AI Request ({model}, {thinking} thinking)",
                 detail={"model": model, "messages": messages},
                 tokens={"input": prompt_tokens})

    def ai_response(self, message, output_tokens, thinking_tokens, response, thinking=None):
        self.log("ai_response", message,
                 detail={"response": response, "thinking": thinking},
                 tokens={"output": output_tokens, "thinking": thinking_tokens})
```

**Usage in agents:**
```python
from core.stream_logger import StreamLogger

logger = StreamLogger(phase="planning")
logger.system("Starting planner agent...")
logger.ai_request(model="claude-opus-4-5-20251101", ...)
logger.ai_response("Creating 3 phases...", ...)
logger.success("Implementation plan created")
```

**Electron Main: Log Capture & Forwarding**

New file: `apps/frontend/src/main/agent/log-parser.ts`
```typescript
export class AgentLogParser {
  parseLine(line: string): void {
    if (line.includes('__AGENT_LOG__')) {
      const jsonStr = line.split('__AGENT_LOG__')[1];
      const logEntry: AgentLogEntry = JSON.parse(jsonStr);

      // Forward to renderer via IPC
      this.mainWindow?.webContents.send(
        IPC_CHANNELS.TASK_LOG_STREAM,
        this.taskId,
        logEntry
      );
    }
  }
}
```

Update `apps/frontend/src/main/agent/agent-process.ts`:
```typescript
spawnAgent(taskId: string, pythonPath: string, args: string[]): ChildProcess {
  const proc = spawn(pythonPath, args, { ... });
  const logParser = new AgentLogParser(taskId, this.getMainWindow());

  proc.stdout?.on('data', (data) => {
    data.toString().split('\n').forEach((line: string) => {
      if (line.trim()) logParser.parseLine(line);
    });
  });
}
```

**React: Real-time Log Reception**

```typescript
// In useTaskDetail hook
const [streamingLogs, setStreamingLogs] = useState<AgentLogEntry[]>([]);

useEffect(() => {
  const handleLogStream = (_: any, taskId: string, logEntry: AgentLogEntry) => {
    if (taskId === task.id) {
      setStreamingLogs(prev => [...prev, logEntry]);
    }
  };

  window.electronAPI.onTaskLogStream(handleLogStream);
  return () => window.electronAPI.offTaskLogStream(handleLogStream);
}, [task.id]);

// Auto-scroll to bottom
useEffect(() => {
  logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [streamingLogs]);
```

### 5. Control Actions Implementation

**Stop Button** - Kill running phase
```typescript
const handleStop = async () => {
  const result = await window.electronAPI.stopTask(task.id);
  if (result.success) {
    setPhaseStatus('failed');
    toast.success('Task stopped');
  }
};
```

Backend kills process and emits error state:
```typescript
ipcMain.handle(IPC_CHANNELS.TASK_STOP, async (_, taskId) => {
  agentManager.stopAgent(taskId);  // Kill Python process

  // Write failure marker
  fs.writeFileSync(path.join(specDir, '.task_stopped'), JSON.stringify({
    stopped_at: new Date().toISOString(),
    reason: 'Stopped by user',
    phase: getCurrentPhase(specDir)
  }));

  // Emit error state
  mainWindow?.webContents.send(IPC_CHANNELS.TASK_ERROR_STATE, taskId, {
    phase: 'planning',
    reason: 'stopped',
    message: 'Task stopped by user',
    elapsed: calculateElapsedSeconds(task),
    timestamp: new Date().toISOString()
  });
});
```

**Retry Button** - Restart failed phase
```typescript
const handleRetry = async () => {
  await window.electronAPI.retryTask(task.id, phase);
  setPhaseStatus('running');
  setStreamingLogs(prev => prev.filter(log => log.phase !== phase)); // Clear phase logs
};
```

Backend clears failure markers and restarts:
```typescript
ipcMain.handle(IPC_CHANNELS.TASK_RETRY, async (_, taskId, phase) => {
  // Remove failure marker
  fs.unlinkSync(path.join(specDir, '.task_stopped'));

  // Reset phase in task_logs.json
  logs.phases[phase] = {
    phase,
    status: 'pending',
    started_at: null,
    completed_at: null,
    entries: []
  };

  // Restart from this phase
  return agentManager.startTask(taskId, { resumeFromPhase: phase });
});
```

**Re-plan Dropdown** - Three strategies
```typescript
<DropdownMenu>
  <DropdownMenuItem onClick={() => handleReplan('retry')}>
    <RotateCcw /> Retry Planning
    <span className="text-muted">Start fresh</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => handleReplan('regenerate')}>
    <Sparkles /> Re-generate Plan
    <span className="text-muted">New AI session</span>
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => handleReplan('edit')}>
    <Pencil /> Edit Plan Manually
    <span className="text-muted">Manual changes</span>
  </DropdownMenuItem>
</DropdownMenu>
```

**Regenerate Plan** - Force new AI session:
```typescript
ipcMain.handle(IPC_CHANNELS.TASK_REGENERATE_PLAN, async (_, taskId) => {
  // Delete existing plan
  fs.unlinkSync(path.join(specDir, 'implementation_plan.json'));

  // Clear planning logs
  logs.phases.planning = { phase: 'planning', status: 'pending', ... };

  // Start fresh planning session
  return agentManager.startTask(taskId, { forceReplan: true, resumeFromPhase: 'planning' });
});
```

### 6. Error Overlay on Kanban Cards

When a task fails, show error overlay on the card without moving columns:

```
┌─────────────────────────────────────────┐
│ ⚠ Task Failed                           │ ← Red banner
├─────────────────────────────────────────┤
│ 001-split-clickhouse-client            │
│ Split ClickHouse client.go...          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ❌ Planning phase stopped by user   │ │
│ │ 2m 34s elapsed                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [View Logs]  [Retry]  [Re-plan ▼]     │
│                                         │
│ In Progress • 0/12 subtasks            │
└─────────────────────────────────────────┘
   ↑ Red border with pulse animation
```

**TaskCard component updates:**
```typescript
const [errorState, setErrorState] = useState<TaskErrorState | null>(null);

useEffect(() => {
  const handleError = (_: any, taskId: string, error: TaskErrorState) => {
    if (taskId === task.id) setErrorState(error);
  };
  window.electronAPI.onTaskError(handleError);
  return () => window.electronAPI.offTaskError(handleError);
}, [task.id]);

return (
  <div className={cn(
    'task-card',
    errorState && 'border-destructive/50 animate-pulse-border'
  )}>
    {errorState && (
      <div className="bg-destructive/90 text-destructive-foreground">
        <AlertTriangle /> Task Failed
      </div>
    )}

    {errorState && (
      <>
        <div className="bg-destructive/10 border-destructive/20">
          <XCircle />
          {errorState.phase} phase {errorState.reason}
          {errorState.message}
          {errorState.elapsed}s elapsed
        </div>

        <div className="flex gap-2">
          <Button onClick={onClick}>View Logs</Button>
          <Button onClick={handleRetry}>Retry</Button>
          {errorState.phase === 'planning' && <ReplanDropdown />}
        </div>
      </>
    )}
  </div>
);
```

**Error state type:**
```typescript
interface TaskErrorState {
  phase: 'planning' | 'coding' | 'validation';
  reason: 'stopped' | 'failed' | 'timeout' | 'auth_error';
  message?: string;
  elapsed?: number;
  timestamp: string;
}
```

**CSS pulse border animation:**
```css
@keyframes pulse-border {
  0%, 100% {
    border-color: rgb(239 68 68 / 0.5);
    box-shadow: 0 0 0 0 rgb(239 68 68 / 0.4);
  }
  50% {
    border-color: rgb(239 68 68 / 0.8);
    box-shadow: 0 0 0 4px rgb(239 68 68 / 0.1);
  }
}

.animate-pulse-border {
  animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## New IPC Channels

```typescript
export const IPC_CHANNELS = {
  // Streaming logs
  TASK_LOG_STREAM: 'task:log:stream',

  // Control actions
  TASK_STOP: 'task:stop',
  TASK_RETRY: 'task:retry',
  TASK_REGENERATE_PLAN: 'task:regenerate-plan',

  // Error state
  TASK_ERROR_STATE: 'task:error:state',
  TASK_ERROR_CLEAR: 'task:error:clear',
  TASK_STATUS_UPDATE: 'task:status:update',
} as const;
```

## File Changes Summary

**New Files:**
- `apps/backend/core/stream_logger.py` - Structured log emission
- `apps/frontend/src/main/agent/log-parser.ts` - Log capture & forwarding
- `docs/plans/2024-12-28-task-control-streaming-logs-design.md` - This document

**Modified Files:**
- `apps/backend/agents/planner.py` - Add StreamLogger usage
- `apps/backend/agents/coder.py` - Add StreamLogger usage
- `apps/backend/agents/qa_reviewer.py` - Add StreamLogger usage
- `apps/frontend/src/main/agent/agent-process.ts` - Add log capture
- `apps/frontend/src/main/ipc-handlers/task/execution-handlers.ts` - Add Stop/Retry/Regenerate handlers
- `apps/frontend/src/renderer/components/task-detail/TaskDetailModal.tsx` - Update Logs tab
- `apps/frontend/src/renderer/components/task-detail/TaskLogs.tsx` - Add streaming + controls
- `apps/frontend/src/renderer/components/task-detail/hooks/useTaskDetail.ts` - Add streaming logs state
- `apps/frontend/src/renderer/components/TaskCard.tsx` - Add error overlay
- `apps/frontend/src/renderer/styles/globals.css` - Add pulse animation
- `apps/frontend/src/shared/constants.ts` - Add new IPC channels
- `apps/frontend/src/shared/types/task.ts` - Add TaskErrorState type

## Implementation Phases

**Phase 1: IPC Streaming Foundation** (3-4 hours)
- Create StreamLogger in Python backend
- Create AgentLogParser in Electron main
- Update AgentProcessManager to capture stdout
- Add IPC channels for log streaming
- Test with basic system messages

**Phase 2: Log Entry Components** (2-3 hours)
- Create LogEntry component with type-specific rendering
- Add expandable AI request/response display
- Add expandable tool call display
- Implement auto-scroll to bottom
- Add streaming indicator

**Phase 3: Phase Controls** (3-4 hours)
- Add Stop button + backend handler
- Add Retry button + backend handler
- Add Re-plan dropdown + regenerate handler
- Implement control visibility rules
- Test all control flows

**Phase 4: Error Overlay** (2-3 hours)
- Add TaskErrorState type
- Update TaskCard with error overlay
- Add pulse border animation
- Implement quick action buttons on cards
- Test error state propagation

**Phase 5: Integration & Polish** (2-3 hours)
- Update all agents (planner/coder/qa) with StreamLogger
- Test end-to-end streaming with real tasks
- Fix auto-scroll edge cases
- Polish animations and transitions
- Write user documentation

**Total estimated time:** 12-17 hours

## Success Criteria

1. **Real-time visibility** - Logs stream in real-time during task execution with <1s latency
2. **Detailed logging** - Can see full AI requests/responses and tool calls (expandable)
3. **Execution control** - Can stop running tasks from Logs tab
4. **Clear recovery paths** - Failed tasks show error overlay with Retry/Re-plan options
5. **No stuck states** - All failure scenarios have clear recovery paths
6. **Performance** - Log streaming doesn't impact Python agent performance
7. **Auto-scroll** - Logs auto-scroll to bottom as new entries arrive
8. **Error clarity** - Error overlays on cards clearly explain what failed and how to recover

## Testing Strategy

**Unit Tests:**
- StreamLogger emits correct JSON format
- AgentLogParser parses all log types correctly
- Error state detection from log messages

**Integration Tests:**
- End-to-end log streaming (Python → Electron → React)
- Stop button kills process correctly
- Retry clears state and restarts
- Re-plan dropdown actions work correctly

**Manual Testing:**
- Start task, verify logs stream in real-time
- Stop task mid-execution, verify error overlay appears
- Click Retry, verify task restarts from correct phase
- Test all Re-plan dropdown options
- Verify auto-scroll works with rapid log bursts
- Test expandable log entries (AI requests/responses/tool calls)

## Future Enhancements

**Log Search & Filter**
- Search logs by keyword
- Filter by log type (errors only, AI responses only, etc.)
- Timestamp-based filtering

**Log Export**
- Export logs to file (JSON or text)
- Copy individual log entries to clipboard
- Share log snippets for debugging

**Performance Metrics**
- Token usage per phase
- Time spent in thinking vs responding
- Tool call frequency and duration

**Log Persistence Options**
- Configure log retention (auto-delete old logs)
- Compress historical logs
- Archive completed task logs

## Risks & Mitigations

**Risk: Log flooding** (too many logs cause UI lag)
- **Mitigation:** Virtualized log list (render only visible entries)
- **Mitigation:** Configurable log level filter

**Risk: Large log payloads** (AI responses with huge context)
- **Mitigation:** Truncate display, show "View full response" button
- **Mitigation:** Lazy load expanded content

**Risk: IPC message size limits**
- **Mitigation:** Chunk large messages if needed
- **Mitigation:** Reference large content by file path instead of inline

**Risk: Process kill fails** (zombie processes)
- **Mitigation:** Use taskkill with /f /t on Windows
- **Mitigation:** Retry kill with escalation (SIGTERM → SIGKILL)

## Conclusion

This design transforms the Logs tab from a passive viewer into an interactive control center for task execution. Real-time streaming provides visibility into AI behavior, per-phase controls enable recovery from failures, and error overlays make failures visible and actionable directly from the Kanban board.

The implementation leverages existing IPC infrastructure and task management patterns, requiring minimal architectural changes while delivering significant UX improvements. The phased rollout allows for incremental delivery and testing.
