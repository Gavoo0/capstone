// Catalogo de marcas y modelos para el formulario de vehiculos.
//
// Fuente 1 (principal): lista de marcas y modelos habituales en Chile. Es una lista de referencia
//   escrita a mano (no viene de una fuente oficial), se puede editar aqui.
// Fuente 2 (complemento): API publica NHTSA vPIC (https://vpic.nhtsa.dot.gov/api/), catalogo de EE. UU.
//   Se consulta desde el servidor y se guarda en memoria 24 horas. Si falla, se usa solo la fuente 1.
//   Su cobertura de modelos vendidos en Chile es parcial, por eso no es la fuente principal.

const CATALOGO_CHILE = {
    'Chery': ['Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 7', 'Arrizo 5', 'QQ'],
    'Chevrolet': ['Sail', 'Spark', 'Onix', 'Aveo', 'Cruze', 'Tracker', 'Groove', 'Captiva', 'Colorado', 'D-Max', 'Silverado'],
    'Citroën': ['C3', 'C3 Aircross', 'C4', 'C-Elysée', 'Berlingo'],
    'Fiat': ['Mobi', 'Argo', 'Cronos', 'Uno', 'Palio', 'Fiorino', 'Strada', 'Toro', '500'],
    'Ford': ['Fiesta', 'Focus', 'EcoSport', 'Ranger', 'Territory', 'Escape', 'Explorer'],
    'Great Wall': ['Wingle 5', 'Wingle 7', 'Poer'],
    'Honda': ['Fit', 'City', 'Civic', 'HR-V', 'CR-V'],
    'Hyundai': ['Accent', 'i10', 'Grand i10', 'Elantra', 'Venue', 'Creta', 'Kona', 'Tucson', 'Santa Fe'],
    'JAC': ['J4', 'J7', 'S2', 'S3', 'T6', 'T8'],
    'Jeep': ['Renegade', 'Compass', 'Wrangler', 'Grand Cherokee'],
    'Kia': ['Morning', 'Picanto', 'Rio', 'Soluto', 'Cerato', 'Seltos', 'Soul', 'Sportage', 'Sorento'],
    'Mazda': ['Mazda2', 'Mazda3', 'CX-3', 'CX-30', 'CX-5', 'BT-50'],
    'MG': ['MG3', 'ZS', 'HS', 'RX5'],
    'Mitsubishi': ['Mirage', 'ASX', 'Eclipse Cross', 'Outlander', 'L200', 'Montero'],
    'Nissan': ['March', 'Versa', 'Note', 'Sentra', 'Kicks', 'Qashqai', 'X-Trail', 'Navara'],
    'Opel': ['Corsa', 'Astra', 'Mokka', 'Crossland'],
    'Peugeot': ['208', '2008', '301', '308', '3008', 'Partner', 'Expert'],
    'Renault': ['Kwid', 'Clio', 'Symbol', 'Logan', 'Sandero', 'Stepway', 'Duster', 'Captur', 'Koleos', 'Oroch'],
    'Skoda': ['Fabia', 'Rapid', 'Octavia', 'Karoq', 'Kodiaq'],
    'SsangYong': ['Tivoli', 'Korando', 'Actyon', 'Rexton'],
    'Subaru': ['Impreza', 'XV', 'Crosstrek', 'Forester', 'Outback'],
    'Suzuki': ['Alto', 'Celerio', 'Swift', 'Dzire', 'Baleno', 'Fronx', 'Ertiga', 'Vitara', 'S-Cross', 'Grand Vitara', 'Jimny'],
    'Toyota': ['Etios', 'Yaris', 'Yaris Cross', 'Corolla', 'Corolla Cross', 'Rush', 'RAV4', 'Prius', 'Hilux'],
    'Volkswagen': ['Gol', 'Voyage', 'Polo', 'Virtus', 'Nivus', 'T-Cross', 'Golf', 'Tiguan', 'Saveiro', 'Amarok'],
};

// Nombre con el que la API NHTSA conoce cada marca (cuando no es igual en minusculas y sin tildes)
const NOMBRE_EN_NHTSA = { 'Citroën': 'citroen' };

const VIGENCIA_CACHE_MS = 24 * 60 * 60 * 1000;
const ESPERA_MAXIMA_MS = 6000;
const cacheNhtsa = new Map();

const sinTildes = (texto) => String(texto).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const getMarcas = () => Object.keys(CATALOGO_CHILE).sort((a, b) => a.localeCompare(b, 'es'));

// Devuelve la marca tal como esta en el catalogo, o null si no existe
const buscarMarca = (texto) => {
    if (typeof texto !== 'string' || !texto.trim()) return null;
    return getMarcas().find((marca) => sinTildes(marca) === sinTildes(texto)) || null;
};

const consultarNhtsa = async (marca) => {
    const nombre = NOMBRE_EN_NHTSA[marca] || marca.toLowerCase();
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(nombre)}?format=json`;
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(ESPERA_MAXIMA_MS) });
    if (!respuesta.ok) throw new Error(`NHTSA respondio ${respuesta.status}`);
    const datos = await respuesta.json();
    const nombres = (datos.Results || []).map((r) => String(r.Model_Name || '').trim()).filter(Boolean);
    return [...new Set(nombres)];
};

// Modelos de una marca: { marca, recomendados, otros, fuenteExterna }
//   recomendados = habituales en Chile (lista propia)
//   otros        = modelos de la API NHTSA que no estan en la lista anterior
//   fuenteExterna = false si no se pudo consultar la API (se muestran solo los recomendados)
const getModelos = async (marcaTexto) => {
    const marca = buscarMarca(marcaTexto);
    if (!marca) return null;

    const recomendados = CATALOGO_CHILE[marca];
    let desdeNhtsa = [];
    let fuenteExterna = true;

    const guardado = cacheNhtsa.get(marca);
    if (guardado && Date.now() - guardado.hora < VIGENCIA_CACHE_MS) {
        desdeNhtsa = guardado.modelos;
    } else {
        try {
            desdeNhtsa = await consultarNhtsa(marca);
            cacheNhtsa.set(marca, { hora: Date.now(), modelos: desdeNhtsa });
        } catch (error) {
            console.error(`No se pudo consultar el catalogo NHTSA de ${marca}:`, error.message);
            fuenteExterna = false;
        }
    }

    const yaIncluidos = new Set(recomendados.map(sinTildes));
    const otros = desdeNhtsa
        .filter((modelo) => !yaIncluidos.has(sinTildes(modelo)))
        .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

    return { marca, recomendados, otros, fuenteExterna };
};

module.exports = { CATALOGO_CHILE, getMarcas, buscarMarca, getModelos };
