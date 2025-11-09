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

  // Zero line is in the middle of the bar area when we have both positive and negative
  const barAreaHeight = maxHeight;
  const zeroLineY = hasNegative && hasPositive ? barAreaHeight / 2 : barAreaHeight;

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {months.map((monthData, index) => {
          const total = monthData?.total || 0;
          const isNegative = total < 0;
          const absValue = Math.abs(total);
          
          // Calculate bar height (use half of barAreaHeight for each direction)
          const barHeight = maxValue > 0 ? (absValue / maxValue) * (barAreaHeight / 2) : 0;
          const height = Math.max(barHeight, 4);
          
          // Ensure isCurrent is a boolean
          const isCurrentRaw = monthData?.isCurrent;
          const isCurrent = isCurrentRaw === true || isCurrentRaw === 'true' || isCurrentRaw === 1;
          
          return (
            <Pressable
              key={index}
              style={styles.barColumn}
              onPress={() => onBarPress && onBarPress(monthData?.month)}
              disabled={Boolean(!onBarPress)}
            >
              {({ pressed }) => {
                const isPressed = Boolean(pressed);
                return (
                  <>
                    {/* Bar area container */}
                    <View style={[styles.barArea, { height: barAreaHeight }]}>
                      {/* Zero line indicator */}
                      {hasNegative && hasPositive && (
                        <View style={[styles.zeroLine, { top: zeroLineY }]} />
                      )}
                      
                      {/* Value label - positioned relative to bar */}
                      {isNegative ? (
                        // Negative: label below the bar (bar ends at zeroLineY + height)
                        <Text 
                          style={[
                            styles.valueLabel, 
                            styles.negativeValueLabel,
                            { position: 'absolute', top: zeroLineY + height + 4 }
                          ]} 
                          numberOfLines={1}
                        >
                          {formatValue(total)}
                        </Text>
                      ) : (
                        // Positive: label above the bar
                        // Bar bottom is at: hasNegative && hasPositive ? (barAreaHeight - zeroLineY) : 0
                        // Bar top is at: hasNegative && hasPositive ? (barAreaHeight - zeroLineY - height) : (barAreaHeight - height)
                        // Label should be above bar top
                        <Text 
                          style={[
                            styles.valueLabel,
                            { 
                              position: 'absolute', 
                              bottom: hasNegative && hasPositive 
                                ? (barAreaHeight - zeroLineY + height + 4)
                                : (height + 4)
                            }
                          ]} 
                          numberOfLines={1}
                        >
                          {formatValue(total)}
                        </Text>
                      )}
                      
                      {isNegative ? (
                        // Negative bar: top at zero line, extends downward
                        <View
                          style={[
                            styles.bar,
                            styles.negativeBar,
                            { 
                              height,
                              position: 'absolute',
                              top: zeroLineY,
                            },
                            isPressed && styles.barPressed,
                          ]}
                        />
                      ) : (
                        // Positive bar: bottom at zero line, extends upward
                        <View
                          style={[
                            styles.bar,
                            styles.currentBar, // Always use green for all positive bars
                            { 
                              height,
                              position: 'absolute',
                              bottom: hasNegative && hasPositive ? (barAreaHeight - zeroLineY) : 0,
                            },
                            isPressed && styles.barPressed,
                          ]}
                        />
                      )}
                    </View>
                    
                    {/* Month label */}
                    <View style={styles.monthLabelContainer}>
                      <Text style={styles.monthLabel} numberOfLines={1}>
                        {formatMonthLabel(monthData?.month || '')}
                      </Text>
                      {onBarPress && (
                        <Text style={styles.clickHint}>👆</Text>
                      )}
                    </View>
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
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
    minWidth: 50,
  },
  valueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  negativeValueLabel: {
    color: '#EF4444', // Red for negative values
  },
  barArea: {
    width: '85%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
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
  barPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  monthLabelContainer: {
    height: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 4,
  },
  monthLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  clickHint: {
    fontSize: 8,
    color: colors.textTertiary,
    marginTop: 2,
  },
});
