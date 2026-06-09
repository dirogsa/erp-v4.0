"""
seo_config.py — Fuente de Verdad para la configuración SEO del backend.
CONSTITUTION §3: La lógica de negocio vive en services/utils, nunca en las rutas.

IMPORTANTE: La whitelist de marcas de vehículos DEBE estar sincronizada con
`frontend-web/src/config/seo.config.js → VEHICLE_BRANDS_WHITELIST`.

Para agregar una marca:
  1. Agregar aquí en VEHICLE_BRANDS_WHITELIST (como slug, lowercase con guiones).
  2. Agregar en frontend-web/src/config/seo.config.js VEHICLE_BRANDS_WHITELIST.
  El resto del sistema (sitemap, páginas Hub, endpoint /seo/vehicles) se actualiza solo.

Criterio de inclusión: Marcas con presencia real en el parque automotor peruano.
"""

# Whitelist de slugs de marcas de vehículos relevantes para el mercado peruano.
# Debe coincidir con el resultado de to_slug(make_raw) para cada marca en la BD.
VEHICLE_BRANDS_WHITELIST: set[str] = {
    # ── AUTOS DE PASAJEROS (Alta demanda Perú) ──
    'toyota', 'nissan', 'hyundai', 'kia', 'chevrolet', 'ford',
    'mitsubishi', 'suzuki', 'honda', 'volkswagen', 'mazda', 'subaru',
    'renault', 'peugeot', 'citroen', 'fiat', 'jeep', 'dodge',
    'chrysler', 'bmw', 'mercedes-benz', 'audi', 'volvo', 'skoda',
    'seat', 'alfa-romeo', 'infiniti', 'lexus', 'acura', 'land-rover',
    'jaguar', 'mini', 'porsche', 'tesla',

    # ── CAMIONETAS Y SUV (Mercado peruano clave) ──
    'isuzu', 'great-wall', 'changan', 'chery', 'byd', 'mg',
    'jac', 'foton', 'dfsk', 'haval',

    # ── VEHÍCULOS COMERCIALES Y TRANSPORTE ──
    'hino', 'fuso', 'internacional', 'international', 'kenworth',
    'freightliner', 'mack', 'man', 'scania', 'volvo-trucks',
    'mercedes-benz-trucks', 'iveco', 'daf',

    # ── MAQUINARIA PESADA (Minería y construcción) ──
    'caterpillar', 'komatsu', 'volvo-construction', 'john-deere',
    'kubota', 'bobcat', 'case', 'new-holland', 'liebherr',
    'hitachi-construction', 'hyundai-construction',
}
