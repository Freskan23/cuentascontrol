'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NegociosPage = () => {
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completados: 0
  });
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    sector: '',
    provincia: '',
    estado: ''
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [negocioEditando, setNegocioEditando] = useState(null);
  const [mostrarAsignacion, setMostrarAsignacion] = useState(false);
  const [negocioAsignacion, setNegocioAsignacion] = useState(null);

  useEffect(() => {
    cargarNegocios();
  }, [filtros, paginacion.page]);

  const cargarNegocios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: paginacion.page.toString(),
        limit: paginacion.limit.toString(),
        ...filtros
      });

      const response = await fetch(`/api/negocios?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNegocios(data.negocios);
        setPaginacion(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
        setEstadisticas(data.estadisticas);
      } else {
        toast.error('Error al cargar los negocios');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginacion(prev => ({ ...prev, page: 1 }));
  };

  const eliminarNegocio = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este negocio?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/negocios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Negocio eliminado exitosamente');
        cargarNegocios();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al eliminar el negocio');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const getEstadoBadge = (negocio) => {
    const { resenasActuales, resenasObjetivo } = negocio.configuracionResenas;
    
    if (resenasActuales >= resenasObjetivo) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Completado
        </span>
      );
    }
    if (negocio.cuentasAsignadas && negocio.cuentasAsignadas.length > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <PlayIcon className="w-3 h-3 mr-1" />
          En Proceso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ClockIcon className="w-3 h-3 mr-1" />
        Pendiente
      </span>
    );
  };

  const getProgresoResenas = (negocio) => {
    const { resenasActuales, resenasObjetivo } = negocio.configuracionResenas;
    const porcentaje = Math.min((resenasActuales / resenasObjetivo) * 100, 100);
    return { porcentaje, actual: resenasActuales, objetivo: resenasObjetivo };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Negocios</h1>
            <p className="mt-1 text-sm text-gray-600">
              Administra los negocios y sus campañas de reseñas
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Nuevo Negocio
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-medium text-gray-900">{estadisticas.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 p-3 rounded-md">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                  <dd className="text-lg font-medium text-gray-900">{estadisticas.pendientes}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <PlayIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">En Proceso</dt>
                  <dd className="text-lg font-medium text-gray-900">{estadisticas.enProceso}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completados</dt>
                  <dd className="text-lg font-medium text-gray-900">{estadisticas.completados}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar por nombre..."
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Filtrar por categoría..."
              value={filtros.categoria}
              onChange={(e) => handleFiltroChange('categoria', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector
            </label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Filtrar por sector..."
              value={filtros.sector}
              onChange={(e) => handleFiltroChange('sector', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <input
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Filtrar por provincia..."
              value={filtros.provincia}
              onChange={(e) => handleFiltroChange('provincia', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_proceso">En Proceso</option>
              <option value="completado">Completados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de negocios */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Negocios</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : negocios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron negocios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Negocio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuentas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {negocios.map((negocio) => {
                  const progreso = getProgresoResenas(negocio);
                  return (
                    <tr key={negocio._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {negocio.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {negocio.categoria} • {negocio.sector}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {negocio.ciudad}, {negocio.provincia}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(negocio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {progreso.actual}/{progreso.objetivo}
                              </span>
                              <span className="text-gray-500">
                                {Math.round(progreso.porcentaje)}%
                              </span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progreso.porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {negocio.cuentasAsignadas ? negocio.cuentasAsignadas.length : 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setNegocioAsignacion(negocio);
                              setMostrarAsignacion(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Asignar cuentas"
                          >
                            <UserGroupIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setNegocioEditando(negocio);
                              setMostrarFormulario(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => eliminarNegocio(negocio._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {paginacion.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPaginacion(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={paginacion.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPaginacion(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={paginacion.page === paginacion.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(paginacion.page - 1) * paginacion.limit + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(paginacion.page * paginacion.limit, paginacion.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{paginacion.total}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={paginacion.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, paginacion.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginacion(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          paginacion.page === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPaginacion(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={paginacion.page === paginacion.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {mostrarFormulario && (
        <FormularioNegocio
          negocio={negocioEditando}
          onClose={() => {
            setMostrarFormulario(false);
            setNegocioEditando(null);
          }}
          onSuccess={() => {
            cargarNegocios();
            setMostrarFormulario(false);
            setNegocioEditando(null);
          }}
        />
      )}

      {mostrarAsignacion && (
        <AsignacionCuentas
          negocio={negocioAsignacion}
          onClose={() => {
            setMostrarAsignacion(false);
            setNegocioAsignacion(null);
          }}
          onSuccess={() => {
            cargarNegocios();
            setMostrarAsignacion(false);
            setNegocioAsignacion(null);
          }}
        />
      )}
    </div>
  );
};

// Componente del formulario de negocio
const FormularioNegocio = ({ negocio, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    nombre: negocio?.nombre || '',
    direccion: negocio?.direccion || '',
    categoria: negocio?.categoria || '',
    sector: negocio?.sector || '',
    provincia: negocio?.provincia || '',
    ciudad: negocio?.ciudad || '',
    telefono: negocio?.telefono || '',
    email: negocio?.email || '',
    sitioWeb: negocio?.sitioWeb || '',
    googleBusinessProfile: {
      url: negocio?.googleBusinessProfile?.url || '',
      placeId: negocio?.googleBusinessProfile?.placeId || ''
    },
    configuracionResenas: {
      resenasObjetivo: negocio?.configuracionResenas?.resenasObjetivo || 5,
      calificacionPromedio: negocio?.configuracionResenas?.calificacionPromedio || 4.5
    },
    observaciones: negocio?.observaciones || ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('googleBusinessProfile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        googleBusinessProfile: {
          ...prev.googleBusinessProfile,
          [field]: value
        }
      }));
    } else if (name.startsWith('configuracionResenas.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        configuracionResenas: {
          ...prev.configuracionResenas,
          [field]: field === 'resenasObjetivo' ? parseInt(value) || 0 : parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const url = negocio ? `/api/negocios/${negocio._id}` : '/api/negocios';
      const method = negocio ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.message || 'Error al guardar el negocio');
        if (data.errores) {
          data.errores.forEach(error => toast.error(error));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {negocio ? 'Editar Negocio' : 'Nuevo Negocio'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Restaurante El Buen Sabor"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <input
                  type="text"
                  name="categoria"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Restaurante"
                  value={formData.categoria}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sector *
                </label>
                <input
                  type="text"
                  name="sector"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Gastronomía"
                  value={formData.sector}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+34 123 456 789"
                  value={formData.telefono}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección *
              </label>
              <input
                type="text"
                name="direccion"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calle Mayor 123"
                value={formData.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia *
                </label>
                <input
                  type="text"
                  name="provincia"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Madrid"
                  value={formData.provincia}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="ciudad"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Madrid"
                  value={formData.ciudad}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contacto@negocio.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="url"
                  name="sitioWeb"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://www.negocio.com"
                  value={formData.sitioWeb}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Google Business Profile
              </label>
              <input
                type="url"
                name="googleBusinessProfile.url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://maps.google.com/..."
                value={formData.googleBusinessProfile.url}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reseñas Objetivo
                </label>
                <input
                  type="number"
                  name="configuracionResenas.resenasObjetivo"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuracionResenas.resenasObjetivo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calificación Promedio Objetivo
                </label>
                <input
                  type="number"
                  name="configuracionResenas.calificacionPromedio"
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.configuracionResenas.calificacionPromedio}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre el negocio..."
                value={formData.observaciones}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (negocio ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Componente de asignación de cuentas
const AsignacionCuentas = ({ negocio, onClose, onSuccess }) => {
  const [cuentasDisponibles, setCuentasDisponibles] = useState([]);
  const [cuentasAsignadas, setCuentasAsignadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [asignando, setAsignando] = useState(false);

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Cargar cuentas disponibles
      const responseDisponibles = await fetch('/api/cuentas?disponible=true&limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (responseDisponibles.ok) {
        const dataDisponibles = await responseDisponibles.json();
        setCuentasDisponibles(dataDisponibles.cuentas);
      }

      // Cargar cuentas ya asignadas al negocio
      if (negocio.cuentasAsignadas && negocio.cuentasAsignadas.length > 0) {
        setCuentasAsignadas(negocio.cuentasAsignadas);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  const asignarCuentaAutomatica = async () => {
    setAsignando(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/negocios/${negocio._id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ automatico: true })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.message || 'Error al asignar cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setAsignando(false);
    }
  };

  const asignarCuentaManual = async (cuentaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/negocios/${negocio._id}/asignar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cuentaId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        cargarCuentas();
      } else {
        toast.error(data.message || 'Error al asignar cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const desasignarCuenta = async (cuentaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/negocios/${negocio._id}/asignar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cuentaId })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        cargarCuentas();
      } else {
        toast.error(data.message || 'Error al desasignar cuenta');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Asignar Cuentas - {negocio.nombre}
            </h3>
            <button
              onClick={asignarCuentaAutomatica}
              disabled={asignando}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {asignando ? 'Asignando...' : 'Asignación Automática'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cuentas Disponibles */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Cuentas Disponibles</h4>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {cuentasDisponibles.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay cuentas disponibles</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {cuentasDisponibles.map((cuenta) => (
                        <div key={cuenta._id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cuenta.email}</div>
                            <div className="text-xs text-gray-500">{cuenta.ciudad}, {cuenta.provincia}</div>
                          </div>
                          <button
                            onClick={() => asignarCuentaManual(cuenta._id)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Asignar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cuentas Asignadas */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Cuentas Asignadas</h4>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {cuentasAsignadas.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No hay cuentas asignadas</p>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {cuentasAsignadas.map((cuenta) => (
                        <div key={cuenta._id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cuenta.email}</div>
                            <div className="text-xs text-gray-500">{cuenta.ciudad}, {cuenta.provincia}</div>
                          </div>
                          <button
                            onClick={() => desasignarCuenta(cuenta._id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NegociosPage;