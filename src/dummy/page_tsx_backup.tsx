'use client';

import React, { useState } from 'react';
import { Task, Connection, Board, Group, ViewMode } from '../../types/canvas';
import { BoardCanvas } from '../components/BoardCanvas';
import { CalendarView, TimelineView, SettingsView } from '../components/Views';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { Mascot } from '../components/Mascot';
import { 
  Trello, Calendar as CalendarIcon, StretchHorizontal, Settings, 
  ChevronLeft, ChevronRight, Sun, Moon 
} from 'lucide-react';

export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([
      { id: '1', title: 'Start Here', status: 'todo', x: 100, y: 100, boardId: 'board-1', color: 'yellow', taskType: 1, description: 'Welcome to your new workspace!' }
  ]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [boards, setBoards] = useState<Board[]>([{ id: 'board-1', title: 'My Board' }]);
  const [activeBoardId, setActiveBoardId] = useState('board-1');
  const [groups, setGroups] = useState<Group[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Specific handler for bulk updates from Board (drag, group move)
  const handleBoardTasksUpdate = (boardTasks: Task[]) => {
       setTasks(prev => {
           const other = prev.filter(t => t.boardId !== activeBoardId);
           return [...other, ...boardTasks];
       });
  };

  return (
    <div className="flex h-screen bg-white dark:bg-domo-bg text-gray-900 dark:text-gray-100 font-sans overflow-hidden selection:bg-domo-highlight selection:text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col border-r border-gray-200 dark:border-gray-800 transition-all duration-300 bg-gray-50 dark:bg-[#16181D]`}>
         <div className="p-4 flex items-center justify-between">
            <div className={`flex items-center gap-3 font-bold text-xl text-gray-900 dark:text-white ${!sidebarOpen && 'hidden'}`}>
                <Mascot size={40} />
                <span className="tracking-tight">DOMO</span>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto py-4 space-y-1">
             <button onClick={() => setViewMode('board')} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors ${viewMode === 'board' ? 'border-r-2 border-domo-primary bg-gray-100 dark:bg-white/5 text-domo-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                 <Trello size={20} />
                 {sidebarOpen && <span>Board</span>}
             </button>
             <button onClick={() => setViewMode('calendar')} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors ${viewMode === 'calendar' ? 'border-r-2 border-domo-primary bg-gray-100 dark:bg-white/5 text-domo-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                 <CalendarIcon size={20} />
                 {sidebarOpen && <span>Calendar</span>}
             </button>
             <button onClick={() => setViewMode('timeline')} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors ${viewMode === 'timeline' ? 'border-r-2 border-domo-primary bg-gray-100 dark:bg-white/5 text-domo-primary' : 'text-gray-600 dark:text-gray-400'}`}>
                 <StretchHorizontal size={20} />
                 {sidebarOpen && <span>Timeline</span>}
             </button>
         </div>

         <div className="p-4 border-t border-gray-200 dark:border-gray-800">
             <button onClick={() => setViewMode('settings')} className={`flex items-center gap-3 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors ${viewMode === 'settings' ? 'text-domo-primary font-bold' : ''}`}>
                 <Settings size={20} />
                 {sidebarOpen && <span>Settings</span>}
             </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {viewMode === 'board' && (
              <BoardCanvas
                  tasks={tasks.filter(t => t.boardId === activeBoardId)}
                  connections={connections.filter(c => c.boardId === activeBoardId)}
                  onTasksUpdate={handleBoardTasksUpdate}
                  onTaskSelect={setSelectedTask}
                  onConnectionCreate={(from, to) => setConnections([...connections, { id: Date.now().toString(), from, to, boardId: activeBoardId, style: 'solid', shape: 'bezier' }])}
                  onConnectionDelete={(id) => setConnections(connections.filter(c => c.id !== id))}
                  onConnectionUpdate={(id, updates) => setConnections(connections.map(c => c.id === id ? { ...c, ...updates } : c))}
                  boards={boards}
                  activeBoardId={activeBoardId}
                  onSwitchBoard={setActiveBoardId}
                  onAddBoard={(name) => { const newId = Date.now().toString(); setBoards([...boards, { id: newId, title: name }]); setActiveBoardId(newId); }}
                  onRenameBoard={(id, name) => setBoards(boards.map(b => b.id === id ? { ...b, title: name } : b))}
                  snapToGrid={snapToGrid}
                  groups={groups.filter(g => g.boardId === activeBoardId)}
                  onGroupsUpdate={(updatedGroups) => {
                      setGroups(prev => {
                          const otherGroups = prev.filter(g => g.boardId !== activeBoardId);
                          return [...otherGroups, ...updatedGroups];
                      });
                  }}
              />
          )}
          {viewMode === 'calendar' && <CalendarView tasks={tasks} onTaskSelect={setSelectedTask} />}
          {viewMode === 'timeline' && <TimelineView tasks={tasks} onTaskSelect={setSelectedTask} />}
          {viewMode === 'settings' && <SettingsView />}
          
          {/* Top Right Controls (Absolute) */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
             <button onClick={() => document.documentElement.classList.toggle('dark')} className="p-2 bg-white dark:bg-[#2c333a] rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-[#38414a] text-gray-700 dark:text-gray-200 transition-colors">
                 <Sun size={20} className="hidden dark:block" />
                 <Moon size={20} className="block dark:hidden" />
             </button>
          </div>
      </div>

      {selectedTask && (
          <TaskDetailModal 
              task={selectedTask} 
              onClose={() => setSelectedTask(null)} 
              onUpdate={(updated) => {
                  setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
                  setSelectedTask(updated);
              }}
              currentUser="User"
          />
      )}
    </div>
  );
}