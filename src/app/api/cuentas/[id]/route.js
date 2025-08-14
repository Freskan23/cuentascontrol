import { NextResponse } from 'next/server';
import { withAuth } from '../../../../../middleware/auth.js';
import connectDB from '../../../../../lib/mongodb.js';
import Cuenta from '../../../../../models/Cuenta.js';
import mongoose from 'mongoose';

// GET - Obtener cuenta específica
export const GET = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cuenta inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede ver sus propias cuentas
    if (req.usuario.rol !== 'administrador') {
      filtro.propietario = req.usuario._id;
    }
    
    const cuenta = await Cuenta.findOne(filtro)
      .populate('propietario', 'nombre email');
    
    if (!cuenta) {
      return NextResponse.json(
        { success: false, message: 'Cuenta no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      cuenta
    });
    
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

// PUT - Actualizar cuenta
export const PUT = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    const datos = await req.json();
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cuenta inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede editar sus propias cuentas
    if (req.usuario.rol !== 'administrador') {
      filtro.propietario = req.usuario._id;
    }
    
    // Buscar cuenta
    const cuenta = await Cuenta.findOne(filtro);
    
    if (!cuenta) {
      return NextResponse.json(
        { success: false, message: 'Cuenta no encontrada' },
        { status: 404 }
      );
    }
    
    // Si se está cambiando el email, verificar que no exista
    if (datos.email && datos.email.toLowerCase() !== cuenta.email) {
      // Verificar que sea un email de Gmail
      if (!/^[^\s@]+@gmail\.com$/i.test(datos.email)) {
        return NextResponse.json(
          { success: false, message: 'Debe ser un email de Gmail válido' },
          { status: 400 }
        );
      }
      
      const emailExistente = await Cuenta.findOne({ 
        email: datos.email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (emailExistente) {
        return NextResponse.json(
          { success: false, message: 'Este email ya está registrado' },
          { status: 400 }
        );
      }
      
      datos.email = datos.email.toLowerCase();
    }
    
    // Campos que no se pueden modificar directamente
    delete datos._id;
    delete datos.propietario;
    delete datos.fechaCreacion;
    
    // Actualizar cuenta
    Object.assign(cuenta, datos);
    await cuenta.save();
    
    // Poblar propietario para la respuesta
    await cuenta.populate('propietario', 'nombre email');
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta actualizada exitosamente',
      cuenta
    });
    
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    
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

// DELETE - Eliminar cuenta
export const DELETE = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de cuenta inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro
    let filtro = { _id: id };
    
    // Si no es admin, solo puede eliminar sus propias cuentas
    if (req.usuario.rol !== 'administrador') {
      filtro.propietario = req.usuario._id;
    }
    
    const cuenta = await Cuenta.findOneAndDelete(filtro);
    
    if (!cuenta) {
      return NextResponse.json(
        { success: false, message: 'Cuenta no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});