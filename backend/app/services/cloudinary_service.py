import os
from typing import Optional

class CloudinaryService:
    """
    Servicio agnóstico para resolución de imágenes en Cloudinary.
    La arquitectura exige que la base de datos solo almacene el public_id (ej. dirogsa/products/WA6162).
    Este servicio centraliza la construcción de URLs para evitar dependencias duras en el frontend.
    """
    
    @classmethod
    def get_cloud_name(cls) -> str:
        # Permite configurar dinámicamente mediante variables de entorno (por defecto 'dhgxr7cp1')
        return os.environ.get("CLOUDINARY_CLOUD_NAME", "dhgxr7cp1")

    @classmethod
    def build_secure_url(cls, public_id: Optional[str], format_auto: bool = True) -> Optional[str]:
        """
        Construye la URL completa de Cloudinary.
        Si format_auto es True, inyecta 'f_auto,q_auto' para servir WebP/AVIF y optimizar calidad.
        """
        if not public_id:
            return None
            
        # Eliminar espacios y barras iniciales/finales por limpieza
        clean_id = public_id.strip().strip("/")
        
        cloud_name = cls.get_cloud_name()
        
        # Inyección de parámetros de transformación de Cloudinary
        transformations = "f_auto,q_auto" if format_auto else ""
        
        # Construcción base: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
        if transformations:
            return f"https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{clean_id}"
        else:
            return f"https://res.cloudinary.com/{cloud_name}/image/upload/{clean_id}"

# Instancia global por conveniencia (aunque los métodos de clase también bastan)
cloudinary_service = CloudinaryService()
