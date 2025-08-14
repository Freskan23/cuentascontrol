import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import connectDB from '../lib/mongodb.js';

export const verificarToken = async (req) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'Token no proporcionado', status: 401 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    await connectDB();
    const usuario = await User.findById(decoded.userId).select('-password');
    
    if (!usuario || !usuario.activo) {
      return { error: 'Usuario no encontrado o inactivo', status: 401 };
    }

    return { usuario };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Token inválido', status: 401 };
    }
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expirado', status: 401 };
    }
    return { error: 'Error de autenticación', status: 500 };
  }
};

export const verificarAdmin = async (req) => {
  const authResult = await verificarToken(req);
  
  if (authResult.error) {
    return authResult;
  }
  
  if (authResult.usuario.rol !== 'administrador') {
    return { error: 'Acceso denegado. Se requieren permisos de administrador', status: 403 };
  }
  
  return authResult;
};

export const generarToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Middleware para Next.js API routes
export const withAuth = (handler) => {
  return async (req, res) => {
    const authResult = await verificarToken(req);
    
    if (authResult.error) {
      return res.status(authResult.status).json({ 
        success: false, 
        message: authResult.error 
      });
    }
    
    req.usuario = authResult.usuario;
    return handler(req, res);
  };
};

export const withAdminAuth = (handler) => {
  return async (req, res) => {
    const authResult = await verificarAdmin(req);
    
    if (authResult.error) {
      return res.status(authResult.status).json({ 
        success: false, 
        message: authResult.error 
      });
    }
    
    req.usuario = authResult.usuario;
    return handler(req, res);
  };
};