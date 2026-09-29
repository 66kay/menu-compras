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

  // 1. Intento principal: Consulta directa a super.lider.cl vía Server-Side Rendering
  try {
    const liderUrl = `https://super.lider.cl/search?query=${encodeURIComponent(query.trim())}`;
    const liderRes = await fetch(liderUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9',
      },
    });

    if (liderRes.ok) {
      const html = await liderRes.text();
      const match = html.match(/<script id=__NEXT_DATA__ type="application\/json"[^>]*>(.*?)<\/script>/s);
      if (match) {
        const parsed = JSON.parse(match[1]);
        const rawItems = parsed.props?.pageProps?.initialData?.searchResult?.itemStacks?.[0]?.items || [];

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          const productos: ApifyLiderItem[] = rawItems.slice(0, 10).map((item: any) => ({
            id: item.id || item.usItemId,
            sku: item.usItemId || item.id,
            name: item.name,
            brand: item.brand || 'Líder',
            price: typeof item.price === 'number' ? item.price : parseInt(String(item.price).replace(/\D/g, ''), 10) || 0,
            originalPrice: item.priceInfo?.wasPrice ? parseInt(String(item.priceInfo.wasPrice).replace(/\D/g, ''), 10) : undefined,
            imageUrl: item.imageInfo?.thumbnailUrl || item.imageInfo?.allImages?.[0]?.url || '',
            url: item.canonicalUrl ? `https://super.lider.cl${item.canonicalUrl}` : `https://super.lider.cl/ip/${item.usItemId}`,
            isAvailable: item.availabilityStatusV2?.value !== 'OUT_OF_STOCK',
            category: item.departmentName || 'Supermercado',
          }));

          return res.status(200).json({
            success: true,
            fallback: false,
            fuente: 'super.lider.cl direct',
            sucursal: store,
            productos,
          });
        }
      }
    }
  } catch (directErr) {
    console.warn('Consulta directa a super.lider.cl falló, intentando Apify...', directErr);
  }

  // 2. Intento secundario: Apify Actor si el token está disponible
  const token = process.env.APIFY_API_TOKEN;
  if (token) {
    try {
      const apifyUrl = `https://api.apify.com/v2/acts/scraperschile~lider-cl/run-sync-get-dataset-items?token=${encodeURIComponent(
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

      if (response.ok) {
        const items = (await response.json()) as ApifyLiderItem[];
        return res.status(200).json({
          success: true,
          fallback: false,
          fuente: 'apify lider-cl',
          sucursal: store,
          productos: items,
        });
      }
    } catch (apifyErr) {
      console.warn('Consulta a Apify falló:', apifyErr);
    }
  }

  // 3. Fallback controlado para que el frontend use el catálogo base verificado
  return res.status(200).json({
    success: false,
    fallback: true,
    mensaje: 'Activando catálogo verificado de Líder y caché local.',
    sucursal: store,
    productos: [],
  });
}
