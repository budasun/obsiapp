export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateUserProfile = (profile: Partial<{
  name: string;
  birthDate: string;
  lastPeriodDate: string;
  cycleLength: number;
  email: string;
}>): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!profile.name || profile.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!profile.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida';
  } else {
    const birthDate = new Date(profile.birthDate);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 18 || age > 120) {
      errors.birthDate = 'Debes tener entre 18 y 120 años';
    }
  }

  if (!profile.lastPeriodDate) {
    errors.lastPeriodDate = 'La fecha del último período es requerida';
  } else {
    const lastPeriod = new Date(profile.lastPeriodDate);
    const now = new Date();
    if (lastPeriod > now) {
      errors.lastPeriodDate = 'La fecha no puede ser futura';
    }
  }

  if (!profile.cycleLength || profile.cycleLength < 20 || profile.cycleLength > 45) {
    errors.cycleLength = 'El ciclo debe estar entre 20 y 45 días';
  }

  if (profile.email && !validateEmail(profile.email)) {
    errors.email = 'Email inválido';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};
