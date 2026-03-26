'use client';

import { useNotifications } from '@/app/providers/notification-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Flag,
  LifeBuoy,
  MapPinHouse,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const typeIcons = {
  report: Flag,
  rescue: LifeBuoy,
  alert: AlertTriangle,
  evacuation: MapPinHouse,
  user: Bell,
};

const typeColors = {
  report: 'text-orange-500',
  rescue: 'text-red-500',
  alert: 'text-yellow-500',
  evacuation: 'text-blue-500',
  user: 'text-green-500',
};

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const router = useRouter();

  const handleNotificationClick = (id: string, actionUrl: string) => {
    markAsRead(id);
    router.push(actionUrl);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full p-0 border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Read all
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Bell className="w-8 h-8 mb-2" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notif) => {
                const Icon = typeIcons[notif.type];
                const iconColor = typeColors[notif.type];
                return (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                        !notif.read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className={`mt-0.5 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm truncate ${!notif.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                          >
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{notif.description}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
