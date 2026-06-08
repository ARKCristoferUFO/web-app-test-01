// 1. REEMPLAZA ESTA URL CON TU URL REAL DE GOOGLE APPS SCRIPT (LA QUE TERMINA EN /exec)
const API_URL = "https://script.google.com/macros/s/AKfycbxRFID-dOQuNJcC2b74GmpYXJ9Do6w5U0yQy89IPy1Y805owu__Xce3yRI9eDBnVpjz/exec";

let clientesGlobal = [];

// Se ejecuta automáticamente al cargar la página web
document.addEventListener("DOMContentLoaded", () => {
    cargarDatos();
    
    // Conectar el buscador en tiempo real (ID: buscador)
    const buscador = document.getElementById("buscador");
    if (buscador) {
        buscador.addEventListener("input", renderizarTabla);
    }
});

// Función para traer los clientes desde Google Sheets
async function cargarDatos() {
    try {
        console.log("Iniciando descarga de datos desde Google Sheets...");
        const res = await fetch(API_URL);
        const json = await res.json();
        clientesGlobal = json.clientes || [];
        console.log("Datos recibidos con éxito. Filas:", clientesGlobal.length);
        renderizarTabla();
    } catch (e) {
        console.error("Error al cargar datos:", e);
        const cuerpoTabla = document.getElementById("cuerpoTabla");
        if (cuerpoTabla) {
            cuerpoTabla.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-red-500 font-black">❌ ERROR AL CONECTAR<br><span class="text-slate-500 font-normal text-[12px]">Verifica la URL o los permisos en Apps Script.</span></td></tr>`;
        }
    }
}

// Función para renderizar la lista en tu tabla oscura
function renderizarTabla() {
    const cuerpoTabla = document.getElementById("cuerpoTabla");
    if (!cuerpoTabla) return;

    const buscador = document.getElementById("buscador");
    const busqueda = buscador ? buscador.value.toLowerCase() : "";

    cuerpoTabla.innerHTML = "";

    // Filtrar clientes por Nombre o Servicio o Teléfono
    const filtrados = clientesGlobal.filter(c => {
        if (!c || c.length < 4) return false; 
        const nombre = String(c[1]).toLowerCase();
        const telefono = String(c[2]).toLowerCase();
        const servicio = String(c[3]).toLowerCase();
        return nombre.includes(busqueda) || telefono.includes(busqueda) || servicio.includes(busqueda);
    });

    if (filtrados.length === 0) {
        cuerpoTabla.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-500">No se encontraron clientes...</td></tr>`;
        return;
    }

    // Dibujar cada fila en la tabla
    filtrados.forEach(c => {
        const tr = document.createElement("tr");
        tr.className = "border-b border-slate-800 hover:bg-slate-900/40 transition-colors text-slate-300 text-sm";
        
        // Calcular estado (Activo / Vencido) basado en la columna 11 (índice 10)
        const fechaVence = c[10] ? new Date(c[10]) : null;
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        
        let estadoHTML = `<span class="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">Sin Fecha</span>`;
        if (fechaVence) {
            fechaVence.setHours(0,0,0,0);
            if (fechaVence < hoy) {
                estadoHTML = `<span class="px-2 py-0.5 rounded text-xs bg-red-900/40 text-red-400 border border-red-800/50 font-medium">Vencido</span>`;
            } else {
                estadoHTML = `<span class="px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 font-medium">Activo</span>`;
            }
        }

        // Formatear fecha legible
        const fechaLegible = c[10] ? String(c[10]).split('T')[0] : '---';

        tr.innerHTML = `
            <td class="p-3">
                <div class="font-semibold text-slate-200">${c[1] || '---'}</div>
                <div class="text-xs text-slate-500 font-mono">${c[3] || '---'}</div>
            </td>
            <td class="p-3">${estadoHTML}</td>
            <td class="p-3 font-mono text-xs text-slate-400">${fechaLegible}</td>
            <td class="p-3 space-x-2">
                <button onclick="renovarCliente('${c[0]}')" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800 px-2 py-1 rounded text-xs transition-colors">🔄 Renovar</button>
                <button onclick="eliminarCliente('${c[0]}')" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-800 px-2 py-1 rounded text-xs transition-colors">🗑️ Eliminar</button>
            </td>
            <td class="p-3 font-mono text-xs text-slate-600">${c[0] || '---'}</td>
        `;
        cuerpoTabla.appendChild(tr);
    });
}

// Función para el botón de Renovar (+30 días)
async function renovarCliente(id) {
    if (!confirm("¿Deseas renovar este cliente por 30 días más?")) return;
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'RENEW', id: id })
        });
        alert("¡Petición de renovación enviada! Espera 2 segundos...");
        setTimeout(cargarDatos, 2000);
    } catch (e) {
        alert("Error en la conexión.");
    }
}

// Función para borrar de la base de datos
async function eliminarCliente(id) {
    if (!confirm("⚠ ¿Estás seguro de eliminar permanentemente este cliente?")) return;
    try {
        await fetch(API_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: 'DELETE', id: id })
        });
        alert("¡Registro eliminado! Actualizando panel...");
        setTimeout(cargarDatos, 2000);
    } catch (e) {
        alert("Error al eliminar.");
    }
}
