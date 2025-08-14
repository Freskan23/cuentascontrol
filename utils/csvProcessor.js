import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Procesa un archivo CSV de cuentas Gmail
 */
export const procesarCSVCuentas = async (csvContent) => {
  return new Promise((resolve, reject) => {
    const resultados = {
      exitosas: [],
      errores: [],
      duplicadas: [],
      total: 0
    };
    
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csv({
        mapHeaders: ({ header }) => header.toLowerCase().trim()
      }))
      .on('data', (row) => {
        resultados.total++;
        
        try {
          const cuenta = validarFilaCuenta(row, resultados.total);
          if (cuenta.valida) {
            resultados.exitosas.push(cuenta.datos);
          } else {
            resultados.errores.push({
              fila: resultados.total,
              errores: cuenta.errores,
              datos: row
            });
          }
        } catch (error) {
          resultados.errores.push({
            fila: resultados.total,
            errores: [error.message],
            datos: row
          });
        }
      })
      .on('end', () => {
        resolve(resultados);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Procesa un archivo CSV de negocios
 */
export const procesarCSVNegocios = async (csvContent) => {
  return new Promise((resolve, reject) => {
    const resultados = {
      exitosas: [],
      errores: [],
      duplicadas: [],
      total: 0
    };
    
    const stream = Readable.from(csvContent);
    
    stream
      .pipe(csv({
        mapHeaders: ({ header }) => header.toLowerCase().trim()
      }))
      .on('data', (row) => {
        resultados.total++;
        
        try {
          const negocio = validarFilaNegocio(row, resultados.total);
          if (negocio.valida) {
            resultados.exitosas.push(negocio.datos);
          } else {
            resultados.errores.push({
              fila: resultados.total,
              errores: negocio.errores,
              datos: row
            });
          }
        } catch (error) {
          resultados.errores.push({
            fila: resultados.total,
            errores: [error.message],
            datos: row
          });
        }
      })
      .on('end', () => {
        resolve(resultados);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Valida una fila de cuenta del CSV
 */
function validarFilaCuenta(row, numeroFila) {
  const errores = [];
  const datos = {};
  
  // Email (obligatorio)
  const email = row.email || row.gmail || row.correo;
  if (!email) {
    errores.push('Email es obligatorio');
  } else if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
    errores.push('Debe ser un email de Gmail válido');
  } else {
    datos.email = email.toLowerCase().trim();
  }
  
  // Provincia (obligatorio)
  const provincia = row.provincia || row.region;
  if (!provincia) {
    errores.push('Provincia es obligatoria');
  } else {
    datos.provincia = provincia.trim();
  }
  
  // Ciudad (obligatorio)
  const ciudad = row.ciudad || row.localidad;
  if (!ciudad) {
    errores.push('Ciudad es obligatoria');
  } else {
    datos.ciudad = ciudad.trim();
  }
  
  // Fecha última reseña (opcional)
  const fechaResena = row['fecha_ultima_resena'] || row['ultima_resena'] || row.fecha;
  if (fechaResena) {
    const fecha = new Date(fechaResena);
    if (isNaN(fecha.getTime())) {
      errores.push('Fecha de última reseña inválida');
    } else {
      datos.fechaUltimaResena = fecha;
    }
  }
  
  // Usada en SAB (opcional)
  const usadaEnSAB = row['usada_en_sab'] || row.sab || row['es_sab'];
  if (usadaEnSAB !== undefined) {
    datos.usadaEnSAB = ['si', 'sí', 'true', '1', 'yes'].includes(usadaEnSAB.toString().toLowerCase());
  }
  
  // Disponible (opcional)
  const disponible = row.disponible || row.activa || row.estado;
  if (disponible !== undefined) {
    if (disponible.toString().toLowerCase() === 'cooldown') {
      datos.disponible = false;
      datos.enCooldown = true;
    } else {
      datos.disponible = ['si', 'sí', 'true', '1', 'yes', 'disponible'].includes(disponible.toString().toLowerCase());
    }
  } else {
    datos.disponible = true;
  }
  
  // Comentarios (opcional)
  const comentarios = row.comentarios || row.notas || row.observaciones;
  if (comentarios) {
    datos.comentarios = comentarios.trim().substring(0, 500);
  }
  
  // IP (opcional)
  const ip = row.ip || row.direccion_ip;
  if (ip) {
    datos.ip = ip.trim();
  }
  
  // Emulador (opcional)
  const emulador = row.emulador || row.dispositivo;
  if (emulador) {
    datos.emulador = emulador.trim();
  }
  
  // Tipo de dispositivo (opcional)
  const tipoDispositivo = row['tipo_dispositivo'] || row.tipo || row.plataforma;
  if (tipoDispositivo) {
    const tipos = ['android', 'ios', 'desktop', 'otro'];
    const tipo = tipoDispositivo.toLowerCase().trim();
    if (tipos.includes(tipo)) {
      datos.tipoDispositivo = tipo;
    }
  }
  
  return {
    valida: errores.length === 0,
    errores,
    datos
  };
}

/**
 * Valida una fila de negocio del CSV
 */
function validarFilaNegocio(row, numeroFila) {
  const errores = [];
  const datos = {};
  
  // Nombre (obligatorio)
  const nombre = row.nombre || row.negocio;
  if (!nombre) {
    errores.push('Nombre del negocio es obligatorio');
  } else {
    datos.nombre = nombre.trim().substring(0, 100);
  }
  
  // Dirección (obligatorio)
  const direccion = row.direccion || row.address;
  if (!direccion) {
    errores.push('Dirección es obligatoria');
  } else {
    datos.direccion = direccion.trim().substring(0, 200);
  }
  
  // Ciudad (obligatorio)
  const ciudad = row.ciudad || row.localidad;
  if (!ciudad) {
    errores.push('Ciudad es obligatoria');
  } else {
    datos.ciudad = ciudad.trim();
  }
  
  // Provincia (obligatorio)
  const provincia = row.provincia || row.region;
  if (!provincia) {
    errores.push('Provincia es obligatoria');
  } else {
    datos.provincia = provincia.trim();
  }
  
  // Categoría (obligatorio)
  const categoria = row.categoria || row.tipo;
  if (!categoria) {
    errores.push('Categoría es obligatoria');
  } else {
    const cat = categoria.toLowerCase().trim();
    if (['sab', 'fisica'].includes(cat)) {
      datos.categoria = cat;
    } else {
      errores.push('Categoría debe ser "SAB" o "fisica"');
    }
  }
  
  // Sector (obligatorio)
  const sector = row.sector || row.rubro || row.industria;
  if (!sector) {
    errores.push('Sector es obligatorio');
  } else {
    const sectoresValidos = [
      'cerrajeria', 'odontologia', 'medicina', 'veterinaria', 'restauracion',
      'belleza', 'fitness', 'educacion', 'legal', 'inmobiliaria',
      'automocion', 'tecnologia', 'construccion', 'limpieza', 'seguridad', 'otro'
    ];
    
    const sect = sector.toLowerCase().trim();
    if (sectoresValidos.includes(sect)) {
      datos.sector = sect;
    } else {
      datos.sector = 'otro';
    }
  }
  
  // Código postal (opcional)
  const codigoPostal = row['codigo_postal'] || row.cp || row.zip;
  if (codigoPostal) {
    datos.codigoPostal = codigoPostal.toString().trim();
  }
  
  // Teléfono (opcional)
  const telefono = row.telefono || row.phone;
  if (telefono) {
    datos.telefono = telefono.toString().trim();
  }
  
  // Email (opcional)
  const email = row.email || row.correo;
  if (email) {
    if (/^\S+@\S+\.\S+$/.test(email.trim())) {
      datos.email = email.toLowerCase().trim();
    } else {
      errores.push('Email del negocio inválido');
    }
  }
  
  // Sitio web (opcional)
  const sitioWeb = row['sitio_web'] || row.web || row.website;
  if (sitioWeb) {
    datos.sitioWeb = sitioWeb.trim();
  }
  
  // Google Place ID (opcional)
  const googlePlaceId = row['google_place_id'] || row.place_id;
  if (googlePlaceId) {
    datos.googlePlaceId = googlePlaceId.trim();
  }
  
  // URL Google Maps (opcional)
  const urlGoogleMaps = row['url_google_maps'] || row.maps_url;
  if (urlGoogleMaps) {
    datos.urlGoogleMaps = urlGoogleMaps.trim();
  }
  
  // Objetivo reseñas (opcional)
  const objetivoResenas = row['objetivo_resenas'] || row.objetivo;
  if (objetivoResenas) {
    const objetivo = parseInt(objetivoResenas);
    if (!isNaN(objetivo) && objetivo >= 0) {
      datos.objetivoResenas = objetivo;
    }
  }
  
  // Observaciones (opcional)
  const observaciones = row.observaciones || row.notas || row.comentarios;
  if (observaciones) {
    datos.observaciones = observaciones.trim().substring(0, 1000);
  }
  
  return {
    valida: errores.length === 0,
    errores,
    datos
  };
}

/**
 * Genera un CSV de ejemplo para cuentas
 */
export const generarCSVEjemploCuentas = () => {
  const headers = [
    'email',
    'provincia',
    'ciudad',
    'fecha_ultima_resena',
    'usada_en_sab',
    'disponible',
    'comentarios',
    'ip',
    'emulador',
    'tipo_dispositivo'
  ];
  
  const ejemplos = [
    [
      'ejemplo1@gmail.com',
      'Madrid',
      'Móstoles',
      '2024-07-15',
      'Si',
      'Si',
      'Cuenta principal para zona sur',
      '192.168.1.100',
      'BlueStacks',
      'android'
    ],
    [
      'ejemplo2@gmail.com',
      'Barcelona',
      'Barcelona',
      '',
      'No',
      'Cooldown',
      'En descanso hasta septiembre',
      '',
      '',
      'ios'
    ]
  ];
  
  let csv = headers.join(',') + '\n';
  ejemplos.forEach(fila => {
    csv += fila.map(campo => `"${campo}"`).join(',') + '\n';
  });
  
  return csv;
};

/**
 * Genera un CSV de ejemplo para negocios
 */
export const generarCSVEjemploNegocios = () => {
  const headers = [
    'nombre',
    'direccion',
    'ciudad',
    'provincia',
    'categoria',
    'sector',
    'codigo_postal',
    'telefono',
    'email',
    'sitio_web',
    'objetivo_resenas',
    'observaciones'
  ];
  
  const ejemplos = [
    [
      'Cerrajería Express Madrid',
      'Calle Mayor 123',
      'Madrid',
      'Madrid',
      'SAB',
      'cerrajeria',
      '28001',
      '911234567',
      'info@cerrajeriamadrid.com',
      'www.cerrajeriamadrid.com',
      '20',
      'Cliente premium, prioridad alta'
    ],
    [
      'Clínica Dental Barcelona',
      'Passeig de Gràcia 456',
      'Barcelona',
      'Barcelona',
      'fisica',
      'odontologia',
      '08007',
      '934567890',
      'contacto@clinicabcn.com',
      '',
      '15',
      'Nuevo cliente, necesita posicionamiento'
    ]
  ];
  
  let csv = headers.join(',') + '\n';
  ejemplos.forEach(fila => {
    csv += fila.map(campo => `"${campo}"`).join(',') + '\n';
  });
  
  return csv;
};