import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { colors } from './colors';
import { useLanguage } from './LanguageProvider';

export default function MultiBarChart({ months, formatValue, onBarPress, maxHeight = 200 }) {
  const { t } = useLanguage();
  
  if (!months || !Array.isArray(months) || months.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t('dashboard.noData')}</Text>
      </View>
    );
  }

  // Calculate max value for scaling
  const totals = months.map(m => m?.total || 0).filter(t => !isNaN(t));
  const maxValue = totals.length > 0 ? Math.max(...totals, 1) : 1;
  
  // Format month label (e.g., "2024-01" -> "Jan 2024")
  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return '';
    try {
      const [year, month] = monthStr.split('-');
      if (!year || !month) return monthStr;
      const date = new Date(parseInt(year), parseInt(month) - 1);
      if (isNaN(date.getTime())) return monthStr;
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch (e) {
      console.warn('Error formatting month label:', monthStr, e);
      return monthStr;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {months.map((monthData, index) => {
          const total = monthData?.total || 0;
          const height = maxValue > 0 ? (total / maxValue) * maxHeight : 0;
          // Ensure isCurrent is a boolean - handle string "true"/"false" from API
          const isCurrentRaw = monthData?.isCurrent;
          const isCurrent = isCurrentRaw === true || isCurrentRaw === 'true' || isCurrentRaw === 1;
          
          return (
            <Pressable
              key={index}
              style={styles.barContainer}
              onPress={() => onBarPress && onBarPress(monthData?.month)}
              disabled={Boolean(!onBarPress)}
            >
              {({ pressed }) => {
                const isPressed = Boolean(pressed);
                return (
                <>
                  <Text style={styles.valueLabel} numberOfLines={1}>
                    {formatValue(monthData?.total || 0)}
                  </Text>
                  <View
                    style={[
                      styles.bar,
                      isCurrent === true ? styles.currentBar : styles.previousBar,
                      { height: Math.max(height, 4) },
                      isPressed === true ? styles.barPressed : null,
                    ].filter(Boolean)}
                  />
                  <Text style={styles.monthLabel} numberOfLines={1}>
                    {formatMonthLabel(monthData?.month || '')}
                  </Text>
                  {onBarPress && (
                    <Text style={styles.clickHint}>👆</Text>
                  )}
                </>
                );
              }}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    paddingHorizontal: 10,
    paddingTop: 40,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    minWidth: 50,
  },
  barPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  clickHint: {
    fontSize: 8,
    color: colors.textTertiary,
    marginTop: 2,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  bar: {
    width: '85%',
    borderRadius: 6,
    minHeight: 4,
  },
  previousBar: {
    backgroundColor: colors.chartPrevious,
  },
  currentBar: {
    backgroundColor: colors.chartCurrent,
  },
  monthLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});

