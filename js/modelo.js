// Obtener los elementos del DOM
const imageUpload = document.getElementById('imageUpload');
const preview = document.getElementById('preview');
const predictionText = document.getElementById('prediction');

let model;
let modelPromise = mobilenet.load().then(m => {
  model = m;
  console.log("Modelo cargado correctamente.");
}).catch(error => {
  console.error("Error al cargar el modelo:", error);
});

// Manejar la carga de imagen
imageUpload.addEventListener('change', async (event) => {
  console.log("Imagen seleccionada...");
  const file = event.target.files[0];
  if (!file) return;

  console.log("Archivo:", file.name);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
    console.log("Imagen cargada en preview.");
  };
  reader.readAsDataURL(file);
});

// Función para clasificar la imagen
async function classifyImage() {
  if (!model) {
    console.log("El modelo aún no está cargado.");
    predictionText.innerText = "Cargando modelo...";
    return;
  }
  
  console.log("Modelo listo. Clasificando imagen...");
  try {
    const predictions = await model.classify(preview);
    console.log("Predicción:", predictions);
    if (predictions.length > 0) {
      predictionText.innerText = `Predicción: ${predictions[0].className} (Confianza: ${(predictions[0].probability * 100).toFixed(2)}%)`;
    } else {
      predictionText.innerText = "No se pudo clasificar la imagen.";
    }
  } catch (error) {
    console.error("Error al clasificar la imagen:", error);
    predictionText.innerText = "Error en la clasificación.";
  }
}

async function describeImage() {
  const file = imageUpload.files[0];
  if (!file) {
    console.error("No se encontró el archivo para enviar.");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
      console.log("Enviando imagen al servidor Flask...");
      const response = await fetch("http://127.0.0.1:5000/describe", {
          method: "POST",
          body: formData
      });

      if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta del servidor Flask:", data);
      
      if (data.description) {
          predictionText.innerHTML += `<br><strong>Descripción:</strong> ${data.description}`;
      } else {
          predictionText.innerHTML += "<br><strong>Descripción:</strong> No se pudo generar la descripción.";
      }
  } catch (error) {
      console.error("Error al obtener la descripción:", error);
      predictionText.innerHTML += "<br><strong>Error en la descripción.</strong>";
  }
}


// Ejecutar clasificación y descripción al cargar la imagen en el DOM
preview.onload = async () => {
  console.log("Esperando al modelo si aún no se ha cargado...");
  await modelPromise;
  console.log("Ejecutando clasificación...");
  await classifyImage();
  console.log("Generando descripción...");
  await describeImage();
};
