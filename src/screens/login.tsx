import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, Pressable } from 'react-native';

const Login: React.FC = () => {
    const [correo, setCorreo] = React.useState('');
    const [clave, setClave] = React.useState('');
    const navigation = useNavigation<NavigationProp<{ Home: undefined }>>();

    const handleLogin = async () => {
        if (!correo || !clave) {
          Alert.alert('Error', 'Por favor, completa todos los campos.');
          // alert('Por favor, completa todos los campos.');
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
            // Extraer datos del usuario y mostrar mensaje de éxito
            const { mensaje, usuario } = data;
            Alert.alert('Inicio de sesión', `${mensaje}\nBienvenido, ${usuario.nombre} ${usuario.apellido}`);

            navigation.navigate('Home'); // Navegar a la pantalla de inicio después del inicio de sesión exitoso
            // console.log('Token:', data.token); // Puedes guardar el token para futuras solicitudes
          } else {
            Alert.alert('Error', data.mensaje || 'Credenciales incorrectas.');
          }
        } catch (error) {
          Alert.alert('Error', 'Hubo un problema con el servidor.');
        }
      };

  return (
    <View style={styles.container}>

        <Image source={require('../../assets/img/icon.png')} style={styles.logo} />
        <Text style={styles.title}>Inicio de Sesión</Text>
        <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
        />
        <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={clave}
        onChangeText={setClave}
        />
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </Pressable>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#22242e',
    padding: 20,
  }, 
  logo: {
    width: 300, // Ajusta el tamaño según lo necesario
    height: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'white',
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    backgroundColor: '#eefa07',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Login;