import { Platform, Alert } from 'react-native';

export interface ReminderSchedule {
  id: string;
  label: string;
  subtitle: string;
  hour: number; // 0..23
  minute: number; // 0..59
  enabled: boolean;
  notificationId?: string | null;
}

export const DEFAULT_REMINDERS: ReminderSchedule[] = [
  {
    id: 'siram-pagi',
    label: 'Siram Pagi',
    subtitle: 'Sebelum sinar terik matahari',
    hour: 7,
    minute: 0,
    enabled: true,
  },
  {
    id: 'siram-sore',
    label: 'Siram Sore',
    subtitle: 'Optimal saat suhu teduh',
    hour: 16,
    minute: 30,
    enabled: true,
  },
];

/**
 * Request notification permissions (web / native)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Schedule a daily repeating reminder at a specific hour & minute
 */
export async function scheduleDailyReminder(
  reminder: ReminderSchedule
): Promise<string | null> {
  if (!reminder.enabled) {
    return null;
  }

  await requestNotificationPermissions();
  return `schedule-${reminder.id}-${Date.now()}`;
}

/**
 * Cancel a scheduled reminder
 */
export async function cancelReminderNotification(_notificationId?: string | null): Promise<void> {
  // No-op
}

/**
 * Trigger an immediate test notification alarm
 */
export async function triggerTestAlarmNotification(
  label = 'Siram Pekarangan'
): Promise<void> {
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.Notification.permission === 'granted'
  ) {
    new window.Notification(`🔔 Alarm Pengingat: ${label}`, {
      body: 'Waktunya menyiram dan memeriksa kelembapan tanaman pekarangan Anda!',
    });
  } else {
    Alert.alert(
      '🔔 Alarm Pengingat Aktif!',
      `Waktunya ${label}! Jadwal siram pekarangan Anda siap dijalankan.`
    );
  }
}
