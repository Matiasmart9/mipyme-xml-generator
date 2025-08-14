import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  UserPlus, 
  Eye, 
  EyeOff,
  Shield,
  ShieldOff,
  LogOut,
  Download
} from 'lucide-react';
import {
  crearInstitucion,
  obtenerInstituciones,
  actualizarInstitucion,
  eliminarInstitucion,
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario,
  obtenerClientes,
  crearAdministrador,
  obtenerAdministradores,
  actualizarAdministrador,
  eliminarAdministrador
} from '../firebase/services';

const AdminInstituciones = ({ currentUser, onLogout }) => {
  const [instituciones, setInstituciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [institucionParaUsuario, setInstitucionParaUsuario] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [institucionParaExportar, setInstitucionParaExportar] = useState('todas');
  const [administradores, setAdministradores] = useState([]);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editingAdminIndex, setEditingAdminIndex] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    nombre: '',
    email: '',
    password: '',
    estado: 'activo'
  });

  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
    email: '',
    estado: 'activo',
    usuarios: []
  });

  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    password: '',
    estado: 'activo'
  });

  const [showPasswords, setShowPasswords] = useState({});

  // Cargar instituciones, usuarios y administradores desde Firebase
  useEffect(() => {
    cargarInstituciones();
    // Solo cargar administradores si es admin principal
    if (currentUser.role === 'admin-principal') {
      cargarAdministradores();
    }
  }, [currentUser]);

  const cargarInstituciones = async () => {
    const resultado = await obtenerInstituciones();
    if (resultado.success) {
      // Cargar usuarios para cada institución
      const institucionesConUsuarios = await Promise.all(
        resultado.data.map(async (institucion) => {
          const usuariosResult = await obtenerUsuarios(institucion.id);
          return {
            ...institucion,
            usuarios: usuariosResult.success ? usuariosResult.data : []
          };
        })
      );
      setInstituciones(institucionesConUsuarios);
    } else {
      console.error('Error cargando instituciones:', resultado.error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      idInstitucion: '',
      direccion: '',
      telefono: '',
      email: '',
      estado: 'activo',
      usuarios: []
    });
    setEditingIndex(null);
  };

  const resetUserForm = () => {
    setNewUser({
      nombre: '',
      email: '',
      password: '',
      estado: 'activo'
    });
  };

  const generarCodigo = () => {
    const codigo = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({...formData, codigo});
  };

  const abrirFormulario = () => {
    resetForm();
    generarCodigo();
    setShowForm(true);
  };

  const editarInstitucion = (index) => {
    setFormData({...instituciones[index]});
    setEditingIndex(index);
    setShowForm(true);
  };

  const guardarInstitucion = async () => {
    if (!formData.nombre || !formData.codigo || !formData.idInstitucion) {
      alert('Nombre, código e ID Institución son requeridos');
      return;
    }

    // Verificar que el código no exista (excepto si estamos editando)
    const codigoExiste = instituciones.some((inst, index) => 
      inst.codigo === formData.codigo && index !== editingIndex
    );

    if (codigoExiste) {
      alert('El código ya existe, genere uno nuevo');
      return;
    }

    // Verificar que el ID Institución no exista (excepto si estamos editando)
    const idExiste = instituciones.some((inst, index) => 
      inst.idInstitucion === formData.idInstitucion && index !== editingIndex
    );

    if (idExiste) {
      alert('El ID Institución ya existe, ingrese uno diferente');
      return;
    }

    try {
      if (editingIndex !== null) {
        // Actualizar institución existente
        const institucionId = instituciones[editingIndex].id;
        const resultado = await actualizarInstitucion(institucionId, formData);
        
        if (resultado.success) {
          alert('Institución actualizada exitosamente');
          await cargarInstituciones(); // Recargar datos
        } else {
          alert('Error actualizando institución: ' + resultado.error);
        }
      } else {
        // Crear nueva institución
        const resultado = await crearInstitucion(formData);
        
        if (resultado.success) {
          alert('Institución creada exitosamente');
          await cargarInstituciones(); // Recargar datos
        } else {
          alert('Error creando institución: ' + resultado.error);
        }
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  const eliminarInstitucionLocal = async (index) => {
    if (window.confirm('¿Está seguro de eliminar esta institución? Se eliminarán también todos sus usuarios.')) {
      try {
        const institucionId = instituciones[index].id;
        const resultado = await eliminarInstitucion(institucionId);
        
        if (resultado.success) {
          alert('Institución eliminada exitosamente');
          await cargarInstituciones(); // Recargar datos
        } else {
          alert('Error eliminando institución: ' + resultado.error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
      }
    }
  };

  const cambiarEstadoInstitucion = async (index, nuevoEstado) => {
    try {
      const institucion = instituciones[index];
      const resultado = await actualizarInstitucion(institucion.id, { estado: nuevoEstado });
      
      if (resultado.success) {
        alert(`Institución ${nuevoEstado === 'activo' ? 'activada' : 'bloqueada'} exitosamente`);
        await cargarInstituciones(); // Recargar datos
      } else {
        alert('Error cambiando estado: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  const abrirFormularioUsuario = (institucionIndex) => {
    setInstitucionParaUsuario(institucionIndex);
    resetUserForm();
    setShowUserForm(true);
  };

  const agregarUsuario = async () => {
    if (!newUser.nombre || !newUser.email || !newUser.password) {
      alert('Todos los campos son requeridos');
      return;
    }

    // Verificar que el email no exista en ninguna institución
    const emailExiste = instituciones.some(inst => 
      inst.usuarios.some(user => user.email === newUser.email)
    );

    if (emailExiste) {
      alert('Este email ya está registrado');
      return;
    }

    try {
      const institucionId = instituciones[institucionParaUsuario].id;
      const resultado = await crearUsuario(institucionId, newUser);
      
      if (resultado.success) {
        alert('Usuario agregado exitosamente');
        await cargarInstituciones(); // Recargar datos
        setShowUserForm(false);
        resetUserForm();
      } else {
        alert('Error creando usuario: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  const eliminarUsuarioLocal = async (institucionIndex, usuarioIndex) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        const institucionId = instituciones[institucionIndex].id;
        const usuarioId = instituciones[institucionIndex].usuarios[usuarioIndex].id;
        
        const resultado = await eliminarUsuario(institucionId, usuarioId);
        
        if (resultado.success) {
          alert('Usuario eliminado exitosamente');
          await cargarInstituciones(); // Recargar datos
        } else {
          alert('Error eliminando usuario: ' + resultado.error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
      }
    }
  };

  const cambiarEstadoUsuario = async (institucionIndex, usuarioIndex, nuevoEstado) => {
    try {
      const institucionId = instituciones[institucionIndex].id;
      const usuarioId = instituciones[institucionIndex].usuarios[usuarioIndex].id;
      
      const resultado = await actualizarUsuario(institucionId, usuarioId, { estado: nuevoEstado });
      
      if (resultado.success) {
        alert(`Usuario ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        await cargarInstituciones(); // Recargar datos
      } else {
        alert('Error cambiando estado: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  const institucionesFiltradas = instituciones.filter(inst =>
    inst.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleShowPassword = (usuarioId) => {
    setShowPasswords(prev => ({
      ...prev,
      [usuarioId]: !prev[usuarioId]
    }));
  };

  const getEstadoBadge = (estado) => {
    const styles = {
      activo: 'bg-green-100 text-green-800',
      bloqueado: 'bg-red-100 text-red-800',
      inactivo: 'bg-gray-100 text-gray-800'
    };
    return `px-2 py-1 rounded-full text-xs font-medium ${styles[estado]}`;
  };


  // Función para exportar cartera de institución específica
  const exportarCarteraInstitucion = async () => {
    if (institucionParaExportar === '') {
      alert('Seleccione una institución para exportar');
      return;
    }

    alert('Generando reporte Excel... Esto puede tomar unos momentos.');

    try {
      const workbook = XLSX.utils.book_new();
      let institucionesAExportar = [];

      // Determinar qué instituciones exportar
      if (institucionParaExportar === 'todas') {
        institucionesAExportar = instituciones;
      } else {
        const institucionSeleccionada = instituciones.find(inst => inst.id === institucionParaExportar);
        if (institucionSeleccionada) {
          institucionesAExportar = [institucionSeleccionada];
        }
      }

      const todosLosClientes = [];
      const todasLasOperacionesActivas = [];
      const todasLasOperacionesCanceladas = [];
      const reporteAtrasos = [];

      for (const institucion of institucionesAExportar) {
        try {
          const clientesResult = await obtenerClientes(institucion.id);
          if (clientesResult.success && clientesResult.data.length > 0) {
            
            clientesResult.data.forEach(cliente => {
              // 1. LISTA DE CLIENTES
              todosLosClientes.push({
                'Institución': institucion.nombre,
                'ID Institución': institucion.idInstitucion,
                'Cliente': cliente.nombreCompleto,
                'Tipo Persona': cliente.idTipoPersona === '1' ? 'Física' : 'Jurídica',
                'Documento': `${cliente.idTipoDoc === '1' ? 'CI' : 'RUC'}: ${cliente.nroDoc}`,
                'Departamento': getDepartamentoLabel(cliente.departamento),
                'Ciudad': cliente.ciudad || '',
                'Dirección': cliente.direccion || '',
                'Teléfono': cliente.telefono || '',
                'Email': cliente.contactos?.find(c => c.idTipoContacto === '1')?.contacto || '',
                'Operaciones Activas': cliente.operacionesActivas?.length || 0,
                'Operaciones Canceladas': cliente.operacionesCanceladas?.length || 0
              });

              // 2. OPERACIONES ACTIVAS
              if (cliente.operacionesActivas && cliente.operacionesActivas.length > 0) {
                cliente.operacionesActivas.forEach(operacion => {
                  todasLasOperacionesActivas.push({
                    'Institución': institucion.nombre,
                    'Cliente': cliente.nombreCompleto,
                    'Documento': cliente.nroDoc,
                    'Número Operación': operacion.numeroOperacion,
                    'Tipo Operación': getTipoOperacionLabel(operacion.idTipoOperacion),
                    'Fecha Operación': operacion.fechaOperacion,
                    'Capital Original': `Gs. ${formatearMonto(operacion.capitalOriginal)}`,
                    'Capital Adeudado': `Gs. ${formatearMonto(operacion.capitalAdeudadoActual)}`,
                    'Plazo Total': operacion.plazoTotalEnPeriodos,
                    'Plazo Remanente': operacion.plazoRemanenteEnPeriodos,
                    'Días Atraso Actual': operacion.diasAtraso || 0,
                    'Días Atraso Máximo': operacion.diasAtrasoMaximo || 0,
                    'Días Atraso Promedio': operacion.diasAtrasoPromedio || 0,
                    'Estado': operacion.diasAtraso > 0 ? 'CON ATRASO' : 'AL DÍA',
                    'Moneda': operacion.idMoneda
                  });

                  // 3. REPORTE DE ATRASOS
                  if (operacion.diasAtraso > 0 || operacion.diasAtrasoMaximo > 0) {
                    reporteAtrasos.push({
                      'Institución': institucion.nombre,
                      'Cliente': cliente.nombreCompleto,
                      'Documento': cliente.nroDoc,
                      'Número Operación': operacion.numeroOperacion,
                      'Capital Adeudado': `Gs. ${formatearMonto(operacion.capitalAdeudadoActual)}`,
                      'Días Atraso Actual': operacion.diasAtraso || 0,
                      'Días Atraso Máximo': operacion.diasAtrasoMaximo || 0,
                      'Días Atraso Promedio': operacion.diasAtrasoPromedio || 0,
                      'Categoría Riesgo': operacion.diasAtraso === 0 ? 'Sin Atraso' :
                                        operacion.diasAtraso <= 30 ? 'Riesgo Bajo (1-30 días)' :
                                        operacion.diasAtraso <= 60 ? 'Riesgo Medio (31-60 días)' :
                                        operacion.diasAtraso <= 90 ? 'Riesgo Alto (61-90 días)' :
                                        'Riesgo Crítico (+90 días)'
                    });
                  }
                });
              }

              // 4. OPERACIONES CANCELADAS
              if (cliente.operacionesCanceladas && cliente.operacionesCanceladas.length > 0) {
                cliente.operacionesCanceladas.forEach(operacion => {
                  todasLasOperacionesCanceladas.push({
                    'Institución': institucion.nombre,
                    'Cliente': cliente.nombreCompleto,
                    'Documento': cliente.nroDoc,
                    'Número Operación': operacion.numeroOperacion,
                    'Tipo Operación': getTipoOperacionLabel(operacion.idTipoOperacion),
                    'Fecha Operación': operacion.fechaOperacion,
                    'Fecha Cancelación': operacion.fechaCancelacion,
                    'Capital Original': `Gs. ${formatearMonto(operacion.capitalOriginal)}`,
                    'Tipo Cancelación': operacion.idTipoCancelacion === '1' ? 'Anticipada' : 
                                      operacion.idTipoCancelacion === '2' ? 'Con Mora' : 'Normal',
                    'Días Atraso Máximo': operacion.diasAtrasoMaximo || 0,
                    'Días Atraso Promedio': operacion.diasAtrasoPromedio || 0,
                    'Moneda': operacion.idMoneda
                  });
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error obteniendo clientes de ${institucion.nombre}:`, error);
        }
      }

      // Crear las hojas del Excel
      if (todosLosClientes.length > 0) {
        const wsClientes = XLSX.utils.json_to_sheet(todosLosClientes);
        XLSX.utils.book_append_sheet(workbook, wsClientes, 'Lista de Clientes');
      }

      if (todasLasOperacionesActivas.length > 0) {
        const wsActivas = XLSX.utils.json_to_sheet(todasLasOperacionesActivas);
        XLSX.utils.book_append_sheet(workbook, wsActivas, 'Operaciones Activas');
      }

      if (todasLasOperacionesCanceladas.length > 0) {
        const wsCanceladas = XLSX.utils.json_to_sheet(todasLasOperacionesCanceladas);
        XLSX.utils.book_append_sheet(workbook, wsCanceladas, 'Operaciones Canceladas');
      }

      if (reporteAtrasos.length > 0) {
        const wsAtrasos = XLSX.utils.json_to_sheet(reporteAtrasos);
        XLSX.utils.book_append_sheet(workbook, wsAtrasos, 'Reporte de Atrasos');
      }

      // Generar archivo
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreInstitucion = institucionParaExportar === 'todas' ? 'Todas_las_Instituciones' : 
                                institucionesAExportar[0]?.nombre?.replace(/\s+/g, '_') || 'Institucion';
      const nombreArchivo = `Cartera_${nombreInstitucion}_${fechaActual}.xlsx`;
      
      XLSX.writeFile(workbook, nombreArchivo);
      
      alert(`✅ Reporte generado: ${nombreArchivo}\n\n` +
            `📊 Resumen:\n` +
            `• ${todosLosClientes.length} clientes\n` +
            `• ${todasLasOperacionesActivas.length} operaciones activas\n` +
            `• ${todasLasOperacionesCanceladas.length} operaciones canceladas\n` +
            `• ${reporteAtrasos.length} operaciones con atraso`);

      setShowExportModal(false);

    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error generando el reporte Excel.');
    }
  };

  // Funciones auxiliares para el Excel
  const getDepartamentoLabel = (departamentoId) => {
    const departamentos = [
      { id: '00', label: 'Sin especificar' },
      { id: '0', label: 'Asunción' },
      { id: '1', label: 'Concepción' },
      { id: '2', label: 'San Pedro' },
      { id: '3', label: 'Cordillera' },
      { id: '4', label: 'Guairá' },
      { id: '5', label: 'Caaguazú' },
      { id: '6', label: 'Caazapá' },
      { id: '7', label: 'Itapúa' },
      { id: '8', label: 'Misiones' },
      { id: '9', label: 'Paraguarí' },
      { id: '10', label: 'Alto Paraná' },
      { id: '11', label: 'Central' },
      { id: '12', label: 'Ñeembucú' },
      { id: '13', label: 'Amambay' },
      { id: '14', label: 'Canindeyú' },
      { id: '15', label: 'Presidente Hayes' },
      { id: '16', label: 'Boquerón' },    
      { id: '17', label: 'Alto Paraguay' }
    ];
    return departamentos.find(d => d.id === departamentoId)?.label || 'Sin especificar';
  };

  const getTipoOperacionLabel = (tipoId) => {
    const tipos = [
      { id: '1', label: 'Préstamo Personal/Consumo' },
      { id: '2', label: 'Préstamo Comercial' },
      { id: '3', label: 'Préstamo Prendario' },
      { id: '5', label: 'Préstamo Industrial o Sector Primario' },
      { id: '6', label: 'Refinanciación o Reestructuración' },
      { id: '8', label: 'Descuento de Cheques' },
      { id: '9', label: 'Descuento de Pagarés' },
      { id: '10', label: 'Descuento de Facturas (Factoring)' },
      { id: '11', label: 'A plazo' },
      { id: '95', label: 'Operación con Gestión de Cobro Judicial' }
    ];
    return tipos.find(t => t.id === tipoId)?.label || 'Desconocido';
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PY').format(monto);
  };

  // ====================== FUNCIONES PARA ADMINISTRADORES ======================

  const cargarAdministradores = async () => {
    const resultado = await obtenerAdministradores();
    if (resultado.success) {
      setAdministradores(resultado.data);
    } else {
      console.error('Error cargando administradores:', resultado.error);
    }
  };

  const resetAdminForm = () => {
    setNewAdmin({
      nombre: '',
      email: '',
      password: '',
      estado: 'activo'
    });
    setEditingAdminIndex(null);
  };

  const abrirFormularioAdmin = () => {
    resetAdminForm();
    setShowAdminForm(true);
  };

  const editarAdmin = (index) => {
    setNewAdmin({...administradores[index]});
    setEditingAdminIndex(index);
    setShowAdminForm(true);
  };

  const agregarAdmin = async () => {
    if (!newAdmin.nombre || !newAdmin.email || !newAdmin.password) {
      alert('Todos los campos son requeridos');
      return;
    }

    // Verificar que el email no exista
    const emailExiste = administradores.some(admin => admin.email === newAdmin.email);
    if (emailExiste && editingAdminIndex === null) {
      alert('Este email ya está registrado como administrador');
      return;
    }

    // Verificar que no sea el admin principal
    if (newAdmin.email === 'matiasmart7@gmail.com') {
      alert('No se puede crear un administrador con este email');
      return;
    }

    try {
      if (editingAdminIndex !== null) {
        // Actualizar admin existente
        const adminId = administradores[editingAdminIndex].id;
        const resultado = await actualizarAdministrador(adminId, newAdmin);
        
        if (resultado.success) {
          alert('Administrador actualizado exitosamente');
          await cargarAdministradores();
        } else {
          alert('Error actualizando administrador: ' + resultado.error);
        }
      } else {
        // Crear nuevo admin
        const resultado = await crearAdministrador(newAdmin);
        
        if (resultado.success) {
          alert('Administrador creado exitosamente');
          await cargarAdministradores();
        } else {
          alert('Error creando administrador: ' + resultado.error);
        }
      }

      setShowAdminForm(false);
      resetAdminForm();
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  const eliminarAdmin = async (index) => {
    if (window.confirm('¿Está seguro de eliminar este administrador?')) {
      try {
        const adminId = administradores[index].id;
        const resultado = await eliminarAdministrador(adminId);
        
        if (resultado.success) {
          alert('Administrador eliminado exitosamente');
          await cargarAdministradores();
        } else {
          alert('Error eliminando administrador: ' + resultado.error);
        }
      } catch (error) {
        alert('Error de conexión: ' + error.message);
      }
    }
  };

  const cambiarEstadoAdmin = async (index, nuevoEstado) => {
    try {
      const adminId = administradores[index].id;
      const resultado = await actualizarAdministrador(adminId, { estado: nuevoEstado });
      
      if (resultado.success) {
        alert(`Administrador ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        await cargarAdministradores();
      } else {
        alert('Error cambiando estado: ' + resultado.error);
      }
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="text-blue-600 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                <p className="text-sm text-gray-500">Gestión de Instituciones MiPymes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.nombre}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
              >
                <LogOut size={16} className="mr-2" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button
          onClick={abrirFormulario}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Nueva Institución
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center w-full sm:w-auto"
        >
          <Download size={20} className="mr-2" />
          Exportar Cartera a Excel
        </button>
        {currentUser.role === 'admin-principal' && (
          <button
            onClick={abrirFormularioAdmin}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center w-full sm:w-auto"
          >
            <Users size={20} className="mr-2" />
            Gestionar Admins
          </button>
        )}
      </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Building2 className="text-blue-600" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Instituciones</p>
                <p className="text-2xl font-semibold text-gray-900">{instituciones.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Shield className="text-green-600" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {instituciones.filter(i => i.estado === 'activo').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <ShieldOff className="text-red-600" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bloqueadas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {instituciones.filter(i => i.estado === 'bloqueado').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="text-purple-600" size={24} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {instituciones.reduce((total, inst) => total + inst.usuarios.length, 0)}
                </p>
              </div>
            </div>
          </div>
          {currentUser.role === 'admin-principal' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Shield className="text-indigo-600" size={24} />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Administradores</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {administradores.length + 1} {/* +1 por el admin principal */}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Instituciones */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Instituciones ({institucionesFiltradas.length})
            </h2>
          </div>
          
          {institucionesFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No hay instituciones registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {institucionesFiltradas.map((institucion, index) => (
                <div key={institucion.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {institucion.nombre}
                        </h3>
                        <span className={getEstadoBadge(institucion.estado)}>
                          {institucion.estado.charAt(0).toUpperCase() + institucion.estado.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>ID Institución:</strong> {institucion.idInstitucion}</p>
                          <p><strong>Código:</strong> {institucion.codigo}</p>
                        </div>
                        <div>
                          <p><strong>Email:</strong> {institucion.email}</p>
                          <p><strong>Teléfono:</strong> {institucion.telefono}</p>
                        </div>
                        <div>
                          <p><strong>Fecha de Alta:</strong> {institucion.fechaAlta}</p>
                          <p><strong>Usuarios:</strong> {institucion.usuarios.length}</p>
                        </div>
                      </div>

                      {/* Lista de Usuarios */}
                      {institucion.usuarios.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Usuarios:</h4>
                          <div className="space-y-2">
                            {institucion.usuarios.map((usuario, userIndex) => (
                              <div key={usuario.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <span className="font-medium text-sm">{usuario.nombre}</span>
                                    <span className={`ml-2 ${getEstadoBadge(usuario.estado)}`}>
                                      {usuario.estado}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600">{usuario.email}</p>
                                  <div className="flex items-center mt-1">
                                    <span className="text-xs text-gray-500 mr-2">Contraseña:</span>
                                    <span className="text-xs font-mono bg-white px-2 py-1 rounded border mr-2">
                                      {showPasswords[usuario.id] ? usuario.password : '••••••••'}
                                    </span>
                                    <button
                                      onClick={() => toggleShowPassword(usuario.id)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      {showPasswords[usuario.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                <button
                                    onClick={() => cambiarEstadoUsuario(
                                      instituciones.findIndex(i => i.id === institucion.id),
                                      userIndex,
                                      usuario.estado === 'activo' ? 'inactivo' : 'activo'
                                    )}
                                    className={`p-1 rounded ${
                                      usuario.estado === 'activo' 
                                        ? 'text-orange-600 hover:bg-orange-100' 
                                        : 'text-green-600 hover:bg-green-100'
                                    }`}
                                    title={usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                  >
                                    {usuario.estado === 'activo' ? <ShieldOff size={14} /> : <Shield size={14} />}
                                  </button>
                                  <button
                                    onClick={() => eliminarUsuarioLocal(
                                      instituciones.findIndex(i => i.id === institucion.id),
                                      userIndex
                                    )}
                                    className="p-1 rounded text-red-600 hover:bg-red-100"
                                    title="Eliminar usuario"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => abrirFormularioUsuario(instituciones.findIndex(i => i.id === institucion.id))}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 flex items-center"
                        >
                          <UserPlus size={14} className="mr-1" />
                          Usuario
                        </button>
                        <button
                          onClick={() => editarInstitucion(instituciones.findIndex(i => i.id === institucion.id))}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                        >
                          <Edit size={14} className="mr-1" />
                          Editar
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => cambiarEstadoInstitucion(
                            instituciones.findIndex(i => i.id === institucion.id),
                            institucion.estado === 'activo' ? 'bloqueado' : 'activo'
                          )}
                          className={`px-3 py-1 rounded text-sm flex items-center ${
                            institucion.estado === 'activo'
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {institucion.estado === 'activo' ? (
                            <>
                              <ShieldOff size={14} className="mr-1" />
                              Bloquear
                            </>
                          ) : (
                            <>
                              <Shield size={14} className="mr-1" />
                              Activar
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => eliminarInstitucionLocal(instituciones.findIndex(i => i.id === institucion.id))}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección de Administradores - Solo para admin principal */}
        {currentUser.role === 'admin-principal' && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="mr-2" size={20} />
                Administradores ({administradores.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {administradores.map((admin, index) => (
                <div key={admin.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {admin.nombre}
                        </h3>
                        <span className={getEstadoBadge(admin.estado)}>
                          {admin.estado.charAt(0).toUpperCase() + admin.estado.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Email:</strong> {admin.email}</p>
                        <p><strong>Fecha de Alta:</strong> {admin.fechaAlta}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500 mr-2">Contraseña:</span>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border mr-2">
                            {showPasswords[admin.id] ? admin.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => toggleShowPassword(admin.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords[admin.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => editarAdmin(index)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                      >
                        <Edit size={14} className="mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => cambiarEstadoAdmin(index, admin.estado === 'activo' ? 'inactivo' : 'activo')}
                        className={`px-3 py-1 rounded text-sm flex items-center ${
                          admin.estado === 'activo'
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {admin.estado === 'activo' ? (
                          <>
                            <ShieldOff size={14} className="mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Shield size={14} className="mr-1" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => eliminarAdmin(index)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Formulario Institución */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">
                  {editingIndex !== null ? 'Editar Institución' : 'Nueva Institución'}
                </h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nombre de la Institución *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Cooperativa San Juan"
                      />
                    </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">ID Institución *</label>
                        <input
                          type="text"
                          value={formData.idInstitucion}
                          onChange={(e) => setFormData({...formData, idInstitucion: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="001, 002, 003..."
                          maxLength="3"
                        />
                        <p className="text-xs text-gray-600 mt-1">Código único de 3 dígitos</p>
                      </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Código *</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={formData.codigo}
                          onChange={(e) => setFormData({...formData, codigo: e.target.value.toUpperCase()})}
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="CSJ001"
                        />
                        <button
                          onClick={generarCodigo}
                          className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
                        >
                          Generar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Av. Principal 123, Ciudad"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Teléfono</label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="021-123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="info@cooperativa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="bloqueado">Bloqueado</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarInstitucion}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                  >
                    {editingIndex !== null ? 'Actualizar' : 'Crear'} Institución
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Formulario Usuario */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Agregar Usuario</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={newUser.nombre}
                      onChange={(e) => setNewUser({...newUser, nombre: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="juan@cooperativa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contraseña *</label>
                    <input
                      type="text"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Contraseña temporal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={newUser.estado}
                      onChange={(e) => setNewUser({...newUser, estado: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowUserForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={agregarUsuario}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
                  >
                    Agregar Usuario
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}        
      </div>

      {/* Modal Exportar a Excel */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Download className="mr-2" size={24} />
                  Exportar Cartera a Excel
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Seleccionar Institución</label>
                    <select
                      value={institucionParaExportar}
                      onChange={(e) => setInstitucionParaExportar(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="todas">📊 Todas las Instituciones</option>
                      {instituciones.map(institucion => (
                        <option key={institucion.id} value={institucion.id}>
                          🏢 {institucion.nombre} (ID: {institucion.idInstitucion})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800 mb-2">📋 El reporte incluirá:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Lista completa de clientes</li>
                      <li>• Operaciones activas con días de atraso</li>
                      <li>• Operaciones canceladas</li>
                      <li>• Reporte detallado de atrasos por categoría</li>
                    </ul>
                  </div>

                  {institucionParaExportar !== 'todas' && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700">
                        📈 Se exportarán los datos de: <strong>
                          {instituciones.find(i => i.id === institucionParaExportar)?.nombre}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={exportarCarteraInstitucion}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <Download className="mr-2" size={16} />
                    Generar Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Formulario Administrador */}
        {showAdminForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <Users className="mr-2" size={24} />
                  {editingAdminIndex !== null ? 'Editar Administrador' : 'Nuevo Administrador'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                    <input
                      type="text"
                      value={newAdmin.nombre}
                      onChange={(e) => setNewAdmin({...newAdmin, nombre: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="admin@empresa.com"
                      disabled={newAdmin.email === 'matiasmart7@gmail.com'}
                    />
                    {newAdmin.email === 'matiasmart7@gmail.com' && (
                      <p className="text-xs text-red-600 mt-1">Este es el administrador principal y no puede ser modificado</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Contraseña *</label>
                    <input
                      type="text"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Contraseña segura"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <select
                      value={newAdmin.estado}
                      onChange={(e) => setNewAdmin({...newAdmin, estado: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-800 mb-2">🔑 Permisos de Administrador:</h3>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Gestionar todas las instituciones</li>
                      <li>• Crear y gestionar usuarios</li>
                      <li>• Exportar reportes de cartera</li>
                      <li>• Acceso completo al sistema</li>
                    </ul>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => setShowAdminForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={agregarAdmin}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
                    disabled={!newAdmin.nombre || !newAdmin.email || !newAdmin.password}
                  >
                    {editingAdminIndex !== null ? 'Actualizar' : 'Crear'} Administrador
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

    </div>
  );
};

export default AdminInstituciones;