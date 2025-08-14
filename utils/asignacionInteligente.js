import Cuenta from '../models/Cuenta.js';
import Negocio from '../models/Negocio.js';

// Configuración de reglas de seguridad
const REGLAS_SEGURIDAD = {
  DIAS_MIN_ENTRE_RESENAS: parseInt(process.env.MIN_DAYS_BETWEEN_REVIEWS) || 7,
  DIAS_COOLDOWN_DEFAULT: parseInt(process.env.DEFAULT_COOLDOWN_DAYS) || 30,
  MAX_CUENTAS_POR_PROVINCIA: parseInt(process.env.MAX_ACCOUNTS_PER_PROVINCE) || 50,
  MAX_PATRONES_TRAFICO: parseInt(process.env.MAX_TRAFFIC_PATTERNS_PER_ACCOUNT) || 2
};

/**
 * Analiza el riesgo de usar una cuenta para un negocio específico
 */
export const analizarRiesgo = async (cuenta, negocio) => {
  const riesgos = [];
  let nivelRiesgo = 'bajo';
  
  try {
    // 1. Verificar disponibilidad básica
    if (!cuenta.estaDisponible()) {
      riesgos.push('Cuenta no disponible o en cooldown');
      nivelRiesgo = 'alto';
    }
    
    // 2. Verificar coincidencia de provincia
    if (cuenta.provincia !== negocio.provincia) {
      riesgos.push(`Diferente provincia: cuenta en ${cuenta.provincia}, negocio en ${negocio.provincia}`);
      nivelRiesgo = 'alto';
    }
    
    // 3. Verificar tiempo desde última reseña
    const diasDesdeUltima = cuenta.diasDesdeUltimaResena();
    if (diasDesdeUltima !== null && diasDesdeUltima < REGLAS_SEGURIDAD.DIAS_MIN_ENTRE_RESENAS) {
      riesgos.push(`Muy poco tiempo desde última reseña: ${diasDesdeUltima} días`);
      nivelRiesgo = nivelRiesgo === 'alto' ? 'alto' : 'medio';
    }
    
    // 4. Verificar uso previo en el mismo negocio
    const yaUsadaEnNegocio = cuenta.historialUso.some(uso => 
      uso.negocio && uso.negocio.toString() === negocio._id.toString()
    );
    if (yaUsadaEnNegocio) {
      riesgos.push('Cuenta ya utilizada en este negocio');
      nivelRiesgo = 'alto';
    }
    
    // 5. Verificar conflictos de sector en la misma zona
    const negociosMismoSector = await Negocio.find({
      sector: negocio.sector,
      provincia: negocio.provincia,
      _id: { $ne: negocio._id }
    });
    
    const usadaEnSectorCercano = cuenta.historialUso.some(uso => {
      return negociosMismoSector.some(neg => 
        neg._id.toString() === uso.negocio?.toString() &&
        uso.fecha > new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)) // últimos 90 días
      );
    });
    
    if (usadaEnSectorCercano) {
      riesgos.push(`Usada recientemente en negocio del mismo sector (${negocio.sector})`);
      nivelRiesgo = nivelRiesgo === 'alto' ? 'alto' : 'medio';
    }
    
    // 6. Verificar patrones de tráfico conflictivos
    const tieneTraficoActivo = cuenta.patronesTrafico.some(patron => 
      patron.activo && patron.negocio.toString() !== negocio._id.toString()
    );
    
    if (tieneTraficoActivo && negocio.categoria === 'SAB') {
      riesgos.push('Cuenta tiene patrones de tráfico activos en otros negocios');
      nivelRiesgo = nivelRiesgo === 'alto' ? 'alto' : 'medio';
    }
    
    // 7. Verificar saturación de provincia
    const cuentasEnProvincia = await Cuenta.countDocuments({
      provincia: negocio.provincia,
      disponible: true,
      enCooldown: false
    });
    
    if (cuentasEnProvincia > REGLAS_SEGURIDAD.MAX_CUENTAS_POR_PROVINCIA) {
      riesgos.push(`Provincia saturada: ${cuentasEnProvincia} cuentas activas`);
      nivelRiesgo = nivelRiesgo === 'alto' ? 'alto' : 'medio';
    }
    
    return {
      nivelRiesgo,
      riesgos,
      recomendacion: obtenerRecomendacion(nivelRiesgo, riesgos),
      puntuacion: calcularPuntuacion(nivelRiesgo, riesgos, diasDesdeUltima)
    };
    
  } catch (error) {
    console.error('Error al analizar riesgo:', error);
    return {
      nivelRiesgo: 'alto',
      riesgos: ['Error al analizar riesgo'],
      recomendacion: 'No usar - Error en análisis',
      puntuacion: 0
    };
  }
};

/**
 * Busca cuentas seguras para un negocio específico
 */
