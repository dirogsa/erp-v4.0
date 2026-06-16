

async function run() {
    try {
        const res = await fetch('http://localhost:8000/categories');
        const data = await res.json();
        console.log("Total categories:", data.length);
        const filtros = data.find(c => c.name === 'Filtros automotrices');
        console.log("Filtros automotrices:", JSON.stringify(filtros, null, 2));
        
        const children = data.filter(c => c.parent_id === (filtros?._id || filtros?.id));
        console.log("Children of Filtros:", children.map(c => c.name));
    } catch (e) {
        console.error(e);
    }
}
run();
