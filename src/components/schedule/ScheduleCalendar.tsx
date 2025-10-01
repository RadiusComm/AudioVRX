import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';

interface Session {
  id: string;
  scenario_id: string;
  user_id: string;
  start_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scenario: {
    title: string;
    description: string;
    difficulty: string;
    tags?: string[];
  };
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
  } | null;
}

interface ScheduleCalendarProps {
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  getStatusBadge: (status: string) => JSX.Element;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  sessions,
  onSelectSession,
  getStatusBadge
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Group sessions by date
  const sessionsByDate: Record<string, Session[]> = {};
  
  sessions.forEach(session => {
    const dateKey = format(new Date(session.start_time), 'yyyy-MM-dd');
    if (!sessionsByDate[dateKey]) {
      sessionsByDate[dateKey] = [];
    }
    sessionsByDate[dateKey].push(session);
  });
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const onDateClick = (day: Date) => {
    setSelectedDate(day);
  };
  
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          onClick={prevMonth}
          className="p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <Button
          variant="ghost"
          onClick={nextMonth}
          className="p-2"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    );
  };
  
  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div
            key={day}
            className="text-center py-2 text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };
  
  const renderCells = () => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    const dateFormat = 'd';
    const rows = [];
    
    let days = [];
    let day = startDate;
    let formattedDate = '';
    
    // Get the day of the week for the first day of the month (0-6)
    const startDay = startDate.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 border border-gray-200 dark:border-gray-700 p-2"></div>
      );
    }
    
    while (day <= endDate) {
      formattedDate = format(day, dateFormat);
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayHasSessions = sessionsByDate[dateKey] && sessionsByDate[dateKey].length > 0;
      const isSelectedDay = isSameDay(day, selectedDate);
      const isCurrentDay = isToday(day);
      
      // Get sessions for this day (limited to 2 for display)
      const daySessions = sessionsByDate[dateKey] || [];
      const displaySessions = daySessions.slice(0, 2);
      const hasMoreSessions = daySessions.length > 2;
      
      days.push(
        <div
          key={day.toString()}
          className={`h-32 border border-gray-200 dark:border-gray-700 p-2 overflow-y-auto transition-colors duration-200 ${
            isSelectedDay 
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' 
              : isCurrentDay 
                ? 'bg-secondary-50 dark:bg-secondary-900/20' 
                : ''
          } ${dayHasSessions ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}`}
          onClick={() => dayHasSessions && onDateClick(day)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium ${
              isCurrentDay 
                ? 'bg-primary-500 text-white dark:bg-primary-600 w-6 h-6 rounded-full flex items-center justify-center' 
                : isSelectedDay 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300'
            }`}>
              {formattedDate}
            </span>
          </div>
          
          <div className="mt-1 space-y-1">
            {displaySessions.map((session, idx) => {
              const userName = session.user 
                ? `${session.user.first_name} ${session.user.last_name}` 
                : 'Unknown User';
              
              return (
                <div 
                  key={session.id}
                  className="flex items-center p-1 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSession(session);
                  }}
                >
                  <Avatar
                    src={session.user?.avatar_url}
                    name={userName}
                    size="xs"
                    className="mr-1 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {userName}
                    </p>
                  </div>
                  <div className="ml-1">
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              );
            })}
            
            {hasMoreSessions && (
              <div 
                className="flex items-center justify-center p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateClick(day);
                }}
              >
                <Users className="h-3 w-3 mr-1" />
                {daySessions.length - 2}+ more
              </div>
            )}
          </div>
        </div>
      );
      
      // If we've reached the end of a week, start a new row
      if (days.length === 7) {
        rows.push(
          <div key={day.toString()} className="grid grid-cols-7 gap-px">
            {days}
          </div>
        );
        days = [];
      }
      
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000); // Add one day
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 7 - days.length;
    if (remainingCells > 0 && days.length > 0) {
      for (let i = 0; i < remainingCells; i++) {
        days.push(
          <div key={`empty-end-${i}`} className="h-32 border border-gray-200 dark:border-gray-700 p-2"></div>
        );
      }
      rows.push(
        <div key={`last-row`} className="grid grid-cols-7 gap-px">
          {days}
        </div>
      );
    }
    
    return <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">{rows}</div>;
  };
  
  // Get sessions for the selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateSessions = sessionsByDate[selectedDateKey] || [];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 md:space-y-6"
    >
      <Card className="p-4 md:p-6">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </Card>
      
      {selectedDateSessions.length > 0 && (
        <Card className="p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary-500" />
            Sessions on {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <div className="space-y-3 md:space-y-4">
            {selectedDateSessions.map(session => {
              const userName = session.user 
                ? `${session.user.first_name} ${session.user.last_name}` 
                : 'Unknown User';
              
              return (
                <div 
                  key={session.id}
                  className="p-3 md:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={session.user?.avatar_url}
                        name={userName}
                        size="sm"
                      />
                      <div>
                        <h4 className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                          {userName}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                          {session.scenario.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      {getStatusBadge(session.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );
};