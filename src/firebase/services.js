import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from "firebase/firestore";
import { db } from "./config";

// ====================== INSTITUCIONES ======================

export const crearInstitucion = async (institucionData) => {
  try {
    const docRef = doc(db, "instituciones", institucionData.idInstitucion);
    await setDoc(docRef, {
      ...institucionData,
      fechaCreacion: new Date().toISOString(),
      fechaAlta: new Date().toISOString().split('T')[0]
    });
    return { success: true };
  } catch (error) {
    console.error("Error creando institución:", error);
    return { success: false, error: error.message };
  }
};

export const obtenerInstituciones = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "instituciones"));
    const instituciones = [];
    querySnapshot.forEach((doc) => {
      instituciones.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return { success: true, data: instituciones };
  } catch (error) {
    console.error("Error obteniendo instituciones:", error);
    return { success: false, error: error.message };
  }
};

export const actualizarInstitucion = async (institucionId, datos) => {
  try {
    const docRef = doc(db, "instituciones", institucionId);
    await updateDoc(docRef, datos);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando institución:", error);
    return { success: false, error: error.message };
  }
};

export const eliminarInstitucion = async (institucionId) => {
  try {
    await deleteDoc(doc(db, "instituciones", institucionId));
    return { success: true };
  } catch (error) {
    console.error("Error eliminando institución:", error);
    return { success: false, error: error.message };
  }
};

// ====================== USUARIOS ======================

export const crearUsuario = async (institucionId, usuarioData) => {
  try {
    const docRef = await addDoc(
      collection(db, "instituciones", institucionId, "usuarios"), 
      {
        ...usuarioData,
        fechaCreacion: new Date().toISOString()
      }
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creando usuario:", error);
    return { success: false, error: error.message };
  }
};

export const obtenerUsuarios = async (institucionId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "instituciones", institucionId, "usuarios")
    );
    const usuarios = [];
    querySnapshot.forEach((doc) => {
      usuarios.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return { success: true, data: usuarios };
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    return { success: false, error: error.message };
  }
};

export const actualizarUsuario = async (institucionId, usuarioId, datos) => {
  try {
    const docRef = doc(db, "instituciones", institucionId, "usuarios", usuarioId);
    await updateDoc(docRef, datos);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    return { success: false, error: error.message };
  }
};

export const eliminarUsuario = async (institucionId, usuarioId) => {
  try {
    await deleteDoc(doc(db, "instituciones", institucionId, "usuarios", usuarioId));
    return { success: true };
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return { success: false, error: error.message };
  }
};

// ====================== CLIENTES ======================

