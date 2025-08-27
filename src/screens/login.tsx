import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, Alert, Pressable, Dimensions, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Login: React.FC = () => {
    const [correo, setCorreo] = React.useState('');
    const [clave, setClave] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalType, setModalType] = React.useState<'success' | 'error'>('success');
    const [modalMessage, setModalMessage] = React.useState('');
    const navigation = useNavigation<NavigationProp<{ Home: undefined }>>();

     const showModal = (type: 'success' | 'error', message: string) => {
      setModalType(type);
      setModalMessage(message);
      setModalVisible(true);
    };

    const handleLogin = async () => {
       if (!correo || !clave) {
        showModal('error', 'Por favor, completa todos los campos.');
        return;
      }
    
        try {
          const response = await fetch('https://catedragaitera.com/catedraGaiteraBack/apiv1/auth/user.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ correo, clave, accion: 'login' }),
          });
          
          // console.log(response);

          const data = await response.json();
          if (response.ok && data.token) {
            const { mensaje, usuario } = data;
            if (usuario.rol === 1) {
              showModal('success', `${mensaje}\nBienvenido, ${usuario.nombre} ${usuario.apellido}`);
              setTimeout(() => {
                setModalVisible(false);
                navigation.navigate('Home');
              }, 1800);
            } else {
              showModal('error', 'Tu usuario no tiene permisos para iniciar sesión en esta app.');
            }
          } else {
            showModal('error', data.mensaje || 'Credenciales incorrectas.');
          }
        } catch (error) {
          Alert.alert('Error', 'Hubo un problema con el servidor.');
        }
      };

 return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Image source={require('../../assets/img/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Inicio de Sesión</Text>
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { marginBottom: 0, flex: 1 }]}
            placeholder="Contraseña"
            secureTextEntry={!showPassword}
            value={clave}
            onChangeText={setClave}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={22}
              color="#22242e"
            />
          </TouchableOpacity>
        </View>
        <Pressable style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </Pressable>
      </View>
      {/* Modal personalizado */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.resultModalContent,
            modalType === 'success' ? styles.resultModalAprobado : styles.resultModalRechazado
          ]}>
            <Text style={styles.resultModalIcon}>
              {modalType === 'success' ? '✅' : '❌'}
            </Text>
            <Text style={styles.resultModalText}>{modalMessage}</Text>
            <Pressable
              style={styles.resultModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.resultModalButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: '#22242e',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    minHeight: height,
    backgroundColor: '#22242e',
  }, 
  logo: {
    width: width * 0.6,
    height: width * 0.6,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 400,
    height: 48,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 15,
  },
  eyeButton: {
    position: 'absolute',
    right: 10,
    padding: 8,
    zIndex: 1,
  },
  button: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#eefa07',
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  resultModalAprobado: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  resultModalRechazado: {
    borderColor: '#F44336',
    borderWidth: 3,
  },
  resultModalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultModalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  resultModalButton: {
    backgroundColor: '#22242e',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  resultModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Login;