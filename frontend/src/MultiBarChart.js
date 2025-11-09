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

  // Calculate range for scaling (handles both positive and negative values)
  const totals = months.map(m => m?.total || 0).filter(t => !isNaN(t));
  const maxValue = totals.length > 0 ? Math.max(...totals.map(Math.abs), 1) : 1;
  const hasNegative = totals.some(t => t < 0);
  const hasPositive = totals.some(t => t > 0);
  
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

  // Calculate zero line position in pixels (middle if we have both positive and negative)
  const zeroLineY = hasNegative && hasPositive ? maxHeight / 2 : maxHeight;

  return (
    <View style={styles.container}>
      {/* Zero line indicator if we have negative values */}
      {hasNegative && hasPositive && (
        <View style={[styles.zeroLine, { top: zeroLineY + 40 }]} />
      )}
      <View style={styles.chartContainer}>
        {months.map((monthData, index) => {
          const total = monthData?.total || 0;
          const isNegative = total < 0;
          const absValue = Math.abs(total);
          
          // Calculate height based on absolute value (use half of maxHeight for each direction)
          const barHeight = maxValue > 0 ? (absValue / maxValue) * (maxHeight / 2) : 0;
          const height = Math.max(barHeight, 4);
          
          // Ensure isCurrent is a boolean - handle string "true"/"false" from API
          const isCurrentRaw = monthData?.isCurrent;
          const isCurrent = isCurrentRaw === true || isCurrentRaw === 'true' || isCurrentRaw === 1;
          
          // For negative bars: position bottom at zero line, extend downward
          // For positive bars: position bottom at zero line (or 0), extend upward
          const barBottom = hasNegative && hasPositive ? zeroLineY : 0;
          
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
                  <Text style={[styles.valueLabel, isNegative && styles.negativeValueLabel]} numberOfLines={1}>
                    {formatValue(monthData?.total || 0)}
                  </Text>
                  <View style={[
                    styles.barWrapper, 
                    { height: maxHeight },
                    hasNegative && hasPositive && styles.barWrapperWithZero
                  ]}>
                    {isNegative ? (
                      // Negative bar: bottom at zero line, extends downward
                      <View
                        style={[
                          styles.bar,
                          styles.negativeBar,
                          { 
                            height,
                            position: 'absolute',
                            bottom: barBottom,
                            // Extends downward from zero line
                          },
                          isPressed === true ? styles.barPressed : null,
                        ].filter(Boolean)}
                      />
                    ) : (
                      // Positive bar: bottom at zero line (or 0), extends upward
                      <View
                        style={[
                          styles.bar,
                          isCurrent === true ? styles.currentBar : styles.previousBar,
                          { 
                            height,
                            position: 'absolute',
                            bottom: barBottom,
                            // Extends upward from zero line
                          },
                          isPressed === true ? styles.barPressed : null,
                        ].filter(Boolean)}
                      />
                    )}
                  </View>
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
    alignItems: 'flex-start',
    height: 250,
    paddingHorizontal: 10,
    paddingTop: 40,
    position: 'relative',
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.textSecondary,
    opacity: 0.3,
    zIndex: 1,
  },
  barWrapper: {
    width: '85%',
    position: 'relative',
    alignItems: 'center',
  },
  barWrapperWithZero: {
    // Zero line is at 50% - bars position relative to this
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
  negativeValueLabel: {
    color: '#EF4444', // Red for negative values
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  negativeBar: {
    backgroundColor: '#EF4444', // Red for negative values
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

