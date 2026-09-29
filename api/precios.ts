export interface VercelRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
}

export interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  end(): VercelResponse;
}

export interface ApifyLiderItem {
  id?: string;
  sku?: string;
  name?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  url?: string;
  isAvailable?: boolean;
  category?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuración de cabeceras CORS y de seguridad
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Solo se acepta GET.' });
  }

  const query = req.query.q as string | undefined;
  const store = (req.query.store as string | undefined) || 'Líder Casona, Osorno';

  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Parámetro de búsqueda "q" inválido o muy corto.' });
  }

  const token = process.env.APIFY_API_TOKEN;

  // Si no está configurado el token en Vercel, respondemos indicando modo fallback elegante
  if (!token) {
    return res.status(200).json({
      success: false,
      fallback: true,
      mensaje: 'APIFY_API_TOKEN no configurado en el servidor. Utilizando catálogo base y caché local.',
      sucursal: store,
      productos: [],
    });
  }

  try {
    // Ejemplo de llamada segura al Actor de Apify / Scraper de Líder
    // https://api.apify.com/v2/acts/.../run-sync-get-dataset-items
    const apifyUrl = `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(
      token
    )}`;

    const response = await fetch(apifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries: [query],
        store: store,
        maxItems: 8,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en API de Apify: ${response.status} ${response.statusText}`);
    }

    const items = (await response.json()) as ApifyLiderItem[];

    return res.status(200).json({
      success: true,
      fallback: false,
      sucursal: store,
      productos: items,
    });
  } catch (error) {
    console.error('Error al consultar precios en Apify/Líder:', error);
    return res.status(200).json({
      success: false,
      fallback: true,
      mensaje: 'Falla temporal al conectar con Líder. Se activa respaldo local.',
      error: error instanceof Error ? error.message : 'Error desconocido',
      sucursal: store,
      productos: [],
    });
  }
}
