import React, { useState, useEffect } from 'react';
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
  LogOut
} from 'lucide-react';
import {
  crearInstitucion,
  obtenerInstituciones,
  actualizarInstitucion,
  eliminarInstitucion,
  crearUsuario,
  obtenerUsuarios,
  actualizarUsuario,
  eliminarUsuario
} from '../firebase/services';

const AdminInstituciones = ({ currentUser, onLogout }) => {
  const [instituciones, setInstituciones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [institucionParaUsuario, setInstitucionParaUsuario] = useState(null);

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

  // Cargar instituciones y usuarios desde Firebase
  useEffect(() => {
    cargarInstituciones();
  }, []);

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
          <div className="flex items-center space-x-4">
            <button
              onClick={abrirFormulario}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus size={20} className="mr-2" />
              Nueva Institución
            </button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
    </div>
  );
};

export default AdminInstituciones;