import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
              style={styles.dayColumn}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${day.dayName} tanggal ${day.dayNumber}${
                day.hasDelivery ? ', ada pengantaran' : ', tanpa pengantaran'
              }`}
            >
              <Text style={[styles.dayNameText, isSelected && styles.dayNameSelected]}>
                {day.dayName}
              </Text>

              <View style={[styles.dayNumberCircle, isSelected && styles.dayNumberCircleSelected]}>
                <Text style={[styles.dayNumberText, isSelected && styles.dayNumberTextSelected]}>
                  {day.dayNumber}
                </Text>
              </View>

              {/* Titik hanya menandai hari yang memang ada pengantaran (state nyata). */}
              {day.hasDelivery && !isSelected && <View style={styles.deliveryDot} />}
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
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 16,
    minWidth: 44,
    minHeight: 44,
  },
  dayNameText: {
    fontSize: 12,
    color: '#64748B',
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
  },
  dayNumberCircleSelected: {
    backgroundColor: '#EBA338',
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayNumberTextSelected: {
    color: '#1E293B',
    fontWeight: '700',
  },
  deliveryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#B45309',
    marginTop: 4,
  },
});
