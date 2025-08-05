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
        // Usar el idInstitucion como ID del documento
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
    const docRef = await addDoc(
      collection(db, "instituciones", institucionId, "clientes"), 
      {
        ...clienteData,
        fechaCreacion: new Date().toISOString(),
        fechaModificacion: new Date().toISOString()
      }
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error guardando cliente:", error);
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

export const actualizarCliente = async (institucionId, clienteId, datos) => {
  try {
    const docRef = doc(db, "instituciones", institucionId, "clientes", clienteId);
    await updateDoc(docRef, {
      ...datos,
      fechaModificacion: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error actualizando cliente:", error);
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

// ====================== AUTENTICACIÓN ======================

export const autenticarUsuario = async (email, password) => {
  try {
    // Buscar en todas las instituciones
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

// Actualizar autenticación para incluir admins de Firebase
export const autenticarUsuarioConAdmins = async (email, password) => {
  try {
    // 1. Verificar admin principal (hardcoded)
    if (email === 'matiasmart7@gmail.com' && password === 'admin123') {
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