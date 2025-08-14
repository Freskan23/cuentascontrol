import { NextResponse } from 'next/server';
import { withAuth } from '../../../../../middleware/auth.js';
import connectDB from '../../../../../lib/mongodb.js';
import Negocio from '../../../../../models/Negocio.js';
import { asignarCuentaSegura } from '../../../../../utils/asignacionInteligente.js';
import mongoose from 'mongoose';

// GET - Obtener negocio específico
export const GET = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de negocio inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede ver sus propios negocios
    if (req.usuario.rol !== 'administrador') {
      filtro.creadoPor = req.usuario._id;
    }
    
    const negocio = await Negocio.findOne(filtro)
      .populate('creadoPor', 'nombre email')
      .populate('cuentasAsignadas', 'email provincia disponible ultimaRevision');
    
    if (!negocio) {
      return NextResponse.json(
        { success: false, message: 'Negocio no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      negocio
    });
    
  } catch (error) {
    console.error('Error al obtener negocio:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

// PUT - Actualizar negocio
export const PUT = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    const datos = await req.json();
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de negocio inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede editar sus propios negocios
    if (req.usuario.rol !== 'administrador') {
      filtro.creadoPor = req.usuario._id;
    }
    
    // Buscar negocio
    const negocio = await Negocio.findOne(filtro);
    
    if (!negocio) {
      return NextResponse.json(
        { success: false, message: 'Negocio no encontrado' },
        { status: 404 }
      );
    }
    
    // Campos que no se pueden modificar directamente
    delete datos._id;
    delete datos.creadoPor;
    delete datos.fechaCreacion;
    delete datos.cuentasAsignadas;
    
    // Actualizar negocio
    Object.assign(negocio, datos);
    await negocio.save();
    
    // Poblar campos para la respuesta
    await negocio.populate('creadoPor', 'nombre email');
    await negocio.populate('cuentasAsignadas', 'email provincia disponible ultimaRevision');
    
    return NextResponse.json({
      success: true,
      message: 'Negocio actualizado exitosamente',
      negocio
    });
    
  } catch (error) {
    console.error('Error al actualizar negocio:', error);
    
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

// DELETE - Eliminar negocio
export const DELETE = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de negocio inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede eliminar sus propios negocios
    if (req.usuario.rol !== 'administrador') {
      filtro.creadoPor = req.usuario._id;
    }
    
    const negocio = await Negocio.findOneAndDelete(filtro);
    
    if (!negocio) {
      return NextResponse.json(
        { success: false, message: 'Negocio no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Negocio eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar negocio:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});