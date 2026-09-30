import React, { useState, useEffect } from 'react';
import CrudPageTemplate from '../components/common/Crud/CrudPageTemplate';
import CrudToolbar from '../components/common/Crud/CrudToolbar';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import marketplaceService from '../services/marketplace.service';

export default function MarketplaceProducts() {
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        brand: '',
        price: '',
        vendor_id: '',
        category_id: '',
        image_url: '',
        description: ''
    });

    useEffect(() => {
        fetchProducts();
        fetchVendors();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await marketplaceService.getProducts({ limit: 100 });
            setProducts(data.items || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const data = await marketplaceService.getVendors({ limit: 100 });
            setVendors(data.items || []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await marketplaceService.getCategories({ limit: 100 });
            setCategories(data.items || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price) || 0
            };
            if (selectedProduct) {
                await marketplaceService.updateProduct(selectedProduct._id, payload);
            } else {
                await marketplaceService.createProduct(payload);
            }
            setIsModalOpen(false);
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Error al guardar: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (product) => {
        setSelectedProduct(product);
        setFormData({
            sku: product.sku || '',
            name: product.name || '',
            brand: product.brand || '',
            price: product.price || '',
            vendor_id: product.vendor_id || '',
            category_id: product.category_id || '',
            image_url: product.image_url || '',
            description: product.description || ''
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        if (vendors.length === 0) {
            alert('Debes crear al menos un proveedor (Tercero) antes de crear productos.');
            return;
        }
        if (categories.length === 0) {
            alert('Debes crear al menos una Categoría MDM antes de crear productos.');
            return;
        }
        setSelectedProduct(null);
        setFormData({ sku: '', name: '', brand: '', price: '', vendor_id: vendors[0]._id, category_id: categories[0]._id, image_url: '', description: '' });
        setIsModalOpen(true);
    };

    const handleDelete = async (ids) => {
        if (window.confirm(`¿Estás seguro de eliminar los ${ids.length} productos seleccionados?`)) {
            for (const id of ids) {
                try {
                    await marketplaceService.deleteProduct(id);
                } catch (err) {
                    console.error('Error deleting product:', err);
                }
            }
            setSelectedIds([]);
            fetchProducts();
        }
    };

    const filteredProducts = products.filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.vendor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { label: 'SKU del Producto', key: 'sku', render: (val, row) => <div className="font-mono text-sm text-brand-primary">{row.sku}</div> },
        { label: 'Producto Tercerizado', key: 'name', sortable: true, render: (val, row) => <div className="font-bold text-white">{row.name}</div> },
        { label: 'Categoría', key: 'category_name', render: (val, row) => <div className="text-sm">{row.category_name || '-'}</div> },
        { label: 'Marca', key: 'brand', render: (val, row) => <div className="text-sm">{row.brand}</div> },
        { label: 'Proveedor', key: 'vendor_name', render: (val, row) => <div className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded inline-block">{row.vendor_name}</div> },
        { label: 'Precio Ref.', key: 'price', render: (val, row) => <div className="font-mono text-gray-300">S/ {row.price?.toFixed(2)}</div> },
        {
            label: 'Acciones',
            key: 'actions',
            render: (_, row) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openEditModal(row); }}>Editar</Button>
                </div>
            )
        }
    ];

    const headerActions = (
        <Button onClick={openCreateModal}>
            + Nuevo Producto
        </Button>
    );

    return (
        <CrudPageTemplate
            title="Catálogo B2B de Terceros"
            subtitle="Inventario extendido. No se mezcla con el Kardex interno."
            headerActions={headerActions}
        >
            <CrudToolbar
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                totalItems={filteredProducts.length}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="🔍 Buscar por SKU, Producto o Proveedor..."
                bulkActions={[
                    {
                        label: 'Eliminar',
                        icon: '🗑️',
                        variant: 'danger',
                        onClick: handleDelete
                    }
                ]}
            />

            <Table
                columns={columns}
                data={filteredProducts}
                loading={loading}
                emptyMessage="No se encontraron productos en el marketplace"
                enableSelection={true}
                selectedKeys={selectedIds}
                onSelectionChange={setSelectedIds}
                keyField="_id"
            />

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#0f172a', borderRadius: '0.75rem', width: '100%', maxWidth: '600px', padding: '1.5rem', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>{selectedProduct ? '📝 Editar Producto Ext.' : '🚀 Nuevo Producto Ext.'}</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'white', fontSize: '0.875rem' }}>Proveedor (Vendedor)</label>
                                <select 
                                    name="vendor_id" 
                                    value={formData.vendor_id} 
                                    onChange={handleInputChange}
                                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: 'white', padding: '0.5rem', borderRadius: '0.375rem' }}
                                >
                                    {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <label style={{ color: 'white', fontSize: '0.875rem' }}>Categoría / Tipo de Producto</label>
                                <select 
                                    name="category_id" 
                                    value={formData.category_id} 
                                    onChange={handleInputChange}
                                    style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #475569', color: 'white', padding: '0.5rem', borderRadius: '0.375rem' }}
                                >
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>

                            <Input label="SKU del Producto" name="sku" value={formData.sku} onChange={handleInputChange} required />
                            <Input label="Nombre del Producto" name="name" value={formData.name} onChange={handleInputChange} required />
                            <Input label="Marca" name="brand" value={formData.brand} onChange={handleInputChange} required />
                            <Input label="Precio Referencial (S/)" name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
                            <Input label="URL de Imagen (Opcional)" name="image_url" value={formData.image_url} onChange={handleInputChange} />
                            <Input label="Descripción Corta" name="description" value={formData.description} onChange={handleInputChange} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </CrudPageTemplate>
    );
}
