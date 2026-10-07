import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SignaturePadProps {
  label: string;
  party: string;
  signed: boolean;
  onSign: (path: string) => void;
  onClear: () => void;
}

const HEIGHT = 120;

const hasLine = (path: string) => path.includes(' L');

/** Kanvas tanda tangan. Pakai PanResponder bawaan React Native dan SVG yang
 *  sudah terpasang, jadi tidak menambah dependensi untuk satu layar ini.
 *  Stroke aktif disimpan sebagai elemen terakhir `strokes`, jadi semua
 *  perubahan lewat updater murni (aman untuk aturan React Hooks). */
export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  party,
  signed,
  onSign,
  onClear,
}) => {
  const [strokes, setStrokes] = useState<string[]>([]);
  const [commitCount, setCommitCount] = useState(0);
  const [size, setSize] = useState({ width: 0, height: HEIGHT });
  const committedRef = useRef(0);

  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setStrokes((previous) => [...previous, `M${locationX.toFixed(1)} ${locationY.toFixed(1)}`]);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setStrokes((previous) => {
          const head = previous.slice(0, -1);
          const tail = previous[previous.length - 1];
          if (tail === undefined) return previous;
          return [...head, `${tail} L${locationX.toFixed(1)} ${locationY.toFixed(1)}`];
        });
      },
      onPanResponderRelease: () => {
        setStrokes((previous) => {
          const tail = previous[previous.length - 1] ?? '';
          // Titik tanpa gerakan (tanpa " L") dibuang, persis perilaku lama.
          return hasLine(tail) ? previous : previous.slice(0, -1);
        });
        setCommitCount((count) => count + 1);
      },
    }),
  );

  useEffect(() => {
    if (committedRef.current === commitCount) return;
    committedRef.current = commitCount;
    onSign(strokes.filter(hasLine).join(' '));
  }, [commitCount, strokes, onSign]);

  const handleClear = () => {
    setStrokes([]);
    onClear();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.party}>{party}</Text>
        </View>
        <Text style={[styles.state, signed ? styles.stateSigned : styles.stateUnsigned]}>
          {signed ? 'Bertanda tangan' : 'Belum bertanda tangan'}
        </Text>
      </View>

      <View
        style={styles.canvas}
        onLayout={(event: LayoutChangeEvent) =>
          setSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height,
          })
        }
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Kanvas tanda tangan ${party}. Sentuh dan geser untuk menandatangani.`}
      >
        {size.width > 0 && (
          <Svg width={size.width} height={size.height}>
            {strokes.filter(Boolean).map((path, index) => (
              <Path
                key={index}
                d={path}
                stroke="#1E293B"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </Svg>
        )}
        {strokes.length === 0 && (
          <Text style={styles.placeholder} pointerEvents="none">
            Tanda tangan di sini
          </Text>
        )}
      </View>

      <Text
        style={styles.clear}
        onPress={handleClear}
        accessibilityRole="button"
        accessibilityLabel={`Hapus tanda tangan ${party}`}
      >
        Hapus
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E9EC',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  party: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  state: {
    fontSize: 11,
    fontWeight: '700',
  },
  stateSigned: {
    color: '#15803D',
  },
  stateUnsigned: {
    color: '#64748B',
  },
  canvas: {
    height: HEIGHT,
    backgroundColor: '#F9F8F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDEEF0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: 12,
    color: '#94A3B8',
  },
  clear: {
    alignSelf: 'flex-end',
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    paddingVertical: 6,
  },
});
