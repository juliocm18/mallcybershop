export const generatePastelColor = (seed: string): { backgroundColor: string; color: string } => {
  // Usamos el ID del usuario como semilla para generar un color consistente
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Generamos tonos pastel (valores HSL con alta luminosidad y saturación)
  const h = Math.abs(hash) % 360; // Matiz (0-359)
  const s = 70 + Math.abs(hash % 30); // Saturación (70-100%)
  const l = 80 + Math.abs(hash % 15); // Luminosidad (80-95%)

  const backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;

  // Determinamos el color del texto basado en la luminosidad del fondo
  // Si la luminosidad es mayor a 60%, el texto será oscuro (negro o casi negro), de lo contrario será claro (blanco o casi blanco)
  const textColor = l > 60 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 95%)';

  return {
    backgroundColor,
    color: textColor
  };
};
