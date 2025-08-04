import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminInstituciones from './components/AdminInstituciones';
import Dashboard from './components/Dashboard';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión guardada al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario logueado, mostrar login
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Si es admin, mostrar panel de administración
  if (currentUser.role === 'admin') {
    return (
      <AdminInstituciones 
        currentUser={currentUser} 
        onLogout={handleLogout} 
      />
    );
  }

  // Si es usuario normal, mostrar dashboard
  return (
    <Dashboard 
      currentUser={currentUser} 
      onLogout={handleLogout} 
    />
  );
};

export default App;