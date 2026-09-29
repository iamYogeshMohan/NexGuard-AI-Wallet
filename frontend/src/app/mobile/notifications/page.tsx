'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Bell,
  ShieldAlert,
  Info,
  CheckCircle2,
  RefreshCw,
  Clock,
  Check,
} from 'lucide-react';

export default function MobileNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifs = async () => {
    try {
      const data = await api('/wallet/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await api(`/wallet/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/mobile/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </Link>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          NOTIFICATIONS
        </span>
        <button
          onClick={fetchNotifs}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-400">No security notifications yet.</div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => {
            const isAlert = notif.type === 'ALERT';

            return (
              <div
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                className={`p-4 rounded-3xl border transition cursor-pointer shadow-xs ${
                  !notif.is_read
                    ? isAlert
                      ? 'bg-rose-50/70 border-rose-200 text-slate-900'
                      : 'bg-indigo-50/70 border-indigo-200 text-slate-900'
                    : 'bg-white border-slate-200/90 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {isAlert ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                        <ShieldAlert size={18} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Info size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{notif.title}</span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono pt-1">
                      <Clock size={11} />
                      <span>{notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
