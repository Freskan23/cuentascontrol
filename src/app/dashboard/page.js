'use client';

import { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [estadisticas, setEstadisticas] = useState({
    cuentas: {
      total: 0,
      disponibles: 0,
      enCooldown: 0,
      bloqueadas: 0
    },
    negocios: {
      total: 0,
      pendientes: 0,
      enProceso: 0,
      completados: 0,
      pausados: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar perfil del usuario
      const perfilResponse = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (perfilResponse.ok) {
        const perfilData = await perfilResponse.json();
        setUsuario(perfilData.usuario);
      }

      // Cargar estadísticas de cuentas
      const cuentasResponse = await fetch('/api/cuentas?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (cuentasResponse.ok) {
        const cuentasData = await cuentasResponse.json();
        setEstadisticas(prev => ({
          ...prev,
          cuentas: cuentasData.estadisticas
        }));
      }

      // Cargar estadísticas de negocios
      const negociosResponse = await fetch('/api/negocios?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (negociosResponse.ok) {
        const negociosData = await negociosResponse.json();
        setEstadisticas(prev => ({
          ...prev,
          negocios: negociosData.estadisticas
        }));
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const tarjetasEstadisticas = [
    {
      titulo: 'Total Cuentas',
      valor: estadisticas.cuentas.total,
      icono: UserGroupIcon,
      color: 'bg-blue-500',
      descripcion: 'Cuentas Gmail registradas'
    },
    {
      titulo: 'Cuentas Disponibles',
      valor: estadisticas.cuentas.disponibles,
      icono: CheckCircleIcon,
      color: 'bg-green-500',
      descripcion: 'Listas para usar'
    },
    {
      titulo: 'En Cooldown',
      valor: estadisticas.cuentas.enCooldown,
      icono: ClockIcon,
      color: 'bg-yellow-500',
      descripcion: 'Esperando tiempo de enfriamiento'
    },
    {
      titulo: 'Cuentas Bloqueadas',
      valor: estadisticas.cuentas.bloqueadas,
      icono: ExclamationTriangleIcon,
      color: 'bg-red-500',
      descripcion: 'Requieren atención'
    },
    {
      titulo: 'Total Negocios',
      valor: estadisticas.negocios.total,
      icono: BuildingOfficeIcon,
      color: 'bg-purple-500',
      descripcion: 'Negocios registrados'
    },
    {
      titulo: 'Negocios Completados',
      valor: estadisticas.negocios.completados,
      icono: ChartBarIcon,
      color: 'bg-indigo-500',
      descripcion: 'Campañas finalizadas'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Bienvenido, {usuario?.nombre}. Aquí tienes un resumen de tu actividad.
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetasEstadisticas.map((tarjeta, index) => {
          const Icono = tarjeta.icono;
          return (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${tarjeta.color} p-3 rounded-md`}>
                      <Icono className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {tarjeta.titulo}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {tarjeta.valor}
                      </dd>
                      <dd className="text-xs text-gray-500">
                        {tarjeta.descripcion}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado de Cuentas */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Cuentas Gmail
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Disponibles</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.cuentas.total > 0 ? (estadisticas.cuentas.disponibles / estadisticas.cuentas.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.cuentas.disponibles}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">En Cooldown</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.cuentas.total > 0 ? (estadisticas.cuentas.enCooldown / estadisticas.cuentas.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.cuentas.enCooldown}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Bloqueadas</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.cuentas.total > 0 ? (estadisticas.cuentas.bloqueadas / estadisticas.cuentas.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.cuentas.bloqueadas}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Negocios */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Estado de Negocios
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pendientes</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.negocios.total > 0 ? (estadisticas.negocios.pendientes / estadisticas.negocios.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.negocios.pendientes}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">En Proceso</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.negocios.total > 0 ? (estadisticas.negocios.enProceso / estadisticas.negocios.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.negocios.enProceso}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completados</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${estadisticas.negocios.total > 0 ? (estadisticas.negocios.completados / estadisticas.negocios.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {estadisticas.negocios.completados}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/cuentas"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-blue-500 mb-2" />
            <h4 className="font-medium text-gray-900">Gestionar Cuentas</h4>
            <p className="text-sm text-gray-600">Ver y administrar cuentas Gmail</p>
          </a>
          <a
            href="/negocios"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-purple-500 mb-2" />
            <h4 className="font-medium text-gray-900">Gestionar Negocios</h4>
            <p className="text-sm text-gray-600">Administrar campañas de negocios</p>
          </a>
          <a
            href="/trafico"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Tráfico Simulado</h4>
            <p className="text-sm text-gray-600">Configurar patrones de tráfico</p>
          </a>
          <a
            href="/alertas"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mb-2" />
            <h4 className="font-medium text-gray-900">Ver Alertas</h4>
            <p className="text-sm text-gray-600">Revisar notificaciones importantes</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;