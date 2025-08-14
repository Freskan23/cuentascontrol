import { NextResponse } from 'next/server';
import { withAuth } from '../../../../../middleware/auth.js';
import connectDB from '../../../../../lib/mongodb.js';
import Cuenta from '../../../../../models/Cuenta.js';
import { procesarCSVCuentas } from '../../../../../utils/csvProcessor.js';

export const POST = withAuth(async (req) => {
  try {
    await connectDB();
    
    const formData = await req.formData();
    const archivo = formData.get('archivo');
    
    if (!archivo) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }
    
    // Verificar que sea un archivo CSV
    if (!archivo.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, message: 'El archivo debe ser un CSV' },
        { status: 400 }
      );
    }
    
    // Leer contenido del archivo
    const contenido = await archivo.text();
    
    // Procesar CSV
    const resultado = await procesarCSVCuentas(contenido);
    
    // Verificar duplicados en la base de datos
    const emailsExitosos = resultado.exitosas.map(cuenta => cuenta.email);
    const cuentasExistentes = await Cuenta.find({
      email: { $in: emailsExitosos }
    }).select('email');
    
    const emailsExistentes = new Set(cuentasExistentes.map(c => c.email));
    
    // Separar cuentas nuevas de duplicadas
    const cuentasNuevas = [];
    const cuentasDuplicadas = [];
    
    resultado.exitosas.forEach(cuenta => {
      if (emailsExistentes.has(cuenta.email)) {
        cuentasDuplicadas.push(cuenta);
      } else {
        cuentasNuevas.push({
          ...cuenta,
          propietario: req.usuario._id
        });
      }
    });
    
    // Insertar cuentas nuevas
    let cuentasCreadas = [];
    if (cuentasNuevas.length > 0) {
      cuentasCreadas = await Cuenta.insertMany(cuentasNuevas);
    }
    
    // Preparar respuesta
    const resumen = {
      totalProcesadas: resultado.total,
      exitosas: cuentasCreadas.length,
      duplicadas: cuentasDuplicadas.length,
      errores: resultado.errores.length,
      detalles: {
        creadas: cuentasCreadas.map(c => ({
          email: c.email,
          provincia: c.provincia,
          ciudad: c.ciudad
        })),
        duplicadas: cuentasDuplicadas.map(c => ({
          email: c.email,
          razon: 'Email ya existe en la base de datos'
        })),
        errores: resultado.errores
      }
    };
    
    return NextResponse.json({
      success: true,
      message: `Importación completada: ${cuentasCreadas.length} cuentas creadas, ${cuentasDuplicadas.length} duplicadas, ${resultado.errores.length} errores`,
      resumen
    });
    
  } catch (error) {
    console.error('Error al importar cuentas:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el archivo CSV' },
      { status: 500 }
    );
  }
});