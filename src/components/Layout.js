'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Rutas que no requieren autenticación
  const rutasPublicas = ['/login', '/register'];
  const esRutaPublica = rutasPublicas.includes(pathname);

  useEffect(() => {
    verificarAutenticacion();
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (!esRutaPublica) {
          router.push('/login');
        }
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsuario(data.usuario);
        
        // Si está en ruta pública y autenticado, redirigir al dashboard
        if (esRutaPublica) {
          router.push('/dashboard');
        }
      } else {
        localStorage.removeItem('token');
        if (!esRutaPublica) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('token');
      if (!esRutaPublica) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    setUsuario(null);
    toast.success('Sesión cerrada exitosamente');
    router.push('/login');
  };

  const navegacion = [
    { nombre: 'Dashboard', href: '/dashboard', icono: HomeIcon },
    { nombre: 'Cuentas Gmail', href: '/cuentas', icono: EnvelopeIcon },
    { nombre: 'Negocios', href: '/negocios', icono: BuildingOfficeIcon },
    { nombre: 'Tráfico Simulado', href: '/trafico', icono: ChartBarIcon },
    { nombre: 'Alertas', href: '/alertas', icono: BellIcon },
  ];

  // Solo mostrar configuración a administradores
  if (usuario?.rol === 'administrador') {
    navegacion.push({ nombre: 'Configuración', href: '/configuracion', icono: Cog6ToothIcon });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Layout para rutas públicas
  if (esRutaPublica) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  // Layout para rutas privadas
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navegacion={navegacion} pathname={pathname} usuario={usuario} cerrarSesion={cerrarSesion} />
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent navegacion={navegacion} pathname={pathname} usuario={usuario} cerrarSesion={cerrarSesion} />
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente del contenido del sidebar
const SidebarContent = ({ navegacion, pathname, usuario, cerrarSesion }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">Gestión Gmail</h1>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navegacion.map((item) => {
            const esActivo = pathname === item.href;
            return (
              <Link
                key={item.nombre}
                href={item.href}
                className={`${
                  esActivo
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium border-l-4 transition-colors duration-150`}
              >
                <item.icono
                  className={`${
                    esActivo ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                />
                {item.nombre}
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Información del usuario */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-700">{usuario?.nombre}</p>
              <p className="text-xs font-medium text-gray-500 capitalize">{usuario?.rol}</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="ml-3 flex-shrink-0 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Cerrar sesión"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
};

export default Layout;