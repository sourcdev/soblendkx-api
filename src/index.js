addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const source = url.searchParams.get('by');

  // ¡¡ADVERTENCIA DE SEGURIDAD EXTREMA!!
  // Tu clave API está incrustada directamente aquí. Esto NO es seguro para un entorno de producción.
  // Cualquiera que acceda a tu código desplegado podrá ver y usar esta clave,
  // lo que podría agotar tus créditos en SerpApi o resultar en cargos no deseados.
  // Para un uso real, siempre se recomienda usar 'wrangler secret put SERPAPI_API_KEY'
  // y acceder a ella como 'const serpApiKey = SERPAPI_API_KEY;'.
  const serpApiKey = "f6fa451fbe5750f932c840447910e3b1d7ff727391c5b9807493f6b17e43fb20";

  if (!query) {
    return new Response(JSON.stringify({
      error: "Parámetro 'q' (texto de búsqueda) es requerido.",
      example_url: "https://tudominio.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5"
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (source !== 'soblend--utf-5') {
    return new Response(JSON.stringify({
      error: "Parámetro 'by' inválido. Debe ser 'soblend--utf-5'.",
      example_url: "https://soblendkx-api.workers.dev/?q=ejemplo_de_busqueda&by=soblend--utf-5"
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;

    const serpApiResponse = await fetch(serpApiUrl);

    if (!serpApiResponse.ok) {
      const errorText = await serpApiResponse.text();
      throw new Error(`Error de la API de SerpApi: ${serpApiResponse.status} - ${errorText}`);
    }

    const data = await serpApiResponse.json();

    let results = [];
    if (data.organic_results) {
      results = data.organic_results.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet
      }));
    }

    return new Response(JSON.stringify({
      query: query,
      source: source,
      message: `Resultados de búsqueda para "${query}"`,
      results: results,
      search_information: {
        total_results: data.search_information ? data.search_information.total_results : 0,
        time_taken: data.search_information ? data.search_information.time_taken : 0
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error al realizar la búsqueda con SerpApi:", error);
    return new Response(JSON.stringify({
      error: "Ocurrió un error al procesar tu búsqueda con SerpApi.",
      details: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
        }
