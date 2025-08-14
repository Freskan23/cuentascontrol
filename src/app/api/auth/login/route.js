import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { generarToken } from '../../../../../middleware/auth.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();
    
    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }
    
    // Buscar usuario por email
    const usuario = await User.findOne({ email: email.toLowerCase() });
    if (!usuario) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return NextResponse.json(
        { success: false, message: 'Cuenta desactivada. Contacta al administrador' },
        { status: 401 }
      );
    }
    
    // Verificar contraseña
    const passwordValida = await usuario.compararPassword(password);
    if (!passwordValida) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Actualizar último acceso
    await usuario.actualizarUltimoAcceso();
    
    // Generar token
    const token = generarToken(usuario._id);
    
    // Respuesta sin contraseña
    const usuarioRespuesta = {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      ultimoAcceso: usuario.ultimoAcceso,
      fechaRegistro: usuario.fechaRegistro
    };
    
    return NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      usuario: usuarioRespuesta,
      token
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}