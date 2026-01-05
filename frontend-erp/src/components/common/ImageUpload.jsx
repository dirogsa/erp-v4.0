import React, { useState } from 'react';
import Button from './Button';

const ImageUpload = ({ onUploadSuccess, currentImage }) => {
    const [uploading, setUploading] = useState(false);

    // Configuración de Cloudinary (Placeholder - El usuario debe configurarlo)
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'tu_cloud_name';
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'tu_preset';

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            if (data.secure_url) {
                onUploadSuccess(data.secure_url);
            } else {
                alert('Error al subir la imagen: ' + (data.error?.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            alert('Error de red al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: '500' }}>Subir Imagen a la Nube (Cloudinary)</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    type="file"
                    id="cloudinary-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => document.getElementById('cloudinary-upload').click()}
                    loading={uploading}
                >
                    {uploading ? 'Subiendo...' : '☁️ Seleccionar Archivo'}
                </Button>
                {currentImage && <span style={{ color: '#059669', fontSize: '0.8rem' }}>✓ Imagen cargada</span>}
            </div>
            {(CLOUD_NAME === 'tu_cloud_name') && (
                <p style={{ color: '#f59e0b', fontSize: '0.7rem', margin: 0 }}>
                    ⚠️ Falta configurar VITE_CLOUDINARY_CLOUD_NAME en .env
                </p>
            )}
        </div>
    );
};

export default ImageUpload;