export const guardarCliente = async (institucionId, clienteData) => {
  try {
    // ✅ CRÍTICO: Asegurar que se preserven las operaciones con su historial completo
    const clienteCompleto = {
      // Datos básicos del cliente
      nombreCompleto: clienteData.nombreCompleto,
      razonSocial: clienteData.razonSocial,
      genero: clienteData.genero,
      idNacionalidad: clienteData.idNacionalidad,
      idEstadoCivil: clienteData.idEstadoCivil,
      fechaNacimiento: clienteData.fechaNacimiento,
      idTipoPersona: clienteData.idTipoPersona,
      idSectorEconomico: clienteData.idSectorEconomico,
      idTipoDoc: clienteData.idTipoDoc,
      idPaisDoc: clienteData.idPaisDoc,
      nroDoc: clienteData.nroDoc,
      fechaVencimientoDoc: clienteData.fechaVencimientoDoc,
      direccion: clienteData.direccion,
      ciudad: clienteData.ciudad,
      barrio: clienteData.barrio,
      departamento: clienteData.departamento,
      telefono: clienteData.telefono,
      cargoTrabajo: clienteData.cargoTrabajo,
      salario: clienteData.salario,
      lugarTrabajo: clienteData.lugarTrabajo,
      contactos: clienteData.contactos || [],
      fechaRegistradaDireccion: clienteData.fechaRegistradaDireccion || '',
      fechaInformadoTrabajo: clienteData.fechaInformadoTrabajo || '',
      
      // ✅ CRÍTICO: Preservar operaciones activas con historial completo
      operacionesActivas: clienteData.operacionesActivas ? clienteData.operacionesActivas.map(operacion => ({
        id: operacion.id,
        idTipoOperacion: operacion.idTipoOperacion,
        fechaOperacion: operacion.fechaOperacion,
        numeroOperacion: operacion.numeroOperacion,
        capitalOriginal: operacion.capitalOriginal,
        interesOriginal: operacion.interesOriginal,
        plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
        idPeriodoPrestamo: operacion.idPeriodoPrestamo,
        fechaVencimiento: operacion.fechaVencimiento,
        idMoneda: operacion.idMoneda,
        idTipoTitular: operacion.idTipoTitular,
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
        // ✅ Preservar cuotas con historial completo
        cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
          numero: cuota.numero,
          fechaVencimiento: cuota.fechaVencimiento,
          montoCuota: cuota.montoCuota,
          saldo: cuota.saldo,
          estado: cuota.estado,
          fechaPago: cuota.fechaPago || '',
          diasAtraso: cuota.diasAtraso || 0,
          pagos: cuota.pagos || []
        })) : []
      })) : [],
      
      // ✅ CRÍTICO: Preservar operaciones canceladas con historial completo
      operacionesCanceladas: clienteData.operacionesCanceladas ? clienteData.operacionesCanceladas.map(operacion => ({
        id: operacion.id,
        idTipoOperacion: operacion.idTipoOperacion,
        fechaOperacion: operacion.fechaOperacion,
        numeroOperacion: operacion.numeroOperacion,
        capitalOriginal: operacion.capitalOriginal,
        interesOriginal: operacion.interesOriginal,
        plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
        idPeriodoPrestamo: operacion.idPeriodoPrestamo,
        fechaVencimiento: operacion.fechaVencimiento,
        idMoneda: operacion.idMoneda,
        idTipoCancelacion: operacion.idTipoCancelacion,
        fechaCancelacion: operacion.fechaCancelacion,
        diasAtrasoMaximo: operacion.diasAtrasoMaximo || 0,
        diasAtrasoPromedio: operacion.diasAtrasoPromedio || 0,
        montoQuitaMora: operacion.montoQuitaMora || '0.00',
        montoQuitaInteres: operacion.montoQuitaInteres || '0.00',
        montoQuitaCapital: operacion.montoQuitaCapital || '0.00',
        montoInteresGenerado: operacion.montoInteresGenerado || '0.00',
        // ✅ Preservar cuotas canceladas con historial completo
        cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
          numero: cuota.numero,
          fechaVencimiento: cuota.fechaVencimiento,
          montoCuota: cuota.montoCuota,
          saldo: cuota.saldo || 0,
          estado: cuota.estado || 'pagado',
          fechaPago: cuota.fechaPago || '', // ✅ PRESERVAR fecha de pago real
          diasAtraso: cuota.diasAtraso || 0, // ✅ PRESERVAR días de atraso reales
          pagos: cuota.pagos || [] // ✅ PRESERVAR historial de pagos parciales
        })) : []
      })) : [],
      
      // Metadatos
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString()
    };

    console.log('🔍 FIREBASE - Guardando cliente completo:', clienteCompleto);
    console.log('🔍 FIREBASE - Operaciones activas:', clienteCompleto.operacionesActivas);
    console.log('🔍 FIREBASE - Operaciones canceladas:', clienteCompleto.operacionesCanceladas);

    const docRef = await addDoc(
      collection(db, "instituciones", institucionId, "clientes"), 
      clienteCompleto
    );
    
    console.log('✅ FIREBASE - Cliente guardado con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error guardando cliente:", error);
    return { success: false, error: error.message };
  }
};

