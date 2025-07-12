import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const UserContext = createContext(null);

const API_BASE_URL = 'http://10.0.0.214:3000/api'; 

const LoginScreen = ({ navigation }) => {
  const { setUser } = useContext(UserContext); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data); 
        navigation.replace('Main'); 
      } else {
        setError(data.error || 'Erro no login');
      }
    } catch (error) {
      setError('Erro na conexão com o servidor');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <Button title="Entrar" onPress={handleLogin} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const HomeScreen = () => {
  const { user } = useContext(UserContext);
  const [projects, setProjects] = useState([]);

  const getProjectColor = (status) => {
    switch (status) {
      case 'Começar':
        return '#4CAF50'; // verde
      case 'Em andamento':
        return '#FFC107'; // amarelo
      case 'Finalizado':
        return '#F44336'; // vermelho
      default:
        return '#ddd'; // cinza claro
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchProjects = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/projetos?user_id=${user.id}`);
          const data = await response.json();
          setProjects(data);
        } catch (error) {
          console.error('Erro ao buscar projetos:', error);
        }
      };

      if (user?.id) fetchProjects();
    }, [user])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seus Projetos:</Text>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.projectCard, { backgroundColor: getProjectColor(item.status) }]}>
            <Text style={styles.projectText}>{item.nome}</Text>
            <Text style={styles.projectText}>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
};

const ProjectControlScreen = () => {
  const { user } = useContext(UserContext);
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('Começar');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/projetos?user_id=${user.id}`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os projetos.');
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
    }, [user])
  );

  const addOrUpdateProject = async () => {
    if (!name.trim() || !cost.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    setLoading(true);
    try {
      const method = editId ? 'PUT' : 'POST';
      const url = editId ? `${API_BASE_URL}/projetos/${editId}` : `${API_BASE_URL}/projetos`;

      const bodyData = { nome: name, custo: cost, status, user_id: user.id }; // envia user_id

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!response.ok) throw new Error(editId ? 'Erro ao atualizar projeto' : 'Erro ao criar projeto');

      await fetchProjects();

      setName('');
      setCost('');
      setStatus('Começar');
      setEditId(null);
    } catch (error) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = (id) => {
    Alert.alert(
      'Confirmar exclusão',
      'Deseja realmente deletar este projeto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(`${API_BASE_URL}/projetos/${id}`, { method: 'DELETE' });
              if (!response.ok) throw new Error('Erro ao deletar projeto');
              await fetchProjects();
            } catch (error) {
              Alert.alert('Erro', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const editProject = (project) => {
    setName(project.nome);
    setCost(project.custo);
    setStatus(project.status);
    setEditId(project.id);
  };

  const getProjectColor = (status) => {
    switch (status) {
      case 'Começar':
        return '#4CAF50';
      case 'Em andamento':
        return '#FFC107';
      case 'Finalizado':
        return '#F44336';
      default:
        return '#ddd';
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>{editId ? 'Editar Projeto' : 'Adicionar Projeto'}</Text>

        <TextInput style={styles.input} placeholder="Nome do projeto" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Custo" value={cost} onChangeText={setCost} keyboardType="numeric" />

        <Text style={styles.label}>Status:</Text>
        <View style={styles.buttonContainer}>
          {['Começar', 'Em andamento', 'Finalizado'].map((item) => (
            <Pressable
              key={item}
              style={[styles.statusButton, status === item && styles.selectedStatus]}
              onPress={() => setStatus(item)}
            >
              <Text style={status === item ? styles.selectedText : styles.statusText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Button title={loading ? 'Aguarde...' : editId ? 'Atualizar' : 'Adicionar'} onPress={addOrUpdateProject} disabled={loading} />

        <FlatList
          data={projects}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={({ item }) => (
            <View
              style={[
                styles.projectCard,
                { backgroundColor: getProjectColor(item.status), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
              ]}
              pointerEvents="box-none"
            >
              <View style={{ flex: 1 }}>
                <Text onPress={() => editProject(item)} style={styles.projectText}>
                  {item.nome}
                </Text>
                <Text onPress={() => editProject(item)} style={styles.projectText}>
                  Custo: {item.custo}
                </Text>
                <Text onPress={() => editProject(item)} style={styles.projectText}>
                  Status: {item.status}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const BudgetScreen = () => {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const calculateBudget = () => {
    const consumo = parseFloat(value);
    if (!isNaN(consumo) && consumo > 0) {
      const placasNecessarias = (consumo / 1300) * 20;
      const custoTotal = placasNecessarias * 9725.68;
      const resultado = {
        placas: Math.ceil(placasNecessarias),
        custo: custoTotal.toFixed(2),
        consumo: consumo.toFixed(2),
      };
      setResult(resultado);
      setHistory([resultado, ...history]); // adiciona ao início
      setValue('');
    } else {
      setResult(null);
      Alert.alert('Erro', 'Digite um valor válido para o consumo.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
          <Text style={styles.title}>Orçamento</Text>
          <TextInput
            style={styles.input}
            placeholder="Consumo médio (KWH/MÊS)"
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
          />
          <Button title="Calcular" onPress={calculateBudget} />

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultText}>Consumo: {result.consumo} kWh/mês</Text>
              <Text style={styles.resultText}>Placas necessárias: {result.placas}</Text>
              <Text style={styles.resultText}>Orçamento: R$ {result.custo}</Text>
            </View>
          )}

          {history.length > 0 && (
            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={styles.title}>Histórico</Text>
              {history.map((item, index) => (
                <View key={index} style={styles.resultCard}>
                  <Text style={styles.resultText}>Consumo: {item.consumo} kWh/mês</Text>
                  <Text style={styles.resultText}>Placas: {item.placas}</Text>
                  <Text style={styles.resultText}>R$ {item.custo}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const LogoutScreen = ({ navigation }) => {
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    setUser(null);
    navigation.replace('Login');
  }, []);

  return (
    <View style={styles.container}>
      <Text>Saindo...</Text>
    </View>
  );
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let iconName = {
          Home: 'home',
          'Controle de Projeto': 'build',
          Orçamento: 'attach-money',
          Sair: 'logout',
        }[route.name];
        return <MaterialIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FFD700',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: { backgroundColor: '#000', paddingBottom: 5 },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Controle de Projeto" component={ProjectControlScreen} />
    <Tab.Screen name="Orçamento" component={BudgetScreen} />
    <Tab.Screen name="Sair" component={LogoutScreen} />
  </Tab.Navigator>
);

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <SafeAreaProvider>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </SafeAreaProvider>
    </UserContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  logo: { width: 150, height: 150, marginBottom: 20 },
  input: { width: 250, height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingLeft: 10, borderRadius: 5 },
  error: { color: 'red', marginBottom: 10 },
  label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statusButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedStatus: { backgroundColor: '#007BFF', borderColor: '#0056b3' },
  statusText: { color: '#000' },
  selectedText: { color: '#fff', fontWeight: 'bold' },
  projectCard: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  projectText: { fontSize: 18, fontWeight: 'bold' },
  resultCard: {
    marginTop: 20,
    padding: 15,
    width: 300,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
});
