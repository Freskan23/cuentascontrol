# Sistema de Gestión de Cuentas Gmail y Negocios

Un sistema completo para la gestión de cuentas Gmail y negocios con asignación inteligente, desarrollado con Next.js, MongoDB y autenticación JWT.

## 🚀 Características Principales

### Gestión de Cuentas Gmail
- ✅ Subida manual y masiva (CSV) de cuentas
- ✅ Estados de cuenta (disponible, en cooldown, bloqueada)
- ✅ Filtros por provincia y disponibilidad
- ✅ Estadísticas en tiempo real
- ✅ Validación de duplicados

### Gestión de Negocios
- ✅ CRUD completo de negocios
- ✅ Categorización por sector y provincia
- ✅ Estados de progreso (pendiente, en proceso, completado)
- ✅ Sistema de asignación de cuentas (automático/manual)
- ✅ Filtros avanzados y búsqueda

### Sistema de Autenticación
- ✅ Registro e inicio de sesión con JWT
- ✅ Roles de usuario (colaborador/administrador)
- ✅ Protección de rutas
- ✅ Middleware de autenticación

### Dashboard y Métricas
- ✅ Estadísticas de cuentas y negocios
- ✅ Resúmenes por estado
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Notificaciones en tiempo real

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (jsonwebtoken)
- **Notificaciones**: React Hot Toast
- **Iconos**: Heroicons
- **Validación**: bcryptjs para contraseñas

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Freskan23/cuentascontrol.git
cd cuentascontrol
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crea un archivo `.env.local` en la raíz del proyecto:
```env
MONGODB_URI=mongodb://localhost:27017/gestion-cuentas
# o para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/gestion-cuentas

JWT_SECRET=tu_clave_secreta_muy_segura_aqui
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🗄️ Estructura del Proyecto

```
├── src/
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   │   ├── auth/           # Autenticación
│   │   │   ├── cuentas/        # Gestión de cuentas
│   │   │   └── negocios/       # Gestión de negocios
│   │   ├── cuentas/            # Página de cuentas
│   │   ├── negocios/           # Página de negocios
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── login/              # Página de login
│   │   └── register/           # Página de registro
│   └── components/             # Componentes reutilizables
├── models/                     # Modelos de MongoDB
├── middleware/                 # Middleware de autenticación
├── utils/                      # Utilidades
└── lib/                        # Configuraciones
```

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario

### Cuentas Gmail
- `GET /api/cuentas` - Listar cuentas con filtros
- `POST /api/cuentas` - Crear nueva cuenta
- `GET /api/cuentas/[id]` - Obtener cuenta específica
- `PUT /api/cuentas/[id]` - Actualizar cuenta
- `DELETE /api/cuentas/[id]` - Eliminar cuenta
- `POST /api/cuentas/import` - Importar cuentas desde CSV

### Negocios
- `GET /api/negocios` - Listar negocios con filtros
- `POST /api/negocios` - Crear nuevo negocio
- `GET /api/negocios/[id]` - Obtener negocio específico
- `PUT /api/negocios/[id]` - Actualizar negocio
- `DELETE /api/negocios/[id]` - Eliminar negocio
- `POST /api/negocios/[id]/asignar` - Asignar cuenta a negocio
- `DELETE /api/negocios/[id]/asignar` - Desasignar cuenta

## 👥 Roles de Usuario

### Colaborador
- Gestionar sus propias cuentas y negocios
- Ver estadísticas personales
- Asignar cuentas a sus negocios

### Administrador
- Acceso completo a todas las funcionalidades
- Gestionar cuentas y negocios de todos los usuarios
- Ver estadísticas globales
- Configuración del sistema

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

### Variables de entorno para producción
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=clave_secreta_produccion
NEXT_PUBLIC_API_URL=https://tu-dominio.vercel.app
```

## 📝 Uso

1. **Registro**: Crea una cuenta de administrador o colaborador
2. **Cuentas Gmail**: Sube cuentas manualmente o via CSV
3. **Negocios**: Crea y gestiona negocios
4. **Asignación**: Asigna cuentas a negocios automática o manualmente
5. **Monitoreo**: Revisa estadísticas y progreso en el dashboard

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- GitHub: [@Freskan23](https://github.com/Freskan23)
- Proyecto: [https://github.com/Freskan23/cuentascontrol](https://github.com/Freskan23/cuentascontrol)