export const actualizarCliente = async (institucionId, clienteId, datos) => {
  try {
    // ✅ CRÍTICO: Asegurar que se preserven las operaciones con su historial completo
    const datosCompletos = {
      // Datos básicos del cliente
      nombreCompleto: datos.nombreCompleto,
      razonSocial: datos.razonSocial,
      genero: datos.genero,
      idNacionalidad: datos.idNacionalidad,
      idEstadoCivil: datos.idEstadoCivil,
      fechaNacimiento: datos.fechaNacimiento,
      idTipoPersona: datos.idTipoPersona,
      idSectorEconomico: datos.idSectorEconomico,
      idTipoDoc: datos.idTipoDoc,
      idPaisDoc: datos.idPaisDoc,
      nroDoc: datos.nroDoc,
      fechaVencimientoDoc: datos.fechaVencimientoDoc,
      direccion: datos.direccion,
      ciudad: datos.ciudad,
      barrio: datos.barrio,
      departamento: datos.departamento,
      telefono: datos.telefono,
      cargoTrabajo: datos.cargoTrabajo,
      salario: datos.salario,
      lugarTrabajo: datos.lugarTrabajo,
      contactos: datos.contactos || [],
      fechaRegistradaDireccion: datos.fechaRegistradaDireccion || '',
      fechaInformadoTrabajo: datos.fechaInformadoTrabajo || '',
      
      // ✅ CRÍTICO: Preservar operaciones activas con historial completo
      operacionesActivas: datos.operacionesActivas ? datos.operacionesActivas.map(operacion => ({
        id: operacion.id,
        idTipoOperacion: operacion.idTipoOperacion,
        fechaOperacion: operacion.fechaOperacion,
        numeroOperacion: operacion.numeroOperacion,
        capitalOriginal: operacion.capitalOriginal,
        interesOriginal: operacion.interesOriginal,
        plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
        idPeriodoPrestamo: operacion.idPeriodoPrestamo,
        fechaVencimiento: operacion.fechaVencimiento,
        idMoneda: operacion.idMoneda,
        idTipoTitular: operacion.idTipoTitular,
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
        // ✅ Preservar cuotas con historial completo
        cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
          numero: cuota.numero,
          fechaVencimiento: cuota.fechaVencimiento,
          montoCuota: cuota.montoCuota,
          saldo: cuota.saldo,
          estado: cuota.estado,
          fechaPago: cuota.fechaPago || '',
          diasAtraso: cuota.diasAtraso || 0,
          pagos: cuota.pagos || []
        })) : []
      })) : [],
      
      // ✅ CRÍTICO: Preservar operaciones canceladas con historial completo
      operacionesCanceladas: datos.operacionesCanceladas ? datos.operacionesCanceladas.map(operacion => ({
        id: operacion.id,
        idTipoOperacion: operacion.idTipoOperacion,
        fechaOperacion: operacion.fechaOperacion,
        numeroOperacion: operacion.numeroOperacion,
        capitalOriginal: operacion.capitalOriginal,
        interesOriginal: operacion.interesOriginal,
        plazoTotalEnPeriodos: operacion.plazoTotalEnPeriodos,
        idPeriodoPrestamo: operacion.idPeriodoPrestamo,
        fechaVencimiento: operacion.fechaVencimiento,
        idMoneda: operacion.idMoneda,
        idTipoCancelacion: operacion.idTipoCancelacion,
        fechaCancelacion: operacion.fechaCancelacion,
        diasAtrasoMaximo: operacion.diasAtrasoMaximo || 0,
        diasAtrasoPromedio: operacion.diasAtrasoPromedio || 0,
        montoQuitaMora: operacion.montoQuitaMora || '0.00',
        montoQuitaInteres: operacion.montoQuitaInteres || '0.00',
        montoQuitaCapital: operacion.montoQuitaCapital || '0.00',
        montoInteresGenerado: operacion.montoInteresGenerado || '0.00',
        // ✅ Preservar cuotas canceladas con historial completo
        cuotas: operacion.cuotas ? operacion.cuotas.map(cuota => ({
          numero: cuota.numero,
          fechaVencimiento: cuota.fechaVencimiento,
          montoCuota: cuota.montoCuota,
          saldo: cuota.saldo || 0,
          estado: cuota.estado || 'pagado',
          fechaPago: cuota.fechaPago || '', // ✅ PRESERVAR fecha de pago real
          diasAtraso: cuota.diasAtraso || 0, // ✅ PRESERVAR días de atraso reales
          pagos: cuota.pagos || [] // ✅ PRESERVAR historial de pagos parciales
        })) : []
      })) : [],
      
      // Metadatos
      fechaModificacion: new Date().toISOString()
    };

    console.log('🔍 FIREBASE - Actualizando cliente:', clienteId);
    console.log('🔍 FIREBASE - Datos completos:', datosCompletos);
    console.log('🔍 FIREBASE - Operaciones canceladas:', datosCompletos.operacionesCanceladas);

    const docRef = doc(db, "instituciones", institucionId, "clientes", clienteId);
    await updateDoc(docRef, datosCompletos);
    
    console.log('✅ FIREBASE - Cliente actualizado exitosamente');
    return { success: true };
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return { success: false, error: error.message };
  }
};

export const obtenerClientes = async (institucionId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, "instituciones", institucionId, "clientes")
    );
    const clientes = [];
    querySnapshot.forEach((doc) => {
      clientes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return { success: true, data: clientes };
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return { success: false, error: error.message };
  }
};

