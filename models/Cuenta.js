import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@gmail\.com$/, 'Debe ser un email de Gmail válido']
  },
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provincia: {
    type: String,
    required: [true, 'La provincia es obligatoria'],
    trim: true
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es obligatoria'],
    trim: true
  },
  fechaUltimaResena: {
    type: Date,
    default: null
  },
  usadaEnSAB: {
    type: Boolean,
    default: false
  },
  disponible: {
    type: Boolean,
    default: true
  },
  enCooldown: {
    type: Boolean,
    default: false
  },
  fechaFinCooldown: {
    type: Date,
    default: null
  },
  comentarios: {
    type: String,
    maxlength: [500, 'Los comentarios no pueden exceder 500 caracteres'],
    default: ''
  },
  // Información técnica adicional
  ip: {
    type: String,
    default: ''
  },
  emulador: {
    type: String,
    default: ''
  },
  tipoDispositivo: {
    type: String,
    enum: ['android', 'ios', 'desktop', 'otro'],
    default: 'android'
  },
  // Historial de uso
  historialUso: [{
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio'
    },
    fecha: {
      type: Date,
      default: Date.now
    },
    provincia: String,
    ciudad: String,
    tipoActividad: {
      type: String,
      enum: ['resena', 'trafico'],
      default: 'resena'
    },
    notas: String
  }],
  // Control de tráfico
  patronesTrafico: [{
    negocio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Negocio'
    },
    frecuencia: {
      type: String,
      enum: ['diaria', 'semanal', '3_veces_semana', 'quincenal'],
      default: 'semanal'
    },
    tipoTrafico: {
      type: String,
      enum: ['navegacion', 'navegacion_llamada', 'navegacion_web'],
      default: 'navegacion'
    },
    activo: {
      type: Boolean,
      default: true
    },
    fechaInicio: {
      type: Date,
      default: Date.now
    },
    fechaFin: Date,
    ultimoEnvio: Date,
    proximoEnvio: Date
  }],
  // Métricas de riesgo
  nivelRiesgo: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    default: 'bajo'
  },
  motivoRiesgo: {
    type: String,
    default: ''
  },
  bloqueada: {
    type: Boolean,
    default: false
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
cuentaSchema.index({ propietario: 1 });
cuentaSchema.index({ provincia: 1, ciudad: 1 });
cuentaSchema.index({ disponible: 1, enCooldown: 1 });
cuentaSchema.index({ email: 1 }, { unique: true });

// Método para verificar si la cuenta está disponible
cuentaSchema.methods.estaDisponible = function() {
  if (this.bloqueada || !this.disponible) return false;
  if (this.enCooldown && this.fechaFinCooldown && new Date() < this.fechaFinCooldown) return false;
  return true;
};

// Método para calcular días desde última reseña
cuentaSchema.methods.diasDesdeUltimaResena = function() {
  if (!this.fechaUltimaResena) return null;
  const ahora = new Date();
  const diferencia = ahora - this.fechaUltimaResena;
  return Math.floor(diferencia / (1000 * 60 * 60 * 24));
};

// Método para poner en cooldown
cuentaSchema.methods.ponerEnCooldown = function(dias = 30) {
  this.enCooldown = true;
  this.fechaFinCooldown = new Date(Date.now() + (dias * 24 * 60 * 60 * 1000));
  return this.save();
};

// Método para agregar uso al historial
cuentaSchema.methods.agregarUso = function(negocioId, provincia, ciudad, tipo = 'resena', notas = '') {
  this.historialUso.push({
    negocio: negocioId,
    provincia,
    ciudad,
    tipoActividad: tipo,
    notas
  });
  
  if (tipo === 'resena') {
    this.fechaUltimaResena = new Date();
    this.provincia = provincia;
    this.ciudad = ciudad;
  }
  
  return this.save();
};

export default mongoose.models.Cuenta || mongoose.model('Cuenta', cuentaSchema);