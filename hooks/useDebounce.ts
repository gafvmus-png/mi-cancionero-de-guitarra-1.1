
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Actualizar el valor debounced después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancelar el timeout si el valor cambia (o el delay o el componente se desmonta)
    // Así solo se ejecuta el último timeout programado
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}