export const eliminarCliente = async (institucionId, clienteId) => {
  try {
    await deleteDoc(doc(db, "instituciones", institucionId, "clientes", clienteId));
    return { success: true };
  } catch (error) {
    console.error("Error eliminando cliente:", error);
    return { success: false, error: error.message };
  }
};

// ====================== ADMINISTRADORES ======================

export const crearAdministrador = async (adminData) => {
  try {
    const docRef = await addDoc(collection(db, "administradores"), {
      ...adminData,
      fechaCreacion: new Date().toISOString(),
      fechaAlta: new Date().toISOString().split('T')[0],
      role: 'admin'
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creando administrador:", error);
    return { success: false, error: error.message };
  }
};

export const obtenerAdministradores = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "administradores"));
    const administradores = [];
    querySnapshot.forEach((doc) => {
      administradores.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return { success: true, data: administradores };
  } catch (error) {
    console.error("Error obteniendo administradores:", error);
    return { success: false, error: error.message };
  }
};

export const actualizarAdministrador = async (adminId, datos) => {
  try {
    const docRef = doc(db, "administradores", adminId);
    await updateDoc(docRef, datos);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando administrador:", error);
    return { success: false, error: error.message };
  }
};

export const eliminarAdministrador = async (adminId) => {
  try {
    await deleteDoc(doc(db, "administradores", adminId));
    return { success: true };
  } catch (error) {
    console.error("Error eliminando administrador:", error);
    return { success: false, error: error.message };
  }
};

// ====================== GESTIÓN CONTRASEÑA ADMIN PRINCIPAL ======================

export const obtenerContrasenaAdminPrincipal = async () => {
  try {
    const docRef = doc(db, "system_config", "admin_principal");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, password: docSnap.data().password };
    } else {
      // Auto-crear admin principal si no existe
      await setDoc(docRef, {
        email: 'matiasmart7@gmail.com',
        password: 'admin123',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Admin principal creado automáticamente');
      return { success: true, password: 'admin123' };
    }
  } catch (error) {
    console.error("Error obteniendo contraseña admin principal:", error);
    return { success: false, error: error.message };
  }
};

