/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, isSameMonth,
  isSameDay, addMonths, subMonths, getDay, startOfWeek, addDays,
  endOfWeek, isToday, isBefore, parse
} from 'date-fns';
// Import these separately since they're causing issues
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, CheckSquare, Users, Filter, GridIcon,
  Plus, Tag, AlertCircle, Trash2, Edit,
  CheckCircle, Maximize2, Minimize2, X, Zap, Layers, MessageSquare
} from 'lucide-react';
import HeaderDash from '../components/HeaderDash';
import useAuthStore from '../store/useAuthStore';
import { toast } from "../components/ui/use-toast";
import apiClient from '../utils/apiClient';

// Task interface
interface Task {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  completed?: boolean;
  iscompleted?: boolean;
  isCompleted?: boolean; // Add this field to match API response
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  board?: {
    id?: string;
    _id?: string;
    title: string;
    backgroundColor?: string;
  };
  team?: {
    id?: string;
    _id?: string;
    name?: string;
  };
  assignedTo?: {
    id?: string;
    _id?: string;
    name: string;
    avatar?: string;
  };
  labels?: string[];
}

// Alternative to eachDayOfInterval
const generateDaysInRange = (start: Date, end: Date): Date[] => {
  const days: Date[] = [];
  const currentDay = new Date(start);

  while (currentDay <= end) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  return days;
};

// Alternative to parseISO
const parseISODate = (dateString: string): Date => {
  return new Date(dateString);
};

const CalendarPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCompleted, setFilterCompleted] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Safe date parsing function to handle API dates
  const safeParse = (dateString: string | undefined): Date => {
    if (!dateString) return new Date();

    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
      return new Date();
    } catch (err) {
      console.error('Date parsing error:', err);
      return new Date();
    }
  };

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!accessToken) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/all`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setTasks(result.data);
        } else {
          const taskData = Array.isArray(result) ? result :
            (result.data && Array.isArray(result.data)) ? result.data : [];
          setTasks(taskData);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [accessToken]);

  // Generate calendar data based on current date and view mode
  const calendarData = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);

      return generateDaysInRange(startDate, endDate);
    }

    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);

      return generateDaysInRange(weekStart, weekEnd);
    }

    return [currentDate];
  }, [currentDate, viewMode]);

  // Fix Today filter in getTasksForDate function
  const getTasksForDate = (date: Date) => {
    if (!tasks.length) return [];

    return tasks.filter(task => {
      if (!task.dueDate) return false;

      // Properly normalize date comparison by setting hours to 0
      const taskDate = safeParse(task.dueDate);
      const compareDate = new Date(date);

      // Reset time components for accurate day comparison
      taskDate.setHours(0, 0, 0, 0);
      compareDate.setHours(0, 0, 0, 0);

      // Check if dates match at day level
      const isSameDate = taskDate.getDate() === compareDate.getDate() &&
        taskDate.getMonth() === compareDate.getMonth() &&
        taskDate.getFullYear() === compareDate.getFullYear();

      if (!isSameDate) return false;

      // Rest of your filtering logic
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

      // Check both completed and isCompleted properties
      const isTaskCompleted = task.completed || task.iscompleted;
      if (filterCompleted === 'completed' && !isTaskCompleted) return false;
      if (filterCompleted === 'pending' && isTaskCompleted) return false;

      if (filterTeam !== 'all' && task.team?.id !== filterTeam) return false;

      return true;
    });
  };

  // Get all tasks for the day view
  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return getTasksForDate(selectedDay);
  }, [selectedDay, tasks, filterPriority, filterCompleted, filterTeam]);

  // Navigation handlers
  const goToPreviousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -1));
    }
  };

  const goToNextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    setSelectedDay(day);

    if (viewMode === 'month') {
      setViewMode('day');
      setCurrentDate(day);
    }
  };

  // Handle task selection
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleToggleTaskCompletion = async (taskId: string, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the task detail modal
    
    try {
      // Optimistically update the UI for both completed and isCompleted flags
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId || task._id === taskId ? { 
            ...task, 
            completed: !completed,
            iscompleted: !completed // Make sure to update both flags
          } : task
        )
      );
      
      const endpoint = completed ? `/tasks/${taskId}/reopen` : `/tasks/${taskId}/complete`;
      
      console.log(`Using PATCH request to endpoint: ${endpoint}`);
      
      const response = await apiClient({
        url: endpoint,
        method: 'PATCH', 
        data: {
          completed: !completed,
          status: !completed ? 'done' : 'todo' 
        }
      });
      
      console.log('Task update response:', response.data);
      
      // If successful, show success toast
      toast({
        title: completed ? "Task Reopened" : "Task Completed",
        description: completed ? "Task has been marked as incomplete" : "Task has been marked as completed",
        variant: "success"
      });
      
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      
      // Revert UI changes in case of error
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed, iscompleted: completed } : task
        )
      );
      
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to update task status',
        variant: "destructive"
      });
    }
  };

  const calendarTitle = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);

      if (format(weekStart, 'MMM') !== format(weekEnd, 'MMM')) {
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }

      if (format(weekStart, 'yyyy') !== format(weekEnd, 'yyyy')) {
        return `${format(weekStart, 'MMM d, yyyy')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }

      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  }, [currentDate, viewMode]);

  // Get task color based on priority
  const getTaskColor = (priority?: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gradient-to-r from-blue-800/30 to-cyan-800/30 border-l-4 border-cyan-500 text-cyan-300';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-800/30 to-amber-800/30 border-l-4 border-amber-500 text-amber-300';
      case 'high':
        return 'bg-gradient-to-r from-orange-800/30 to-red-800/30 border-l-4 border-red-500 text-red-300';
      case 'critical':
        return 'bg-gradient-to-r from-red-800/30 to-pink-800/30 border-l-4 border-pink-500 text-pink-300';
      default:
        return 'bg-gradient-to-r from-gray-800/30 to-gray-700/30 border-l-4 border-gray-500 text-gray-300';
    }
  };

  // Render task item component
  const TaskItem = ({ task, compact = false }: { task: Task, compact?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group cursor-pointer rounded-lg p-2 mb-1 backdrop-blur-sm ${getTaskColor(task.priority)} hover:scale-[1.01] transition-all duration-150`}
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            className="mr-2 flex items-center justify-center w-5 h-5"
            onClick={(e) => handleToggleTaskCompletion(task.id || task._id || '', !!task.completed, e)}
          >
            {task.completed ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <Clock className="h-4 w-4 text-indigo-400" />
            )}
          </button>
          <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {compact ? (
              task.title.length > 18 ? `${task.title.substring(0, 16)}...` : task.title
            ) : (
              task.title
            )}
          </span>
        </div>
      </div>

      {!compact && task.description && (
        <p className="mt-1 text-xs text-gray-400 truncate">
          {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
        </p>
      )}

      {!compact && (
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            {task.team && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-700 backdrop-blur-sm shadow-sm">
                <Users className="mr-1 h-3 w-3" />
                {task.team.name ?
                  (task.team.name.length > 15 ? `${task.team.name.substring(0, 12)}...` : task.team.name)
                  : 'Team'
                }
              </span>
            )}
            {task.labels && task.labels.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-purple-900/50 text-purple-300 border border-purple-700 backdrop-blur-sm shadow-sm">
                <Tag className="mr-1 h-3 w-3" />
                {task.labels[0]}
                {task.labels.length > 1 && ` +${task.labels.length - 1}`}
              </span>
            )}
          </div>

          {task.priority && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full shadow-sm ${task.priority === 'critical' ? 'bg-gradient-to-r from-red-900/70 to-pink-900/70 text-pink-200 border border-pink-700' :
              task.priority === 'high' ? 'bg-gradient-to-r from-orange-900/70 to-red-900/70 text-red-200 border border-red-700' :
                task.priority === 'medium' ? 'bg-gradient-to-r from-yellow-900/70 to-amber-900/70 text-amber-200 border border-amber-700' :
                  'bg-gradient-to-r from-blue-900/70 to-cyan-900/70 text-cyan-200 border border-cyan-700'
              }`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );

  // Render functions for different views
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1.5">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day: string) => (
        <div
          key={day}
          className="p-2 text-sm font-medium text-gray-300 text-center border-b border-gray-700 bg-gray-800/80 backdrop-blur-sm"
        >
          {day}
        </div>
      ))}

      {calendarData.map((day: Date, i: number) => {
        const dayTasks: Task[] = getTasksForDate(day);
        const isCurrentMonth: boolean = isSameMonth(day, currentDate);
        const isSelectedDay: boolean = selectedDay !== null && isSameDay(day, selectedDay);
        const isCurrentDay: boolean = isToday(day);

        return (
          <div
            key={i}
            className={`min-h-[120px] p-1.5 border border-gray-700/50 rounded-lg backdrop-blur-sm shadow-lg transition-all duration-200 ${isCurrentMonth
              ? 'bg-gray-800/80 hover:bg-gray-800'
              : 'bg-gray-800/40 hover:bg-gray-800/60'
              } ${isSelectedDay ? 'ring-2 ring-indigo-500/70' : ''} ${isCurrentDay ? 'ring-1 ring-cyan-400/50' : ''
              } hover:scale-[1.02] hover:z-10`}
            onClick={() => handleDayClick(day)}
          >
            <div className={`flex items-center justify-between p-1.5 mb-1.5 ${isCurrentDay ? 'bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 rounded-md' : ''
              }`}>
              <span className={`text-sm font-medium ${isCurrentDay
                ? 'text-cyan-300'
                : isCurrentMonth
                  ? 'text-white'
                  : 'text-gray-500'
                }`}>
                {format(day, 'd')}
              </span>

              {dayTasks.length > 0 && (
                <span className="bg-indigo-900/70 border border-indigo-600/50 text-xs font-medium text-indigo-300 px-1.5 py-0.5 rounded-full shadow-sm">
                  {dayTasks.length}
                </span>
              )}
            </div>

            <div className="space-y-1.5 overflow-hidden max-h-[80px]">
              {dayTasks.slice(0, 2).map((task: Task, index: number) => (
                <TaskItem key={task.id || task._id || `task-${index}`} task={task} compact />
              ))}

              {dayTasks.length > 2 && (
                <div className="text-center mt-1.5 text-xs bg-indigo-900/40 text-indigo-300 py-0.5 px-1 rounded-md border border-indigo-800/60 backdrop-blur-sm shadow-sm">
                  <span className="flex items-center justify-center">
                    <Layers className="h-3 w-3 mr-1" />
                    {dayTasks.length - 2} more
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 gap-1.5">
        {calendarData.map((day: Date, i: number) => (
          <div
            key={i}
            className={`p-3 text-center border-b border-gray-700 rounded-t-lg ${isToday(day)
              ? 'bg-gradient-to-b from-indigo-900/70 to-gray-800/90'
              : 'bg-gray-800/90'
              }`}
          >
            <div className="text-sm font-medium text-gray-300">
              {format(day, 'E')}
            </div>
            <div className={`text-xl font-bold ${isToday(day) ? 'text-cyan-300' : 'text-white'
              }`}>
              {format(day, 'd')}
            </div>
            <div className="text-xs text-gray-500">
              {format(day, 'MMM')}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mt-2">
        {calendarData.map((day: Date, i: number) => {
          const dayTasks = getTasksForDate(day);
          const isSelectedDay = selectedDay && isSameDay(day, selectedDay);

          return (
            <div
              key={i}
              className={`border border-gray-700/50 rounded-lg bg-gray-800/80 min-h-[250px] max-h-[500px] overflow-y-auto p-3 backdrop-blur-sm shadow-lg ${isSelectedDay ? 'ring-2 ring-indigo-500' : ''
                } ${isToday(day) ? 'ring-1 ring-cyan-400/50' : ''
                }`}
              onClick={() => setSelectedDay(day)}
            >
              {dayTasks.length > 0 ? (
                <div className="space-y-2">
                  {dayTasks.map((task, index) => (
                    <TaskItem key={task.id || task._id || `task-${index}`} task={task} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="p-3 rounded-full bg-gray-700/50">
                    <CheckSquare className="h-6 w-6 text-gray-400" />
                  </div>
                  <span className="text-xs mt-2">No tasks</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="p-5 border-b border-gray-700 bg-gradient-to-r from-indigo-900/50 to-gray-800/90">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="inline-flex items-center justify-center p-1.5 bg-indigo-800/70 rounded-lg mr-3 border border-indigo-700/70">
            <CalendarIcon className="h-5 w-5 text-cyan-300" />
          </span>
          {format(currentDate, 'EEEE, MMMM d')}
        </h2>
      </div>

      <div className="p-5">
        {tasksForSelectedDay.length > 0 ? (
          <div className="space-y-3">
            {tasksForSelectedDay.map((task, index) => (
              <TaskItem key={task.id || task._id || `task-${index}`} task={task} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="p-5 rounded-full bg-gradient-to-br from-gray-700/50 to-gray-800/80 mb-4 shadow-lg border border-gray-700/60">
              <CheckSquare className="h-12 w-12 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tasks for today</h3>
            <p className="text-sm text-gray-400 max-w-md text-center">
              Looks like you don&apos;t have any tasks scheduled for this day. Switch to a different day.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Task detail modal
  const TaskDetailModal = () => {
    if (!selectedTask) return null;

    let dueDate: Date | null = null;
    let createdAt: Date | null = null;

    try {
      if (selectedTask.dueDate) {
        dueDate = safeParse(selectedTask.dueDate);
      }

      createdAt = safeParse(selectedTask.createdAt);
    } catch (error) {
      console.error("Error parsing dates", error);
    }

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700/70 overflow-hidden"
        >
          <div
            className={`p-4 border-b border-gray-700 flex items-center justify-between ${selectedTask.priority === 'critical' ? 'bg-gradient-to-r from-red-900/50 to-pink-900/40' :
              selectedTask.priority === 'high' ? 'bg-gradient-to-r from-orange-900/50 to-red-900/40' :
                selectedTask.priority === 'medium' ? 'bg-gradient-to-r from-yellow-900/50 to-orange-900/40' :
                  'bg-gradient-to-r from-blue-900/50 to-indigo-900/40'
              }`}
          >
            <h3 className="text-lg font-medium text-white flex items-center">
              <span className={`h-3 w-3 rounded-full mr-2 ${selectedTask.priority === 'high' ? 'bg-red-500' :
                selectedTask.priority === 'medium' ? 'bg-yellow-500' :
                  selectedTask.priority === 'low' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></span>
              Task Details
            </h3>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-400 hover:text-white p-1 rounded-full transition-colors bg-gray-800/40 hover:bg-gray-800/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              {selectedTask.title}
              {(selectedTask.priority === 'high' || selectedTask.priority === 'critical') && (
                <span className="ml-2 inline-flex items-center">
                  <Zap className="h-5 w-5 text-amber-400" fill="#FBBF24" fillOpacity={0.3} />
                </span>
              )}
            </h2>

            {selectedTask.description && (
              <p className="text-gray-300 mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                {selectedTask.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                  <span className="w-1 h-5 bg-indigo-500 mr-2 rounded-full"></span>
                  Details
                </h4>
                <ul className="space-y-4 bg-gray-800/40 p-4 rounded-xl border border-gray-700/50">
                  <li className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-cyan-400 mr-3" />
                    <span className="text-gray-300">
                      Due: {dueDate ? format(dueDate, 'PPP') : 'No due date'}
                    </span>
                  </li>

                  <li className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-cyan-400 mr-3" />
                    <span className="text-gray-300">
                      Priority:
                      <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${selectedTask.priority === 'critical' ? 'bg-gradient-to-r from-red-900/70 to-pink-900/70 text-pink-200 border border-pink-700/70' :
                        selectedTask.priority === 'high' ? 'bg-gradient-to-r from-orange-900/70 to-red-900/70 text-red-200 border border-red-700/70' :
                          selectedTask.priority === 'medium' ? 'bg-gradient-to-r from-yellow-900/70 to-amber-900/70 text-amber-200 border border-amber-700/70' :
                            'bg-gradient-to-r from-blue-900/70 to-cyan-900/70 text-cyan-200 border border-cyan-700/70'
                        }`}>
                        {selectedTask.priority ? `${selectedTask.priority.charAt(0).toUpperCase()}${selectedTask.priority.slice(1)}` : 'None'}
                      </span>
                    </span>
                  </li>

                  <li className="flex items-center">
                    <CheckSquare className="h-5 w-5 text-cyan-400 mr-3" />
                    <span className="text-gray-300">
                      Status:
                      <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${selectedTask.completed
                        ? 'bg-gradient-to-r from-green-900/70 to-emerald-900/70 text-emerald-200 border border-emerald-700/70'
                        : 'bg-gradient-to-r from-amber-900/70 to-orange-900/70 text-amber-200 border border-amber-700/70'
                        }`}>
                        {selectedTask.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                {selectedTask.board && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                      <span className="w-1 h-5 bg-indigo-500 mr-2 rounded-full"></span>
                      Board
                    </h4>
                    <div
                      className="p-3 rounded-xl flex items-center bg-gray-800/40 border border-gray-700/50 shadow-sm"
                    >
                      <div
                        className="h-5 w-5 rounded-md mr-2 shadow-sm"
                        style={{ backgroundColor: selectedTask.board.backgroundColor || '#3D4451' }}
                      ></div>
                      <span className="text-gray-300 font-medium">{selectedTask.board.title}</span>
                    </div>
                  </div>
                )}

                {selectedTask.team && (
                  <div>
                    <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                      <span className="w-1 h-5 bg-indigo-500 mr-2 rounded-full"></span>
                      Team
                    </h4>
                    <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 flex items-center shadow-sm">
                      <div className="p-1.5 rounded-lg bg-indigo-900/60 mr-2">
                        <Users className="h-4 w-4 text-indigo-300" />
                      </div>
                      <span className="text-gray-300 font-medium">
                        {selectedTask.team && selectedTask.team.name ? selectedTask.team.name : 'Unknown Team'}
                      </span>
                    </div>
                  </div>
                )}

                {selectedTask.labels && selectedTask.labels.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                      <span className="w-1 h-5 bg-indigo-500 mr-2 rounded-full"></span>
                      Labels
                    </h4>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
                      {selectedTask.labels.map((label, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 rounded-full text-xs bg-purple-900/50 text-purple-300 border border-purple-700/70 shadow-sm"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-sm font-medium text-indigo-400 mb-3 flex items-center">
                <span className="w-1 h-5 bg-indigo-500 mr-2 rounded-full"></span>
                Comments
              </h4>
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4 flex items-center">
                <div className="p-2 rounded-full bg-indigo-900/40 border border-indigo-800/60">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="ml-3 bg-transparent border-none focus:outline-none text-gray-300 w-full"
                />
                <button className="px-3 py-1 bg-indigo-700/70 hover:bg-indigo-600 rounded-lg text-white text-sm shadow-sm">
                  Add
                </button>
              </div>
            </div> */}
          </div>

          <div className="p-4 border-t border-gray-700 flex items-center justify-between bg-gray-800/50">
            <div className="flex items-center">
              <span className="text-xs text-gray-500">
                Created: {createdAt ? format(createdAt, 'PPp') : 'Unknown date'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 text-white">
      <HeaderDash />

      <main className={`pt-20 px-4 pb-12 mx-auto transition-all ${isFullWidth ? 'max-w-full' : 'max-w-7xl'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white flex items-center relative">
                <span className="absolute -inset-1 rounded-lg bg-indigo-500/20 blur-sm"></span>
                <span className="relative inline-flex items-center justify-center p-2 bg-indigo-900/70 rounded-lg mr-3 border border-indigo-700">
                  <CalendarIcon className="h-6 w-6 text-cyan-300" />
                </span>
                Task Calendar
              </h1>
              <button
                onClick={() => setIsFullWidth(!isFullWidth)}
                className="ml-4 p-1.5 text-gray-400 hover:text-white rounded-md transition-colors bg-gray-800/70 hover:bg-gray-700/70 border border-gray-700"
                title={isFullWidth ? 'Compact view' : 'Full width view'}
              >
                {isFullWidth ? (
                  <Minimize2 className="h-5 w-5" />
                ) : (
                  <Maximize2 className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Visualize your schedule and manage your tasks across time
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
            <div className="inline-flex rounded-lg shadow-lg border border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'month'
                  ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 text-white'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                  } transition-colors duration-200`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 text-sm font-medium border-x border-gray-700 ${viewMode === 'week'
                  ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 text-white'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                  } transition-colors duration-200`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 text-sm font-medium ${viewMode === 'day'
                  ? 'bg-gradient-to-r from-indigo-700 to-indigo-600 text-white'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
                  } transition-colors duration-200`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border border-gray-700/70 shadow-lg backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-800/70 p-1 rounded-lg border border-gray-700/50">
              <button
                onClick={goToPreviousPeriod}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm"
              >
                Today
              </button>
              <button
                onClick={goToNextPeriod}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-lg font-medium text-white px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50 shadow-sm">
              {calendarTitle}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 text-sm bg-gray-800/70 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700/50 shadow-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>

              {showFilters && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-3 z-1000000000000">
                  <div className="space-y-3 z-10">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                      >
                        <option value="all">All priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <select
                        value={filterCompleted}
                        onChange={(e) => setFilterCompleted(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                      >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="pt-2 border-t border-gray-700 flex justify-end">
                      <button
                        onClick={() => {
                          setFilterPriority('all');
                          setFilterCompleted('all');
                          setFilterTeam('all');
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Reset all filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/70 rounded-xl p-16 flex flex-col items-center justify-center shadow-xl backdrop-blur-sm">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md"></div>
              <div className="relative animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
            <p className="text-gray-400 mt-2">Loading your calendar...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-red-800/70 rounded-xl p-10 text-center shadow-xl backdrop-blur-sm">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-red-500/20 blur-md"></div>
              <div className="relative flex items-center justify-center h-16 w-16 rounded-full">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Failed to load calendar</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-900/30 hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/70 rounded-xl p-5 overflow-x-auto shadow-xl backdrop-blur-sm">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedTask && <TaskDetailModal />}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;