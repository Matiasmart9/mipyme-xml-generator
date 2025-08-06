import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Building2, Mail, ArrowLeft, Shield } from 'lucide-react';
import { autenticarUsuarioConAdmins, enviarEmailRecuperacion, validarTokenRecuperacion, cambiarContrasena } from '../firebase/services';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para recuperación de contraseña
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'forgot', 'token', 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para validación de token y cambio de contraseña
  const [tokenData, setTokenData] = useState({
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resultado = await autenticarUsuarioConAdmins(formData.email, formData.password);
      
      if (resultado.success) {
        onLogin(resultado.user);
      } else {
        setError(resultado.error);
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Error en login:', error);
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setSuccessMessage('');

    if (!forgotEmail.trim()) {
      setError('Por favor ingrese su email');
      setForgotLoading(false);
      return;
    }

    try {
      const resultado = await enviarEmailRecuperacion(forgotEmail);
      
      if (resultado.success) {
        setSuccessMessage('✅ Se ha enviado un email con las instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.');
        setCurrentStep('token');
        setError('');
      } else {
        setError(resultado.error);
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Error en recuperación:', error);
    }
    
    setForgotLoading(false);
  };

  const handleValidateToken = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');

    if (!tokenData.token.trim()) {
      setError('Por favor ingrese el código de verificación');
      setForgotLoading(false);
      return;
    }

    try {
      const resultado = await validarTokenRecuperacion(forgotEmail, tokenData.token);
      
      if (resultado.success) {
        setCurrentStep('reset');
        setSuccessMessage('✅ Código válido. Ahora puede establecer su nueva contraseña.');
        setError('');
      } else {
        setError(resultado.error);
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Error validando token:', error);
    }
    
    setForgotLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');

    // Validaciones
    if (!tokenData.newPassword || !tokenData.confirmPassword) {
      setError('Por favor complete todos los campos');
      setForgotLoading(false);
      return;
    }

    if (tokenData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setForgotLoading(false);
      return;
    }

    if (tokenData.newPassword !== tokenData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setForgotLoading(false);
      return;
    }

    try {
      const resultado = await cambiarContrasena(forgotEmail, tokenData.token, tokenData.newPassword);
      
      if (resultado.success) {
        setSuccessMessage('✅ Contraseña cambiada exitosamente. Ya puede iniciar sesión con su nueva contraseña.');
        // Limpiar formularios y volver al login después de 3 segundos
        setTimeout(() => {
          resetAllForms();
        }, 3000);
      } else {
        setError(resultado.error);
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Error cambiando contraseña:', error);
    }
    
    setForgotLoading(false);
  };

  const resetAllForms = () => {
    setCurrentStep('login');
    setForgotEmail('');
    setTokenData({ token: '', newPassword: '', confirmPassword: '' });
    setSuccessMessage('');
    setError('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const goToStep = (step) => {
    setCurrentStep(step);
    setError('');
    setSuccessMessage('');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'forgot': return 'Recuperar Contraseña';
      case 'token': return 'Verificar Código';
      case 'reset': return 'Nueva Contraseña';
      default: return 'Sistema de Gestión de Cartera';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">MiPymes XML</h1>
          <p className="text-gray-600 mt-2">{getStepTitle()}</p>
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'login' && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className={currentStep === 'forgot' ? 'text-blue-600 font-medium' : ''}>Email</span>
              <span className={currentStep === 'token' ? 'text-blue-600 font-medium' : ''}>Código</span>
              <span className={currentStep === 'reset' ? 'text-blue-600 font-medium' : ''}>Nueva contraseña</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${
                  currentStep === 'forgot' ? 'w-1/3' :
                  currentStep === 'token' ? 'w-2/3' :
                  currentStep === 'reset' ? 'w-full' : 'w-0'
                }`}
              ></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <p className="text-sm">{successMessage}</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {currentStep === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => goToStep('forgot')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {currentStep === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu email registrado"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Te enviaremos un código de verificación para restablecer tu contraseña.
              </p>
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                forgotLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              }`}
            >
              {forgotLoading ? 'Enviando...' : 'Enviar Código de Verificación'}
            </button>

            <button
              type="button"
              onClick={resetAllForms}
              className="w-full py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al Login
            </button>
          </form>
        )}

        {/* TOKEN VALIDATION FORM */}
        {currentStep === 'token' && (
          <form onSubmit={handleValidateToken} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificación
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  value={tokenData.token}
                  onChange={(e) => setTokenData({...tokenData, token: e.target.value.toUpperCase()})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-mono text-lg tracking-widest"
                  placeholder="ABCD123"
                  maxLength="7"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Ingresa el código de 7 caracteres que enviamos a <strong>{forgotEmail}</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={forgotLoading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                forgotLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }`}
            >
              {forgotLoading ? 'Verificando...' : 'Verificar Código'}
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => goToStep('forgot')}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-sm"
              >
                Reenviar código
              </button>
              <button
                type="button"
                onClick={resetAllForms}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {currentStep === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={tokenData.newPassword}
                  onChange={(e) => setTokenData({...tokenData, newPassword: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={tokenData.confirmPassword}
                  onChange={(e) => setTokenData({...tokenData, confirmPassword: e.target.value})}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {tokenData.newPassword && (
              <div className="text-xs space-y-1">
                <div className={`flex items-center ${tokenData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${tokenData.newPassword.length >= 6 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  Mínimo 6 caracteres
                </div>
                <div className={`flex items-center ${tokenData.newPassword === tokenData.confirmPassword && tokenData.confirmPassword ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${tokenData.newPassword === tokenData.confirmPassword && tokenData.confirmPassword ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                  Las contraseñas coinciden
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={forgotLoading || tokenData.newPassword !== tokenData.confirmPassword || tokenData.newPassword.length < 6}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                forgotLoading || tokenData.newPassword !== tokenData.confirmPassword || tokenData.newPassword.length < 6
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              }`}
            >
              {forgotLoading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
            </button>

            <button
              type="button"
              onClick={resetAllForms}
              className="w-full py-2 px-4 rounded-lg font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* Demo Info - Solo mostrar en login normal */}
        {currentStep === 'login' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Credenciales de Prueba:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Admin:</strong> matiasmart7@gmail.com / admin123</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;