import { NextResponse } from 'next/server';
import { withAuth } from '../../../../../middleware/auth.js';

export const GET = withAuth(async (req) => {
  try {
    // El usuario ya está disponible en req.usuario gracias al middleware
    const usuarioRespuesta = {
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      ultimoAcceso: req.usuario.ultimoAcceso,
      fechaRegistro: req.usuario.fechaRegistro,
      activo: req.usuario.activo
    };
    
    return NextResponse.json({
      success: true,
      usuario: usuarioRespuesta
    });
    
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (req) => {
  try {
    const { nombre } = await req.json();
    
    if (!nombre || nombre.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }
    
    // Actualizar nombre del usuario
    req.usuario.nombre = nombre.trim();
    await req.usuario.save();
    
    const usuarioRespuesta = {
      id: req.usuario._id,
      nombre: req.usuario.nombre,
      email: req.usuario.email,
      rol: req.usuario.rol,
      ultimoAcceso: req.usuario.ultimoAcceso,
      fechaRegistro: req.usuario.fechaRegistro
    };
    
    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      usuario: usuarioRespuesta
    });
    
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    
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