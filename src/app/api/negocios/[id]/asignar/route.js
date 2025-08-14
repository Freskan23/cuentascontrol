import { NextResponse } from 'next/server';
import { withAuth } from '../../../../../../middleware/auth.js';
import connectDB from '../../../../../../lib/mongodb.js';
import Negocio from '../../../../../../models/Negocio.js';
import { asignarCuentaSegura } from '../../../../../../utils/asignacionInteligente.js';
import mongoose from 'mongoose';

// POST - Asignar cuenta a negocio
export const POST = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    const { cuentaId, forzarAsignacion = false } = await req.json();
    
    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de negocio inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro para negocio
    let filtroNegocio = { _id: id };
    
    // Si no es admin, solo puede asignar a sus propios negocios
    if (req.usuario.rol !== 'administrador') {
      filtroNegocio.creadoPor = req.usuario._id;
    }
    
    // Buscar negocio
    const negocio = await Negocio.findOne(filtroNegocio);
    
    if (!negocio) {
      return NextResponse.json(
        { success: false, message: 'Negocio no encontrado' },
        { status: 404 }
      );
    }
    
    // Si se especifica una cuenta específica
    if (cuentaId) {
      if (!mongoose.Types.ObjectId.isValid(cuentaId)) {
        return NextResponse.json(
          { success: false, message: 'ID de cuenta inválido' },
          { status: 400 }
        );
      }
      
      // Verificar que la cuenta no esté ya asignada
      if (negocio.cuentasAsignadas.includes(cuentaId)) {
        return NextResponse.json(
          { success: false, message: 'Esta cuenta ya está asignada a este negocio' },
          { status: 400 }
        );
      }
      
      // Asignar cuenta específica
      const resultado = await asignarCuentaSegura(id, cuentaId, forzarAsignacion);
      
      if (!resultado.exito) {
        return NextResponse.json(
          { success: false, message: resultado.mensaje, detalles: resultado.detalles },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Cuenta asignada exitosamente',
        asignacion: resultado.asignacion
      });
    }
    
    // Asignación automática inteligente
    const resultado = await asignarCuentaSegura(id);
    
    if (!resultado.exito) {
      return NextResponse.json(
        { success: false, message: resultado.mensaje, detalles: resultado.detalles },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta asignada automáticamente',
      asignacion: resultado.asignacion
    });
    
  } catch (error) {
    console.error('Error al asignar cuenta:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});

// DELETE - Desasignar cuenta de negocio
export const DELETE = withAuth(async (req, { params }) => {
  try {
    await connectDB();
    
    const { id } = params;
    const url = new URL(req.url);
    const cuentaId = url.searchParams.get('cuentaId');
    
    // Validar ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de negocio inválido' },
        { status: 400 }
      );
    }
    
    if (!cuentaId || !mongoose.Types.ObjectId.isValid(cuentaId)) {
      return NextResponse.json(
        { success: false, message: 'ID de cuenta inválido' },
        { status: 400 }
      );
    }
    
    // Construir filtro para negocio
    let filtroNegocio = { _id: id };
    
    // Si no es admin, solo puede desasignar de sus propios negocios
    if (req.usuario.rol !== 'administrador') {
      filtroNegocio.creadoPor = req.usuario._id;
    }
    
    // Buscar y actualizar negocio
    const negocio = await Negocio.findOneAndUpdate(
      filtroNegocio,
      { $pull: { cuentasAsignadas: cuentaId } },
      { new: true }
    ).populate('cuentasAsignadas', 'email provincia disponible');
    
    if (!negocio) {
      return NextResponse.json(
        { success: false, message: 'Negocio no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta desasignada exitosamente',
      negocio
    });
    
  } catch (error) {
    console.error('Error al desasignar cuenta:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
});