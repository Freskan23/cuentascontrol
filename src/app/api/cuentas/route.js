import { NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/auth.js';
import connectDB from '../../../../lib/mongodb.js';
import Cuenta from '../../../../models/Cuenta.js';
import { procesarCSVCuentas } from '../../../../utils/csvProcessor.js';

// GET - Obtener cuentas del usuario
const getHandler = async (req) => {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const provincia = url.searchParams.get('provincia') || '';
    const disponible = url.searchParams.get('disponible');
    
    // Construir filtro
    let filtro = {};
    
    // Si no es admin, solo ver sus propias cuentas
    if (req.usuario.rol !== 'administrador') {
      filtro.propietario = req.usuario._id;
    }
    
    // Filtros adicionales
    if (search) {
      filtro.email = { $regex: search, $options: 'i' };
    }
    
    if (provincia) {
      filtro.provincia = provincia;
    }
    
    if (disponible !== null && disponible !== undefined && disponible !== '') {
      filtro.disponible = disponible === 'true';
    }
    
    // Calcular skip
    const skip = (page - 1) * limit;
    
    // Obtener cuentas
    const cuentas = await Cuenta.find(filtro)
      .populate('propietario', 'nombre email')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(limit);
    
    // Contar total
    const total = await Cuenta.countDocuments(filtro);
    
    // Estadísticas adicionales
    const estadisticas = await Cuenta.aggregate([
      { $match: req.usuario.rol === 'administrador' ? {} : { propietario: req.usuario._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          disponibles: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$disponible', true] }, { $eq: ['$enCooldown', false] }] }, 1, 0]
            }
          },
          enCooldown: {
            $sum: { $cond: [{ $eq: ['$enCooldown', true] }, 1, 0] }
          },
          bloqueadas: {
            $sum: { $cond: [{ $eq: ['$bloqueada', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      cuentas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      estadisticas: estadisticas[0] || {
        total: 0,
        disponibles: 0,
        enCooldown: 0,
        bloqueadas: 0
      }
    });
    
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};

// POST - Crear nueva cuenta
const postHandler = async (req) => {
  try {
    await connectDB();
    
    const datos = await req.json();
    
    // Validar datos obligatorios
    const { email, provincia, ciudad } = datos;
    
    if (!email || !provincia || !ciudad) {
      return NextResponse.json(
        { success: false, message: 'Email, provincia y ciudad son obligatorios' },
        { status: 400 }
      );
    }
    
    // Verificar que sea un email de Gmail
    if (!/^[^\s@]+@gmail\.com$/i.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Debe ser un email de Gmail válido' },
        { status: 400 }
      );
    }
    
    // Verificar si el email ya existe
    const cuentaExistente = await Cuenta.findOne({ email: email.toLowerCase() });
    if (cuentaExistente) {
      return NextResponse.json(
        { success: false, message: 'Esta cuenta Gmail ya está registrada' },
        { status: 400 }
      );
    }
    
    // Crear nueva cuenta
    const nuevaCuenta = new Cuenta({
      ...datos,
      email: email.toLowerCase(),
      propietario: req.usuario._id
    });
    
    await nuevaCuenta.save();
    
    // Poblar propietario para la respuesta
    await nuevaCuenta.populate('propietario', 'nombre email');
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      cuenta: nuevaCuenta
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { success: false, message: 'Datos inválidos', errores },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
};

// Exportar las funciones con middleware
export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);