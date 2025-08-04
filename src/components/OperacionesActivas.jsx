import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, AlertTriangle, DollarSign, Clock, ChevronDown, Eye, CreditCard, CheckCircle } from 'lucide-react';

const OperacionesActivas = ({ operaciones, onOperacionesChange, clienteId, globalOperationCounter = 1, onUpdateGlobalCounter, onMoverACancelada }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tipoOperacion, setTipoOperacion] = useState('nueva');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCuotas, setShowCuotas] = useState({});
  const [editingCuota, setEditingCuota] = useState(null);

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
    idTipoTitular: '1',
    cuotas: [],
    // Campos calculados
    capitalAdeudadoActual: '',
    interesPendienteDeDevengar: '',
    capitalAtrasado: '0',
    interesAtrasado: '0',
    moraPendienteDePago: '0',
    moraPaga: '0',
    plazoRemanenteEnPeriodos: '',
    diasAtraso: 0,
    diasAtrasoMaximo: 0,
    diasAtrasoPromedio: 0
  });

  const [pagoActual, setPagoActual] = useState({
    tipoPago: 'totalidad',
    montoPago: '',
    fechaPago: '',
    diasAtraso: 0
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

  const tiposTitular = [
    { id: '1', label: 'Titular/Codeudor' },
    { id: '2', label: 'Garante Solidario' }
  ];

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
        saldo: montoCuota,
        estado: 'sin_vencer', // sin_vencer, vencido, pagado
        fechaPago: '',
        diasAtraso: 0,
        pagos: []
      });
    }

    return cuotas;
  };

  // Calcular días de atraso entre dos fechas
  const calcularDiasAtraso = (fechaVencimiento, fechaPago = null) => {
    const fechaComparacion = fechaPago ? new Date(fechaPago) : new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = fechaComparacion - vencimiento;
    return diferencia > 0 ? Math.floor(diferencia / (1000 * 60 * 60 * 24)) : 0;
  };

  // Actualizar estados de cuotas
  const actualizarEstadosCuotas = (cuotas) => {
    const hoy = new Date();
    return cuotas.map(cuota => {
      // Si ya está marcada como pagada, mantener ese estado
      if (cuota.estado === 'pagado' || cuota.saldo <= 0) {
        return { ...cuota, estado: 'pagado' };
      } else if (new Date(cuota.fechaVencimiento) < hoy) {
        return { 
          ...cuota, 
          estado: 'vencido',
          diasAtraso: calcularDiasAtraso(cuota.fechaVencimiento)
        };
      } else {
        return { ...cuota, estado: 'sin_vencer', diasAtraso: 0 };
      }
    });
  };

  // Calcular métricas de atraso
  const calcularMetricasAtraso = (cuotas) => {
    let diasAtrasoMaximo = 0;
    let sumaDiasAtraso = 0;
    let cantidadCuotasConAtraso = 0;
    let diasAtrasoActual = 0;

    const hoy = new Date();

    cuotas.forEach(cuota => {
      let diasAtrasoEfectivo = 0;

      if (cuota.estado === 'pagado') {
        // Para cuotas pagadas, usar el atraso registrado en el momento del pago
        diasAtrasoEfectivo = cuota.diasAtraso || 0;
      } else if (cuota.estado === 'vencido') {
        // Para cuotas vencidas, calcular atraso actual desde la fecha de vencimiento hasta hoy
        diasAtrasoEfectivo = calcularDiasAtraso(cuota.fechaVencimiento);
        // Actualizar el atraso en la cuota para que se muestre correctamente
        cuota.diasAtraso = diasAtrasoEfectivo;
      }

      // Si hay atraso (mayor a 0), incluir en cálculos
      if (diasAtrasoEfectivo > 0) {
        diasAtrasoMaximo = Math.max(diasAtrasoMaximo, diasAtrasoEfectivo);
        sumaDiasAtraso += diasAtrasoEfectivo;
        cantidadCuotasConAtraso++;

        // El atraso actual es el mayor atraso de las cuotas vencidas NO pagadas
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

  // Calcular capital adeudado
  const calcularCapitalAdeudado = (cuotas) => {
    return cuotas.reduce((total, cuota) => total + cuota.saldo, 0);
  };

  // Generar número de operación automático
  useEffect(() => {
    if (!operacionActual.numeroOperacion && !editingIndex && tipoOperacion === 'nueva') {
      const numeroBase = globalOperationCounter.toString().padStart(3, '0');
      setOperacionActual(prev => ({
        ...prev,
        numeroOperacion: `N${numeroBase}`
      }));
    }
  }, [globalOperationCounter, editingIndex, tipoOperacion]);

  // Generar cuotas cuando cambian los parámetros
  useEffect(() => {
    if (operacionActual.plazoTotalEnPeriodos && 
        operacionActual.capitalOriginal && operacionActual.fechaOperacion) {
      const nuevasCuotas = generarCuotas(
        operacionActual.plazoTotalEnPeriodos,
        operacionActual.capitalOriginal,
        operacionActual.interesOriginal,
        operacionActual.fechaOperacion,
        operacionActual.idPeriodoPrestamo
      );
      setOperacionActual(prev => ({
        ...prev,
        cuotas: actualizarEstadosCuotas(nuevasCuotas)
      }));
    }
  }, [
    operacionActual.plazoTotalEnPeriodos,
    operacionActual.capitalOriginal,
    operacionActual.interesOriginal,
    operacionActual.fechaOperacion,
    operacionActual.idPeriodoPrestamo
  ]);

  // Actualizar métricas cuando cambian las cuotas
  useEffect(() => {
    if (operacionActual.cuotas.length > 0) {
      const cuotasActualizadas = actualizarEstadosCuotas(operacionActual.cuotas);
      const metricas = calcularMetricasAtraso(cuotasActualizadas);
      const capitalAdeudado = calcularCapitalAdeudado(cuotasActualizadas);
      
      setOperacionActual(prev => ({
        ...prev,
        cuotas: cuotasActualizadas,
        capitalAdeudadoActual: capitalAdeudado,
        diasAtraso: metricas.diasAtraso,
        diasAtrasoMaximo: metricas.diasAtrasoMaximo,
        diasAtrasoPromedio: metricas.diasAtrasoPromedio,
        plazoRemanenteEnPeriodos: cuotasActualizadas.filter(c => c.saldo > 0).length
      }));
    }
  }, [operacionActual.cuotas.length, operacionActual.cuotas]);

  // Forzar actualización de métricas cada vez que se monta el componente
  useEffect(() => {
    if (operaciones.length > 0) {
      const nuevasOperaciones = operaciones.map(operacion => {
        if (operacion.cuotas && operacion.cuotas.length > 0) {
          const cuotasActualizadas = actualizarEstadosCuotas([...operacion.cuotas]);
          const metricas = calcularMetricasAtraso(cuotasActualizadas);
          const capitalAdeudado = calcularCapitalAdeudado(cuotasActualizadas);
          
          return {
            ...operacion,
            cuotas: cuotasActualizadas,
            capitalAdeudadoActual: capitalAdeudado,
            diasAtraso: metricas.diasAtraso,
            diasAtrasoMaximo: metricas.diasAtrasoMaximo,
            diasAtrasoPromedio: metricas.diasAtrasoPromedio,
            plazoRemanenteEnPeriodos: cuotasActualizadas.filter(c => c.saldo > 0).length
          };
        }
        return operacion;
      });
      
      // Solo actualizar si hay cambios
      const hayChangios = nuevasOperaciones.some((op, index) => 
        op.diasAtraso !== operaciones[index]?.diasAtraso ||
        op.diasAtrasoMaximo !== operaciones[index]?.diasAtrasoMaximo ||
        op.diasAtrasoPromedio !== operaciones[index]?.diasAtrasoPromedio
      );
      
      if (hayChangios) {
        onOperacionesChange(nuevasOperaciones);
      }
    }
  }, []);

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
      idTipoTitular: '1',
      cuotas: [],
      capitalAdeudadoActual: '',
      interesPendienteDeDevengar: '',
      capitalAtrasado: '0',
      interesAtrasado: '0',
      moraPendienteDePago: '0',
      moraPaga: '0',
      plazoRemanenteEnPeriodos: '',
      diasAtraso: 0,
      diasAtrasoMaximo: 0,
      diasAtrasoPromedio: 0
    });
  };

  const seleccionarTipoOperacion = (tipo) => {
    setTipoOperacion(tipo);
    setShowDropdown(false);
    resetOperacionActual();
    setEditingIndex(null);
    setShowForm(true);
    
    // Para ambos tipos, generar número automáticamente pero permitir edición
    const numeroBase = globalOperationCounter.toString().padStart(3, '0');
    setOperacionActual(prev => ({
      ...prev,
      numeroOperacion: `N${numeroBase}`
    }));
  };

  const editarOperacion = (index) => {
    setOperacionActual(operaciones[index]);
    setEditingIndex(index);
    setTipoOperacion('existente');
    setShowForm(true);
  };

  const registrarPago = (operacionIndex, cuotaIndex) => {
    const operacion = operaciones[operacionIndex];
    const cuota = operacion.cuotas[cuotaIndex];
    
    if (!pagoActual.fechaPago) {
      alert('Debe ingresar la fecha de pago');
      return;
    }

    const diasAtraso = calcularDiasAtraso(cuota.fechaVencimiento, pagoActual.fechaPago);
    let montoPago = pagoActual.tipoPago === 'totalidad' ? cuota.saldo : parseFloat(pagoActual.montoPago);

    if (pagoActual.tipoPago === 'parcial' && (!pagoActual.montoPago || montoPago <= 0)) {
      alert('Debe ingresar un monto válido para pago parcial');
      return;
    }

    if (montoPago > cuota.saldo) {
      alert('El monto no puede ser mayor al saldo de la cuota');
      return;
    }

    const nuevasOperaciones = [...operaciones];
    const nuevaCuota = { ...cuota };
    
    // Registrar el pago
    nuevaCuota.pagos.push({
      fecha: pagoActual.fechaPago,
      monto: montoPago,
      diasAtraso: diasAtraso,
      tipo: pagoActual.tipoPago
    });

    // Actualizar saldo
    nuevaCuota.saldo = cuota.saldo - montoPago;
    
    // Si se pagó completamente, marcar fecha de pago y días de atraso
    if (nuevaCuota.saldo <= 0) {
      nuevaCuota.fechaPago = pagoActual.fechaPago;
      nuevaCuota.diasAtraso = diasAtraso;
      nuevaCuota.estado = 'pagado';
    } else {
      // Para pagos parciales, también actualizar el atraso si cambió la fecha
      nuevaCuota.diasAtraso = diasAtraso;
    }

    nuevasOperaciones[operacionIndex].cuotas[cuotaIndex] = nuevaCuota;

    // Primero actualizar estados de todas las cuotas
    let cuotasActualizadas = actualizarEstadosCuotas(nuevasOperaciones[operacionIndex].cuotas);

    // Luego recalcular métricas con las cuotas actualizadas
    const metricas = calcularMetricasAtraso(cuotasActualizadas);
    const capitalAdeudado = calcularCapitalAdeudado(cuotasActualizadas);

    nuevasOperaciones[operacionIndex] = {
      ...nuevasOperaciones[operacionIndex],
      cuotas: cuotasActualizadas,
      capitalAdeudadoActual: capitalAdeudado,
      diasAtraso: metricas.diasAtraso,
      diasAtrasoMaximo: metricas.diasAtrasoMaximo,
      diasAtrasoPromedio: metricas.diasAtrasoPromedio,
      plazoRemanenteEnPeriodos: cuotasActualizadas.filter(c => c.saldo > 0).length
    };

    onOperacionesChange(nuevasOperaciones);
    
    // Reset form
    setPagoActual({
      tipoPago: 'totalidad',
      montoPago: '',
      fechaPago: '',
      diasAtraso: 0
    });
    setEditingCuota(null);
  };

  const guardarOperacion = () => {
    if (!operacionActual.numeroOperacion || !operacionActual.capitalOriginal) {
      alert('Número de operación y capital son requeridos');
      return;
    }

    const operacionCompleta = {
      ...operacionActual,
      id: editingIndex !== null ? operaciones[editingIndex].id : Date.now()
    };

    let nuevasOperaciones;
    if (editingIndex !== null) {
      nuevasOperaciones = [...operaciones];
      nuevasOperaciones[editingIndex] = operacionCompleta;
    } else {
      nuevasOperaciones = [...operaciones, operacionCompleta];
      // Solo incrementar el contador global si es una operación nueva
      if (tipoOperacion === 'nueva' && onUpdateGlobalCounter) {
        onUpdateGlobalCounter();
      }
    }

    onOperacionesChange(nuevasOperaciones);
    setShowForm(false);
    setEditingIndex(null);
    setTipoOperacion('nueva');
  };

  const eliminarOperacion = (index) => {
    if (window.confirm('¿Está seguro de eliminar esta operación?')) {
      const nuevasOperaciones = operaciones.filter((_, i) => i !== index);
      onOperacionesChange(nuevasOperaciones);
    }
  };

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PY').format(monto);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'pagado': return 'text-green-600 bg-green-100';
      case 'vencido': return 'text-red-600 bg-red-100';
      case 'sin_vencer': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case 'pagado': return 'Pagado';
      case 'vencido': return 'Vencido';
      case 'sin_vencer': return 'Sin vencer';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-red-600 border-b pb-2">
          <DollarSign className="inline mr-2" size={18} />
          Operaciones Activas ({operaciones.length})
        </h3>
        
        {/* Botón con desplegable */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-red-500 text-white px-3 py-2 rounded text-sm flex items-center"
          >
            <Plus size={16} className="mr-1" />
            Agregar Operación
            <ChevronDown size={14} className="ml-1" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => seleccionarTipoOperacion('nueva')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b"
              >
                <div className="font-medium text-green-600">Nueva Operación</div>
                <div className="text-xs text-gray-500">Crear préstamo desde cero</div>
              </button>
              <button
                onClick={() => seleccionarTipoOperacion('existente')}
                className="w-full text-left px-4 py-3 hover:bg-gray-50"
              >
                <div className="font-medium text-blue-600">Cargar Operación Existente</div>
                <div className="text-xs text-gray-500">Préstamo con historial de pagos</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Operaciones */}
      {operaciones.length > 0 && (
        <div className="space-y-3 mb-4">
          {operaciones.map((operacion, index) => (
            <div key={operacion.id || index} className="bg-red-50 p-3 rounded border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium text-red-800">{operacion.numeroOperacion}</h4>
                    {operacion.diasAtraso > 0 && (
                      <span className="ml-2 bg-red-200 text-red-800 text-xs px-2 py-1 rounded">
                        <AlertTriangle size={12} className="inline mr-1" />
                        {operacion.diasAtraso} días atraso
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Capital Original:</span>
                      <span className="font-medium ml-1">
                        Gs. {formatearMonto(operacion.capitalOriginal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Capital Adeudado:</span>
                      <span className="font-medium ml-1">
                        Gs. {formatearMonto(operacion.capitalAdeudadoActual)}
                      </span>
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
                        <span className="text-blue-600 font-medium">{operacion.plazoRemanenteEnPeriodos}</span>
                        /{operacion.plazoTotalEnPeriodos} 
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
                    onClick={() => setShowCuotas({...showCuotas, [index]: !showCuotas[index]})}
                    className="text-purple-500 p-1"
                    title="Ver cuotas"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => editarOperacion(index)}
                    className="text-blue-500 p-1"
                    title="Editar"
                  >
                    <Clock size={16} />
                  </button>
                  {operacion.capitalAdeudadoActual === 0 && onMoverACancelada && (
                    <button
                      onClick={() => {
                        if (window.confirm('¿Mover esta operación a canceladas? Esta acción no se puede deshacer.')) {
                          onMoverACancelada(index);
                        }
                      }}
                      className="text-green-500 p-1"
                      title="Mover a canceladas"
                    >
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => eliminarOperacion(index)}
                    className="text-red-500 p-1"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Tabla de Cuotas */}
              {showCuotas[index] && operacion.cuotas && (
                <div className="mt-4 border-t pt-4">
                  <h5 className="font-medium mb-3 text-gray-700">Historial de Cuotas</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Cuota</th>
                          <th className="p-2 text-left">F. Venc.</th>
                          <th className="p-2 text-right">Monto</th>
                          <th className="p-2 text-right">Saldo</th>
                          <th className="p-2 text-center">Estado</th>
                          <th className="p-2 text-left">F. Pago</th>
                          <th className="p-2 text-center">Atraso</th>
                          <th className="p-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operacion.cuotas.map((cuota, cuotaIndex) => (
                          <tr key={cuotaIndex} className="border-b">
                            <td className="p-2">{cuota.numero}</td>
                            <td className="p-2">{cuota.fechaVencimiento}</td>
                            <td className="p-2 text-right">Gs. {formatearMonto(cuota.montoCuota)}</td>
                            <td className="p-2 text-right font-medium">
                              Gs. {formatearMonto(cuota.saldo)}
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(cuota.estado)}`}>
                                {getEstadoTexto(cuota.estado)}
                              </span>
                            </td>
                            <td className="p-2">{cuota.fechaPago || '-'}</td>
                            <td className="p-2 text-center">
                              {cuota.diasAtraso > 0 ? (
                                <span className="text-red-600 font-medium">{cuota.diasAtraso}</span>
                              ) : '-'}
                            </td>
                            <td className="p-2 text-center">
                              {cuota.saldo > 0 && (
                                <button
                                  onClick={() => setEditingCuota(`${index}-${cuotaIndex}`)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Registrar pago"
                                >
                                  <CreditCard size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {operaciones.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay operaciones activas</p>
          <p className="text-xs">Use "Agregar Operación" para comenzar</p>
        </div>
      )}

      {/* Modal de Pago */}
      {editingCuota && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg m-4 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Registrar Pago</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Pago</label>
                <select
                  value={pagoActual.tipoPago}
                  onChange={(e) => setPagoActual({...pagoActual, tipoPago: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="totalidad">Totalidad</option>
                  <option value="parcial">Parcial</option>
                </select>
              </div>

              {pagoActual.tipoPago === 'parcial' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Monto del Pago (Gs.)</label>
                  <input
                    type="number"
                    value={pagoActual.montoPago}
                    onChange={(e) => setPagoActual({...pagoActual, montoPago: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="500000"
                  />
                </div>
              )}

<div>
                <label className="block text-sm font-medium mb-1">Fecha de Pago *</label>
                <input
                  type="date"
                  value={pagoActual.fechaPago}
                  onChange={(e) => setPagoActual({...pagoActual, fechaPago: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>

              {pagoActual.fechaPago && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    Días de atraso calculados: <span className="font-medium">
                      {(() => {
                        const [opIndex, cuotaIndex] = editingCuota.split('-').map(Number);
                        const cuota = operaciones[opIndex]?.cuotas[cuotaIndex];
                        return cuota ? calcularDiasAtraso(cuota.fechaVencimiento, pagoActual.fechaPago) : 0;
                      })()}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingCuota(null);
                  setPagoActual({
                    tipoPago: 'totalidad',
                    montoPago: '',
                    fechaPago: '',
                    diasAtraso: 0
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 p-2 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const [opIndex, cuotaIndex] = editingCuota.split('-').map(Number);
                  registrarPago(opIndex, cuotaIndex);
                }}
                className="flex-1 bg-green-600 text-white p-2 rounded"
                disabled={!pagoActual.fechaPago}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Operación */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="bg-white m-4 mt-8 rounded-lg max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-red-600 text-white p-4 rounded-t-lg">
              <h3 className="text-lg font-bold">
                {editingIndex !== null ? 'Editar' : 
                 tipoOperacion === 'nueva' ? 'Nueva' : 'Cargar'} Operación Activa
              </h3>
              <p className="text-sm opacity-90">
                {tipoOperacion === 'nueva' ? 'Préstamo desde cero con cuotas automáticas' : 'Préstamo con historial de pagos'}
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
                  {tipoOperacion === 'nueva' 
                    ? 'Generado automáticamente, puede modificarlo si es necesario'
                    : 'Generado automáticamente, ingrese el número original o mantenga el generado'
                  }
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
                  <label className="block text-sm font-medium mb-1">Plazo Total (meses) *</label>
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

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo Titular</label>
                  <select
                    value={operacionActual.idTipoTitular}
                    onChange={(e) => setOperacionActual({...operacionActual, idTipoTitular: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    {tiposTitular.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview de cuotas - Tanto para nueva como existente */}
              {operacionActual.cuotas.length > 0 && (
                <div className={`p-3 rounded ${tipoOperacion === 'nueva' ? 'bg-green-50' : 'bg-blue-50'}`}>
                  <h4 className={`font-medium mb-3 ${tipoOperacion === 'nueva' ? 'text-green-700' : 'text-blue-700'}`}>
                    {tipoOperacion === 'nueva' ? 
                      `Vista Previa del Cuotero (${operacionActual.cuotas.length} cuotas)` :
                      `Marcar Pagos Realizados (${operacionActual.cuotas.length} cuotas)`
                    }
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={tipoOperacion === 'nueva' ? 'bg-green-100' : 'bg-blue-100'}>
                          <th className="p-2 text-left">Cuota</th>
                          <th className="p-2 text-left">Vencimiento</th>
                          <th className="p-2 text-right">Monto</th>
                          {tipoOperacion === 'existente' && (
                            <>
                              <th className="p-2 text-center">¿Pagado?</th>
                              <th className="p-2 text-left">F. Pago</th>
                              <th className="p-2 text-center">Días Atraso</th>
                            </>
                          )}
                          {tipoOperacion === 'nueva' && (
                            <th className="p-2 text-center">Estado</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {operacionActual.cuotas.map((cuota, index) => (
                          <tr key={index} className={`border-b ${tipoOperacion === 'nueva' ? 'border-green-200' : 'border-blue-200'}`}>
                            <td className="p-2">{cuota.numero}</td>
                            <td className="p-2">{cuota.fechaVencimiento}</td>
                            <td className="p-2 text-right">Gs. {formatearMonto(cuota.montoCuota)}</td>
                            {tipoOperacion === 'existente' && (
                              <>
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={cuota.estado === 'pagado'}
                                    onChange={(e) => {
                                      const nuevasCuotas = [...operacionActual.cuotas];
                                      if (e.target.checked) {
                                        nuevasCuotas[index] = {
                                          ...cuota,
                                          estado: 'pagado',
                                          saldo: 0,
                                          fechaPago: cuota.fechaPago || new Date().toISOString().split('T')[0],
                                          diasAtraso: cuota.diasAtraso || 0
                                        };
                                      } else {
                                        nuevasCuotas[index] = {
                                          ...cuota,
                                          estado: 'sin_vencer',
                                          saldo: cuota.montoCuota,
                                          fechaPago: '',
                                          diasAtraso: 0
                                        };
                                      }
                                      setOperacionActual(prev => ({
                                        ...prev,
                                        cuotas: nuevasCuotas
                                      }));
                                    }}
                                    className="w-4 h-4"
                                  />
                                </td>
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
                                        diasAtraso: diasAtraso,
                                        estado: e.target.value ? 'pagado' : 'sin_vencer',
                                        saldo: e.target.value ? 0 : cuota.montoCuota
                                      };
                                      setOperacionActual(prev => ({
                                        ...prev,
                                        cuotas: nuevasCuotas
                                      }));
                                    }}
                                    className="w-full p-1 border rounded text-xs"
                                    disabled={cuota.estado !== 'pagado'}
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
                                      setOperacionActual(prev => ({
                                        ...prev,
                                        cuotas: nuevasCuotas
                                      }));
                                    }}
                                    className="w-16 p-1 border rounded text-xs text-center"
                                    placeholder="0"
                                    min="0"
                                    disabled={cuota.estado !== 'pagado'}
                                  />
                                </td>
                              </>
                            )}
                            {tipoOperacion === 'nueva' && (
                              <td className="p-2 text-center">
                                <span className={`px-1 py-0.5 rounded text-xs ${getEstadoColor(cuota.estado)}`}>
                                  {getEstadoTexto(cuota.estado)}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {tipoOperacion === 'existente' && (
                    <div className="mt-3 text-xs text-gray-600 bg-white p-2 rounded">
                      <p><strong>Instrucciones:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Las fechas de vencimiento se calculan desde la <strong>Fecha Operación</strong></li>
                        <li>Marque las cuotas que YA fueron pagadas</li>
                        <li>Ingrese la fecha real de pago para cada cuota pagada</li>
                        <li>Los días de atraso se calculan automáticamente, pero puede ajustarlos</li>
                        <li>Las cuotas no marcadas quedarán como pendientes</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Campos calculados (solo lectura) */}
              {operacionActual.cuotas.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium mb-3 text-gray-700">Información Calculada</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Días de Atraso:</span>
                      <span className={`ml-1 font-medium ${operacionActual.diasAtraso > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {operacionActual.diasAtraso}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Plazo Remanente:</span>
                      <span className="ml-1 font-medium text-blue-600">
                        {operacionActual.plazoRemanenteEnPeriodos} / {operacionActual.plazoTotalEnPeriodos}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Capital Adeudado:</span>
                      <span className="ml-1 font-medium">Gs. {formatearMonto(operacionActual.capitalAdeudadoActual)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Atraso Máximo:</span>
                      <span className="ml-1 font-medium">{operacionActual.diasAtrasoMaximo}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setTipoOperacion('nueva');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 p-3 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarOperacion}
                  className="flex-1 bg-red-600 text-white p-3 rounded"
                  disabled={!operacionActual.numeroOperacion || !operacionActual.capitalOriginal}
                >
                  {editingIndex !== null ? 'Actualizar' : 'Agregar'} Operación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click fuera para cerrar dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default OperacionesActivas;