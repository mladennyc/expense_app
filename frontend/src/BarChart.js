import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { colors } from './colors';
import { useLanguage } from './LanguageProvider';

export default function BarChart({ currentValue, previousValue, currentLabel, previousLabel, formatValue, maxHeight = 200, onCurrentBarPress }) {
  const { t } = useLanguage();
  // Calculate max value for scaling
  const maxValue = Math.max(currentValue, previousValue, 1); // At least 1 to avoid division by zero
  
  // Calculate bar heights (percentage of maxHeight)
  const currentHeight = maxValue > 0 ? (currentValue / maxValue) * maxHeight : 0;
  const previousHeight = maxValue > 0 ? (previousValue / maxValue) * maxHeight : 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {/* Previous Month Bar */}
        <View style={styles.barContainer}>
          <Text style={styles.valueLabel}>{formatValue(previousValue)}</Text>
          <View style={[styles.bar, styles.previousBar, { height: previousHeight }]} />
          <Text style={styles.monthLabel}>{previousLabel}</Text>
        </View>
        
        {/* Current Month Bar */}
        <Pressable
          style={styles.barContainer}
          onPress={onCurrentBarPress}
          disabled={Boolean(!onCurrentBarPress)}
        >
          {({ pressed }) => {
            const isPressed = Boolean(pressed);
            return (
            <>
              <Text style={styles.valueLabel}>{formatValue(currentValue)}</Text>
              <View
                style={[
                  styles.bar,
                  styles.currentBar,
                  { height: currentHeight },
                  isPressed === true ? styles.barPressed : null,
                ].filter(Boolean)}
              />
              <Text style={styles.monthLabel}>{currentLabel}</Text>
              {onCurrentBarPress && (
                <Text style={styles.clickHint}>👆 {t('dashboard.tap')}</Text>
              )}
            </>
            );
          }}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 10,
    ...(Platform.OS === 'web' && { cursor: 'pointer' }),
  },
  barPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  clickHint: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: 8,
    minHeight: 4,
  },
  previousBar: {
    backgroundColor: colors.chartPrevious,
  },
  currentBar: {
    backgroundColor: colors.chartCurrent,
  },
  monthLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