export const actualizarContrasenaAdminPrincipal = async (newPassword) => {
  try {
    const docRef = doc(db, "system_config", "admin_principal");
    await setDoc(docRef, {
      email: 'matiasmart7@gmail.com',
      password: newPassword,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error("Error actualizando contraseña admin principal:", error);
    return { success: false, error: error.message };
  }
};

// ====================== AUTENTICACIÓN ======================

export const autenticarUsuario = async (email, password) => {
  try {
    const institucionesSnapshot = await getDocs(collection(db, "instituciones"));
    
    for (let institucionDoc of institucionesSnapshot.docs) {
      const institucionData = institucionDoc.data();
      const usuariosSnapshot = await getDocs(
        collection(db, "instituciones", institucionDoc.id, "usuarios")
      );
      
      for (let usuarioDoc of usuariosSnapshot.docs) {
        const usuarioData = usuarioDoc.data();
        if (usuarioData.email === email && 
            usuarioData.password === password && 
            usuarioData.estado === 'activo' &&
            institucionData.estado === 'activo') {
          return {
            success: true,
            user: {
              id: usuarioDoc.id,
              email: usuarioData.email,
              nombre: usuarioData.nombre,
              role: 'user',
              institucionId: institucionData.idInstitucion,
              institucionNombre: institucionData.nombre
            }
          };
        }
      }
    }
    
    return { success: false, error: 'Credenciales incorrectas o usuario inactivo' };
  } catch (error) {
    console.error("Error en autenticación:", error);
    return { success: false, error: error.message };
  }
};

export const autenticarUsuarioConAdmins = async (email, password) => {
  try {
    // 1. Verificar admin principal
    if (email === 'matiasmart7@gmail.com') {
      const adminPrincipalPassword = await obtenerContrasenaAdminPrincipal();
      if (adminPrincipalPassword.success && adminPrincipalPassword.password === password) {
        return {
          success: true,
          user: {
            id: 'admin-principal',
            email: 'matiasmart7@gmail.com',
            nombre: 'Administrador Principal',
            role: 'admin-principal',
            institucionId: null
          }
        };
      }
    }

    // 2. Verificar administradores en Firebase
    const adminsSnapshot = await getDocs(collection(db, "administradores"));
    for (let adminDoc of adminsSnapshot.docs) {
      const adminData = adminDoc.data();
      if (adminData.email === email && 
          adminData.password === password && 
          adminData.estado === 'activo') {
        return {
          success: true,
          user: {
            id: adminDoc.id,
            email: adminData.email,
            nombre: adminData.nombre,
            role: 'admin',
            institucionId: null
          }
        };
      }
    }

    // 3. Verificar usuarios de instituciones
    const institucionesSnapshot = await getDocs(collection(db, "instituciones"));
    
    for (let institucionDoc of institucionesSnapshot.docs) {
      const institucionData = institucionDoc.data();
      const usuariosSnapshot = await getDocs(
        collection(db, "instituciones", institucionDoc.id, "usuarios")
      );
      
      for (let usuarioDoc of usuariosSnapshot.docs) {
        const usuarioData = usuarioDoc.data();
        if (usuarioData.email === email && 
            usuarioData.password === password && 
            usuarioData.estado === 'activo' &&
            institucionData.estado === 'activo') {
          return {
            success: true,
            user: {
              id: usuarioDoc.id,
              email: usuarioData.email,
              nombre: usuarioData.nombre,
              role: 'user',
              institucionId: institucionData.idInstitucion,
              institucionNombre: institucionData.nombre
            }
          };
        }
      }
    }
    
    return { success: false, error: 'Credenciales incorrectas o usuario inactivo' };
  } catch (error) {
    console.error("Error en autenticación:", error);
    return { success: false, error: error.message };
  }
};

// ====================== RECUPERACIÓN DE CONTRASEÑA POR EMAIL ======================

const generarToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 7; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Función que intenta enviar email real, pero siempre funciona con fallback
const intentarEnviarEmail = async (email, token, userType, institucion = null) => {
  try {
    // Intentar cargar EmailJS dinámicamente
    const emailjs = await import('@emailjs/browser');
    
    // Inicializar EmailJS
    emailjs.default.init('vovvFuoKuX26ZV9K0');
    
    const templateParams = {
      email: email,
      system_name: 'MiPymes XML',
      verification_code: token,
      user_type: userType,
      institution: institucion || 'Sistema MiPymes',
      expiry_time: '15 minutos',
      support_email: 'soporte.tecnico@bicsa.com.py'
    };

    console.log('📧 Enviando email a:', email);
    
    const response = await emailjs.default.send(
      'service_8m9oj4z',
      'template_g124oyy',
      templateParams
    );

    console.log('✅ Email enviado exitosamente');
    return { success: true, method: 'email' };
    
  } catch (error) {
    console.log('⚠️ EmailJS no disponible, usando modo consola');
    
    // Mostrar en consola como fallback
    console.log('=================================');
    console.log('📧 CÓDIGO DE RECUPERACIÓN');
    console.log('=================================');
    console.log(`Para: ${email}`);
    console.log(`Tipo: ${userType}`);
    if (institucion) console.log(`Institución: ${institucion}`);
    console.log(`🔑 CÓDIGO: ${token}`);
    console.log('⏰ Expira en: 15 minutos');
    console.log('=================================');
    
    return { success: true, method: 'console' };
  }
};

export const enviarEmailRecuperacion = async (email) => {
  try {
    let userFound = null;
    let userType = '';
    let institucion = null;

    // 1. Verificar admin principal
    if (email === 'matiasmart7@gmail.com') {
      userFound = { email, type: 'admin-principal' };
      userType = 'Administrador Principal';
    }

    // 2. Buscar en administradores
    if (!userFound) {
      const adminsSnapshot = await getDocs(collection(db, "administradores"));
      for (let adminDoc of adminsSnapshot.docs) {
        const adminData = adminDoc.data();
        if (adminData.email === email && adminData.estado === 'activo') {
          userFound = { 
            id: adminDoc.id, 
            email, 
            type: 'admin',
            ...adminData 
          };
          userType = 'Administrador';
          break;
        }
      }
    }

    // 3. Buscar en usuarios de instituciones
    if (!userFound) {
      const institucionesSnapshot = await getDocs(collection(db, "instituciones"));
      
      for (let institucionDoc of institucionesSnapshot.docs) {
        const institucionData = institucionDoc.data();
        const usuariosSnapshot = await getDocs(
          collection(db, "instituciones", institucionDoc.id, "usuarios")
        );
        
        for (let usuarioDoc of usuariosSnapshot.docs) {
          const usuarioData = usuarioDoc.data();
          if (usuarioData.email === email && usuarioData.estado === 'activo') {
            userFound = {
              id: usuarioDoc.id,
              email,
              type: 'user',
              institucionId: institucionDoc.id,
              ...usuarioData
            };
            userType = 'Usuario';
            institucion = institucionData.nombre;
            break;
          }
        }
        if (userFound) break;
      }
    }

    if (!userFound) {
      return { 
        success: false, 
        error: 'No se encontró una cuenta activa asociada a este email' 
      };
    }

    const token = generarToken();
    const tokenData = {
      token,
      email,
      userType: userFound.type,
      userId: userFound.id || 'admin-principal',
      institucionId: userFound.institucionId || null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      used: false
    };

    await addDoc(collection(db, "password_reset_tokens"), tokenData);
    const emailResult = await intentarEnviarEmail(email, token, userType, institucion);

    const message = emailResult.method === 'email' 
      ? 'Se ha enviado un código de verificación a tu email. Revisa tu bandeja de entrada y spam.'
      : 'Se ha generado un código de verificación. Revisa la consola del navegador (F12) para ver el código.';

    return { 
      success: true, 
      message 
    };

  } catch (error) {
    console.error("Error enviando email de recuperación:", error);
    return { 
      success: false, 
      error: 'Error del sistema. Intente nuevamente más tarde.' 
    };
  }
};

export const validarTokenRecuperacion = async (email, token) => {
  try {
    const tokensQuery = query(
      collection(db, "password_reset_tokens"),
      where("email", "==", email),
      where("token", "==", token),
      where("used", "==", false)
    );

    const tokensSnapshot = await getDocs(tokensQuery);
    
    if (tokensSnapshot.empty) {
      return { 
        success: false, 
        error: 'Código de verificación inválido' 
      };
    }

    const tokenDoc = tokensSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);

    if (now > expiresAt) {
      await updateDoc(doc(db, "password_reset_tokens", tokenDoc.id), { used: true });
      
      return { 
        success: false, 
        error: 'El código de verificación ha expirado. Solicita uno nuevo.' 
      };
    }

    return { 
      success: true, 
      tokenId: tokenDoc.id,
      userData: tokenData
    };

  } catch (error) {
    console.error("Error validando token:", error);
    return { 
      success: false, 
      error: 'Error del sistema. Intente nuevamente más tarde.' 
    };
  }
};

export const cambiarContrasena = async (email, token, newPassword) => {
  try {
    const tokenValidation = await validarTokenRecuperacion(email, token);
    
    if (!tokenValidation.success) {
      return tokenValidation;
    }

    const { tokenId, userData } = tokenValidation;

    switch (userData.userType) {
      case 'admin-principal':
        const updateResult = await actualizarContrasenaAdminPrincipal(newPassword);
        if (!updateResult.success) {
          return {
            success: false,
            error: 'Error actualizando contraseña del administrador principal'
          };
        }
        break;

      case 'admin':
        await updateDoc(
          doc(db, "administradores", userData.userId), 
          { password: newPassword }
        );
        break;

      case 'user':
        await updateDoc(
          doc(db, "instituciones", userData.institucionId, "usuarios", userData.userId),
          { password: newPassword }
        );
        break;

      default:
        return { 
          success: false, 
          error: 'Tipo de usuario no válido' 
        };
    }

    await updateDoc(doc(db, "password_reset_tokens", tokenId), { 
      used: true,
      usedAt: new Date().toISOString()
    });

    return { 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    };

  } catch (error) {
    console.error("Error cambiando contraseña:", error);
    return { 
      success: false, 
      error: 'Error del sistema. Intente nuevamente más tarde.' 
    };
  }
};

export const limpiarTokensExpirados = async () => {
  try {
    const now = new Date().toISOString();
    const expiredTokensQuery = query(
      collection(db, "password_reset_tokens"),
      where("expiresAt", "<", now)
    );

    const expiredTokensSnapshot = await getDocs(expiredTokensQuery);
    
    const deletePromises = expiredTokensSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
    
    console.log(`Limpiados ${expiredTokensSnapshot.docs.length} tokens expirados`);
    
    return { success: true, deleted: expiredTokensSnapshot.docs.length };
  } catch (error) {
    console.error("Error limpiando tokens expirados:", error);
    return { success: false, error: error.message };
  }
};