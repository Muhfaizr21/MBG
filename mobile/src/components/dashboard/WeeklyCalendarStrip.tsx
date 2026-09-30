import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { DayItem } from '../../types/role';

interface WeeklyCalendarStripProps {
  days: DayItem[];
  selectedDayId: string;
  onSelectDay: (day: DayItem) => void;
}

export const WeeklyCalendarStrip: React.FC<WeeklyCalendarStripProps> = ({
  days,
  selectedDayId,
  onSelectDay,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.stripRow}>
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;
          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayColumn,
                isSelected && styles.dayColumnSelected,
              ]}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayNameText,
                  isSelected && styles.dayNameSelected,
                ]}
              >
                {day.dayName}
              </Text>

              <View
                style={[
                  styles.dayNumberCircle,
                  isSelected && styles.dayNumberCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumberText,
                    isSelected && styles.dayNumberTextSelected,
                  ]}
                >
                  {day.dayNumber}
                </Text>
              </View>

              {day.hasDelivery && !isSelected && (
                <View style={styles.deliveryDot} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 20,
    minWidth: 42,
  },
  dayColumnSelected: {
    // optional styling for column
  },
  dayNameText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 6,
  },
  dayNameSelected: {
    color: '#1E293B',
    fontWeight: '700',
  },
  dayNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayNumberCircleSelected: {
    backgroundColor: '#EBA338', // Golden amber matching reference
    shadowColor: '#EBA338',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deliveryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBA338',
    marginTop: 4,
  },
});
