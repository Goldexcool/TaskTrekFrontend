/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Plus, MoreHorizontal, PlusCircle, Trash2, Clipboard } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../components/ui/dropdown-menu';
import SortableTaskCard from './SortableTaskCard'
import { Task } from '@/app/types/task';

interface Column {
  _id: string;
  title: string;
  color: string;
}

// Add these context providers in the Board page so they're available to all components
const TaskColumn: React.FC<{
  column: Column;
  tasks: Task[];
  onAddTask: (title: string, priority: string, dueDate?: string, description?: string) => void;
  onDeleteColumn: () => void;
  onMoveTask: (taskId: string, targetColumnId: string, position?: number) => Promise<void>;
  onSelectTask: (task: Task) => void;
  onToggleTaskCompletion: (columnId: string, taskId: string, isCompleted: boolean) => void;
}> = ({ 
  column, 
  tasks, 
  onAddTask, 
  onDeleteColumn,
  onMoveTask,
  onSelectTask,
  onToggleTaskCompletion
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const isActiveColumn = activeColumn === column._id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(
        newTaskTitle,
        newTaskPriority,
        newTaskDueDate || undefined,
        newTaskDescription || undefined
      );
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      setNewTaskDueDate('');
      setActiveColumn(null);
    }
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  return (
    <div
      className="bg-gray-100 dark:bg-gray-900/50 rounded-xl overflow-hidden flex flex-col min-h-[calc(100vh-220px)] shadow-sm border border-gray-200 dark:border-gray-800 task-column"
      data-column-id={column._id}
    >
      <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="font-medium text-gray-900 dark:text-white">{column.title}</h3>
          <div className="flex ml-2 gap-1">
            <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {totalTasks}
            </span>
            {completedTasks > 0 && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center">
                <CheckCircle size={10} className="mr-1" />
                {completedTasks}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center">
          <button
            className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setActiveColumn(isActiveColumn ? null : column._id)}
          >
            <Plus size={16} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 ml-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setActiveColumn(column._id)}>
                <PlusCircle size={14} className="mr-2" /> Add Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDeleteColumn} className="text-red-600 dark:text-red-400">
                <Trash2 size={14} className="mr-2" /> Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence>
        {isActiveColumn && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Enter task title..."
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  placeholder="Add a description (optional)"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2 min-h-[60px]"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                    <select
                      className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveColumn(null);
                      setNewTaskTitle('');
                      setNewTaskDescription('');
                      setNewTaskPriority('medium');
                      setNewTaskDueDate('');
                    }}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim()}
                    className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 flex items-center"
                  >
                    <Plus size={14} className="mr-1" /> Add
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 overflow-y-auto flex-1 board-container">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center p-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
              <Clipboard className="h-6 w-6 text-gray-400" />
            </div>
            <p className="mb-2">No tasks yet</p>
            <button
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center text-sm"
              onClick={() => setActiveColumn(column._id)}
            >
              <Plus size={16} className="mr-1" /> Add a task
            </button>
          </div>
        ) : (
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1 },
            }}
            initial="hidden"
            animate="show"
            className="min-h-full"
          >
            {tasks.map(task => (
              <SortableTaskCard
                key={task._id}
                task={task}
                columnId={column._id}
                onMoveTask={onMoveTask}
                onSelectTask={handleSelectTask}
                onToggleTaskCompletion={onToggleTaskCompletion}
                // Remove these props or make sure they're defined in SortableTaskCard component
                // activeTaskId={activeTaskId}
                // setActiveTaskId={setActiveTaskId}p
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TaskColumn;