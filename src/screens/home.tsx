import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";

const Home: React.FC = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    idDetalle: "",
    noDocumento: "",
    nombre: "",
    fecha: "",
    hora: "",
    lugar: "",
    fila: "",
    cantidad: "",
    zona: "",
  });
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [resultModalType, setResultModalType] = useState<
    "aprobado" | "rechazado" | null
  >(null);
  const [resultModalMessage, setResultModalMessage] = useState("");
  const [invalidQRModalVisible, setInvalidQRModalVisible] = useState(false);

  const api: string = "https://catedragaitera.com/catedraGaiteraBack/apiv1";

  // Función para formatear la hora a formato 12h
  function formatTime(time: string): string {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  }

  // Función para formatear la fecha a dd/MM/yyyy
  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    // Asume formato 'YYYY-MM-DD'
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  }

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async (
    result: { type: string; data: string } | undefined
  ) => {
    if (!result || !result.type || !result.data) return;
    if (!scanned) {
      setScanned(true);
      let idDetalle: string | null = null;
      let noDocumento: string | null = null;
      let nombre = "";
      let fecha = "";
      let hora = "";
      let lugar = "";
      let fila = "";
      let cantidad = "";
      let zona = "";
      // Si termina en invoices/<numero>
      const invoicesMatch = result.data.match(/invoices\/(\d+)$/);
      // Si termina en invoice/<numero>
      const invoiceMatch = result.data.match(/invoice\/(\d+)$/);
      if (invoicesMatch) {
        idDetalle = invoicesMatch[1];
        // console.log("ID Detalle encontrado:", idDetalle);
      } else if (invoiceMatch) {
        noDocumento = invoiceMatch[1];
        // console.log("No Documento encontrado:", noDocumento);
      }

      // Si tenemos idDetalle, buscar el noDocumento asociado
      if (idDetalle) {
        try {
          const response = await fetch(`${api}/facturacion/detalles.php`);
          const responseDetails = await fetch(
            `${api}/facturacion/detalles.php?idDetalle=${idDetalle}`
          );
          const details = await responseDetails.json();
          const payments = await response.json();
          const payment = payments.find((p: any) => p.idDetalle === idDetalle);
          // console.log("Datos del pago encontrado:", payment);
          // console.log("Datos del detalle encontrado:", details);

          if (details.status === "Aprobado" || details.status === "Rechazado") {
            cantidad = details.cantidadDeEntradas?.toString() || "";
            fila = details.fila?.toString() || "";
            zona = details.nombreZona ?? "";
            setModalData({
              idDetalle: idDetalle ?? "No encontrado",
              noDocumento: noDocumento ?? "No encontrado",
              nombre,
              fecha: formatDate(fecha),
              hora: formatTime(hora),
              lugar,
              fila,
              cantidad,
              zona,
            });
            setResultModalType(
              details.status === "Aprobado" ? "aprobado" : "rechazado"
            );
            setResultModalMessage(
              details.status === "Aprobado"
                ? "Esta entrada ya fue aprobada."
                : "Esta entrada ya fue rechazada."
            );
            setResultModalVisible(true);
            setScanned(false);
            console.log("entrada:", cantidad, fila, details);
            return;
          }

          if (payment && details) {
            noDocumento = payment.noDocumento;
            fila = payment.fila.toString() || "";
            cantidad = details.cantidadDeEntradas.toString() || "";
            zona = details.nombreZona;
            setModalData((prev) => ({
              ...prev,
              fila,
              cantidad,
              zona,
            }));

            // console.log("cantidad de entradas:", cantidad);
          }
        } catch (error) {
          console.error("Error al obtener detalles:", error);
        }
      }

      // Si tenemos noDocumento, buscar los datos del pago y evento
      if (noDocumento) {
        try {
          const response = await fetch(
            `${api}/facturacion/facturacion.php?noDocumento=${noDocumento}`
          );
          const payment = await response.json();
          const idEvento = payment.idEvento;
          let cantidadEntradas = 0;

          // Si la respuesta es un array, la cantidad es su longitud
          if (Array.isArray(payment)) {
            cantidadEntradas = payment.length;
            // Puedes tomar los datos del primer objeto si necesitas nombre, fecha, etc.
            if (payment[0]) {
              const { idEvento: eventoId } = payment[0];
              if (eventoId) {
                const eventResponse = await fetch(
                  `${api}/eventos/eventos.php?idEvento=${eventoId}`
                );
                const event = await eventResponse.json();
                nombre = event.nombre || "";
                fecha = event.fecha || "";
                hora = event.hora || "";
                lugar = event.lugar || "";
              }
            }
          } else {
            // Si es un objeto único, la cantidad es 1
            if (idEvento) {
              const eventResponse = await fetch(
                `${api}/eventos/eventos.php?idEvento=${idEvento}`
              );
              const event = await eventResponse.json();
              nombre = event.nombre || "";
              fecha = event.fecha || "";
              hora = event.hora || "";
              lugar = event.lugar || "";
            }
          }
        } catch (error) {
          console.error("Error al obtener datos del pago/evento:", error);
        }
      }

      if (
        (!idDetalle || idDetalle === "No encontrado") &&
        (!noDocumento || noDocumento === "No encontrado") &&
        !nombre &&
        !fecha &&
        !hora &&
        !lugar &&
        !fila &&
        !cantidad
      ) {
        setInvalidQRModalVisible(true);
        setScanned(false); // Permite volver a escanear
        return;
      }

      // Formatear hora (opcional, aquí solo se muestra como viene)
      // Mostrar modal con los datos
      setModalData({
        idDetalle: idDetalle ?? "No encontrado",
        noDocumento: noDocumento ?? "No encontrado",
        nombre,
        fecha: formatDate(fecha),
        hora: formatTime(hora),
        lugar,
        fila,
        cantidad,
        zona,
      });
      setModalVisible(true);
      // Aquí puedes actualizar el estado si quieres mostrar los datos en pantalla
    }
  };

  if (hasPermission === null) {
    return <Text>Solicitando permiso para usar la cámara...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No se tiene permiso para usar la cámara.</Text>;
  }

  // Función para actualizar el status en la API
  const handleStatusUpdate = async (status: string) => {
    let url = `${api}/facturacion/detalles.php`;
    let body: any = { accion: "actualizarStatus", status };

    if (modalData.idDetalle && modalData.idDetalle !== "No encontrado") {
      body.idDetalle = Number(modalData.idDetalle);
    } else if (
      modalData.noDocumento &&
      modalData.noDocumento !== "No encontrado"
    ) {
      body.noDocumento = Number(modalData.noDocumento);
    } else {
      alert("No se encontró idDetalle ni noDocumento para actualizar.");
      return;
    }

    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error("Error al parsear JSON:", e, text);
        Alert.alert("Error", "La respuesta del servidor no es un JSON válido.");
        return;
      }
      console.log("Respuesta de la API:", data);
      if (response.ok) {
        if (status === "Rechazado") {
          setResultModalType("rechazado");
          setResultModalMessage("La entrada ha sido rechazada correctamente.");
        } else {
          setResultModalType("aprobado");
          setResultModalMessage("La entrada ha sido aprobada correctamente.");
        }
        setResultModalVisible(true);
      } else {
        Alert.alert("Error al aprobar entrada");
      }
    } catch (error) {
      console.error("Error al actualizar el status:", error);
      alert("Error al actualizar el status.");
    }
  };

  const { width, height } = Dimensions.get("window");
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#22242e" }}>
      <Modal
        visible={invalidQRModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInvalidQRModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.resultModalContent, styles.resultModalRechazado]}
          >
            <Text style={styles.resultModalIcon}>❌</Text>
            <Text style={styles.resultModalText}>QR inválido</Text>
            <Pressable
              style={styles.resultModalButton}
              onPress={() => setInvalidQRModalVisible(false)}
            >
              <Text style={styles.resultModalButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={resultModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResultModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.resultModalContent,
              resultModalType === "aprobado"
                ? styles.resultModalAprobado
                : styles.resultModalRechazado,
            ]}
          >
            <Text style={styles.resultModalIcon}>
              {resultModalType === "aprobado" ? "✅" : "❌"}
            </Text>
            <Text style={styles.resultModalText}>{resultModalMessage}</Text>

            <Text style={styles.modalInfo}>
              <Text style={styles.resultModalText}>Entrada:</Text> {modalData.fila} de{" "}
              {modalData.cantidad}
            </Text>

            <Pressable
              style={styles.resultModalButton}
              onPress={() => setResultModalVisible(false)}
            >
              <Text style={styles.resultModalButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: width * 0.9 }]}>
            {/* <Text style={styles.modalTitle}>
              No Documento: {modalData.noDocumento}
            </Text> */}
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Nombre:</Text> {modalData.nombre}
            </Text>
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Fecha:</Text> {modalData.fecha}
            </Text>
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Hora:</Text> {modalData.hora}
            </Text>
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Lugar:</Text> {modalData.lugar}
            </Text>
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Zona:</Text> {modalData.zona}
            </Text>
            <Text style={styles.modalInfo}>
              <Text style={styles.bold}>Entrada:</Text> {modalData.fila} de{" "}
              {modalData.cantidad}
            </Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.actionButton, styles.approveButton]}
                onPress={async () => {
                  setModalVisible(false); /* lógica de aprobar */
                  await handleStatusUpdate("Aprobado");
                }}
              >
                <Text style={styles.buttonActionText}>Aprobar</Text>
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={async () => {
                  setModalVisible(false); /* lógica de rechazar */
                  await handleStatusUpdate("Rechazado");
                }}
              >
                <Text style={styles.buttonActionText}>Rechazar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Escanea un Código QR</Text>
          <CameraView
            style={{
              width: width * 0.9,
              height: height * 0.5,
              borderRadius: 16,
            }}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            ref={cameraRef}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          {scanned && (
            <Pressable style={styles.button} onPress={() => setScanned(false)}>
              <Text style={styles.buttonText}>
                {/* Toca aquí para escanear nuevamente */}
                Escanear de nuevo
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22242e",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
  },
  // camera eliminado, ahora se usa style inline responsive
  rescanText: {
    marginTop: 20,
    fontSize: 16,
    color: "#007BFF",
    textDecorationLine: "underline",
  },
  button: {
    width: "90%",
    backgroundColor: "#eefa07",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInfo: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: "left",
    width: "100%",
  },
  bold: {
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 8,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  buttonActionText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  resultModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    width: 280,
  },
  resultModalAprobado: {
    borderColor: "#4CAF50",
    borderWidth: 3,
  },
  resultModalRechazado: {
    borderColor: "#F44336",
    borderWidth: 3,
  },
  resultModalIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultModalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  resultModalButton: {
    backgroundColor: "#22242e",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  resultModalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default Home;
