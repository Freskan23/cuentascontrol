import mongoose from 'mongoose';

const negocioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del negocio es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  direccion: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true,
    maxlength: [200, 'La dirección no puede exceder 200 caracteres']
  },
  ciudad: {
    type: String,
    required: [true, 'La ciudad es obligatoria'],
    trim: true
  },
  provincia: {
    type: String,
    required: [true, 'La provincia es obligatoria'],
    trim: true
  },
  codigoPostal: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    enum: ['SAB', 'fisica'],
    required: [true, 'La categoría es obligatoria']
  },
  sector: {
    type: String,
    required: [true, 'El sector es obligatorio'],
    trim: true,
    enum: [
      'cerrajeria',
      'odontologia',
      'medicina',
      'veterinaria',
      'restauracion',
      'belleza',
      'fitness',
      'educacion',
      'legal',
      'inmobiliaria',
      'automocion',
      'tecnologia',
      'construccion',
      'limpieza',
      'seguridad',
      'otro'
    ]
  },
  telefono: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  sitioWeb: {
    type: String,
    trim: true
  },
  // Google Business Profile
  googlePlaceId: {
    type: String,
    trim: true
  },
  urlGoogleMaps: {
    type: String,
    trim: true
  },
  // Configuración de reseñas
  objetivoResenas: {
    type: Number,
    default: 0,
    min: 0
  },
  resenasActuales: {
    type: Number,
    default: 0,
    min: 0
  },
  calificacionPromedio: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  // Control de asignaciones
  cuentasAsignadas: [{
    cuenta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta'
    },
    fechaAsignacion: {
      type: Date,
      default: Date.now
    },
    estado: {
      type: String,
      enum: ['pendiente', 'completada', 'cancelada'],
      default: 'pendiente'
    },
    fechaCompletada: Date,
    calificacion: {
      type: Number,
      min: 1,
      max: 5
    },
    comentarioResena: String
  }],
  // Configuración de tráfico
  patronesTrafico: {
    activo: {
      type: Boolean,
      default: false
    },
    cuentasTrafico: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta'
    }],
    frecuenciaObjetivo: {
      type: String,
      enum: ['diaria', 'semanal', '3_veces_semana', 'quincenal'],
      default: 'semanal'
    }
  },
  // Métricas y análisis
  estadisticas: {
    totalResenasRecibidas: {
      type: Number,
      default: 0
    },
    totalTraficoGenerado: {
      type: Number,
      default: 0
    },
    ultimaActividad: Date,
    promedioTiempoRespuesta: Number // en días
  },
  // Configuración de riesgo
  nivelRiesgo: {
    type: String,
    enum: ['bajo', 'medio', 'alto'],
    default: 'bajo'
  },
  motivoRiesgo: {
    type: String,
    default: ''
  },
  // Observaciones y notas
  observaciones: {
    type: String,
    maxlength: [1000, 'Las observaciones no pueden exceder 1000 caracteres'],
    default: ''
  },
  // Control de estado
  activo: {
    type: Boolean,
    default: true
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para optimizar consultas
negocioSchema.index({ provincia: 1, ciudad: 1 });
negocioSchema.index({ sector: 1, categoria: 1 });
negocioSchema.index({ activo: 1 });
negocioSchema.index({ creadoPor: 1 });

// Método para verificar compatibilidad con cuenta
negocioSchema.methods.esCompatibleConCuenta = function(cuenta) {
  // Verificar provincia
  if (this.provincia !== cuenta.provincia) {
    return {
      compatible: false,
      razon: 'Diferente provincia'
    };
  }
  
  // Verificar si la cuenta ya fue usada en este negocio
  const yaUsada = this.cuentasAsignadas.some(asignacion => 
    asignacion.cuenta.toString() === cuenta._id.toString()
  );
  
  if (yaUsada) {
    return {
      compatible: false,
      razon: 'Cuenta ya utilizada en este negocio'
    };
  }
  
  return {
    compatible: true,
    razon: 'Compatible'
  };
};

// Método para asignar cuenta
negocioSchema.methods.asignarCuenta = function(cuentaId) {
  this.cuentasAsignadas.push({
    cuenta: cuentaId,
    fechaAsignacion: new Date(),
    estado: 'pendiente'
  });
  return this.save();
};

// Método para completar reseña
negocioSchema.methods.completarResena = function(cuentaId, calificacion, comentario) {
  const asignacion = this.cuentasAsignadas.find(a => 
    a.cuenta.toString() === cuentaId.toString() && a.estado === 'pendiente'
  );
  
  if (asignacion) {
    asignacion.estado = 'completada';
    asignacion.fechaCompletada = new Date();
    asignacion.calificacion = calificacion;
    asignacion.comentarioResena = comentario;
    
    this.resenasActuales += 1;
    this.estadisticas.totalResenasRecibidas += 1;
    this.estadisticas.ultimaActividad = new Date();
    
    // Recalcular calificación promedio
    const resenasCompletadas = this.cuentasAsignadas.filter(a => a.estado === 'completada');
    if (resenasCompletadas.length > 0) {
      const sumaCalificaciones = resenasCompletadas.reduce((sum, a) => sum + a.calificacion, 0);
      this.calificacionPromedio = sumaCalificaciones / resenasCompletadas.length;
    }
  }
  
  return this.save();
};

export default mongoose.models.Negocio || mongoose.model('Negocio', negocioSchema);