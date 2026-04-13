# Estándar de Feedback Visual y Prevención de Doble Clic (ERP v4.0)

Para garantizar una experiencia de usuario premium y evitar errores de duplicidad en la base de datos (como el error de timeout por triple petición), todas las acciones asíncronas deben seguir este estándar de espera.

## 1. El Componente Uniforme
Usar siempre el componente `LoadingOverlay` ubicado en:
`src/components/common/LoadingOverlay.jsx`

## 2. Patrón de Implementación en Páginas
Cada página que realice operaciones de escritura (POST, PUT, DELETE) debe manejar un estado de bloqueo.

```javascript
import LoadingOverlay from '../components/common/LoadingOverlay';

const MyPage = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async () => {
        if (isSubmitting) return; // Protección funcional
        setIsSubmitting(true);    // Bloqueo visual
        
        try {
            await apiService.doSomething();
        } finally {
            setIsSubmitting(false); // Liberar
        }
    }

    return (
        <>
            <LoadingOverlay 
                visible={isSubmitting} 
                message="Procesando..." 
                subMessage="Estamos sincronizando los datos con el servidor."
            />
            {/* Resto del contenido */}
        </>
    );
}
```

## 3. Reglas de Diseño
*   **Mensaje Principal**: Verbo en gerundio ("Guardando...", "Actualizando...", "Eliminando...").
*   **Sub-mensaje**: Explicación breve de lo que ocurre ("Sincronizando con SUNAT", "Validando Inventario").
*   **Fondo**: Siempre usar `backdropFilter: blur(10px)` para dar sensación de profundidad y enfoque.

## 4. Prevención de Doble Clic en Botones
Adicionalmente, los componentes `Button` deben recibir el prop `disabled={isSubmitting}` para cambiar su estado visual antes de que el Overlay cubra la pantalla.
