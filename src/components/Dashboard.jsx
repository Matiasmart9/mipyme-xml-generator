import React, { useState, useEffect } from 'react';
import { Download, Plus, Trash2, User, FileText, Search, Edit, Phone, Mail } from 'lucide-react';
import OperacionesActivas from './OperacionesActivas';
import OperacionesCanceladas from './OperacionesCanceladas';
import {
  guardarCliente,
  obtenerClientes,
  actualizarCliente,
  eliminarCliente
} from '../firebase/services';

const Dashboard = ({ currentUser, onLogout }) => {
  const [institucionId, setInstitucionId] = useState(currentUser?.institucionId || '000');
  const [personas, setPersonas] = useState([]);
  const [globalOperationCounter, setGlobalOperationCounter] = useState(1);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState(null);
  
  const [currentPerson, setCurrentPerson] = useState({
    nombreCompleto: '',
    razonSocial: '',
    genero: 'M',
    idNacionalidad: 'PY',
    idEstadoCivil: '1',
    fechaNacimiento: '',
    idTipoPersona: '1',
    idSectorEconomico: '5',
    idTipoDoc: '1',
    idPaisDoc: 'PY',
    nroDoc: '',
    fechaVencimientoDoc: '',
    direccion: '',
    ciudad: '',
    barrio: '',
    telefono: '',
    cargoTrabajo: '',
    salario: '',
    lugarTrabajo: '',
    contactos: [],
    operacionesActivas: [],
    operacionesCanceladas: []
  });

  const [newContact, setNewContact] = useState({
    contacto: '',
    idTipoContacto: '1'
  });

  // Funciones auxiliares para mover operaciones
  const determinarTipoCancelacion = (operacion) => {
    if (!operacion.cuotas || operacion.cuotas.length === 0) return '3';

    let tuvoAtraso = false;
    let canceloAnticipada = false;
    let ultimaFechaPago = null;

    operacion.cuotas.forEach(cuota => {
      if (cuota.diasAtraso > 0) {
        tuvoAtraso = true;
      }
      if (cuota.fechaPago && (!ultimaFechaPago || cuota.fechaPago > ultimaFechaPago)) {
        ultimaFechaPago = cuota.fechaPago;
      }
    });

    // Verificar si canceló anticipadamente
    if (ultimaFechaPago) {
      const ultimaCuotaVencimiento = new Date(operacion.cuotas[operacion.cuotas.length - 1].fechaVencimiento);
      const fechaCancel = new Date(ultimaFechaPago);
      if (fechaCancel < ultimaCuotaVencimiento) {
        canceloAnticipada = true;
      }
    }

    if (canceloAnticipada) return '1'; // Anticipada
    if (tuvoAtraso) return '2'; // Con Mora
    return '3'; // Normal
  };

  const obtenerUltimaFechaPago = (cuotas) => {
    if (!cuotas || cuotas.length === 0) return '';
    
    let ultimaFecha = '';
    cuotas.forEach(cuota => {
      if (cuota.fechaPago && cuota.fechaPago > ultimaFecha) {
        ultimaFecha = cuota.fechaPago;
      }
    });
    return ultimaFecha;
  };

  const estadosCiviles = [
    { id: '1', label: 'Casado/a' },
    { id: '2', label: 'Soltero/a' },
    { id: '3', label: 'Concubinato' },
    { id: '4', label: 'Divorciado/a' },
    { id: '5', label: 'Viudo/a' },
    { id: '6', label: 'Sin Datos' }
  ];

  const nacionalidades = [
    { id: 'PY', label: 'Paraguaya' },
    { id: 'BR', label: 'Brasil' }
  ];

  const sectoresEconomicos = [
    { id: '1', label: 'Profesional Independiente' },
    { id: '2', label: 'Comerciante' },
    { id: '3', label: 'Industrial' },
    { id: '4', label: 'Agropecuario' },
    { id: '5', label: 'Empleado Asalariado' },
    { id: '6', label: 'Otro' }
  ];

  const tiposDocumento = [
    { id: '1', label: 'CI' },
    { id: '4', label: 'RUC' }
  ];

  const tiposContacto = [
    { id: '1', label: 'Correo' },
    { id: '2', label: 'Número' }
  ];

  const validarRUC = (ruc) => {
    if (currentPerson.idTipoDoc === '4') {
      // Formato flexible: al menos 1 dígito antes del guión, luego guión, luego 1 dígito
      const regex = /^\d+-\d$/;
      return regex.test(ruc);
    }
    return true;
  };

  const buscarCliente = () => {
    if (!searchDoc.trim()) return;
    
    const clienteExistente = personas.find(p => p.nroDoc === searchDoc.trim());
    if (clienteExistente) {
      setCurrentPerson({...clienteExistente});
      setIsEditMode(true);
      setEditingPersonId(clienteExistente.id);
      setShowPersonForm(true);
      alert(`Cliente encontrado: ${clienteExistente.nombreCompleto}`);
    } else {
      alert('Cliente no encontrado. Use el botón "Nuevo Cliente" para agregar uno nuevo.');
    }
    setSearchDoc('');
  };

  const nuevoCliente = () => {
    setCurrentPerson({
      nombreCompleto: '',
      razonSocial: '',
      genero: 'M',
      idNacionalidad: 'PY',
      idEstadoCivil: '1',
      fechaNacimiento: '',
      idTipoPersona: '1',
      idSectorEconomico: '5',
      idTipoDoc: '1',
      idPaisDoc: 'PY',
      nroDoc: '',
      fechaVencimientoDoc: '',
      direccion: '',
      ciudad: '',
      barrio: '',
      telefono: '',
      cargoTrabajo: '',
      salario: '',
      lugarTrabajo: '',
      contactos: [],
      operacionesActivas: [],
      operacionesCanceladas: []
    });
    setIsEditMode(false);
    setEditingPersonId(null);
    setShowPersonForm(true);
  };

  // Efecto para ajustar tipo de documento según tipo de persona
  useEffect(() => {
    if (currentPerson.idTipoPersona === '2') {
      // Persona jurídica siempre RUC
      setCurrentPerson(prev => ({
        ...prev, 
        idTipoDoc: '4',
        razonSocial: prev.nombreCompleto
      }));
    } else {
      // Persona física puede tener CI o RUC
      if (currentPerson.idTipoDoc === '4' && currentPerson.idTipoPersona === '1') {
        // Si era jurídica y ahora es física, cambiar a CI por defecto
        setCurrentPerson(prev => ({...prev, idTipoDoc: '1'}));
      }
    }
  }, [currentPerson.idTipoPersona]);

  const agregarContacto = () => {
    if (newContact.contacto.trim()) {
      setCurrentPerson({
        ...currentPerson,
        contactos: [...currentPerson.contactos, {...newContact, id: Date.now()}]
      });
      setNewContact({ contacto: '', idTipoContacto: '1' });
    }
  };

  const eliminarContacto = (contactoId) => {
    setCurrentPerson({
      ...currentPerson,
      contactos: currentPerson.contactos.filter(c => c.id !== contactoId)
    });
  };

  useEffect(() => {
    if (currentPerson.idTipoPersona === '2') {
      setCurrentPerson(prev => ({...prev, razonSocial: prev.nombreCompleto}));
    }
  }, [currentPerson.nombreCompleto, currentPerson.idTipoPersona]);

  const guardarPersona = async () => {
    if (!currentPerson.nombreCompleto || !currentPerson.nroDoc) {
      alert('Nombre completo y documento son requeridos');
      return;
    }

    if (currentPerson.idTipoDoc === '4' && !validarRUC(currentPerson.nroDoc)) {
      alert('RUC debe tener formato: 123456-7 (números-dígito verificador)');
      return;
    }

    try {
      if (isEditMode) {
        // Actualizar cliente existente
        const resultado = await actualizarCliente(currentUser.institucionId, editingPersonId, currentPerson);
        
        if (resultado.success) {
          alert('Cliente actualizado exitosamente');
          cargarClientes(); // Recargar datos
        } else {
          alert('Error actualizando cliente: ' + resultado.error);
        }
      } else {
        // Crear nuevo cliente
        const resultado = await guardarCliente(currentUser.institucionId, currentPerson);
        
        if (resultado.success) {
          alert('Cliente guardado exitosamente');
          cargarClientes(); // Recargar datos
        } else {
          alert('Error guardando cliente: ' + resultado.error);
        }
      }

      // Reset form
      setCurrentPerson({
        nombreCompleto: '',
        razonSocial: '',
        genero: 'M',
        idNacionalidad: 'PY',
        idEstadoCivil: '1',
        fechaNacimiento: '',
        idTipoPersona: '1',
        idSectorEconomico: '5',
        idTipoDoc: '1',
        idPaisDoc: 'PY',
        nroDoc: '',
        fechaVencimientoDoc: '',
        direccion: '',
        ciudad: '',
        barrio: '',
        telefono: '',
        cargoTrabajo: '',
        salario: '',
        lugarTrabajo: '',
        contactos: [],
        operacionesActivas: [],
        operacionesCanceladas: []
      });
      setShowPersonForm(false);
      setIsEditMode(false);
      setEditingPersonId(null);
    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  };

  // Cargar clientes desde Firebase al montar el componente
  useEffect(() => {
    if (currentUser && currentUser.institucionId) {
      cargarClientes();
    }
  }, [currentUser]);

  const cargarClientes = async () => {
    try {
      const resultado = await obtenerClientes(currentUser.institucionId);
      if (resultado.success) {
        setPersonas(resultado.data);
        
        // Calcular contador global basado en operaciones existentes
        let maxCounter = 0;
        resultado.data.forEach(persona => {
          // Verificar operaciones activas
          if (persona.operacionesActivas) {
            persona.operacionesActivas.forEach(operacion => {
              if (operacion.numeroOperacion && operacion.numeroOperacion.startsWith('N')) {
                const numero = parseInt(operacion.numeroOperacion.substring(1));
                if (!isNaN(numero) && numero > maxCounter) {
                  maxCounter = numero;
                }
              }
            });
          }
          
          // Verificar operaciones canceladas
          if (persona.operacionesCanceladas) {
            persona.operacionesCanceladas.forEach(operacion => {
              if (operacion.numeroOperacion && operacion.numeroOperacion.startsWith('N')) {
                const numero = parseInt(operacion.numeroOperacion.substring(1));
                if (!isNaN(numero) && numero > maxCounter) {
                  maxCounter = numero;
                }
              }
            });
          }
        });
        setGlobalOperationCounter(maxCounter + 1);
      } else {
        console.error('Error cargando clientes:', resultado.error);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    }
  };

  const generarXML = () => {
    if (personas.length === 0) {
      alert('Agregue al menos un cliente');
      return;
    }

    const fechaInforme = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<Informe_Personas Fecha_Informe="${fechaInforme}" IdInstitucion="${institucionId}">\n`;

    personas.forEach(persona => {
      xml += `  <Persona NombreCompleto="${persona.nombreCompleto}" `;
      
      if (persona.idTipoPersona === '2') {
        xml += `RazonSocial="${persona.razonSocial}" `;
      }
      
      xml += `Genero="${persona.genero}" `;
      xml += `IdNacionalidad="${persona.idNacionalidad}" `;
      xml += `IdEstadoCivil="${persona.idEstadoCivil}" `;
      
      // Solo agregar FechaNacimiento para personas físicas
      if (persona.idTipoPersona === '1' && persona.fechaNacimiento) {
        xml += `FechaNacimiento="${persona.fechaNacimiento}" `;
      }
      
      xml += `IdTipoPersona="${persona.idTipoPersona}" `;
      xml += `IdSectorEconomico="${persona.idSectorEconomico}">\n`;

      xml += `    <Documentos IdTipoDoc="${persona.idTipoDoc}" `;
      xml += `IdPaisDoc="${persona.idPaisDoc}" `;
      xml += `NroDoc="${persona.nroDoc}"`;
      if (persona.fechaVencimientoDoc) {
        xml += ` FechaVencimiento="${persona.fechaVencimientoDoc}"`;
      }
      xml += ` />\n`;

      if (persona.direccion) {
        xml += `    <Direcciones Direccion_Libre="${persona.direccion} Ciudad: ${persona.ciudad} Barrio: ${persona.barrio}" `;
        xml += `Calle="${persona.direccion}" IdPais="PY" IdDepartamento="0" `;
        xml += `Ciudad="${persona.ciudad}" Barrio="${persona.barrio}" `;
        xml += `Telefono="${persona.telefono}" FechaRegistrada="${fechaInforme}" IdTipoDireccion="1" />\n`;
      }

      if (persona.cargoTrabajo) {
        xml += `    <Trabajos EsDependiente="1" CargoTrabajo="${persona.cargoTrabajo}" `;
        xml += `Salario="${persona.salario}" FechaInformado="${fechaInforme}" `;
        xml += `ComprobanteIngreso="1" LugarDeTrabajo="${persona.lugarTrabajo}" />\n`;
      }

      persona.contactos.forEach(contacto => {
        xml += `    <Contactos Contacto="${contacto.contacto}" IdTipoContacto="${contacto.idTipoContacto}" />\n`;
      });

      // Operaciones Activas
      persona.operacionesActivas.forEach(operacion => {
        xml += `    <OperacionesActivas IdTipoOperacion="${operacion.idTipoOperacion}" `;
        xml += `FechaOperacion="${operacion.fechaOperacion}" `;
        xml += `NumeroOperacion="${operacion.numeroOperacion}" `;
        xml += `CapitalOriginal="${operacion.capitalOriginal}.00" `;
        xml += `InteresOriginal="${operacion.interesOriginal || '0'}.00" `;
        xml += `CapitalAdeudadoActual="${operacion.capitalAdeudadoActual}.00" `;
        xml += `InteresPendienteDeDevengar="${operacion.interesPendienteDeDevengar}0.00" `;
        xml += `CapitalAtrasado="${operacion.capitalAtrasado}.00" `;
        xml += `InteresAtrasado="${operacion.interesAtrasado}.00" `;
        xml += `MoraPendienteDePago="${operacion.moraPendienteDePago}.00" `;
        xml += `MoraPaga="${operacion.moraPaga}.00" `;
        xml += `PlazoTotalEnPeriodos="${operacion.plazoTotalEnPeriodos}" `;
        xml += `PlazoRemanenteEnPeriodos="${operacion.plazoRemanenteEnPeriodos}" `;
        xml += `IdPeriodoPrestamo="${operacion.idPeriodoPrestamo}" `;
        xml += `DiasAtraso="${operacion.diasAtraso}" `;
        xml += `DiasAtrasoMaximo="${operacion.diasAtrasoMaximo}" `;
        xml += `DiasAtrasoPromedio="${operacion.diasAtrasoPromedio}" `;
        xml += `IdMoneda="${operacion.idMoneda}" `;
        xml += `IdTipoTitular="${operacion.idTipoTitular}" />\n`;
      });

      // Operaciones Canceladas
      if (persona.operacionesCanceladas && persona.operacionesCanceladas.length > 0) {
        persona.operacionesCanceladas.forEach(operacion => {
          xml += `    <OperacionesCanceladas IdTipoOperacion="${operacion.idTipoOperacion}" `;
          xml += `IdTipoCancelacion="${operacion.idTipoCancelacion}" `;
          xml += `FechaOperacion="${operacion.fechaOperacion}" `;
          xml += `CapitalOriginal="${operacion.capitalOriginal}.00" `;
          xml += `DiasAtrasoMaximo="${operacion.diasAtrasoMaximo || 0}" `;
          xml += `DiasAtrasoPromedio="${operacion.diasAtrasoPromedio || 0}" `;
          xml += `MontoQuitaMora="${operacion.montoQuitaMora || '0.00'}" `;
          xml += `MontoQuitaInteres="${operacion.montoQuitaInteres || '0.00'}" `;
          xml += `MontoQuitaCapital="${operacion.montoQuitaCapital || '0.00'}" `;
          xml += `MontoInteresGenerado="${operacion.montoInteresGenerado || '0.00'}" `;
          xml += `MontoMoraGenerada="0.00" `;
          xml += `IdMoneda="${operacion.idMoneda}" `;
          xml += `NumeroOperacion="${operacion.numeroOperacion}" `;
          xml += `FechaCancelacion="${operacion.fechaCancelacion}" />\n`;
        });
      }

      xml += `  </Persona>\n`;
    });

    xml += `</Informe_Personas>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_personas_${fechaInforme}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
            <div>
            <h1 className="text-lg font-bold">Generador XML MiPymes</h1>
            <p className="text-sm opacity-90">{currentUser?.institucionNombre || 'Cartera de Clientes'}</p>
            </div>
            <div className="flex items-center space-x-4">
            <div className="text-right">
                <p className="text-sm font-medium">{currentUser?.nombre}</p>
                <p className="text-xs opacity-75">{currentUser?.email}</p>
            </div>
            <button
                onClick={onLogout}
                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center text-sm"
            >
                Salir
            </button>
            </div>
        </div>
        </div>

        {/* Configuración */}
        <div className="p-4 bg-gray-50 border-b">
          <label className="block text-sm font-medium mb-2">ID Institución</label>
          <input
            type="text"
            value={institucionId}
            className="w-full p-2 border rounded text-center font-mono bg-gray-100"
            readOnly
          />
          <p className="text-xs text-gray-600 mt-1">Asignado por el administrador</p>
        </div>

      {/* Botón Nuevo Cliente */}
      <div className="p-4 bg-green-50 border-b">
        <button
          onClick={nuevoCliente}
          className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-700 transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda de Cliente */}
      <div className="p-4 bg-blue-50 border-b">
        <label className="block text-sm font-medium mb-2">Buscar Cliente por Documento</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchDoc}
            onChange={(e) => setSearchDoc(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="CI o RUC"
          />
          <button
            onClick={buscarCliente}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={!searchDoc.trim()}
          >
            <Search size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Buscar cliente existente para editar
        </p>
      </div>

      {/* Lista de Personas */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <User className="mr-2" size={20} />
            Clientes ({personas.length})
          </h2>
        </div>

        {personas.map((persona) => (
          <div key={persona.id} className="bg-white border rounded-lg p-3 mb-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium">{persona.nombreCompleto}</h3>
                {persona.idTipoPersona === '2' && (
                  <p className="text-sm text-blue-600">Razón Social: {persona.razonSocial}</p>
                )}
                <p className="text-sm text-gray-600">
                  {persona.idTipoDoc === '1' ? 'CI' : 'RUC'}: {persona.nroDoc}
                </p>
                <p className="text-sm text-gray-600">{persona.ciudad}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-xs">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {persona.idTipoPersona === '1' ? 'Física' : 'Jurídica'}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {sectoresEconomicos.find(s => s.id === persona.idSectorEconomico)?.label}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Contactos: {persona.contactos.length}
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    Op. Activas: {persona.operacionesActivas.length}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => {
                    setCurrentPerson({...persona});
                    setIsEditMode(true);
                    setEditingPersonId(persona.id);
                    setShowPersonForm(true);
                  }}
                  className="text-blue-500 p-1"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
                      try {
                        const resultado = await eliminarCliente(currentUser.institucionId, persona.id);
                        if (resultado.success) {
                          alert('Cliente eliminado exitosamente');
                          cargarClientes();
                        } else {
                          alert('Error eliminando cliente: ' + resultado.error);
                        }
                      } catch (error) {
                        alert('Error de conexión: ' + error.message);
                      }
                    }
                  }}
                  className="text-red-500 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {personas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User size={48} className="mx-auto mb-2 opacity-50" />
            <p>No hay clientes agregados</p>
            <p className="text-sm">Use el botón "Nuevo Cliente" o el buscador</p>
          </div>
        )}
      </div>

      {/* Formulario de Persona */}
      {showPersonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="bg-white m-2 mt-4 rounded-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-blue-600 text-white p-4 rounded-t-lg">
              <h2 className="text-lg font-bold">
                {isEditMode ? 'Editar Cliente' : 'Agregar Cliente'}
              </h2>
              <p className="text-sm opacity-90">
                {isEditMode ? `Documento: ${currentPerson.nroDoc}` : 'Cliente Nuevo'}
              </p>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Agregar Datos Cliente */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-blue-600 mb-3 border-b pb-2">
                  Agregar Datos Cliente
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de Persona *</label>
                    <select
                      value={currentPerson.idTipoPersona}
                      onChange={(e) => setCurrentPerson({...currentPerson, idTipoPersona: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="1">Física</option>
                      <option value="2">Jurídica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={currentPerson.nombreCompleto}
                      onChange={(e) => setCurrentPerson({...currentPerson, nombreCompleto: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="APELLIDO, NOMBRE"
                    />
                  </div>

                  {currentPerson.idTipoPersona === '2' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Razón Social *</label>
                      <input
                        type="text"
                        value={currentPerson.razonSocial}
                        onChange={(e) => setCurrentPerson({...currentPerson, razonSocial: e.target.value})}
                        className="w-full p-2 border rounded bg-gray-50"
                        placeholder="Se autocompleta con Nombre Completo"
                      />
                    </div>
                  )}

                  {currentPerson.idTipoPersona === '1' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Género</label>
                        <select
                          value={currentPerson.genero}
                          onChange={(e) => setCurrentPerson({...currentPerson, genero: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Fecha Nacimiento</label>
                        <input
                          type="date"
                          value={currentPerson.fechaNacimiento}
                          onChange={(e) => setCurrentPerson({...currentPerson, fechaNacimiento: e.target.value})}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    {currentPerson.idTipoPersona === '1' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Estado Civil</label>
                        <select
                          value={currentPerson.idEstadoCivil}
                          onChange={(e) => setCurrentPerson({...currentPerson, idEstadoCivil: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          {estadosCiviles.map(estado => (
                            <option key={estado.id} value={estado.id}>{estado.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={currentPerson.idTipoPersona === '1' ? '' : 'col-span-2'}>
                      <label className="block text-sm font-medium mb-1">Nacionalidad</label>
                      <select
                        value={currentPerson.idNacionalidad}
                        onChange={(e) => setCurrentPerson({...currentPerson, idNacionalidad: e.target.value})}
                        className="w-full p-2 border rounded"
                      >
                        {nacionalidades.map(nac => (
                          <option key={nac.id} value={nac.id}>{nac.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Sector Económico</label>
                    <select
                      value={currentPerson.idSectorEconomico}
                      onChange={(e) => setCurrentPerson({...currentPerson, idSectorEconomico: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      {sectoresEconomicos.map(sector => (
                        <option key={sector.id} value={sector.id}>{sector.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-green-600 mb-3 border-b pb-2">
                  Documentos
                </h3>
                
                <div className="space-y-3">
                  {currentPerson.idTipoPersona === '1' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo Documento *</label>
                        <select
                          value={currentPerson.idTipoDoc}
                          onChange={(e) => setCurrentPerson({...currentPerson, idTipoDoc: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          {tiposDocumento.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">País Documento</label>
                        <select
                          value={currentPerson.idPaisDoc}
                          onChange={(e) => setCurrentPerson({...currentPerson, idPaisDoc: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="PY">Paraguay</option>
                          <option value="BR">Brasil</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {currentPerson.idTipoPersona === '2' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo Documento *</label>
                        <input
                          type="text"
                          value="RUC"
                          className="w-full p-2 border rounded bg-gray-100"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">País Documento</label>
                        <select
                          value={currentPerson.idPaisDoc}
                          onChange={(e) => setCurrentPerson({...currentPerson, idPaisDoc: e.target.value})}
                          className="w-full p-2 border rounded"
                        >
                          <option value="PY">Paraguay</option>
                          <option value="BR">Brasil</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Número Documento * 
                      {currentPerson.idTipoDoc === '4' && (
                        <span className="text-xs text-red-600">(Formato: 123456-7 o 12345678-9)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={currentPerson.nroDoc}
                      onChange={(e) => setCurrentPerson({...currentPerson, nroDoc: e.target.value})}
                      className={`w-full p-2 border rounded ${
                        currentPerson.idTipoDoc === '4' && currentPerson.nroDoc && !validarRUC(currentPerson.nroDoc) 
                          ? 'border-red-500' : ''
                      }`}
                      placeholder={currentPerson.idTipoDoc === '1' ? '1234567' : '123456-7'}
                    />
                    {currentPerson.idTipoDoc === '4' && currentPerson.nroDoc && !validarRUC(currentPerson.nroDoc) && (
                      <p className="text-xs text-red-600 mt-1">RUC debe incluir dígito verificador con guión</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha Vencimiento</label>
                    <input
                      type="date"
                      value={currentPerson.fechaVencimientoDoc}
                      onChange={(e) => setCurrentPerson({...currentPerson, fechaVencimientoDoc: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Contactos */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-purple-600 mb-3 border-b pb-2">
                  Contactos del Cliente
                </h3>
                
                {/* Lista de contactos */}
                {currentPerson.contactos.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {currentPerson.contactos.map((contacto) => (
                      <div key={contacto.id} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                        <div className="flex items-center">
                          {contacto.idTipoContacto === '1' ? <Mail size={16} className="mr-2" /> : <Phone size={16} className="mr-2" />}
                          <span className="text-sm">{contacto.contacto}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({contacto.idTipoContacto === '1' ? 'Correo' : 'Número'})
                          </span>
                        </div>
                        <button
                          onClick={() => eliminarContacto(contacto.id)}
                          className="text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar nuevo contacto */}
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newContact.idTipoContacto}
                      onChange={(e) => setNewContact({...newContact, idTipoContacto: e.target.value})}
                      className="p-2 border rounded"
                    >
                      {tiposContacto.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newContact.contacto}
                      onChange={(e) => setNewContact({...newContact, contacto: e.target.value})}
                      className="col-span-2 p-2 border rounded"
                      placeholder={newContact.idTipoContacto === '1' ? 'email@ejemplo.com' : '0981-123456'}
                    />
                  </div>
                  <button
                    onClick={agregarContacto}
                    className="w-full bg-purple-500 text-white p-2 rounded text-sm"
                    disabled={!newContact.contacto.trim()}
                  >
                    <Plus className="inline mr-1" size={14} />
                    Agregar Contacto
                  </button>
                </div>
              </div>

              {/* Dirección y Trabajo */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-orange-600 mb-3 border-b pb-2">
                  Dirección y Trabajo
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Dirección</label>
                    <input
                      type="text"
                      value={currentPerson.direccion}
                      onChange={(e) => setCurrentPerson({...currentPerson, direccion: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Calle y número"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ciudad</label>
                      <input
                        type="text"
                        value={currentPerson.ciudad}
                        onChange={(e) => setCurrentPerson({...currentPerson, ciudad: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Barrio</label>
                      <input
                        type="text"
                        value={currentPerson.barrio}
                        onChange={(e) => setCurrentPerson({...currentPerson, barrio: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>

                    <div>
                    <label className="block text-sm font-medium mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={currentPerson.telefono}
                      onChange={(e) => setCurrentPerson({...currentPerson, telefono: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="0981-123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo de Trabajo</label>
                    <input
                      type="text"
                      value={currentPerson.cargoTrabajo}
                      onChange={(e) => setCurrentPerson({...currentPerson, cargoTrabajo: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="EMPLEADO, CHOFER, etc."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Salario (Gs.)</label>
                      <input
                        type="number"
                        value={currentPerson.salario}
                        onChange={(e) => setCurrentPerson({...currentPerson, salario: e.target.value})}
                        className="w-full p-2 border rounded"
                        placeholder="2500000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lugar de Trabajo</label>
                      <input
                        type="text"
                        value={currentPerson.lugarTrabajo}
                        onChange={(e) => setCurrentPerson({...currentPerson, lugarTrabajo: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <OperacionesActivas
                operaciones={currentPerson.operacionesActivas}
                onOperacionesChange={(operaciones) => setCurrentPerson({...currentPerson, operacionesActivas: operaciones})}
                clienteId={currentPerson.nroDoc}
                globalOperationCounter={globalOperationCounter}
                onUpdateGlobalCounter={() => setGlobalOperationCounter(prev => prev + 1)}
                onMoverACancelada={(operacionIndex) => {
                  const operacionAMover = currentPerson.operacionesActivas[operacionIndex];
                  
                  // Crear la operación cancelada con los datos correctos
                  const operacionCancelada = {
                    ...operacionAMover,
                    id: Date.now(), // Nuevo ID para la operación cancelada
                    idTipoCancelacion: determinarTipoCancelacion(operacionAMover),
                    fechaCancelacion: obtenerUltimaFechaPago(operacionAMover.cuotas),
                    diasAtrasoMaximo: operacionAMover.diasAtrasoMaximo || 0,
                    diasAtrasoPromedio: operacionAMover.diasAtrasoPromedio || 0,
                    montoQuitaMora: '0.00',
                    montoQuitaInteres: '0.00',
                    montoQuitaCapital: '0.00',
                    montoInteresGenerado: '0.00'
                  };
                  
                  // Agregar a canceladas y quitar de activas
                  const nuevasActivas = currentPerson.operacionesActivas.filter((_, i) => i !== operacionIndex);
                  const nuevasCanceladas = [...currentPerson.operacionesCanceladas, operacionCancelada];
                  
                  setCurrentPerson({
                    ...currentPerson,
                    operacionesActivas: nuevasActivas,
                    operacionesCanceladas: nuevasCanceladas
                  });
                  
                  alert('Operación movida a canceladas exitosamente');
                }}
              />

              {/* Operaciones Canceladas */}
              <OperacionesCanceladas
                operaciones={currentPerson.operacionesCanceladas}
                onOperacionesChange={(operaciones) => setCurrentPerson({...currentPerson, operacionesCanceladas: operaciones})}
                clienteId={currentPerson.nroDoc}
                globalOperationCounter={globalOperationCounter}
                onUpdateGlobalCounter={() => setGlobalOperationCounter(prev => prev + 1)}
              />

              {/* Botones de Acción */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowPersonForm(false);
                    setIsEditMode(false);
                    setEditingPersonId(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarPersona}
                  className="flex-1 bg-blue-600 text-white p-3 rounded"
                  disabled={!currentPerson.nombreCompleto || !currentPerson.nroDoc || 
                           (currentPerson.idTipoDoc === '4' && !validarRUC(currentPerson.nroDoc))}
                >
                  {isEditMode ? 'Actualizar' : 'Agregar'} Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón Generar XML */}
      {personas.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4">
          <button
            onClick={generarXML}
            className="w-full bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-center"
          >
            <Download className="mr-2" size={20} />
            Generar XML ({personas.length} cliente{personas.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;