export const buscarCuentasSeguras = async (negocioId, cantidad = 5, propietarioId = null) => {
  try {
    const negocio = await Negocio.findById(negocioId);
    if (!negocio) {
      throw new Error('Negocio no encontrado');
    }
    
    // Construir filtro base
    const filtro = {
      disponible: true,
      bloqueada: false,
      $or: [
        { enCooldown: false },
        { fechaFinCooldown: { $lt: new Date() } }
      ]
    };
    
    // Si se especifica propietario, filtrar por él
    if (propietarioId) {
      filtro.propietario = propietarioId;
    }
    
    // Buscar cuentas candidatas
    const cuentasCandidatas = await Cuenta.find(filtro)
      .populate('propietario', 'nombre email')
      .sort({ fechaUltimaResena: 1 }) // Priorizar cuentas menos usadas
      .limit(cantidad * 3); // Buscar más para tener opciones
    
    // Analizar riesgo para cada cuenta
    const analisisPromises = cuentasCandidatas.map(async (cuenta) => {
      const analisis = await analizarRiesgo(cuenta, negocio);
      return {
        cuenta,
        analisis
      };
    });
    
    const resultados = await Promise.all(analisisPromises);
    
    // Filtrar y ordenar por seguridad
    const cuentasSeguras = resultados
      .filter(r => r.analisis.nivelRiesgo !== 'alto')
      .sort((a, b) => {
        // Ordenar por puntuación (mayor es mejor)
        return b.analisis.puntuacion - a.analisis.puntuacion;
      })
      .slice(0, cantidad);
    
    return {
      success: true,
      cuentas: cuentasSeguras,
      total: cuentasSeguras.length,
      negocio: {
        id: negocio._id,
        nombre: negocio.nombre,
        provincia: negocio.provincia,
        ciudad: negocio.ciudad,
        sector: negocio.sector
      }
    };
    
  } catch (error) {
    console.error('Error al buscar cuentas seguras:', error);
    return {
      success: false,
      error: error.message,
      cuentas: []
    };
  }
};

/**
 * Asigna una cuenta a un negocio después de verificar seguridad
 */
export const asignarCuentaSegura = async (cuentaId, negocioId, usuarioId) => {
  try {
    const cuenta = await Cuenta.findById(cuentaId);
    const negocio = await Negocio.findById(negocioId);
    
    if (!cuenta || !negocio) {
      throw new Error('Cuenta o negocio no encontrado');
    }
    
    // Verificar permisos (el usuario debe ser propietario de la cuenta o admin)
    // Esta verificación se haría en el endpoint
    
    // Analizar riesgo final
    const analisis = await analizarRiesgo(cuenta, negocio);
    
    if (analisis.nivelRiesgo === 'alto') {
      return {
        success: false,
        error: 'Asignación de alto riesgo bloqueada',
        riesgos: analisis.riesgos
      };
    }
    
    // Realizar asignación
    await negocio.asignarCuenta(cuentaId);
    
    // Actualizar estado de la cuenta
    cuenta.disponible = false;
    await cuenta.save();
    
    return {
      success: true,
      message: 'Cuenta asignada exitosamente',
      analisis
    };
    
  } catch (error) {
    console.error('Error al asignar cuenta:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Marca una reseña como completada y actualiza estados
 */
export const completarResena = async (cuentaId, negocioId, calificacion, comentario) => {
  try {
    const cuenta = await Cuenta.findById(cuentaId);
    const negocio = await Negocio.findById(negocioId);
    
    if (!cuenta || !negocio) {
      throw new Error('Cuenta o negocio no encontrado');
    }
    
    // Completar reseña en el negocio
    await negocio.completarResena(cuentaId, calificacion, comentario);
    
    // Actualizar cuenta
    await cuenta.agregarUso(negocioId, negocio.provincia, negocio.ciudad, 'resena', comentario);
    
    // Poner cuenta en cooldown
    await cuenta.ponerEnCooldown(REGLAS_SEGURIDAD.DIAS_COOLDOWN_DEFAULT);
    
    return {
      success: true,
      message: 'Reseña completada exitosamente'
    };
    
  } catch (error) {
    console.error('Error al completar reseña:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Funciones auxiliares
function obtenerRecomendacion(nivelRiesgo, riesgos) {
  switch (nivelRiesgo) {
    case 'bajo':
      return 'Seguro para usar';
    case 'medio':
      return 'Usar con precaución';
    case 'alto':
      return 'No recomendado - Alto riesgo';
    default:
      return 'Evaluar manualmente';
  }
}

function calcularPuntuacion(nivelRiesgo, riesgos, diasDesdeUltima) {
  let puntuacion = 100;
  
  // Penalizar por nivel de riesgo
  switch (nivelRiesgo) {
    case 'medio':
      puntuacion -= 30;
      break;
    case 'alto':
      puntuacion -= 70;
      break;
  }
  
  // Penalizar por cada riesgo
  puntuacion -= riesgos.length * 10;
  
  // Bonificar por tiempo desde última reseña
  if (diasDesdeUltima !== null) {
    puntuacion += Math.min(diasDesdeUltima, 90); // Máximo 90 puntos por antigüedad
  } else {
    puntuacion += 50; // Bonificación por cuenta nueva
  }
  
  return Math.max(0, puntuacion);
}