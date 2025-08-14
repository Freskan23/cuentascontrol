import { NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/auth.js';
import connectDB from '../../../../lib/mongodb.js';
import Negocio from '../../../../models/Negocio.js';
import { procesarCSVNegocios } from '../../../../utils/csvProcessor.js';

// GET - Obtener negocios
export const GET = withAuth(async (req) => {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const search = url.searchParams.get('search') || '';
    const categoria = url.searchParams.get('categoria') || '';
    const sector = url.searchParams.get('sector') || '';
    const provincia = url.searchParams.get('provincia') || '';
    const estado = url.searchParams.get('estado') || '';
    
    // Construir filtro
    let filtro = {};
    
    // Si no es admin, solo ver negocios creados por él
    if (req.usuario.rol !== 'administrador') {
      filtro.creadoPor = req.usuario._id;
    }
    
    // Filtros adicionales
    if (search) {
      filtro.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { direccion: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (categoria) {
      filtro.categoria = categoria;
    }
    
    if (sector) {
      filtro.sector = sector;
    }
    
    if (provincia) {
      filtro.provincia = provincia;
    }
    
    if (estado) {
      filtro.estado = estado;
    }
    
    // Calcular skip
    const skip = (page - 1) * limit;
    
    // Obtener negocios
    const negocios = await Negocio.find(filtro)
      .populate('creadoPor', 'nombre email')
      .populate('cuentasAsignadas', 'email provincia disponible')
      .sort({ fechaCreacion: -1 })
      .skip(skip)
      .limit(limit);
    
    // Contar total
    const total = await Negocio.countDocuments(filtro);
    
    // Estadísticas adicionales
    const estadisticas = await Negocio.aggregate([
      { $match: req.usuario.rol === 'administrador' ? {} : { creadoPor: req.usuario._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pendientes: {
            $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] }
          },
          enProceso: {
            $sum: { $cond: [{ $eq: ['$estado', 'en_proceso'] }, 1, 0] }
          },
          completados: {
            $sum: { $cond: [{ $eq: ['$estado', 'completado'] }, 1, 0] }
          },
          pausados: {
            $sum: { $cond: [{ $eq: ['$estado', 'pausado'] }, 1, 0] }
          }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      negocios,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      estadisticas: estadisticas[0] || {
        total: 0,
        pendientes: 0,
        enProceso: 0,
        completados: 0,
        pausados: 0
      }
    });
    
  } catch (error) {
    console.error('Error al obtener negocios:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

// POST - Crear nuevo negocio
export const POST = withAuth(async (req) => {
  try {
    await connectDB();
    
    const datos = await req.json();
    
    // Validar datos obligatorios
    const { nombre, direccion, categoria, sector, provincia, ciudad } = datos;
    
    if (!nombre || !direccion || !categoria || !sector || !provincia || !ciudad) {
      return NextResponse.json(
        { success: false, message: 'Nombre, dirección, categoría, sector, provincia y ciudad son obligatorios' },
        { status: 400 }
      );
    }
    
    // Verificar si ya existe un negocio con el mismo nombre y dirección
    const negocioExistente = await Negocio.findOne({
      nombre: { $regex: `^${nombre}$`, $options: 'i' },
      direccion: { $regex: `^${direccion}$`, $options: 'i' }
    });
    
    if (negocioExistente) {
      return NextResponse.json(
        { success: false, message: 'Ya existe un negocio con el mismo nombre y dirección' },
        { status: 400 }
      );
    }
    
    // Crear nuevo negocio
    const nuevoNegocio = new Negocio({
      ...datos,
      creadoPor: req.usuario._id
    });
    
    await nuevoNegocio.save();
    
    // Poblar campos para la respuesta
    await nuevoNegocio.populate('creadoPor', 'nombre email');
    
    return NextResponse.json({
      success: true,
      message: 'Negocio creado exitosamente',
      negocio: nuevoNegocio
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error al crear negocio:', error);
    
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
});