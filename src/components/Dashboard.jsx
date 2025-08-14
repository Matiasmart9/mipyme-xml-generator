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
    operacionesCanceladas: [],
    fechaRegistradaDireccion: '',
    fechaInformadoTrabajo: ''
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
    { id: 'AR', label: 'Argentina' },
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
      departamento: '00', // Sin Especificar por defecto
      telefono: '',
      cargoTrabajo: '',
      salario: '',
      lugarTrabajo: '',
      contactos: [],
      operacionesActivas: [],
      operacionesCanceladas: [],
      fechaRegistradaDireccion: '',
      fechaInformadoTrabajo: ''
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
    // ===== VALIDACIONES BÁSICAS =====
    if (!currentPerson.nombreCompleto || !currentPerson.nroDoc) {
      alert('Nombre completo y documento son requeridos');
      return;
    }

    if (currentPerson.idTipoDoc === '4' && !validarRUC(currentPerson.nroDoc)) {
      alert('RUC debe tener formato: 123456-7 (números-dígito verificador)');
      return;
    }

    // ===== VALIDACIONES PARA PERSONAS FÍSICAS =====
    if (currentPerson.idTipoPersona === '1') {
      // Campos obligatorios para personas físicas
      if (!currentPerson.genero) {
        alert('El género es obligatorio para personas físicas');
        return;
      }
      
      if (!currentPerson.fechaNacimiento) {
        alert('La fecha de nacimiento es obligatoria para personas físicas');
        return;
      }
      
      if (!currentPerson.idEstadoCivil) {
        alert('El estado civil es obligatorio para personas físicas');
        return;
      }
    }

    // ===== VALIDACIONES PARA TODOS =====
    if (!currentPerson.idNacionalidad) {
      alert('La nacionalidad es obligatoria');
      return;
    }

    if (!currentPerson.idSectorEconomico) {
      alert('El sector económico es obligatorio');
      return;
    }

    // ===== VALIDACIONES DE DOCUMENTOS =====
    if (!currentPerson.idPaisDoc) {
      alert('El país del documento es obligatorio');
      return;
    }

    if (!currentPerson.fechaVencimientoDoc) {
      alert('La fecha de vencimiento del documento es obligatoria');
      return;
    }

    // ===== VALIDACIONES DE CONTACTOS =====
    if (!currentPerson.contactos || currentPerson.contactos.length === 0) {
      alert('Debe agregar al menos un contacto (correo o número)');
      return;
    }

    // ===== VALIDACIONES DE DIRECCIÓN Y TRABAJO =====
    if (!currentPerson.direccion || currentPerson.direccion.trim() === '') {
      alert('La dirección es obligatoria');
      return;
    }

    if (!currentPerson.departamento || currentPerson.departamento === '00') {
      alert('El departamento es obligatorio');
      return;
    }

    if (!currentPerson.ciudad || currentPerson.ciudad.trim() === '') {
      alert('La ciudad es obligatoria');
      return;
    }

    if (!currentPerson.barrio || currentPerson.barrio.trim() === '') {
      alert('El barrio es obligatorio');
      return;
    }

    if (!currentPerson.telefono || currentPerson.telefono.trim() === '') {
      alert('El teléfono es obligatorio');
      return;
    }

    if (!currentPerson.cargoTrabajo || currentPerson.cargoTrabajo.trim() === '') {
      alert('El cargo de trabajo es obligatorio');
      return;
    }

    if (!currentPerson.salario || currentPerson.salario.trim() === '') {
      alert('El salario es obligatorio');
      return;
    }

    if (!currentPerson.lugarTrabajo || currentPerson.lugarTrabajo.trim() === '') {
      alert('El lugar de trabajo es obligatorio');
      return;
    }

    // ===== VALIDACIONES DE FECHAS OBLIGATORIAS =====
    if (!currentPerson.fechaRegistradaDireccion) {
      alert('La fecha de registro de dirección es obligatoria');
      return;
    }

    if (!currentPerson.fechaInformadoTrabajo) {
      alert('La fecha de informado de trabajo es obligatoria');
      return;
    }

    // ===== VALIDAR DEPARTAMENTO NO SEA UNDEFINED =====
    if (!currentPerson.departamento) {
      setCurrentPerson(prev => ({
        ...prev,
        departamento: '8' // Central por defecto
      }));
    }

    try {
      // ✅ CRÍTICO: Crear persona completa con TODOS los datos preservados
      const personaCompleta = {
        // Datos básicos de la persona
        nombreCompleto: currentPerson.nombreCompleto,
        razonSocial: currentPerson.razonSocial,
        genero: currentPerson.genero,
        idNacionalidad: currentPerson.idNacionalidad,
        idEstadoCivil: currentPerson.idEstadoCivil,
        fechaNacimiento: currentPerson.fechaNacimiento,
        idTipoPersona: currentPerson.idTipoPersona,
        idSectorEconomico: currentPerson.idSectorEconomico,
        idTipoDoc: currentPerson.idTipoDoc,
        idPaisDoc: currentPerson.idPaisDoc,
        nroDoc: currentPerson.nroDoc,
        fechaVencimientoDoc: currentPerson.fechaVencimientoDoc,
        direccion: currentPerson.direccion,
        ciudad: currentPerson.ciudad,
        barrio: currentPerson.barrio,
        departamento: currentPerson.departamento,
        telefono: currentPerson.telefono,
        cargoTrabajo: currentPerson.cargoTrabajo,
        salario: currentPerson.salario,
        lugarTrabajo: currentPerson.lugarTrabajo,
        contactos: currentPerson.contactos || [],
        fechaRegistradaDireccion: currentPerson.fechaRegistradaDireccion || '',
        fechaInformadoTrabajo: currentPerson.fechaInformadoTrabajo || '',
        
        // ✅ CRÍTICO: Preservar operaciones activas con TODO su historial
        operacionesActivas: currentPerson.operacionesActivas ? currentPerson.operacionesActivas.map(operacion => ({
          // Datos básicos de la operación
          id: operacion.id,
          idTipoOperacion: operacion.idTipoOperacion,
          fechaOperacion: operacion.fechaOperacion,
          numeroOperacion: operacion.numeroOperacion,
          capitalOriginal: operacion.capitalOriginal,
          interesOriginal: operacion.interesOriginal || '',
          plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
          idPeriodoPrestamo: operacion.idPeriodoPrestamo,
          fechaVencimiento: operacion.fechaVencimiento,
          idMoneda: operacion.idMoneda,
          idTipoTitular: operacion.idTipoTitular,
          
          // Datos calculados
          capitalAdeudadoActual: operacion.capitalAdeudadoActual,
          interesPendienteDeDevengar: operacion.interesPendienteDeDevengar,
          capitalAtrasado: operacion.capitalAtrasado,
          interesAtrasado: operacion.interesAtrasado,
          moraPendienteDePago: operacion.moraPendienteDePago,
          moraPaga: operacion.moraPaga,
          plazoRemanenteEnPeriodos: operacion.plazoRemanenteEnPeriodos,
          diasAtraso: operacion.diasAtraso,
          diasAtrasoMaximo: operacion.diasAtrasoMaximo,
          diasAtrasoPromedio: operacion.diasAtrasoPromedio,
          
          // ✅ CRÍTICO: Preservar EXACTAMENTE las cuotas con su historial completo
          cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
            numero: cuota.numero,
            fechaVencimiento: cuota.fechaVencimiento,
            montoCuota: cuota.montoCuota,
            saldo: cuota.saldo,
            estado: cuota.estado,
            fechaPago: cuota.fechaPago || '', // ✅ PRESERVAR fecha de pago
            diasAtraso: cuota.diasAtraso || 0, // ✅ PRESERVAR días de atraso
            pagos: cuota.pagos ? cuota.pagos.map(pago => ({
              fecha: pago.fecha,
              monto: pago.monto,
              diasAtraso: pago.diasAtraso,
              tipo: pago.tipo
            })) : [] // ✅ PRESERVAR historial de pagos parciales
          })) : []
        })) : [],
        
        // ✅ CRÍTICO: Preservar operaciones canceladas con TODO su historial
        operacionesCanceladas: currentPerson.operacionesCanceladas ? currentPerson.operacionesCanceladas.map(operacion => ({
          // Datos básicos de la operación
          id: operacion.id,
          idTipoOperacion: operacion.idTipoOperacion,
          fechaOperacion: operacion.fechaOperacion,
          numeroOperacion: operacion.numeroOperacion,
          capitalOriginal: operacion.capitalOriginal,
          interesOriginal: operacion.interesOriginal || '',
          plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
          idPeriodoPrestamo: operacion.idPeriodoPrestamo,
          fechaVencimiento: operacion.fechaVencimiento,
          idMoneda: operacion.idMoneda,
          
          // Datos específicos de cancelación
          idTipoCancelacion: operacion.idTipoCancelacion,
          fechaCancelacion: operacion.fechaCancelacion,
          diasAtrasoMaximo: operacion.diasAtrasoMaximo || 0,
          diasAtrasoPromedio: operacion.diasAtrasoPromedio || 0,
          montoQuitaMora: operacion.montoQuitaMora || '0.00',
          montoQuitaInteres: operacion.montoQuitaInteres || '0.00',
          montoQuitaCapital: operacion.montoQuitaCapital || '0.00',
          montoInteresGenerado: operacion.montoInteresGenerado || '0.00',
          
          // ✅ CRÍTICO: Preservar EXACTAMENTE las cuotas con su historial completo
          cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
            numero: cuota.numero,
            fechaVencimiento: cuota.fechaVencimiento,
            montoCuota: cuota.montoCuota,
            saldo: 0, // En canceladas todo está pagado
            estado: 'pagado',
            fechaPago: cuota.fechaPago || '', // ✅ PRESERVAR fecha de pago REAL
            diasAtraso: cuota.diasAtraso || 0, // ✅ PRESERVAR días de atraso REALES
            pagos: cuota.pagos ? cuota.pagos.map(pago => ({
              fecha: pago.fecha,
              monto: pago.monto,
              diasAtraso: pago.diasAtraso,
              tipo: pago.tipo
            })) : [] // ✅ PRESERVAR historial de pagos parciales
          })) : []
        })) : []
      };

      console.log('🔍 GUARDANDO PERSONA COMPLETA:', personaCompleta);
      console.log('🔍 OPERACIONES ACTIVAS A GUARDAR:', personaCompleta.operacionesActivas);
      console.log('🔍 OPERACIONES CANCELADAS A GUARDAR:', personaCompleta.operacionesCanceladas);

      let resultado;
      if (isEditMode) {
        resultado = await actualizarCliente(currentUser.institucionId, editingPersonId, personaCompleta);
      } else {
        resultado = await guardarCliente(currentUser.institucionId, personaCompleta);
      }
      
      if (resultado.success) {
        alert(isEditMode ? 'Cliente actualizado exitosamente' : 'Cliente guardado exitosamente');
        await cargarClientes(); // Recargar datos
      } else {
        alert('Error guardando cliente: ' + resultado.error);
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
        departamento: '0',
        telefono: '',
        cargoTrabajo: '',
        salario: '',
        lugarTrabajo: '',
        contactos: [],
        operacionesActivas: [],
        operacionesCanceladas: [],
        fechaRegistradaDireccion: '',
        fechaInformadoTrabajo: ''
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

  // Función para actualizar días de atraso automáticamente y guardar en Firebase
  const actualizarDiasAtrasoAutomatico = async (personas) => {
    const personasActualizadas = [];

    for (const persona of personas) {
      let personaModificada = false;
      const personaActualizada = { ...persona };

      // Actualizar operaciones activas
      if (personaActualizada.operacionesActivas && personaActualizada.operacionesActivas.length > 0) {
        const operacionesActualizadas = personaActualizada.operacionesActivas.map(operacion => {
          let operacionModificada = false;
          const operacionActual = { ...operacion };

          if (operacionActual.cuotas && operacionActual.cuotas.length > 0) {
            const cuotasActualizadas = operacionActual.cuotas.map(cuota => {
              const cuotaActual = { ...cuota };
              
              // Solo actualizar cuotas vencidas que no están pagadas
              if (cuotaActual.estado === 'vencido' && cuotaActual.saldo > 0) {
                const nuevoDiasAtraso = calcularDiasAtraso(cuotaActual.fechaVencimiento);
                if (nuevoDiasAtraso !== cuotaActual.diasAtraso) {
                  cuotaActual.diasAtraso = nuevoDiasAtraso;
                  operacionModificada = true;
                }
              }
              
              return cuotaActual;
            });

            if (operacionModificada) {
              operacionActual.cuotas = cuotasActualizadas;
              
              // Recalcular métricas de la operación
              const metricas = calcularMetricasAtraso(cuotasActualizadas);
              operacionActual.diasAtraso = metricas.diasAtraso;
              operacionActual.diasAtrasoMaximo = metricas.diasAtrasoMaximo;
              operacionActual.diasAtrasoPromedio = metricas.diasAtrasoPromedio;
              
              personaModificada = true;
            }
          }

          return operacionActual;
        });

        if (personaModificada) {
          personaActualizada.operacionesActivas = operacionesActualizadas;
        }
      }

      // Si hubo modificaciones, guardar en Firebase
      if (personaModificada) {
        try {
          await actualizarCliente(currentUser.institucionId, persona.id, personaActualizada);
          console.log(`Días de atraso actualizados para cliente: ${persona.nombreCompleto}`);
        } catch (error) {
          console.error(`Error actualizando cliente ${persona.nombreCompleto}:`, error);
        }
      }

      personasActualizadas.push(personaActualizada);
    }

    return personasActualizadas;
  };

  // Funciones auxiliares para cálculo de atraso (copiadas de OperacionesActivas)
  const calcularDiasAtraso = (fechaVencimiento, fechaPago = null) => {
    const fechaComparacion = fechaPago ? new Date(fechaPago) : new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = fechaComparacion - vencimiento;
    return diferencia > 0 ? Math.floor(diferencia / (1000 * 60 * 60 * 24)) : 0;
  };

  const calcularMetricasAtraso = (cuotas) => {
    let diasAtrasoMaximo = 0;
    let sumaDiasAtraso = 0;
    let cantidadCuotasConAtraso = 0;
    let diasAtrasoActual = 0;

    const hoy = new Date();

    cuotas.forEach(cuota => {
      let diasAtrasoEfectivo = 0;

      if (cuota.estado === 'pagado') {
        diasAtrasoEfectivo = cuota.diasAtraso || 0;
      } else if (cuota.estado === 'vencido') {
        diasAtrasoEfectivo = calcularDiasAtraso(cuota.fechaVencimiento);
        cuota.diasAtraso = diasAtrasoEfectivo;
      }

      if (diasAtrasoEfectivo > 0) {
        diasAtrasoMaximo = Math.max(diasAtrasoMaximo, diasAtrasoEfectivo);
        sumaDiasAtraso += diasAtrasoEfectivo;
        cantidadCuotasConAtraso++;

        if (cuota.estado === 'vencido') {
          diasAtrasoActual = Math.max(diasAtrasoActual, diasAtrasoEfectivo);
        }
      }
    });

    const diasAtrasoPromedio = cantidadCuotasConAtraso > 0 ? 
      Math.round(sumaDiasAtraso / cantidadCuotasConAtraso) : 0;

    return { 
      diasAtraso: diasAtrasoActual, 
      diasAtrasoMaximo, 
      diasAtrasoPromedio 
    };
  };

  const cargarClientes = async () => {
    try {
      const resultado = await obtenerClientes(currentUser.institucionId);
      if (resultado.success) {
        // Actualizar días de atraso antes de mostrar
        const personasActualizadas = await actualizarDiasAtrasoAutomatico(resultado.data);
        setPersonas(personasActualizadas);
        
        // Calcular contador global basado en operaciones existentes
        let maxCounter = 0;
        personasActualizadas.forEach(persona => {
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
        xml += `Calle="${persona.direccion}" IdPais="PY" IdDepartamento="${persona.departamento || '0'}" `;
        xml += `Ciudad="${persona.ciudad}" Barrio="${persona.barrio}" `;
        xml += `Telefono="${persona.telefono}" `;
        // ✅ USAR LA FECHA REAL DE REGISTRO EN LUGAR DE fechaInforme
        xml += `FechaRegistrada="${persona.fechaRegistradaDireccion || fechaInforme}" `;
        xml += `IdTipoDireccion="1" />\n`;
      }

      if (persona.cargoTrabajo) {
        xml += `    <Trabajos EsDependiente="1" CargoTrabajo="${persona.cargoTrabajo}" `;
        xml += `Salario="${persona.salario}" `;
        // ✅ USAR LA FECHA PERSISTENTE O FECHA ACTUAL COMO FALLBACK
        xml += `FechaInformado="${persona.fechaInformadoTrabajo || fechaInforme}" `;
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
        <div className="bg-orange-400 text-white p-4">
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
          className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold flex items-center justify-center hover:bg-green-700 transition-colors"
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
            className="bg-orange-500 text-white px-4 py-2 rounded"
            disabled={!searchDoc.trim()}
          >
            <Search size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Buscar cliente existente para editar o registrar pago
        </p>
      </div>

      {/* Lista de Personas */}
      <div className="p-4 pb-20">
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
                <p className="text-sm text-gray-600">
                {persona.ciudad}
                {persona.departamento && persona.departamento !== '0' && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({departamentos.find(d => d.id === persona.departamento)?.label})
                  </span>
                )}
              </p>
<div className="mt-2 flex flex-wrap gap-1 text-xs">
  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
    {persona.idTipoPersona === '1' ? 'Física' : 'Jurídica'}
  </span>
  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
    {sectoresEconomicos.find(s => s.id === persona.idSectorEconomico)?.label}
  </span>
  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
    Contactos: {persona.contactos.length}
  </span>
  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
    Activas: {persona.operacionesActivas.length}
  </span>
  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
    Canceladas: {persona.operacionesCanceladas?.length || 0}
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
                          await cargarClientes();
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
            <div className="sticky top-0 bg-orange-400 text-white p-4 rounded-t-lg">
              <h2 className="text-lg font-bold">
                {isEditMode ? 'Editar Cliente' : 'Agregar Cliente'}
              </h2>
              <p className="text-sm opacity-90">
                {isEditMode ? `Documento: ${currentPerson.nroDoc}` : 'Cliente Nuevo'}
              </p>
            </div>
            
            <div className="p-4 pt-5 space-y-6">
              {/* Agregar Datos Cliente */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3 border-b pb-2">
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
                        <label className="block text-sm font-medium mb-1">Género *</label>
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
                        <label className="block text-sm font-medium mb-1">Fecha Nacimiento *</label>
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
                        <label className="block text-sm font-medium mb-1">Estado Civil *</label>
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
                      <label className="block text-sm font-medium mb-1">Nacionalidad *</label>
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
                    <label className="block text-sm font-medium mb-1">Sector Económico *</label>
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
                        <label className="block text-sm font-medium mb-1">País Documento *</label>
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
                        <label className="block text-sm font-medium mb-1">País Documento *</label>
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
                    <label className="block text-sm font-medium mb-1">Fecha Vencimiento *</label>
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
                <h3 className="font-semibold text-blue-700 mb-3 border-b pb-2">
                  Contactos del Cliente *
                  <span className="text-xs font-normal text-red-600 ml-2">(Al menos uno requerido)</span>
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
                    className="w-full bg-cyan-500 text-white p-2 rounded text-sm"
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
                    <label className="block text-sm font-medium mb-1">Dirección *</label>
                    <input
                      type="text"
                      value={currentPerson.direccion}
                      onChange={(e) => setCurrentPerson({...currentPerson, direccion: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Calle del cliente"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Departamento *</label>
                      <select
                        value={currentPerson.departamento}
                        onChange={(e) => setCurrentPerson({...currentPerson, departamento: e.target.value})}
                        className="w-full p-2 border rounded"
                      >
                        {departamentos.map(depto => (
                          <option key={depto.id} value={depto.id}>{depto.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Ciudad *</label>
                      <input
                        type="text"
                        value={currentPerson.ciudad}
                        onChange={(e) => setCurrentPerson({...currentPerson, ciudad: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Barrio *</label>
                      <input
                        type="text"
                        value={currentPerson.barrio}
                        onChange={(e) => setCurrentPerson({...currentPerson, barrio: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono *</label>
                      <input
                        type="text"
                        value={currentPerson.telefono}
                        onChange={(e) => setCurrentPerson({...currentPerson, telefono: e.target.value})}
                        className="w-full p-2 border rounded"
                        placeholder="0981-123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Fecha Registro Dirección *
                        <span className="text-xs text-gray-500 ml-1">(para XML)</span>
                      </label>
                      <input
                        type="date"
                        value={currentPerson.fechaRegistradaDireccion}
                        onChange={(e) => setCurrentPerson({...currentPerson, fechaRegistradaDireccion: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo de Trabajo *</label>
                    <input
                      type="text"
                      value={currentPerson.cargoTrabajo}
                      onChange={(e) => setCurrentPerson({...currentPerson, cargoTrabajo: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="EMPLEADO, CHOFER, etc."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Salario (Gs.) *</label>
                      <input
                        type="number"
                        value={currentPerson.salario}
                        onChange={(e) => setCurrentPerson({...currentPerson, salario: e.target.value})}
                        className="w-full p-2 border rounded"
                        placeholder="2750000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lugar de Trabajo *</label>
                      <input
                        type="text"
                        value={currentPerson.lugarTrabajo}
                        onChange={(e) => setCurrentPerson({...currentPerson, lugarTrabajo: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Fecha Informado Trabajo *
                        <span className="text-xs text-gray-500 ml-1">(para XML)</span>
                      </label>
                      <input
                        type="date"
                        value={currentPerson.fechaInformadoTrabajo}
                        onChange={(e) => setCurrentPerson({...currentPerson, fechaInformadoTrabajo: e.target.value})}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                  </div>

                  {/* Información sobre las fechas */}
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-blue-700">📅 Información sobre las fechas:</h4>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fechaHoy = new Date().toISOString().split('T')[0];
                            if (!currentPerson.fechaRegistradaDireccion) {
                              setCurrentPerson(prev => ({
                                ...prev,
                                fechaRegistradaDireccion: fechaHoy
                              }));
                            }
                          }}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          disabled={!!currentPerson.fechaRegistradaDireccion}
                        >
                          Fecha Dirección Hoy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const fechaHoy = new Date().toISOString().split('T')[0];
                            if (!currentPerson.fechaInformadoTrabajo) {
                              setCurrentPerson(prev => ({
                                ...prev,
                                fechaInformadoTrabajo: fechaHoy
                              }));
                            }
                          }}
                          className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700"
                          disabled={!!currentPerson.fechaInformadoTrabajo}
                        >
                          Fecha Trabajo Hoy
                        </button>
                      </div>
                    </div>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• <strong>Fecha Registro Dirección:</strong> Se usa como "FechaRegistrada" en el XML</li>
                      <li>• <strong>Fecha Informado Trabajo:</strong> Se usa como "FechaInformado" en el XML</li>
                      <li>• Estas fechas son OBLIGATORIAS y se guardan permanentemente</li>
                      <li>• Use los botones de arriba para establecer la fecha de hoy rápidamente</li>
                    </ul>
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
                  
                  console.log('🔍 ANTES DE MOVER - Operación original:', operacionAMover);
                  console.log('🔍 ANTES DE MOVER - Cuotas originales:', operacionAMover.cuotas);
                  
                  // ✅ CRÍTICO: Crear la operación cancelada preservando TODO el historial
                  const operacionCancelada = {
                    // Datos básicos de la operación (preservar TODOS)
                    id: Date.now(), // Nuevo ID para la operación cancelada
                    idTipoOperacion: operacionAMover.idTipoOperacion,
                    fechaOperacion: operacionAMover.fechaOperacion,
                    numeroOperacion: operacionAMover.numeroOperacion,
                    capitalOriginal: operacionAMover.capitalOriginal,
                    interesOriginal: operacionAMover.interesOriginal || '',
                    plazoTotalEnPeriodos: operacionAMover.plazoTotalEnPeriodos,
                    idPeriodoPrestamo: operacionAMover.idPeriodoPrestamo,
                    fechaVencimiento: operacionAMover.fechaVencimiento,
                    idMoneda: operacionAMover.idMoneda,
                    idTipoTitular: operacionAMover.idTipoTitular,
                    
                    // Datos específicos de cancelación
                    idTipoCancelacion: determinarTipoCancelacion(operacionAMover),
                    fechaCancelacion: obtenerUltimaFechaPago(operacionAMover.cuotas) || new Date().toISOString().split('T')[0],
                    diasAtrasoMaximo: operacionAMover.diasAtrasoMaximo || 0,
                    diasAtrasoPromedio: operacionAMover.diasAtrasoPromedio || 0,
                    montoQuitaMora: '0.00',
                    montoQuitaInteres: '0.00',
                    montoQuitaCapital: '0.00',
                    montoInteresGenerado: '0.00',
                    
                    // ✅ CRÍTICO: Preservar EXACTAMENTE las cuotas con su historial COMPLETO
                    cuotas: operacionAMover.cuotas ? operacionAMover.cuotas.map(cuota => {
                      console.log(`🔍 Procesando cuota ${cuota.numero}:`, cuota);
                      
                      return {
                        numero: cuota.numero,
                        fechaVencimiento: cuota.fechaVencimiento,
                        montoCuota: cuota.montoCuota,
                        saldo: 0, // En canceladas todo está pagado
                        estado: 'pagado',
                        
                        // ✅ CRÍTICO: Preservar fecha de pago REAL (no vacía)
                        fechaPago: cuota.fechaPago || cuota.fechaVencimiento, 
                        
                        // ✅ CRÍTICO: Preservar días de atraso REALES
                        diasAtraso: cuota.diasAtraso || 0,
                        
                        // ✅ CRÍTICO: Preservar historial de pagos parciales
                        pagos: cuota.pagos ? cuota.pagos.map(pago => ({
                          fecha: pago.fecha,
                          monto: pago.monto,
                          diasAtraso: pago.diasAtraso || 0,
                          tipo: pago.tipo
                        })) : []
                      };
                    }) : []
                  };
                  
                  console.log('🔍 DESPUÉS DE CREAR - Operación cancelada:', operacionCancelada);
                  console.log('🔍 DESPUÉS DE CREAR - Cuotas preservadas:', operacionCancelada.cuotas);
                  
                  // Verificar que se preservó el historial
                  const cuotasConHistorial = operacionCancelada.cuotas.filter(c => c.fechaPago && c.fechaPago !== c.fechaVencimiento);
                  console.log('🔍 CUOTAS CON FECHA DE PAGO REAL:', cuotasConHistorial.length);
                  
                  operacionCancelada.cuotas.forEach((cuota, index) => {
                    console.log(`🔍 Cuota ${cuota.numero}: fechaPago="${cuota.fechaPago}", diasAtraso=${cuota.diasAtraso}`);
                  });
                  
                  // Agregar a canceladas y quitar de activas
                  const nuevasActivas = currentPerson.operacionesActivas.filter((_, i) => i !== operacionIndex);
                  const nuevasCanceladas = [...(currentPerson.operacionesCanceladas || []), operacionCancelada];
                  
                  setCurrentPerson({
                    ...currentPerson,
                    operacionesActivas: nuevasActivas,
                    operacionesCanceladas: nuevasCanceladas
                  });
                  
                  console.log('🔍 FINAL - Nuevas canceladas:', nuevasCanceladas);
                  console.log('🔍 FINAL - Historial en última cancelada:', nuevasCanceladas[nuevasCanceladas.length - 1].cuotas);
                  
                  const mensaje = cuotasConHistorial.length > 0 
                    ? `✅ Operación movida a canceladas con ${cuotasConHistorial.length} cuotas con historial de pagos preservado`
                    : '✅ Operación movida a canceladas';
                  
                  alert(mensaje);
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

              {/* Botones de Acción - Sticky con sombra */}
              <div className="sticky bottom-0 bg-white border-t pt-4 pb-4 mt-4 shadow-lg">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowPersonForm(false);
                      setIsEditMode(false);
                      setEditingPersonId(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 p-3 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarPersona}
                    className="flex-1 bg-orange-600 text-white p-3 rounded hover:bg-orange-700 transition-colors"
                    disabled={!currentPerson.nombreCompleto || !currentPerson.nroDoc || 
                            !currentPerson.fechaRegistradaDireccion || !currentPerson.fechaInformadoTrabajo ||
                            (currentPerson.idTipoDoc === '4' && !validarRUC(currentPerson.nroDoc))}
                  >
                    {isEditMode ? 'Actualizar' : 'Agregar'} Cliente
                  </button>
                </div>
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
            className="w-full bg-cyan-600 text-white p-4 rounded-lg shadow-lg flex items-center justify-center"
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