// Formateo de fechas
export const formatDate = (date) => {
    if (!date) return 'N/A';

    // Si es un string YYYY-MM-DD, lo procesamos directamente para evitar problemas de zona horaria
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-');
        return `${day}/${month}/${year}`;
    }

    // Para otros formatos (ISO con hora, Date objects), usamos UTC para consistencia
    // OJO: Si viene con hora, se asume que queremos la fecha de esa hora.
    // Pero si es solo fecha, mejor usar UTC.
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    return d.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC' // Forzamos UTC para evitar que 2023-12-11 00:00 pase al día anterior
    });
};

export const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';

    // Para datetime sí usamos la zona local, o UTC? 
    // Si la BD guarda UTC, debemos mostrar local.
    // Si usamos toLocaleString sin timeZone, usa la del browser. 
    // El usuario quiere consistencia. 
    // Vamos a asegurar el formato DD/MM/YYYY HH:mm

    // Opcion A: Usar Intl.DateTimeFormat con formato forzado
    const parts = new Intl.DateTimeFormat('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // 12h format suele ser preferido, o 24h? Default es 24h a veces.
    }).formatToParts(d);

    // Reconstruir si es necesario, o confiar en es-PE.
    // es-PE suele ser dd/mm/yyyy hh:mm
    return d.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

// Formateo de moneda
export const formatCurrency = (amount, symbol = 'S/') => {
    if (amount === null || amount === undefined) return `${symbol} 0.00`;
    return `${symbol} ${parseFloat(amount).toFixed(2)}`;
};

// Formateo de números
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('es-PE');
};

// Formateo de estado
export const formatStatus = (status) => {
    const statusMap = {
        'PENDING': 'Pendiente',
        'PARTIALLY_INVOICED': 'Facturada Parcial',
        'INVOICED': 'Facturada',
        'PAID': 'Pagado',
        'PARTIAL': 'Pago Parcial',
        'DISPATCHED': 'Despachado',
        'NOT_DISPATCHED': 'No Despachado',
        'RECEIVED': 'Recibido',
        'NOT_RECEIVED': 'No Recibido',
        'DRAFT': 'Borrador',
        'SENT': 'Enviada',
        'ACCEPTED': 'Aceptada',
        'CONVERTED': 'Convertida',
        'REJECTED': 'Rechazada'
    };
    return statusMap[status] || status;
};

// Formateo de RUC
export const formatRUC = (ruc) => {
    if (!ruc) return '';
    // Formato: 20-12345678-9
    if (ruc.length === 11) {
        return `${ruc.slice(0, 2)}-${ruc.slice(2, 10)}-${ruc.slice(10)}`;
    }
    return ruc;
};
