import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api';
import { colors } from '../src/colors';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No notifications</Text>
              </View>
            ) : (
              <>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={handleMarkAllAsRead}
                  >
                    <Text style={styles.markAllButtonText}>
                      Mark all as read ({unreadCount})
                    </Text>
                  </TouchableOpacity>
                )}
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationCard,
                      !notification.read && styles.unreadCard
                    ]}
                    onPress={() => !notification.read && handleMarkAsRead(notification.id)}
                  >
                    <View style={styles.notificationContent}>
                      <Text style={[
                        styles.notificationMessage,
                        !notification.read && styles.unreadMessage
                      ]}>
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {formatDate(notification.created_at)}
                      </Text>
                    </View>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      marginHorizontal: 'auto',
      width: '100%',
      padding: 24,
    }),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  markAllButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 22,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  notificationDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: 12,
  },
});



