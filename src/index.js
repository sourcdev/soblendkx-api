addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const source = url.searchParams.get('by');
  const engine = url.searchParams.get('engine') || 'google';

  const serpApiKey = "f6fa451fbe5750f932c840447910e3b1d7ff727391c5b9807493f6b17e43fb20";

  if (!query) {
    return new Response(JSON.stringify({
      error: "Parámetro 'q' (texto de búsqueda) es requerido.",
      example_url: "https://tudominio.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5&engine=google"
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (source !== 'soblend--utf-5') {
    return new Response(JSON.stringify({
      error: "Parámetro 'by' inválido. Debe ser 'soblend--utf-5'.",
      example_url: "https://tudominio.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5&engine=google"
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const allowedEngines = ['google', 'bing', 'duckduckgo'];
  if (!allowedEngines.includes(engine)) {
    return new Response(JSON.stringify({
      error: `Motor de búsqueda inválido: '${engine}'. Los motores permitidos son: ${allowedEngines.join(', ')}.`,
      example_url: "https://tudominio.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5&engine=google"
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let serpApiUrl;
  switch (engine) {
    case 'duckduckgo':
      serpApiUrl = `https://serpapi.com/search.json?engine=duckduckgo&q=${encodeURIComponent(query)}&kl=us-en&api_key=${serpApiKey}`;
      break;
    case 'bing':
      serpApiUrl = `https://serpapi.com/search.json?engine=bing&q=${encodeURIComponent(query)}&cc=US&api_key=${serpApiKey}`;
      break;
    case 'google':
    default:
      serpApiUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
      break;
  }

  try {
    const serpApiResponse = await fetch(serpApiUrl);

    if (!serpApiResponse.ok) {
      const errorText = await serpApiResponse.text();
      throw new Error(`Error de la API de SerpApi para ${engine}: ${serpApiResponse.status} - ${errorText}`);
    }

    const data = await serpApiResponse.json();

    let results = [];
    if (data.organic_results) {
        results = data.organic_results.map(item => item);
    }

    return new Response(JSON.stringify({
      query: query,
      engine: engine,
      source: source,
      message: `Resultados de búsqueda para "${query}" desde ${engine}`,
      results: results,
      search_information: data.search_information,
      raw_serpapi_response: data
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error al realizar la búsqueda con SerpApi:", error);
    return new Response(JSON.stringify({
      error: "Ocurrió un error al procesar tu búsqueda con SerpApi.",
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
      }
