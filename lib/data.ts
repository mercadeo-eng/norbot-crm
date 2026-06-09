import type { Cuenta, Etapa, Lead, Campana, Metrica, PostsByCuenta } from "./types";

export const CUENTAS: Cuenta[] = [
  { key: "san_antonio", nombre: "Urbanización San Antonio", nombreCorto: "San Antonio", handle: "@urbanizacionsanantonio_", tipo: "Urbanización residencial", ubicacion: "Bugaba · Chiriquí", brand: "#5b7a6b", precioDesde: 135000, unidadesTotales: 86, unidadesVendidas: 41, fechaInicio: "Lanzamiento ene · 2025" },
  { key: "los_molinos", nombre: "Hacienda Los Molinos Residencial", nombreCorto: "Los Molinos", handle: "@vivelosmolinos", tipo: "Residencial premium", ubicacion: "Boquete · Chiriquí", brand: "#b08940", precioDesde: 215000, unidadesTotales: 48, unidadesVendidas: 19, fechaInicio: "Lanzamiento mar · 2025" },
  { key: "nova_sur", nombre: "Residencial Nova Sur", nombreCorto: "Nova Sur", handle: "@nova_sur", tipo: "Urbanización residencial", ubicacion: "David · Chiriquí", brand: "#4a7a8c", precioDesde: 298000, unidadesTotales: 124, unidadesVendidas: 33, fechaInicio: "Lanzamiento oct · 2024" },
];
export const CUENTA_BY_KEY: Record<string, Cuenta> = Object.fromEntries(CUENTAS.map((c) => [c.key, c]));

export const ETAPAS: Etapa[] = [
  { key: "nuevo",            title: "Lead nuevo",          sub: "01 · Captación y contacto", color: "#5b7a6b" },
  { key: "visita_agendada",  title: "Visita agendada",     sub: "02 · Recorrido pactado",    color: "#8a6a9c" },
  { key: "visita_realizada", title: "Visita realizada",    sub: "03 · Post-recorrido",       color: "#b87355" },
  { key: "reservado",        title: "Reservado · Vendido", sub: "04 · Conversión",           color: "#2d5d4f" },
];
export const ETAPA_BY_KEY: Record<string, Etapa> = Object.fromEntries(ETAPAS.map((e) => [e.key, e]));

/**
 * Mapea cualquier valor de etapa (incluidos los legados) a una de las etapas
 * vigentes del pipeline. "Lead nuevo" unifica las antiguas nuevo/contactado/info_enviada.
 */
export function normalizeEtapa(etapa: string | null | undefined): string {
  switch (etapa) {
    case "contactado":
    case "info_enviada":
    case "llamar_whatsapp":
      return "nuevo";
    case "vendido":
      return "reservado"; // combinado por ahora (Reservado · Vendido)
    case "nuevo":
    case "visita_agendada":
    case "visita_realizada":
    case "reservado":
      return etapa;
    default:
      return "nuevo";
  }
}

export const ORIGENES = ["Pauta IG", "Orgánico IG", "DM Directo", "Story", "Referido", "Brokers", "Hotel"];
export const PRESUPUESTOS = ["$120-180k", "$180-250k", "$250-350k", "$350k+"];

