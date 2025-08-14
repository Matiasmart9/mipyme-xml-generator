import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, Archive, Clock, ChevronDown } from 'lucide-react';

const OperacionesCanceladas = ({ operaciones, onOperacionesChange, clienteId, globalOperationCounter, onUpdateGlobalCounter }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [operacionActual, setOperacionActual] = useState({
    idTipoOperacion: '1',
    fechaOperacion: '',
    numeroOperacion: '',
    capitalOriginal: '',
    interesOriginal: '',
    plazoTotalEnPeriodos: '',
    idPeriodoPrestamo: '5',
    fechaVencimiento: '',
    idMoneda: 'PYG',
    cuotas: [],
    // Campos específicos para canceladas
    idTipoCancelacion: '3', // Por defecto Normal
    fechaCancelacion: '',
    diasAtrasoMaximo: 0,
    diasAtrasoPromedio: 0,
    montoQuitaMora: '0.00',
    montoQuitaInteres: '0.00',
    montoQuitaCapital: '0.00',
    montoInteresGenerado: '0.00'
  });

  const tiposOperacion = [
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

  const periodosPresta = [
    { id: '2', label: 'Semanal' },
    { id: '4', label: 'Quincenal' },
    { id: '5', label: 'Mensual' },
    { id: '6', label: 'Bimensual' },
    { id: '7', label: 'Trimestral' },
    { id: '8', label: 'Cuatrimestral' },
    { id: '10', label: 'Anual' }
  ];

  const tiposCancelacion = [
    { id: '1', label: 'Anticipada', description: 'Canceló antes del vencimiento' },
    { id: '2', label: 'Con Mora', description: 'Tuvo días de atraso durante la operación' },
    { id: '3', label: 'Normal', description: 'Pagó puntualmente sin atrasos' }
  ];

  // Calcular días de atraso entre dos fechas
  const calcularDiasAtraso = (fechaVencimiento, fechaPago = null) => {
    const fechaComparacion = fechaPago ? new Date(fechaPago) : new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = fechaComparacion - vencimiento;
    return diferencia > 0 ? Math.floor(diferencia / (1000 * 60 * 60 * 24)) : 0;
  };

  // Generar cuotas automáticamente
  const generarCuotas = (plazoTotal, capitalOriginal, interesOriginal, fechaInicio, periodo) => {
    if (!plazoTotal || !capitalOriginal || !fechaInicio) return [];

    const cuotas = [];
    const montoCuota = Math.round((parseFloat(capitalOriginal) + parseFloat(interesOriginal || 0)) / parseInt(plazoTotal));
    const fechaBase = new Date(fechaInicio);

    for (let i = 1; i <= parseInt(plazoTotal); i++) {
      const fechaVencimiento = new Date(fechaBase);
      
      // Agregar períodos según el tipo seleccionado
      if (periodo === '5') { // Mensual
        fechaVencimiento.setMonth(fechaBase.getMonth() + i);
      } else if (periodo === '4') { // Quincenal
        fechaVencimiento.setDate(fechaBase.getDate() + (i * 15));
      } else if (periodo === '2') { // Semanal
        fechaVencimiento.setDate(fechaBase.getDate() + (i * 7));
      } else if (periodo === '7') { // Trimestral
        fechaVencimiento.setMonth(fechaBase.getMonth() + (i * 3));
      } else if (periodo === '6') { // Bimensual
        fechaVencimiento.setMonth(fechaBase.getMonth() + (i * 2));
      } else if (periodo === '8') { // Cuatrimestral
        fechaVencimiento.setMonth(fechaBase.getMonth() + (i * 4));
      } else if (periodo === '10') { // Anual
        fechaVencimiento.setFullYear(fechaBase.getFullYear() + i);
      } else { // Por defecto mensual
        fechaVencimiento.setMonth(fechaBase.getMonth() + i);
      }

      cuotas.push({
        numero: i,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        montoCuota,
        estado: 'pagado', // Todas las cuotas canceladas están pagadas
        fechaPago: '',
        diasAtraso: 0,
        pagos: []
      });
    }

    return cuotas;
  };

  // Determinar tipo de cancelación automáticamente
  const determinarTipoCancelacion = (cuotas, fechaCancelacion) => {
    if (!cuotas || cuotas.length === 0) return '3';

    let tuvoAtraso = false;
    let canceloAnticipada = false;
    let ultimaFechaPago = null;

    cuotas.forEach(cuota => {
      // Si tiene días de atraso registrados, considerarlo como que tuvo atraso
      if (cuota.diasAtraso && cuota.diasAtraso > 0) {
        tuvoAtraso = true;
      }
      
      // Buscar la última fecha de pago
      if (cuota.fechaPago && (!ultimaFechaPago || cuota.fechaPago > ultimaFechaPago)) {
        ultimaFechaPago = cuota.fechaPago;
      }
    });

    // Verificar si canceló anticipadamente
    if (fechaCancelacion && cuotas.length > 0) {
      const ultimaCuotaVencimiento = new Date(cuotas[cuotas.length - 1].fechaVencimiento);
      const fechaCancel = new Date(fechaCancelacion);
      if (fechaCancel < ultimaCuotaVencimiento) {
        canceloAnticipada = true;
      }
    }

    if (canceloAnticipada) return '1'; // Anticipada
    if (tuvoAtraso) return '2'; // Con Mora
    return '3'; // Normal
  };

  // Calcular métricas de atraso para operación cancelada
  const calcularMetricasCancelada = (cuotas) => {
    if (!cuotas || cuotas.length === 0) return { diasAtrasoMaximo: 0, diasAtrasoPromedio: 0 };

    let diasAtrasoMaximo = 0;
    let sumaDiasAtraso = 0;
    let cantidadCuotasConAtraso = 0;

    cuotas.forEach(cuota => {
      // Para operaciones canceladas, usar el atraso registrado en cada cuota
      const diasAtrasoEfectivo = cuota.diasAtraso || 0;
      
      if (diasAtrasoEfectivo > 0) {
        diasAtrasoMaximo = Math.max(diasAtrasoMaximo, diasAtrasoEfectivo);
        sumaDiasAtraso += diasAtrasoEfectivo;
        cantidadCuotasConAtraso++;
      }
    });

    const diasAtrasoPromedio = cantidadCuotasConAtraso > 0 ? 
      Math.round(sumaDiasAtraso / cantidadCuotasConAtraso) : 0;

    return { diasAtrasoMaximo, diasAtrasoPromedio };
  };

  // Generar cuotas cuando cambian los parámetros (SOLO para operaciones nuevas)
  useEffect(() => {
    // ✅ CRÍTICO: NO regenerar cuotas si estamos editando una operación existente
    if (editingIndex !== null) {
      console.log('🔍 EDITANDO - NO regenerar cuotas, mantener historial existente');
      return; // Salir sin hacer nada si estamos editando
    }

    // Solo generar cuotas para operaciones nuevas
    if (operacionActual.plazoTotalEnPeriodos && 
        operacionActual.capitalOriginal && operacionActual.fechaOperacion &&
        parseInt(operacionActual.plazoTotalEnPeriodos) > 0 &&
        parseFloat(operacionActual.capitalOriginal) > 0) {
      
      console.log('🔍 NUEVA OPERACIÓN - Generando cuotas automáticamente');
      const nuevasCuotas = generarCuotas(
        operacionActual.plazoTotalEnPeriodos,
        operacionActual.capitalOriginal,
        operacionActual.interesOriginal,
        operacionActual.fechaOperacion,
        operacionActual.idPeriodoPrestamo
      );
      
      setOperacionActual(prev => ({
        ...prev,
        cuotas: nuevasCuotas
      }));
    } else {
      // Si faltan datos, limpiar cuotas (solo para nuevas operaciones)
      setOperacionActual(prev => ({
        ...prev,
        cuotas: []
      }));
    }
  }, [
    operacionActual.plazoTotalEnPeriodos,
    operacionActual.capitalOriginal,
    operacionActual.interesOriginal,
    operacionActual.fechaOperacion,
    operacionActual.idPeriodoPrestamo,
    editingIndex // ✅ Agregar editingIndex como dependencia
  ]);

  // Actualizar métricas cuando cambian las cuotas o fecha de cancelación
  useEffect(() => {
    if (operacionActual.cuotas.length > 0) {
      console.log('🔍 CALCULANDO MÉTRICAS - Cuotas actuales:', operacionActual.cuotas);
      
      const metricas = calcularMetricasCancelada(operacionActual.cuotas);
      const tipoCancelacion = determinarTipoCancelacion(operacionActual.cuotas, operacionActual.fechaCancelacion);
      
      console.log('🔍 MÉTRICAS CALCULADAS:', metricas);
      console.log('🔍 TIPO CANCELACIÓN:', tipoCancelacion);
      
      setOperacionActual(prev => ({
        ...prev,
        diasAtrasoMaximo: metricas.diasAtrasoMaximo,
        diasAtrasoPromedio: metricas.diasAtrasoPromedio,
        idTipoCancelacion: tipoCancelacion
      }));
    }
  }, [
    operacionActual.cuotas.length,
    // ✅ CRÍTICO: Agregar dependencia de los días de atraso de cada cuota
    JSON.stringify(operacionActual.cuotas.map(c => ({
      diasAtraso: c.diasAtraso,
      fechaPago: c.fechaPago
    }))),
    operacionActual.fechaCancelacion
  ]);

  const resetOperacionActual = () => {
    setOperacionActual({
      idTipoOperacion: '1',
      fechaOperacion: '',
      numeroOperacion: '',
      capitalOriginal: '',
      interesOriginal: '',
      plazoTotalEnPeriodos: '',
      idPeriodoPrestamo: '5',
      fechaVencimiento: '',
      idMoneda: 'PYG',
      cuotas: [],
      idTipoCancelacion: '3',
      fechaCancelacion: '',
      diasAtrasoMaximo: 0,
      diasAtrasoPromedio: 0,
      montoQuitaMora: '0.00',
      montoQuitaInteres: '0.00',
      montoQuitaCapital: '0.00',
      montoInteresGenerado: '0.00'
    });
  };

    const abrirFormulario = () => {
    resetOperacionActual();
    setEditingIndex(null);
    setShowForm(true);
    setShowDropdown(false);
    
    // Generar número de operación automáticamente
    const numeroBase = globalOperationCounter.toString().padStart(3, '0');
    setOperacionActual(prev => ({
        ...prev,
        numeroOperacion: `N${numeroBase}`
    }));
    };

  const editarOperacion = (index) => {
    const operacionAEditar = operaciones[index];
    console.log('🔍 EDITANDO - Operación original:', operacionAEditar);
    console.log('🔍 EDITANDO - Cuotas a cargar:', operacionAEditar.cuotas);
    
    // ✅ CRÍTICO: Asegurar que las cuotas se carguen correctamente con TODO su historial
    const operacionConCuotasCompletas = {
      // Cargar TODOS los datos de la operación
      id: operacionAEditar.id,
      idTipoOperacion: operacionAEditar.idTipoOperacion,
      fechaOperacion: operacionAEditar.fechaOperacion,
      numeroOperacion: operacionAEditar.numeroOperacion,
      capitalOriginal: operacionAEditar.capitalOriginal,
      interesOriginal: operacionAEditar.interesOriginal || '',
      plazoTotalEnPeriodos: operacionAEditar.plazoTotalEnPeriodos,
      idPeriodoPrestamo: operacionAEditar.idPeriodoPrestamo,
      fechaVencimiento: operacionAEditar.fechaVencimiento,
      idMoneda: operacionAEditar.idMoneda,
      
      // Datos específicos de cancelación
      idTipoCancelacion: operacionAEditar.idTipoCancelacion,
      fechaCancelacion: operacionAEditar.fechaCancelacion,
      diasAtrasoMaximo: operacionAEditar.diasAtrasoMaximo || 0,
      diasAtrasoPromedio: operacionAEditar.diasAtrasoPromedio || 0,
      montoQuitaMora: operacionAEditar.montoQuitaMora || '0.00',
      montoQuitaInteres: operacionAEditar.montoQuitaInteres || '0.00',
      montoQuitaCapital: operacionAEditar.montoQuitaCapital || '0.00',
      montoInteresGenerado: operacionAEditar.montoInteresGenerado || '0.00',
      
      // ✅ CRÍTICO: Cargar cuotas con TODO su historial preservado
      cuotas: operacionAEditar.cuotas ? operacionAEditar.cuotas.map(cuota => ({
        numero: cuota.numero,
        fechaVencimiento: cuota.fechaVencimiento,
        montoCuota: cuota.montoCuota,
        saldo: 0, // En canceladas todo está pagado
        estado: 'pagado',
        
        // ✅ PRESERVAR fecha de pago EXACTA
        fechaPago: cuota.fechaPago || '',
        
        // ✅ PRESERVAR días de atraso EXACTOS
        diasAtraso: cuota.diasAtraso || 0,
        
        // ✅ PRESERVAR historial de pagos parciales
        pagos: cuota.pagos ? cuota.pagos.map(pago => ({
          fecha: pago.fecha,
          monto: pago.monto,
          diasAtraso: pago.diasAtraso || 0,
          tipo: pago.tipo
        })) : []
      })) : []
    };
    
    console.log('🔍 EDITANDO - Cuotas procesadas:', operacionConCuotasCompletas.cuotas);
    
    // Verificar que se cargó el historial
    const cuotasConHistorial = operacionConCuotasCompletas.cuotas.filter(c => c.fechaPago || c.diasAtraso > 0);
    console.log('🔍 EDITANDO - Cuotas con historial cargadas:', cuotasConHistorial.length);
    
    // Mostrar detalles del historial cargado
    operacionConCuotasCompletas.cuotas.forEach((cuota, cuotaIndex) => {
      if (cuota.fechaPago || cuota.diasAtraso > 0) {
        console.log(`🔍 Cuota ${cuota.numero} cargada: Fecha Pago=${cuota.fechaPago}, Días Atraso=${cuota.diasAtraso}`);
      }
    });
    
    setOperacionActual(operacionConCuotasCompletas);
    setEditingIndex(index);
    setShowForm(true);
  };

  const guardarOperacion = () => {
    if (!operacionActual.numeroOperacion || !operacionActual.capitalOriginal || !operacionActual.fechaCancelacion) {
      alert('Número de operación, capital y fecha de cancelación son requeridos');
      return;
    }

    console.log('🔍 GUARDANDO - Estado actual:', operacionActual);
    console.log('🔍 GUARDANDO - Cuotas actuales:', operacionActual.cuotas);

    // ✅ CRÍTICO: Crear operación completa preservando TODO el historial
    const operacionCompleta = {
      // Todos los datos básicos de la operación
      id: editingIndex !== null ? operaciones[editingIndex].id : Date.now(),
      idTipoOperacion: operacionActual.idTipoOperacion,
      fechaOperacion: operacionActual.fechaOperacion,
      numeroOperacion: operacionActual.numeroOperacion,
      capitalOriginal: operacionActual.capitalOriginal,
      interesOriginal: operacionActual.interesOriginal || '',
      plazoTotalEnPeriodos: operacionActual.plazoTotalEnPeriodos,
      idPeriodoPrestamo: operacionActual.idPeriodoPrestamo,
      fechaVencimiento: operacionActual.fechaVencimiento,
      idMoneda: operacionActual.idMoneda,
      
      // Datos específicos de cancelación
      idTipoCancelacion: operacionActual.idTipoCancelacion,
      fechaCancelacion: operacionActual.fechaCancelacion,
      diasAtrasoMaximo: operacionActual.diasAtrasoMaximo || 0,
      diasAtrasoPromedio: operacionActual.diasAtrasoPromedio || 0,
      montoQuitaMora: operacionActual.montoQuitaMora || '0.00',
      montoQuitaInteres: operacionActual.montoQuitaInteres || '0.00',
      montoQuitaCapital: operacionActual.montoQuitaCapital || '0.00',
      montoInteresGenerado: operacionActual.montoInteresGenerado || '0.00',
      
      // ✅ CRÍTICO: Preservar las cuotas EXACTAMENTE como están con su historial
      cuotas: operacionActual.cuotas ? operacionActual.cuotas.map(cuota => ({
        numero: cuota.numero,
        fechaVencimiento: cuota.fechaVencimiento,
        montoCuota: cuota.montoCuota,
        saldo: 0, // En canceladas todo está pagado
        estado: 'pagado',
        
        // ✅ CRÍTICO: Preservar fecha de pago EXACTA
        fechaPago: cuota.fechaPago || '', 
        
        // ✅ CRÍTICO: Preservar días de atraso EXACTOS
        diasAtraso: cuota.diasAtraso || 0,
        
        // ✅ CRÍTICO: Preservar historial de pagos parciales si existe
        pagos: cuota.pagos ? cuota.pagos.map(pago => ({
          fecha: pago.fecha,
          monto: pago.monto,
          diasAtraso: pago.diasAtraso || 0,
          tipo: pago.tipo
        })) : []
      })) : []
    };

    console.log('🔍 OPERACIÓN COMPLETA CREADA:', operacionCompleta);
    console.log('🔍 CUOTAS EN OPERACIÓN COMPLETA:', operacionCompleta.cuotas);
    
    // Verificar que se preservó el historial antes de guardar
    const cuotasConHistorial = operacionCompleta.cuotas.filter(c => c.fechaPago || c.diasAtraso > 0);
    console.log('🔍 CUOTAS CON HISTORIAL A GUARDAR:', cuotasConHistorial.length);
    
    // Mostrar detalles del historial
    operacionCompleta.cuotas.forEach((cuota, index) => {
      if (cuota.fechaPago || cuota.diasAtraso > 0) {
        console.log(`🔍 Cuota ${cuota.numero}: Fecha Pago=${cuota.fechaPago}, Días Atraso=${cuota.diasAtraso}`);
      }
    });

    let nuevasOperaciones;
    if (editingIndex !== null) {
      nuevasOperaciones = [...operaciones];
      nuevasOperaciones[editingIndex] = operacionCompleta;
    } else {
      nuevasOperaciones = [...operaciones, operacionCompleta];
      if (onUpdateGlobalCounter) {
        onUpdateGlobalCounter();
      }
    }

    console.log('🔍 NUEVAS OPERACIONES CANCELADAS:', nuevasOperaciones);

    onOperacionesChange(nuevasOperaciones);
    setShowForm(false);
    setEditingIndex(null);
    
    // Mensaje de confirmación con detalles
    const mensaje = cuotasConHistorial.length > 0 
      ? `✅ Operación cancelada guardada con ${cuotasConHistorial.length} cuotas con historial de pagos`
      : '✅ Operación cancelada guardada';
    
    alert(mensaje);
  };

  const eliminarOperacion = (index) => {
    if (window.confirm('¿Está seguro de eliminar esta operación cancelada?')) {
      const nuevasOperaciones = operaciones.filter((_, i) => i !== index);
      onOperacionesChange(nuevasOperaciones);
    }
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PY').format(monto);
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

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-green-600 border-b pb-2">
          <Archive className="inline mr-2" size={18} />
          Operaciones Canceladas ({operaciones.length})
        </h3>
        
        <button
          onClick={abrirFormulario}
          className="bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Agregar Cancelada
        </button>
      </div>

      {/* Lista de Operaciones Canceladas */}
      {operaciones.length > 0 && (
        <div className="space-y-3 mb-4">
          {operaciones.map((operacion, index) => (
            <div key={operacion.id || index} className="bg-green-50 p-3 rounded border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium text-green-800">{operacion.numeroOperacion}</h4>
                    <span className="ml-2 bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                      <CheckCircle size={12} className="inline mr-1" />
                      {tiposCancelacion.find(t => t.id === operacion.idTipoCancelacion)?.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Capital Original:</span>
                      <span className="font-medium ml-1">
                        Gs. {formatearMonto(operacion.capitalOriginal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">F. Cancelación:</span>
                      <span className="ml-1">{operacion.fechaCancelacion}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tipo:</span>
                      <span className="ml-1 text-xs">
                        {tiposOperacion.find(t => t.id === operacion.idTipoOperacion)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Plazo:</span>
                      <span className="ml-1">
                        {operacion.plazoTotalEnPeriodos} 
                        <span className="text-xs text-gray-500 ml-1">
                          {periodosPresta.find(p => p.id === operacion.idPeriodoPrestamo)?.label?.toLowerCase()}
                        </span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Métricas de atraso */}
                  <div className="mt-2 text-xs text-gray-600 grid grid-cols-3 gap-2">
                    <div>Atraso Max: <span className="font-medium">{operacion.diasAtrasoMaximo}</span></div>
                    <div>Atraso Prom: <span className="font-medium">{operacion.diasAtrasoPromedio}</span></div>
                    <div>Cuotas: <span className="font-medium">{operacion.cuotas?.length || 0}</span></div>
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => editarOperacion(index)}
                    className="text-blue-500 p-1"
                    title="Editar"
                  >
                    <Clock size={16} />
                  </button>
                  <button
                    onClick={() => eliminarOperacion(index)}
                    className="text-red-500 p-1"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {operaciones.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Archive size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay operaciones canceladas</p>
          <p className="text-xs">Use "Agregar Cancelada" para registrar operaciones completadas</p>
        </div>
      )}

      {/* Formulario de Operación Cancelada */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="bg-white m-4 mt-8 rounded-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-green-600 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-bold">
                {editingIndex !== null ? 'Editar' : 'Agregar'} Operación Cancelada
              </h3>
              <p className="text-sm opacity-90">
                Registro de operación completamente pagada
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Datos Básicos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Operación *</label>
                  <select
                    value={operacionActual.idTipoOperacion}
                    onChange={(e) => setOperacionActual({...operacionActual, idTipoOperacion: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    {tiposOperacion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Operación *</label>
                  <input
                    type="date"
                    value={operacionActual.fechaOperacion}
                    onChange={(e) => setOperacionActual({...operacionActual, fechaOperacion: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

                <div>
                <label className="block text-sm font-medium mb-1">Número de Operación *</label>
                <input
                    type="text"
                    value={operacionActual.numeroOperacion}
                    onChange={(e) => setOperacionActual({...operacionActual, numeroOperacion: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="N001, N002, etc."
                />
                <p className="text-xs text-gray-600 mt-1">
                    Generado automáticamente, puede modificarlo con el número original de la operación
                </p>
                </div>

              {/* Montos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Capital Original (Gs.) *</label>
                  <input
                    type="number"
                    value={operacionActual.capitalOriginal}
                    onChange={(e) => setOperacionActual({...operacionActual, capitalOriginal: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="5000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interés Original (Gs.)</label>
                  <input
                    type="number"
                    value={operacionActual.interesOriginal}
                    onChange={(e) => setOperacionActual({...operacionActual, interesOriginal: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="1500000"
                  />
                </div>
              </div>

              {/* Plazos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Plazo Total (períodos) *</label>
                  <input
                    type="number"
                    value={operacionActual.plazoTotalEnPeriodos}
                    onChange={(e) => setOperacionActual({...operacionActual, plazoTotalEnPeriodos: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Período</label>
                  <select
                    value={operacionActual.idPeriodoPrestamo}
                    onChange={(e) => setOperacionActual({...operacionActual, idPeriodoPrestamo: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    {periodosPresta.map(periodo => (
                      <option key={periodo.id} value={periodo.id}>{periodo.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha de Cancelación y Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha Cancelación *</label>
                  <input
                    type="date"
                    value={operacionActual.fechaCancelacion}
                    onChange={(e) => setOperacionActual({...operacionActual, fechaCancelacion: e.target.value})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Cancelación</label>
                  <select
                    value={operacionActual.idTipoCancelacion}
                    onChange={(e) => setOperacionActual({...operacionActual, idTipoCancelacion: e.target.value})}
                    className="w-full p-2 border rounded bg-gray-50"
                    disabled
                  >
                    {tiposCancelacion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-1">
                    Se determina automáticamente según el historial de pagos
                  </p>
                </div>
              </div>

              {/* Información adicional */}
              <div>
                <label className="block text-sm font-medium mb-1">Moneda</label>
                <select
                  value={operacionActual.idMoneda}
                  onChange={(e) => setOperacionActual({...operacionActual, idMoneda: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="PYG">Guaraníes (PYG)</option>
                  <option value="USD">Dólares (USD)</option>
                  <option value="BRL">Reales (BRL)</option>
                </select>
              </div>

              {/* Historial de Cuotas - Marcar pagos realizados */}
              {operacionActual.cuotas.length > 0 && (
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-medium mb-3 text-blue-700">
                    Historial de Pagos de la Operación Cancelada ({operacionActual.cuotas.length} cuotas)
                  </h4>
                  
                  {/* Información del resumen */}
                  <div className="mb-3 text-sm text-blue-700 bg-white p-2 rounded">
                    <p><strong>Resumen de la operación:</strong></p>
                    <p>• Capital: Gs. {formatearMonto(operacionActual.capitalOriginal || 0)}</p>
                    <p>• Interés: Gs. {formatearMonto(operacionActual.interesOriginal || 0)}</p>
                    <p>• Cuota: Gs. {formatearMonto(operacionActual.cuotas[0]?.montoCuota || 0)}</p>
                    <p>• Tipo cancelación: <strong>{tiposCancelacion.find(t => t.id === operacionActual.idTipoCancelacion)?.label}</strong></p>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-blue-100">
                          <th className="p-2 text-left">Cuota</th>
                          <th className="p-2 text-left">Vencimiento</th>
                          <th className="p-2 text-right">Monto</th>
                          <th className="p-2 text-left">F. Pago *</th>
                          <th className="p-2 text-center">Días Atraso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operacionActual.cuotas.map((cuota, index) => (
                          <tr key={index} className="border-b border-blue-200">
                            <td className="p-2">{cuota.numero}</td>
                            <td className="p-2">{cuota.fechaVencimiento}</td>
                            <td className="p-2 text-right">Gs. {formatearMonto(cuota.montoCuota)}</td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={cuota.fechaPago || ''}
                                onChange={(e) => {
                                  const nuevasCuotas = [...operacionActual.cuotas];
                                  const diasAtraso = e.target.value ? 
                                    calcularDiasAtraso(cuota.fechaVencimiento, e.target.value) : 0;
                                  nuevasCuotas[index] = {
                                    ...cuota,
                                    fechaPago: e.target.value,
                                    diasAtraso: diasAtraso
                                  };
                                  setOperacionActual(prev => ({
                                    ...prev,
                                    cuotas: nuevasCuotas
                                  }));
                                }}
                                className="w-full p-1 border rounded text-xs"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={cuota.diasAtraso || ''}
                                onChange={(e) => {
                                  const nuevasCuotas = [...operacionActual.cuotas];
                                  nuevasCuotas[index] = {
                                    ...cuota,
                                    diasAtraso: parseInt(e.target.value) || 0
                                  };
                                  
                                  // ✅ AGREGAR: Recalcular métricas inmediatamente
                                  const metricas = calcularMetricasCancelada(nuevasCuotas);
                                  const tipoCancelacion = determinarTipoCancelacion(nuevasCuotas, operacionActual.fechaCancelacion);
                                  
                                  setOperacionActual(prev => ({
                                    ...prev,
                                    cuotas: nuevasCuotas,
                                    diasAtrasoMaximo: metricas.diasAtrasoMaximo,
                                    diasAtrasoPromedio: metricas.diasAtrasoPromedio,
                                    idTipoCancelacion: tipoCancelacion
                                  }));
                                }}
                                className="w-16 p-1 border rounded text-xs text-center"
                                placeholder="0"
                                min="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                    <p><strong>Instrucciones para operación cancelada:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Ingrese la fecha real de pago para cada cuota</li>
                      <li>Los días de atraso se calculan automáticamente, pero puede ajustarlos</li>
                      <li>Estos datos se usan para calcular el <strong>Atraso Máximo</strong> y <strong>Atraso Promedio</strong></li>
                      <li>El tipo de cancelación se determina automáticamente según los atrasos</li>
                      <li>La fecha de cancelación debería ser la fecha del último pago realizado</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Información Calculada */}
              {operacionActual.cuotas.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-3 text-gray-700">Información Calculada</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tipo Cancelación:</span>
                      <span className="ml-1 font-medium text-green-600">
                        {tiposCancelacion.find(t => t.id === operacionActual.idTipoCancelacion)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Última F. Pago:</span>
                      <span className="ml-1 font-medium">{obtenerUltimaFechaPago(operacionActual.cuotas) || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Atraso Máximo:</span>
                      <span className={`ml-1 font-medium ${operacionActual.diasAtrasoMaximo > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {operacionActual.diasAtrasoMaximo} días
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Atraso Promedio:</span>
                      <span className={`ml-1 font-medium ${operacionActual.diasAtrasoPromedio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {operacionActual.diasAtrasoPromedio} días
                      </span>
                    </div>
                  </div>
                  
                  {/* Preview de cómo aparecerá en el XML */}
                  <div className="mt-3 bg-yellow-50 p-2 rounded">
                    <p className="text-xs text-yellow-800"><strong>Preview XML:</strong></p>
                    <p className="text-xs font-mono text-yellow-700">
                      DiasAtrasoMaximo="{operacionActual.diasAtrasoMaximo}" 
                      DiasAtrasoPromedio="{operacionActual.diasAtrasoPromedio}"
                    </p>
                  </div>
                </div>
              )}

              {/* Montos de Quita (Opcionales) */}
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-medium mb-3 text-yellow-700">Montos de Quita (Opcional)</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium mb-1">Quita Mora (Gs.)</label>
                    <input
                      type="number"
                      value={operacionActual.montoQuitaMora.replace('.00', '')}
                      onChange={(e) => setOperacionActual({...operacionActual, montoQuitaMora: `${e.target.value}.00`})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Quita Interés (Gs.)</label>
                    <input
                      type="number"
                      value={operacionActual.montoQuitaInteres.replace('.00', '')}
                      onChange={(e) => setOperacionActual({...operacionActual, montoQuitaInteres: `${e.target.value}.00`})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Quita Capital (Gs.)</label>
                    <input
                      type="number"
                      value={operacionActual.montoQuitaCapital.replace('.00', '')}
                      onChange={(e) => setOperacionActual({...operacionActual, montoQuitaCapital: `${e.target.value}.00`})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Interés Generado (Gs.)</label>
                    <input
                      type="number"
                      value={operacionActual.montoInteresGenerado.replace('.00', '')}
                      onChange={(e) => setOperacionActual({...operacionActual, montoInteresGenerado: `${e.target.value}.00`})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Deje en 0 si no hubo quitas o descuentos especiales
                </p>
              </div>

              {/* Botones */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingIndex(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarOperacion}
                  className="flex-1 bg-green-600 text-white p-3 rounded"
                  disabled={!operacionActual.numeroOperacion || !operacionActual.capitalOriginal || !operacionActual.fechaCancelacion}
                >
                  {editingIndex !== null ? 'Actualizar' : 'Agregar'} Operación Cancelada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperacionesCanceladas;