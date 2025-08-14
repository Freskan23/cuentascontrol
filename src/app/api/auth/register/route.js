import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb.js';
import User from '../../../../../models/User.js';
import { generarToken } from '../../../../../middleware/auth.js';

export async function POST(request) {
  try {
    await connectDB();
    
    const { nombre, email, password, rol } = await request.json();
    
    // Validaciones básicas
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }
    
    // Verificar si el email ya existe
    const usuarioExistente = await User.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, message: 'El email ya está registrado' },
        { status: 400 }
      );
    }
    
    // Validar rol
    const rolesValidos = ['colaborador', 'administrador'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'colaborador';
    
    // Crear nuevo usuario
    const nuevoUsuario = new User({
      nombre: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      rol: rolFinal
    });
    
    await nuevoUsuario.save();
    
    // Generar token
    const token = generarToken(nuevoUsuario._id);
    
    // Respuesta sin contraseña
    const usuarioRespuesta = {
      id: nuevoUsuario._id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      fechaRegistro: nuevoUsuario.fechaRegistro
    };
    
    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      usuario: usuarioRespuesta,
      token
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error en registro:', error);
    
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
}