export const MOCK_LEADS: Lead[] = [
  { id: "L001", nombre: "María Castillo",      telefono: "+507 6481-7723", email: "mcastillo@gmail.com",    cuenta: "san_antonio", origen: "Pauta IG",    campana: "Casa modelo · Mayo",    etapa: "reservado",        fechaIngreso: "2026-04-12", presupuesto: "$120-180k", notas: "Cerró reserva de modelo Almendro. Pago inicial pendiente para 15-jun." },
  { id: "L002", nombre: "Luis Bernal",         telefono: "+507 6612-4490", email: "luis.bernal@hotmail.com", cuenta: "san_antonio", origen: "Pauta IG",    campana: "Casa modelo · Mayo",    etapa: "visita_realizada", fechaIngreso: "2026-05-04", presupuesto: "$120-180k", notas: "Visitó el sábado. Le gustó el modelo Cedro de 2 plantas. Pide financiamiento BAC." },
  { id: "L003", nombre: "Carolina Yánez",      telefono: "+507 6789-2210", email: "cyanez@empresarial.pa",  cuenta: "san_antonio", origen: "Story",       campana: "",                       etapa: "visita_agendada",  fechaIngreso: "2026-05-18", presupuesto: "$180-250k", notas: "Agendada sábado 31-may 10am. Llega con esposo." },
  { id: "L004", nombre: "Diego Mendoza",       telefono: "+507 6398-1107", email: "diego.mendoza@me.com",   cuenta: "san_antonio", origen: "Pauta IG",    campana: "Promo Reserva 5%",       etapa: "visita_agendada",  fechaIngreso: "2026-05-20", presupuesto: "$120-180k", notas: "Quiere ver casa modelo y disponibilidad fase 2." },
  { id: "L005", nombre: "Ana Lucía Quintero",  telefono: "+507 6201-8855", email: "alq@gmail.com",          cuenta: "san_antonio", origen: "DM Directo",  campana: "",                       etapa: "info_enviada",     fechaIngreso: "2026-05-22", presupuesto: "$180-250k", notas: "Enviado brochure y planos. Pidió tiempo para revisar con esposo." },
  { id: "L006", nombre: "Roberto Vásquez",     telefono: "+507 6014-3398", email: "rvasquez@gmail.com",     cuenta: "san_antonio", origen: "Pauta IG",    campana: "Promo Reserva 5%",       etapa: "llamar_whatsapp",  fechaIngreso: "2026-05-24", presupuesto: "$120-180k", notas: "Solicitó cotización con cierre financiado. Llamar mañana." },
  { id: "L007", nombre: "Patricia Núñez",      telefono: "+507 6770-1182", email: "pn@gmail.com",           cuenta: "san_antonio", origen: "Pauta IG",    campana: "Casa modelo · Mayo",    etapa: "contactado",       fechaIngreso: "2026-05-25", presupuesto: "$120-180k", notas: "Primer contacto WhatsApp. Pide más fotos del modelo Almendro." },
  { id: "L008", nombre: "Esteban Ríos",        telefono: "+507 6544-0921", email: "estrios@yahoo.com",      cuenta: "san_antonio", origen: "Orgánico IG", campana: "",                       etapa: "contactado",       fechaIngreso: "2026-05-26", presupuesto: "$180-250k", notas: "Vino por publicación de tour 360°. Solicita rangos." },
  { id: "L009", nombre: "Mariana López",       telefono: "+507 6321-4076", email: "marianalopez@gmail.com", cuenta: "san_antonio", origen: "Referido",    campana: "",                       etapa: "llamar_whatsapp",  fechaIngreso: "2026-05-27", presupuesto: "$120-180k", notas: "Referida por residente actual (lote 14). Coordinar llamada." },
  { id: "L010", nombre: "Juan Pablo Solís",    telefono: "+507 6889-2204", email: "jpsolis@outlook.com",    cuenta: "san_antonio", origen: "Pauta IG",    campana: "Promo Reserva 5%",       etapa: "nuevo",            fechaIngreso: "2026-05-29", presupuesto: "$120-180k", notas: "DM esta mañana. Pide info general." },
  { id: "L011", nombre: "Lorena Caicedo",      telefono: "+507 6610-7733", email: "lcaicedo@gmail.com",     cuenta: "san_antonio", origen: "Pauta IG",    campana: "Promo Reserva 5%",       etapa: "nuevo",            fechaIngreso: "2026-05-29", presupuesto: "$180-250k", notas: "Llenó formulario IG." },
  { id: "L012", nombre: "Manuel Bethancourt",  telefono: "+507 6411-0987", email: "mbeth@gmail.com",        cuenta: "san_antonio", origen: "Pauta IG",    campana: "Casa modelo · Mayo",    etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$120-180k", notas: "Recién llegado del formulario." },
  { id: "L013", nombre: "Marisol Pinilla",     telefono: "+507 6018-4220", email: "msolp@gmail.com",        cuenta: "san_antonio", origen: "Story",       campana: "",                       etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$180-250k", notas: "Respondió encuesta del story." },

  { id: "L014", nombre: "Eduardo Martín",      telefono: "+507 6122-3340", email: "emartin@arq.pa",         cuenta: "los_molinos", origen: "Pauta IG",    campana: "Lanzamiento Fase 2",     etapa: "reservado",        fechaIngreso: "2026-04-08", presupuesto: "$180-250k", notas: "Cerró hacienda 19. Firma 12-jun." },
  { id: "L015", nombre: "Adriana Pinto",       telefono: "+507 6809-0014", email: "apinto@gmail.com",       cuenta: "los_molinos", origen: "Referido",    campana: "",                       etapa: "visita_realizada", fechaIngreso: "2026-04-25", presupuesto: "$250-350k", notas: "Visita doble (familia). Muy interesados en hacienda 21." },
  { id: "L016", nombre: "Pablo Otero",         telefono: "+507 6450-2278", email: "pabotero@yahoo.com",     cuenta: "los_molinos", origen: "Pauta IG",    campana: "Lanzamiento Fase 2",     etapa: "visita_agendada",  fechaIngreso: "2026-05-16", presupuesto: "$180-250k", notas: "Sábado 7-jun 4pm." },
  { id: "L017", nombre: "Rosa María Bonilla",  telefono: "+507 6717-3309", email: "rmbonilla@gmail.com",    cuenta: "los_molinos", origen: "Pauta IG",    campana: "Open House Mayo",        etapa: "visita_agendada",  fechaIngreso: "2026-05-21", presupuesto: "$250-350k", notas: "Open House sábado 31-may." },
  { id: "L018", nombre: "Felipe Aranda",       telefono: "+507 6005-8801", email: "fearanda@hotmail.com",   cuenta: "los_molinos", origen: "Pauta IG",    campana: "Lanzamiento Fase 2",     etapa: "info_enviada",     fechaIngreso: "2026-05-19", presupuesto: "$180-250k", notas: "Brochure enviado. Espera comparar con otra opción." },
  { id: "L019", nombre: "Sara Beltrán",        telefono: "+507 6612-3398", email: "sbeltran@gmail.com",     cuenta: "los_molinos", origen: "Orgánico IG", campana: "",                       etapa: "llamar_whatsapp",  fechaIngreso: "2026-05-22", presupuesto: "$250-350k", notas: "Pidió precios y financiamiento Banistmo. Pendiente llamar." },
  { id: "L020", nombre: "Iván Quintero",       telefono: "+507 6889-2231", email: "ivanq@me.com",           cuenta: "los_molinos", origen: "Pauta IG",    campana: "Open House Mayo",        etapa: "contactado",       fechaIngreso: "2026-05-26", presupuesto: "$180-250k", notas: "Confirmó interés. Pendiente coordinar visita." },
  { id: "L021", nombre: "Mónica Vélez",        telefono: "+507 6411-5520", email: "mvelez@gmail.com",       cuenta: "los_molinos", origen: "Pauta IG",    campana: "Open House Mayo",        etapa: "contactado",       fechaIngreso: "2026-05-27", presupuesto: "$250-350k", notas: "Respondió mensaje. Pide tour virtual primero." },
  { id: "L022", nombre: "Pedro Salinas",       telefono: "+507 6320-7714", email: "psalinas@gmail.com",     cuenta: "los_molinos", origen: "DM Directo",  campana: "",                       etapa: "contactado",       fechaIngreso: "2026-05-28", presupuesto: "$180-250k", notas: "Habla con esposa primero." },
  { id: "L023", nombre: "Hugo Pinilla",        telefono: "+507 6708-0091", email: "hugop@gmail.com",        cuenta: "los_molinos", origen: "Pauta IG",    campana: "Lanzamiento Fase 2",     etapa: "nuevo",            fechaIngreso: "2026-05-29", presupuesto: "$180-250k", notas: "Formulario IG." },
  { id: "L024", nombre: "Beatriz Alfaro",      telefono: "+507 6112-7733", email: "balfaro@yahoo.com",      cuenta: "los_molinos", origen: "Pauta IG",    campana: "Open House Mayo",        etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$250-350k", notas: "Llegó hoy. Pide info Open House." },
  { id: "L025", nombre: "Fernando Saa",        telefono: "+507 6014-3322", email: "fsaa@arq.pa",            cuenta: "los_molinos", origen: "Story",       campana: "",                       etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$350k+",    notas: "Respondió encuesta de story." },

  { id: "L026", nombre: "Tomás Acevedo",       telefono: "+507 6800-1144", email: "tacevedo@nova.pa",       cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Penthouse Showcase",     etapa: "reservado",        fechaIngreso: "2026-03-22", presupuesto: "$350k+",    notas: "Reservó penthouse PH02. Cierre 30-jun." },
  { id: "L027", nombre: "Camila Restrepo",     telefono: "+507 6660-2200", email: "crestrepo@gmail.com",    cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Vista al Mar",           etapa: "visita_realizada", fechaIngreso: "2026-04-30", presupuesto: "$250-350k", notas: "Visita martes. Le encantó vista al mar de piso 14." },
  { id: "L028", nombre: "Daniel Sosa",         telefono: "+507 6309-7710", email: "dsosa@me.com",           cuenta: "nova_sur",    origen: "Referido",    campana: "",                       etapa: "visita_realizada", fechaIngreso: "2026-05-08", presupuesto: "$250-350k", notas: "Visita sábado. Comparando con un proyecto Costa del Este." },
  { id: "L029", nombre: "Isabella Ortega",     telefono: "+507 6204-3398", email: "iortega@gmail.com",      cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Vista al Mar",           etapa: "visita_agendada",  fechaIngreso: "2026-05-17", presupuesto: "$250-350k", notas: "Recorrido viernes 6-jun 5pm." },
  { id: "L030", nombre: "Andrés Ferrer",       telefono: "+507 6112-0077", email: "aferrer@nova.pa",        cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Penthouse Showcase",     etapa: "visita_agendada",  fechaIngreso: "2026-05-20", presupuesto: "$350k+",    notas: "Visita ejecutiva miércoles 4-jun." },
  { id: "L031", nombre: "Daniela Mosquera",    telefono: "+507 6889-4422", email: "dmosquera@gmail.com",    cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Vista al Mar",           etapa: "info_enviada",     fechaIngreso: "2026-05-18", presupuesto: "$250-350k", notas: "Brochure y planos enviados. Quiere ver disponibilidad piso 12+." },
  { id: "L032", nombre: "Jimena Lozano",       telefono: "+507 6411-2233", email: "jlozano@yahoo.com",      cuenta: "nova_sur",    origen: "Orgánico IG", campana: "",                       etapa: "llamar_whatsapp",  fechaIngreso: "2026-05-21", presupuesto: "$250-350k", notas: "Vio reel de amenidades. Llamar para cotización directa." },
  { id: "L033", nombre: "Karla Trujillo",      telefono: "+507 6708-1184", email: "ktrujillo@gmail.com",    cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Promo Cierre Trimestre", etapa: "info_enviada",     fechaIngreso: "2026-05-23", presupuesto: "$350k+",    notas: "Pidió cotización 2 unidades (compra y renta)." },
  { id: "L034", nombre: "Gabriela Vergara",    telefono: "+507 6320-7714", email: "gvergara@gmail.com",     cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Vista al Mar",           etapa: "contactado",       fechaIngreso: "2026-05-26", presupuesto: "$250-350k", notas: "Habló brevemente. Pendiente reenviar info." },
  { id: "L035", nombre: "Ricardo Soto",        telefono: "+507 6018-2211", email: "rsoto@me.com",           cuenta: "nova_sur",    origen: "DM Directo",  campana: "",                       etapa: "contactado",       fechaIngreso: "2026-05-27", presupuesto: "$250-350k", notas: "Mensaje directo. Pide tour virtual y precios." },
  { id: "L036", nombre: "Sofía Arboleda",      telefono: "+507 6712-3309", email: "sarboleda@gmail.com",    cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Promo Cierre Trimestre", etapa: "contactado",       fechaIngreso: "2026-05-28", presupuesto: "$250-350k", notas: "Compara con Buenaventura." },
  { id: "L037", nombre: "Jorge Caballero",     telefono: "+507 6004-8870", email: "jcaballero@nova.pa",     cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Penthouse Showcase",     etapa: "nuevo",            fechaIngreso: "2026-05-29", presupuesto: "$350k+",    notas: "Formulario IG." },
  { id: "L038", nombre: "Valentina Cifuentes", telefono: "+507 6611-2298", email: "vcifuentes@gmail.com",   cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Vista al Mar",           etapa: "nuevo",            fechaIngreso: "2026-05-29", presupuesto: "$250-350k", notas: "Nueva. Pide brochure." },
  { id: "L039", nombre: "Alejandro Ruiz",      telefono: "+507 6810-2244", email: "aruiz@yahoo.com",        cuenta: "nova_sur",    origen: "Pauta IG",    campana: "Promo Cierre Trimestre", etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$250-350k", notas: "Llegó hoy 8am." },
  { id: "L040", nombre: "Carla Solano",        telefono: "+507 6709-0098", email: "csolano@gmail.com",      cuenta: "nova_sur",    origen: "Story",       campana: "",                       etapa: "nuevo",            fechaIngreso: "2026-05-30", presupuesto: "$250-350k", notas: "Respondió encuesta del story." },
];

export const MOCK_CAMPANAS: Campana[] = [
  { id: "C001", cuenta: "san_antonio", nombre: "Casa modelo · Mayo",     objetivo: "Mensajes",   inicio: "2026-05-01", fin: "2026-05-31", gasto: 480, alcance: 38200, impresiones: 96400, clicks: 1240, leads: 18, cpl: 26.67, estado: "activa" },
  { id: "C002", cuenta: "san_antonio", nombre: "Promo Reserva 5%",       objetivo: "Conversión", inicio: "2026-05-15", fin: "2026-06-15", gasto: 320, alcance: 22800, impresiones: 58100, clicks: 720,  leads: 11, cpl: 29.09, estado: "activa" },
  { id: "C003", cuenta: "san_antonio", nombre: "Recorrido virtual 360°", objetivo: "Tráfico",    inicio: "2026-04-10", fin: "2026-05-10", gasto: 210, alcance: 18500, impresiones: 42000, clicks: 540,  leads: 6,  cpl: 35.00, estado: "finalizada" },
  { id: "C004", cuenta: "los_molinos", nombre: "Lanzamiento Fase 2",     objetivo: "Mensajes",   inicio: "2026-05-05", fin: "2026-06-05", gasto: 540, alcance: 31200, impresiones: 82400, clicks: 980,  leads: 14, cpl: 38.57, estado: "activa" },
  { id: "C005", cuenta: "los_molinos", nombre: "Open House Mayo",        objetivo: "Conversión", inicio: "2026-05-20", fin: "2026-06-01", gasto: 280, alcance: 14800, impresiones: 36200, clicks: 460,  leads: 9,  cpl: 31.11, estado: "activa" },
  { id: "C006", cuenta: "los_molinos", nombre: "Hacienda en vivo",       objetivo: "Reels",      inicio: "2026-04-15", fin: "2026-05-15", gasto: 180, alcance: 25400, impresiones: 61200, clicks: 410,  leads: 4,  cpl: 45.00, estado: "finalizada" },
  { id: "C007", cuenta: "nova_sur",    nombre: "Vista al Mar",            objetivo: "Mensajes",   inicio: "2026-05-01", fin: "2026-05-31", gasto: 720, alcance: 48200, impresiones: 121400, clicks: 1620, leads: 22, cpl: 32.73, estado: "activa" },
  { id: "C008", cuenta: "nova_sur",    nombre: "Penthouse Showcase",      objetivo: "Conversión", inicio: "2026-05-10", fin: "2026-06-10", gasto: 540, alcance: 28400, impresiones: 78200, clicks: 880,  leads: 10, cpl: 54.00, estado: "activa" },
  { id: "C009", cuenta: "nova_sur",    nombre: "Promo Cierre Trimestre",  objetivo: "Conversión", inicio: "2026-05-20", fin: "2026-06-30", gasto: 380, alcance: 18200, impresiones: 44600, clicks: 590,  leads: 8,  cpl: 47.50, estado: "activa" },
  { id: "C010", cuenta: "nova_sur",    nombre: "Tour amenidades",         objetivo: "Reels",      inicio: "2026-04-01", fin: "2026-04-30", gasto: 220, alcance: 22800, impresiones: 54100, clicks: 420,  leads: 5,  cpl: 44.00, estado: "finalizada" },
];

export const MESES = ["2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"];
export const MES_NOMBRES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function genMetricas(): Metrica[] {
  const out: Metrica[] = [];
  const seeds: Record<string, { followers: number; alcance: number; eng: number; inv: number; leads: number; conv: number }> = {
    san_antonio: { followers: 6800, alcance: 22000, eng: 3.8, inv: 600, leads: 18, conv: 2 },
    los_molinos: { followers: 4900, alcance: 18200, eng: 4.2, inv: 720, leads: 14, conv: 2 },
    nova_sur:    { followers: 9200, alcance: 36400, eng: 3.4, inv: 980, leads: 24, conv: 3 },
  };
  MESES.forEach((mes, i) => {
    CUENTAS.forEach((c) => {
      const s = seeds[c.key];
      const growth = 1 + i * 0.06 + (Math.sin(i + c.key.length) * 0.04);
      out.push({
        mes, cuenta: c.key,
        followers: Math.round(s.followers * growth),
        alcance:   Math.round(s.alcance * growth),
        impresiones: Math.round(s.alcance * growth * 2.4),
        engagement: +(s.eng + (i * 0.05) + (Math.cos(i) * 0.2)).toFixed(2),
        visitasPerfil: Math.round(s.alcance * growth * 0.08),
        inversion: Math.round(s.inv * (0.9 + i * 0.03)),
        leads:     Math.round(s.leads * (0.85 + i * 0.05)),
        conversiones: Math.round(s.conv * (0.7 + i * 0.1)),
      });
    });
  });
  return out;
}
export const MOCK_METRICAS: Metrica[] = genMetricas();

export const MOCK_POSTS: PostsByCuenta = {
  san_antonio: [
    { id:"P1", tipo:"Reel",     titulo:"Tour casa modelo Almendro", alcance: 28400, likes: 1820, comentarios: 142, guardados: 312, fecha:"2026-05-12" },
    { id:"P2", tipo:"Carrusel", titulo:"5 razones para vivir en San Antonio", alcance: 18200, likes: 980, comentarios: 64, guardados: 220, fecha:"2026-05-18" },
    { id:"P3", tipo:"Reel",     titulo:"Antes vs. después de la fase 1", alcance: 22100, likes: 1340, comentarios: 88, guardados: 180, fecha:"2026-05-22" },
  ],
  los_molinos: [
    { id:"P4", tipo:"Reel",     titulo:"Atardecer desde la hacienda 21", alcance: 31200, likes: 2240, comentarios: 188, guardados: 410, fecha:"2026-05-08" },
    { id:"P5", tipo:"Carrusel", titulo:"Planos Fase 2 · 4 modelos", alcance: 14800, likes: 720, comentarios: 52, guardados: 168, fecha:"2026-05-19" },
    { id:"P6", tipo:"Reel",     titulo:"Open House · invitación", alcance: 18400, likes: 1180, comentarios: 96, guardados: 92, fecha:"2026-05-24" },
  ],
  nova_sur: [
    { id:"P7", tipo:"Reel",     titulo:"Vista al mar desde piso 14", alcance: 48200, likes: 3580, comentarios: 312, guardados: 720, fecha:"2026-05-05" },
    { id:"P8", tipo:"Carrusel", titulo:"Penthouse PH02 · recorrido", alcance: 22400, likes: 1420, comentarios: 108, guardados: 380, fecha:"2026-05-14" },
    { id:"P9", tipo:"Reel",     titulo:"Amenidades · pool deck", alcance: 28400, likes: 1860, comentarios: 142, guardados: 290, fecha:"2026-05-21" },
  ],
};
