// @ts-nocheck
/* eslint-disable */
import React, { useState, useMemo, useEffect, useRef } from "react";
import Papa from "papaparse";

/* ============================================================
   NORBOT GROUP · CRM de gestión de redes sociales · Istmo Marketing PA
   Importación de datos por CSV con fusión por cuenta.
============================================================ */

const CUENTAS = [
  { key: "san_antonio", nombre: "Urbanización San Antonio", nombreCorto: "San Antonio", handle: "@urbanizacionsanantonio_", tipo: "Urbanización residencial", ubicacion: "Bugaba · Chiriquí", brand: "#5b7a6b", precioDesde: 135000, unidadesTotales: 86, unidadesVendidas: 41, fechaInicio: "Lanzamiento ene · 2025" },
  { key: "los_molinos", nombre: "Hacienda Los Molinos Residencial", nombreCorto: "Los Molinos", handle: "@vivelosmolinos", tipo: "Residencial premium", ubicacion: "Boquete · Chiriquí", brand: "#b08940", precioDesde: 215000, unidadesTotales: 48, unidadesVendidas: 19, fechaInicio: "Lanzamiento mar · 2025" },
  { key: "nova_sur", nombre: "Residencial Nova Sur", nombreCorto: "Nova Sur", handle: "@nova_sur", tipo: "Urbanización residencial", ubicacion: "David · Chiriquí", brand: "#4a7a8c", precioDesde: 298000, unidadesTotales: 124, unidadesVendidas: 33, fechaInicio: "Lanzamiento oct · 2024" },
];
const CUENTA_BY_KEY = Object.fromEntries(CUENTAS.map((c) => [c.key, c]));

const ETAPAS = [
  { key: "nuevo",            title: "Lead nuevo",          sub: "01 · Entrada IG",         color: "#5b7a6b" },
  { key: "contactado",       title: "Contactado",          sub: "02 · Primer mensaje",     color: "#c89b5e" },
  { key: "info_enviada",     title: "Info enviada",        sub: "03 · Brochure y precios", color: "#4a7a8c" },
  { key: "visita_agendada",  title: "Visita agendada",     sub: "04 · Recorrido pactado",  color: "#8a6a9c" },
  { key: "visita_realizada", title: "Visita realizada",    sub: "05 · Post-recorrido",     color: "#b87355" },
  { key: "reservado",        title: "Reservado · Vendido", sub: "06 · Conversión",         color: "#2d5d4f" },
];
const ETAPA_BY_KEY = Object.fromEntries(ETAPAS.map((e) => [e.key, e]));

const ORIGENES = ["Pauta IG", "Orgánico IG", "DM Directo", "Story", "Referido"];
const PRESUPUESTOS = ["$120-180k", "$180-250k", "$250-350k", "$350k+"];

const MOCK_LEADS = [
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

const MOCK_CAMPANAS = [
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

const MESES = ["2025-12","2026-01","2026-02","2026-03","2026-04","2026-05"];
const MES_NOMBRES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function mesLabel(mes) {
  if (!mes) return "—";
  const parts = String(mes).split("-");
  if (parts.length < 2) return mes;
  const nm = MES_NOMBRES[parseInt(parts[1], 10) - 1] || parts[1];
  return `${nm} ${parts[0].slice(2)}`;
}

function genMetricas() {
  const out = [];
  const seeds = {
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
const MOCK_METRICAS = genMetricas();

const MOCK_POSTS = {
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

/* ───────────────────── HELPERS ───────────────────── */
const fmtMoney = (n) => "$" + Math.round(n || 0).toLocaleString("en-US");
const fmtNum = (n) => Math.round(n || 0).toLocaleString("en-US");
const fmtPct = (n, d = 1) => (n || 0).toFixed(d) + "%";
const compactDate = (s) => {
  if (!s) return "—";
  const d = new Date(s + "T12:00:00");
  if (isNaN(d)) return s;
  return d.toLocaleDateString("es-PA", { day: "2-digit", month: "short" });
};
const longDate = (d) => d.toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" });

function norm(s) {
  return (s == null ? "" : String(s)).trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_\-./]+/g, "");
}
function normalizeRow(raw) { const o = {}; Object.keys(raw || {}).forEach((k) => { o[norm(k)] = raw[k]; }); return o; }
function pick(rowMap, aliases) {
  for (const a of aliases) { const v = rowMap[norm(a)]; if (v != null && String(v).trim() !== "") return String(v).trim(); }
  return "";
}
function parseNum(val) {
  if (val == null || val === "") return 0;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}
function parseFecha(val) {
  let s = String(val || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) { let y = m[3]; if (y.length === 2) y = "20" + y; return `${y}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`; }
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}
const MES_MAP = { ene:"01", jan:"01", feb:"02", mar:"03", abr:"04", apr:"04", may:"05", jun:"06", jul:"07", ago:"08", aug:"08", sep:"09", oct:"10", nov:"11", dic:"12", dec:"12" };
function parseMes(val) {
  let s = String(val || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,"0")}`;
  m = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2,"0")}`;
  m = s.match(/^([a-zA-Záéíóúñ]+)[\s-]?(\d{2,4})$/);
  if (m) { const mm = MES_MAP[norm(m[1]).slice(0, 3)]; if (mm) { let y = m[2]; if (y.length === 2) y = "20" + y; return `${y}-${mm}`; } }
  return null;
}
function resolveCuenta(val) {
  const v = norm(val);
  if (!v) return null;
  for (const c of CUENTAS) if ([c.key, c.nombre, c.nombreCorto, c.handle].some((x) => norm(x) === v)) return c.key;
  for (const c of CUENTAS) if ([c.nombre, c.nombreCorto, c.handle.replace("@","")].some((x) => norm(x).includes(v) || v.includes(norm(x)))) return c.key;
  return null;
}
function resolveEtapa(val) {
  const v = norm(val);
  if (!v) return "nuevo";
  for (const e of ETAPAS) if (norm(e.key) === v || norm(e.title) === v) return e.key;
  for (const e of ETAPAS) if (norm(e.title).includes(v) || v.includes(norm(e.key))) return e.key;
  const syn = { vendido:"reservado", cerrado:"reservado", reserva:"reservado", reservada:"reservado", ganado:"reservado", lead:"nuevo", inicial:"nuevo", primercontacto:"contactado", llamar:"contactado", llamada:"contactado", whatsapp:"contactado", wsp:"contactado", brochure:"info_enviada", info:"info_enviada", agendada:"visita_agendada", agendado:"visita_agendada", visito:"visita_realizada", visitado:"visita_realizada" };
  return syn[v] || "nuevo";
}
function resolveEstado(val) {
  const v = norm(val);
  if (v.includes("final") || v.includes("termin") || v.includes("complet")) return "finalizada";
  if (v.includes("paus")) return "pausada";
  return "activa";
}

function parseLeads(rows, fallback) {
  const out = []; let errores = 0; const avisos = [];
  rows.forEach((raw, i) => {
    const r = normalizeRow(raw);
    const nombre = pick(r, ["nombre","name","cliente","contacto","leadname","fullname"]);
    if (!nombre) { errores++; return; }
    const cuenta = resolveCuenta(pick(r, ["cuenta","account","proyecto","desarrollo","perfil","ig","instagram"]));
    if (!cuenta && !fallback) avisos.push(`Fila ${i + 2}: cuenta no reconocida → asignada a ${CUENTAS[0].nombreCorto}.`);
    out.push({
      id: "L" + String(1001 + out.length),
      nombre,
      telefono: pick(r, ["telefono","tel","celular","phone","whatsapp","movil","numero"]),
      email: pick(r, ["email","correo","mail","correoelectronico"]),
      cuenta: cuenta || fallback || CUENTAS[0].key,
      origen: pick(r, ["origen","source","canal","fuente"]) || "Pauta IG",
      campana: pick(r, ["campana","campaign","anuncio","ad"]),
      etapa: resolveEtapa(pick(r, ["etapa","stage","estado","fase","status"])),
      fechaIngreso: parseFecha(pick(r, ["fechaingreso","fecha","date","ingreso","fechaentrada"])) || new Date().toISOString().slice(0, 10),
      presupuesto: pick(r, ["presupuesto","budget","rango","capacidad"]),
      notas: pick(r, ["notas","notes","comentarios","observaciones"]),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
function parseCampanas(rows, fallback) {
  const out = []; let errores = 0; const avisos = [];
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const nombre = pick(r, ["campana","campaign","nombre","name","anuncio"]);
    const cuenta = resolveCuenta(pick(r, ["cuenta","account","proyecto","desarrollo","perfil"])) || fallback;
    if (!nombre || !cuenta) { errores++; return; }
    const gasto = parseNum(pick(r, ["gasto","spend","inversion","costo","amount","importe"]));
    const leads = parseNum(pick(r, ["leads","resultados","conversaciones","prospectos"]));
    out.push({
      id: "C" + String(1001 + out.length),
      cuenta, nombre,
      objetivo: pick(r, ["objetivo","objective","goal"]) || "Mensajes",
      inicio: parseFecha(pick(r, ["inicio","start","fechainicio","desde"])) || "",
      fin: parseFecha(pick(r, ["fin","end","fechafin","hasta"])) || "",
      gasto,
      alcance: parseNum(pick(r, ["alcance","reach"])),
      impresiones: parseNum(pick(r, ["impresiones","impressions"])),
      clicks: parseNum(pick(r, ["clicks","clics","clicsenlace"])),
      leads,
      cpl: leads > 0 ? gasto / leads : 0,
      estado: resolveEstado(pick(r, ["estado","status","entrega"])),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
function parseMetricas(rows, fallback) {
  const out = []; let errores = 0; const avisos = [];
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const mes = parseMes(pick(r, ["mes","month","periodo","fecha"]));
    const cuenta = resolveCuenta(pick(r, ["cuenta","account","proyecto","desarrollo","perfil"])) || fallback;
    if (!mes || !cuenta) { errores++; return; }
    out.push({
      mes, cuenta,
      followers: parseNum(pick(r, ["followers","seguidores","fans"])),
      alcance: parseNum(pick(r, ["alcance","reach"])),
      impresiones: parseNum(pick(r, ["impresiones","impressions"])),
      engagement: parseNum(pick(r, ["engagement","interaccion","interacciones","tasaengagement","tasadeengagement"])),
      visitasPerfil: parseNum(pick(r, ["visitasperfil","profilevisits","visitas"])),
      inversion: parseNum(pick(r, ["inversion","spend","gasto","inversionmeta"])),
      leads: parseNum(pick(r, ["leads","prospectos"])),
      conversiones: parseNum(pick(r, ["conversiones","conversions","ventas","reservas","cierres"])),
    });
  });
  return { data: out, errores, avisos, count: out.length };
}
function parsePosts(rows, fallback) {
  const out = {}; let errores = 0; let n = 0;
  rows.forEach((raw) => {
    const r = normalizeRow(raw);
    const cuenta = resolveCuenta(pick(r, ["cuenta","account","proyecto","desarrollo","perfil"])) || fallback;
    const titulo = pick(r, ["titulo","title","post","contenido","descripcion","texto"]);
    if (!cuenta || !titulo) { errores++; return; }
    if (!out[cuenta]) out[cuenta] = [];
    out[cuenta].push({
      id: "P" + (++n),
      tipo: pick(r, ["tipo","type","formato"]) || "Post",
      titulo,
      alcance: parseNum(pick(r, ["alcance","reach"])),
      likes: parseNum(pick(r, ["likes","megusta"])),
      comentarios: parseNum(pick(r, ["comentarios","comments"])),
      guardados: parseNum(pick(r, ["guardados","saves","guardado"])),
      fecha: parseFecha(pick(r, ["fecha","date"])) || "",
    });
  });
  return { data: out, errores, avisos: [], count: n };
}
const PARSERS = { leads: parseLeads, campanas: parseCampanas, metricas: parseMetricas, posts: parsePosts };

const IMPORT_INFO = {
  leads: {
    label: "Leads", desc: "Contactos del pipeline. Alimenta el tablero de leads, el embudo y la conversión.",
    headers: ["nombre","telefono","email","cuenta","origen","campana","etapa","fechaIngreso","presupuesto","notas"],
    rows: [
      ["María Castillo","+507 6481-7723","mcastillo@gmail.com","Los Molinos","Pauta IG","Lanzamiento Fase 2","Reservado","2026-05-12","$180-250k","Cerró hacienda 19"],
      ["Pablo Otero","+507 6450-2278","pabotero@yahoo.com","Los Molinos","Pauta IG","Open House Mayo","Llamar / WhatsApp","2026-05-16","$180-250k","Coordinar llamada"],
    ],
  },
  campanas: {
    label: "Campañas (Meta Ads)", desc: "Pautas de Meta Ads. Alimenta la sección de Pautas, inversión, CPL y CTR.",
    headers: ["cuenta","nombre","objetivo","inicio","fin","gasto","alcance","impresiones","clicks","leads","estado"],
    rows: [
      ["Los Molinos","Lanzamiento Fase 2","Mensajes","2026-05-05","2026-06-05","540","31200","82400","980","14","activa"],
      ["Los Molinos","Open House Mayo","Conversión","2026-05-20","2026-06-01","280","14800","36200","460","9","finalizada"],
    ],
  },
  metricas: {
    label: "Métricas mensuales IG", desc: "Insights por mes y cuenta. Alimenta todas las gráficas de evolución y los KPIs del panel.",
    headers: ["mes","cuenta","followers","alcance","impresiones","engagement","visitasPerfil","inversion","leads","conversiones"],
    rows: [
      ["2026-05","Los Molinos","5200","19400","46100","4.3","1550","720","15","2"],
      ["2026-04","Los Molinos","5000","18600","44600","4.1","1480","700","13","2"],
    ],
  },
  posts: {
    label: "Top posts", desc: "Publicaciones destacadas por cuenta. Alimenta las tarjetas de contenido destacado.",
    headers: ["cuenta","tipo","titulo","alcance","likes","comentarios","guardados","fecha"],
    rows: [
      ["Los Molinos","Reel","Atardecer desde la hacienda 21","31200","2240","188","410","2026-05-08"],
      ["Los Molinos","Carrusel","Planos Fase 2","14800","720","52","168","2026-05-19"],
    ],
  },
};

function downloadTemplate(tipo) {
  const info = IMPORT_INFO[tipo];
  const csv = Papa.unparse({ fields: info.headers, data: info.rows });
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `plantilla_${tipo}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ──────────── ScrollX: scrollbar horizontal arriba ──────────── */
function ScrollX({ children }) {
  const topRef = useRef(null);
  const bodyRef = useRef(null);
  const [w, setW] = useState(0);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => { setW(body.scrollWidth); setShow(body.scrollWidth - body.clientWidth > 2); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    Array.from(body.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [children]);
  const onTop = () => { const b = bodyRef.current, t = topRef.current; if (b && t && b.scrollLeft !== t.scrollLeft) b.scrollLeft = t.scrollLeft; };
  const onBody = () => { const b = bodyRef.current, t = topRef.current; if (b && t && t.scrollLeft !== b.scrollLeft) t.scrollLeft = b.scrollLeft; };
  return (
    <div className="scrollx">
      <div className="scrollx-top" ref={topRef} onScroll={onTop} style={{ display: show ? "block" : "none" }}>
        <div style={{ width: w }} />
      </div>
      <div className="scrollx-body" ref={bodyRef} onScroll={onBody}>{children}</div>
    </div>
  );
}

function Sparkline({ values, color = "#2d5d4f", w = 120, h = 32, fill = true }) {
  if (!values || values.length === 0) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1 || 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 4) - 2}`);
  const pathD = "M " + points.join(" L ");
  const areaD = pathD + ` L ${w},${h} L 0,${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block", maxWidth: "100%" }}>
      {fill && <path d={areaD} fill={color} opacity="0.12" />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarRow({ label, value, max, color, suffix = "" }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="bar-row">
      <div className="bar-label">{label}</div>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <div className="bar-value">{typeof value === "number" ? fmtNum(value) : value}{suffix}</div>
    </div>
  );
}

/* ───────────────────── MAIN ───────────────────── */
export default function NorbotCRM() {
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState(() => MOCK_LEADS.map((l) => (ETAPA_BY_KEY[l.etapa] ? l : { ...l, etapa: "contactado" })));
  const [campanas, setCampanas] = useState(MOCK_CAMPANAS);
  const [metricas, setMetricas] = useState(MOCK_METRICAS);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [imported, setImported] = useState({ leads: false, campanas: false, metricas: false, posts: false });
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importCuenta, setImportCuenta] = useState(null);
  const [filtroCuenta, setFiltroCuenta] = useState("todas");
  const [search, setSearch] = useState("");
  const [reporteCuenta, setReporteCuenta] = useState("san_antonio");
  const [reporteMes, setReporteMes] = useState("2026-05");
  const [toast, setToast] = useState("");
  const dragLeadId = useRef(null);
  const toastTimer = useRef(null);

  const meses = useMemo(() => {
    const s = [...new Set(metricas.map((m) => m.mes))].filter(Boolean).sort();
    return s.length ? s : MESES;
  }, [metricas]);

  const realData = imported.leads || imported.campanas || imported.metricas || imported.posts;

  useEffect(() => {
    const id = "norbot-fonts";
    if (document.getElementById(id)) return;
    const pre1 = document.createElement("link"); pre1.rel = "preconnect"; pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link"); pre2.rel = "preconnect"; pre2.href = "https://fonts.gstatic.com"; pre2.crossOrigin = "";
    const link = document.createElement("link"); link.id = id; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(pre1); document.head.appendChild(pre2); document.head.appendChild(link);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") { setSelectedLeadId(null); setShowNewLead(false); setShowImport(false); }
      const tag = document.activeElement?.tagName;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !["INPUT","TEXTAREA","SELECT"].includes(tag)) { e.preventDefault(); setShowNewLead(true); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (!meses.includes(reporteMes)) setReporteMes(meses[meses.length - 1]); }, [meses]);

  function showToast(msg) { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(""), 2600); }

  const leadsFiltrados = useMemo(() => {
    let xs = leads;
    if (filtroCuenta !== "todas") xs = xs.filter((l) => l.cuenta === filtroCuenta);
    if (search.trim()) {
      const q = search.toLowerCase();
      xs = xs.filter((l) => l.nombre.toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q) || (l.telefono || "").includes(q));
    }
    return xs;
  }, [leads, filtroCuenta, search]);

  const headerStats = useMemo(() => {
    const total = leads.length;
    const enProceso = leads.filter((l) => ["contactado","llamar_whatsapp","info_enviada","visita_agendada"].includes(l.etapa)).length;
    const visitas = leads.filter((l) => ["visita_agendada","visita_realizada"].includes(l.etapa)).length;
    const cerrados = leads.filter((l) => l.etapa === "reservado").length;
    const conv = total > 0 ? (cerrados / total) * 100 : 0;
    return { total, enProceso, visitas, cerrados, conv };
  }, [leads]);

  function moveLead(id, newEtapa) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.etapa === newEtapa) return;
    setLeads((xs) => xs.map((l) => (l.id === id ? { ...l, etapa: newEtapa } : l)));
    showToast(`${lead.nombre} → ${ETAPA_BY_KEY[newEtapa].title}`);
  }
  function updateLead(id, patch) { setLeads((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l))); }
  function deleteLead(id) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    if (!confirm(`¿Eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`)) return;
    setLeads((xs) => xs.filter((l) => l.id !== id));
    setSelectedLeadId(null);
    showToast(`Lead eliminado`);
  }
  function addLead(data) {
    const id = "L" + String(Date.now()).slice(-6);
    const newLead = { id, etapa: "nuevo", fechaIngreso: new Date().toISOString().slice(0,10), ...data };
    setLeads((xs) => [newLead, ...xs]);
    showToast(`${newLead.nombre} agregado`);
  }

  /* importación con fusión por cuenta */
  function mergeByCuenta(prev, incoming, idPrefix) {
    const cuentasIn = new Set(incoming.map((x) => x.cuenta));
    const kept = prev.filter((x) => !cuentasIn.has(x.cuenta));
    const merged = [...incoming, ...kept];
    if (idPrefix) return merged.map((x, i) => ({ ...x, id: idPrefix + String(i + 1).padStart(4, "0") }));
    return merged;
  }
  function aplicarImport(tipo, data) {
    if (tipo === "leads") setLeads((prev) => mergeByCuenta(prev, data, "L"));
    else if (tipo === "campanas") setCampanas((prev) => mergeByCuenta(prev, data, "C"));
    else if (tipo === "metricas") setMetricas((prev) => mergeByCuenta(prev, data, null));
    else if (tipo === "posts") setPosts((prev) => ({ ...prev, ...data }));
    setImported((s) => ({ ...s, [tipo]: true }));
    const cuentasIn = tipo === "posts" ? Object.keys(data) : [...new Set(data.map((x) => x.cuenta))];
    const nombres = cuentasIn.map((k) => CUENTA_BY_KEY[k]?.nombreCorto).filter(Boolean).join(", ");
    showToast(`${IMPORT_INFO[tipo].label} importados${nombres ? " · " + nombres : ""}`);
  }
  function restaurarDemo() {
    setLeads(MOCK_LEADS.map((l) => (ETAPA_BY_KEY[l.etapa] ? l : { ...l, etapa: "contactado" }))); setCampanas(MOCK_CAMPANAS); setMetricas(MOCK_METRICAS); setPosts(MOCK_POSTS);
    setImported({ leads: false, campanas: false, metricas: false, posts: false });
    showToast("Datos demo restaurados");
  }
  function abrirImport(cuentaKey) { setImportCuenta(cuentaKey || null); setShowImport(true); }

  function onDragStart(e, id) { dragLeadId.current = id; e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; }
  function onDrop(e, etapaKey) { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); const id = e.dataTransfer.getData("text/plain") || dragLeadId.current; if (id) moveLead(id, etapaKey); }
  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; e.currentTarget.classList.add("drag-over"); }
  function onDragLeave(e) { e.currentTarget.classList.remove("drag-over"); }

  const pageHeader = useMemo(() => {
    if (page === "dashboard") return { eyebrow:"NORBOT Group · Gestión social", title:<>Panel <em>general</em></>, sub:"Vista agregada de los 3 desarrollos en redes" };
    if (page === "leads") return { eyebrow:"Pipeline · Leads Instagram", title:<>Seguimiento de <em>leads</em></>, sub:"Desde el primer DM hasta la reserva" };
    if (page === "embudo") return { eyebrow:"Embudo · Recorrido del lead", title:<>Análisis de <em>embudo</em></>, sub:"Conversión y puntos de fuga entre etapas" };
    if (page === "pautas") return { eyebrow:"Meta Ads · Campañas activas", title:<>Pautas y <em>resultados</em></>, sub:"Inversión, alcance y costo por lead" };
    if (page === "reportes") return { eyebrow:"Reportes mensuales", title:<>Informe <em>ejecutivo</em></>, sub:"Listo para presentar al cliente" };
    if (page.startsWith("cuenta:")) { const c = CUENTA_BY_KEY[page.split(":")[1]]; return { eyebrow:`${c.tipo} · ${c.ubicacion}`, title:<>{c.nombreCorto}</>, sub:c.handle }; }
    return { eyebrow:"", title:"", sub:"" };
  }, [page]);

  return (
    <>
      <Styles />
      <div className="layout">
        <Sidebar page={page} onNavigate={setPage} leads={leads} realData={realData} />
        <main className="main">
          <header className="page-header">
            <div className="hl">
              <div className="eyebrow">
                <span>{pageHeader.eyebrow}</span>
                <span className="sync-badge"><span className={`sync-dot ${realData ? "" : "local"}`} />{realData ? "Datos importados" : "Modo demo"}</span>
                {page.startsWith("cuenta:") && (
                  <button className="btn btn-primary hero-import-btn" onClick={() => abrirImport(page.split(":")[1])}><span className="import-ico">↥</span> Importar datos</button>
                )}
              </div>
              <h1>{pageHeader.title}</h1>
              <div className="sub">{pageHeader.sub}</div>
            </div>
            <div className="hr">
              <Stat label="Leads totales" value={headerStats.total} />
              <Stat label="En proceso" value={headerStats.enProceso} />
              <Stat label="Visitas" value={headerStats.visitas} />
              <Stat label="Reservados" value={headerStats.cerrados} />
              <Stat label="Conversión" value={<>{headerStats.conv.toFixed(0)}<span className="pct">%</span></>} />
            </div>
          </header>

          {page === "dashboard" && (
            <PanelGeneral metricas={metricas} leads={leads} campanas={campanas} meses={meses} onOpenCuenta={(k) => setPage(`cuenta:${k}`)} />
          )}
          {page === "leads" && (
            <LeadsPipeline leads={leadsFiltrados} filtroCuenta={filtroCuenta} setFiltroCuenta={setFiltroCuenta} search={search} setSearch={setSearch}
              onDragStart={onDragStart} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
              onOpenLead={setSelectedLeadId} onNewLead={() => setShowNewLead(true)} />
          )}
          {page === "embudo" && (<EmbudoPage leads={leads} />)}
          {page === "pautas" && (
            <PautasPage campanas={campanas} filtroCuenta={filtroCuenta} setFiltroCuenta={setFiltroCuenta} />
          )}
          {page === "reportes" && (
            <ReportesPage cuenta={reporteCuenta} setCuenta={setReporteCuenta} mes={reporteMes} setMes={setReporteMes}
              metricas={metricas} leads={leads} campanas={campanas} posts={posts} meses={meses} />
          )}
          {page.startsWith("cuenta:") && (
            <CuentaPage cuentaKey={page.split(":")[1]} metricas={metricas} leads={leads} campanas={campanas} posts={posts} meses={meses}
              onImport={() => abrirImport(page.split(":")[1])}
              onGoLeads={() => { setFiltroCuenta(page.split(":")[1]); setPage("leads"); }}
              onGoPautas={() => { setFiltroCuenta(page.split(":")[1]); setPage("pautas"); }}
              onGoReporte={() => { setReporteCuenta(page.split(":")[1]); setPage("reportes"); }} />
          )}
        </main>
      </div>

      {selectedLeadId && (
        <LeadModal lead={leads.find((l) => l.id === selectedLeadId)} onClose={() => setSelectedLeadId(null)}
          onSave={(patch) => { updateLead(selectedLeadId, patch); showToast("Cambios guardados"); }}
          onDelete={() => deleteLead(selectedLeadId)} onMove={(etapa) => moveLead(selectedLeadId, etapa)} />
      )}
      {showNewLead && (<NewLeadModal onClose={() => setShowNewLead(false)} onCreate={(data) => { addLead(data); setShowNewLead(false); }} />)}
      {showImport && (
        <ImportModal imported={imported} cuentaContext={importCuenta} onClose={() => setShowImport(false)} onImport={aplicarImport} onRestore={restaurarDemo} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

/* ──────────────────── SUB-COMPONENTS ──────────────────── */
function Stat({ label, value }) { return (<div className="stat"><div className="stat-num">{value}</div><div className="stat-label">{label}</div></div>); }

function Sidebar({ page, onNavigate, leads, realData }) {
  const leadsPorCuenta = useMemo(() => {
    const map = {};
    CUENTAS.forEach((c) => { map[c.key] = leads.filter((l) => l.cuenta === c.key).length; });
    return map;
  }, [leads]);
  const NavBtn = ({ id, icon, label }) => (
    <button onClick={() => onNavigate(id)} className={`nav-btn ${page === id ? "active" : ""}`}>
      <span className="nav-icon">{icon}</span><span>{label}</span>
    </button>
  );
  return (
    <aside className="sidebar">
      <div className="brand-row">
        <div className="brand-mark">N</div>
        <div className="brand-text"><div className="brand-name">NORBOT Group</div><div className="brand-sub">CRM · Istmo Marketing</div></div>
      </div>
      <nav className="nav">
        <NavBtn id="dashboard" icon="◧" label="Panel general" />
        <NavBtn id="leads" icon="◆" label="Leads · Pipeline" />
        <NavBtn id="embudo" icon="▽" label="Embudo" />
        <NavBtn id="pautas" icon="◉" label="Pautas Meta" />
        <NavBtn id="reportes" icon="◫" label="Reportes" />
        <div className="nav-section"><span>Cuentas Instagram</span><span className="muted-small">{CUENTAS.length}</span></div>
        {CUENTAS.map((c) => {
          const active = page === `cuenta:${c.key}`;
          return (
            <button key={c.key} onClick={() => onNavigate(`cuenta:${c.key}`)} className={`cuenta-btn ${active ? "active" : ""}`}>
              <span className="cuenta-dot" style={{ background: c.brand }} />
              <div className="cuenta-text"><div className="cuenta-name">{c.nombreCorto}</div><div className="cuenta-handle">{c.handle}</div></div>
              <span className="cuenta-count">{leadsPorCuenta[c.key]}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <div className="foot-row"><span className="foot-key">Usuario</span><span className="foot-val">david@istmomarketingpa.com</span></div>
        <div className="foot-row"><span className="foot-key">Fuente</span><span className="foot-val">{realData ? "CSV importado" : "Demo"}</span></div>
      </div>
    </aside>
  );
}

/* ─────── Panel General ─────── */
function PanelGeneral({ metricas, leads, campanas, meses, onOpenCuenta }) {
  const mesActual = meses[meses.length - 1];
  const mesPrev = meses[meses.length - 2] || mesActual;
  const m = metricas.filter((x) => x.mes === mesActual);
  const mPrev = metricas.filter((x) => x.mes === mesPrev);
  const totalReach = m.reduce((a, x) => a + x.alcance, 0);
  const totalReachPrev = mPrev.reduce((a, x) => a + x.alcance, 0);
  const totalInv = m.reduce((a, x) => a + x.inversion, 0);
  const totalLeads = m.reduce((a, x) => a + x.leads, 0);
  const totalConv = m.reduce((a, x) => a + x.conversiones, 0);
  const totalFollowers = m.reduce((a, x) => a + x.followers, 0);
  const totalFollowersPrev = mPrev.reduce((a, x) => a + x.followers, 0);
  const cpl = totalLeads > 0 ? totalInv / totalLeads : 0;
  const reachGrowth = totalReachPrev > 0 ? ((totalReach - totalReachPrev) / totalReachPrev) * 100 : 0;
  const followersGrowth = totalFollowersPrev > 0 ? ((totalFollowers - totalFollowersPrev) / totalFollowersPrev) * 100 : 0;
  const seriesReach = meses.map((mes) => metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.alcance, 0));
  const seriesLeads = meses.map((mes) => metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.leads, 0));
  const seriesInv = meses.map((mes) => metricas.filter((x) => x.mes === mes).reduce((a, x) => a + x.inversion, 0));
  const porCuenta = CUENTAS.map((c) => {
    const cm = m.find((x) => x.cuenta === c.key) || {};
    const cmPrev = mPrev.find((x) => x.cuenta === c.key) || {};
    const lc = leads.filter((l) => l.cuenta === c.key);
    const ccs = campanas.filter((cc) => cc.cuenta === c.key);
    return {
      ...c, reach: cm.alcance || 0, followers: cm.followers || 0,
      followersDelta: (cm.followers || 0) - (cmPrev.followers || 0),
      inversion: cm.inversion || 0, leads: lc.length,
      reservados: lc.filter((l) => l.etapa === "reservado").length,
      cpl: cm.leads > 0 ? cm.inversion / cm.leads : 0, engagement: cm.engagement || 0,
      campanasActivas: ccs.filter((cc) => cc.estado === "activa").length,
      series: meses.map((mes) => (metricas.find((x) => x.mes === mes && x.cuenta === c.key) || {}).alcance || 0),
    };
  });
  return (
    <div className="page">
      <section className="kpi-grid">
        <KpiBig label="Alcance total (mes)" value={fmtNum(totalReach)} delta={reachGrowth} accent="#2d5d4f" />
        <KpiBig label="Inversión Meta (mes)" value={fmtMoney(totalInv)} sub={`CPL ${fmtMoney(cpl)}`} accent="#b08940" />
        <KpiBig label="Leads generados (mes)" value={fmtNum(totalLeads)} sub={`${totalConv} reservas cerradas`} accent="#4a7a8c" />
        <KpiBig label="Seguidores totales" value={fmtNum(totalFollowers)} delta={followersGrowth} accent="#8a6a9c" />
      </section>
      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Evolución últimos {meses.length} meses</h3><p className="card-sub">Alcance · Leads · Inversión (los 3 desarrollos sumados)</p></div></header>
        <div className="trend-grid">
          <TrendChart label="Alcance" values={seriesReach} meses={meses} color="#2d5d4f" />
          <TrendChart label="Leads" values={seriesLeads} meses={meses} color="#4a7a8c" />
          <TrendChart label="Inversión" values={seriesInv} meses={meses} color="#b08940" prefix="$" />
        </div>
      </section>
      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Desempeño por cuenta · {mesLabel(mesActual)}</h3><p className="card-sub">Click una cuenta para abrir su panel detallado</p></div></header>
        <div className="cuenta-cards">
          {porCuenta.map((c) => (
            <button key={c.key} className="cuenta-card" onClick={() => onOpenCuenta(c.key)}>
              <div className="cuenta-card-head">
                <div className="cuenta-stripe" style={{ background: c.brand }} />
                <div><div className="cuenta-card-name">{c.nombreCorto}</div><div className="cuenta-card-handle">{c.handle}</div></div>
                <div className="cuenta-card-pill" style={{ borderColor: c.brand, color: c.brand }}>{c.campanasActivas} pautas</div>
              </div>
              <div className="cuenta-card-grid">
                <Mini label="Alcance" value={fmtNum(c.reach)} />
                <Mini label="Leads" value={fmtNum(c.leads)} />
                <Mini label="Reservados" value={fmtNum(c.reservados)} />
                <Mini label="CPL" value={fmtMoney(c.cpl)} />
                <Mini label="Engagement" value={fmtPct(c.engagement, 1)} />
                <Mini label="Inversión" value={fmtMoney(c.inversion)} />
              </div>
              <div className="cuenta-card-spark">
                <Sparkline values={c.series} color={c.brand} w={280} h={36} />
                <div className="cuenta-card-spark-foot">
                  <span>Followers {fmtNum(c.followers)}</span>
                  <span className={c.followersDelta >= 0 ? "pos" : "neg"}>{c.followersDelta >= 0 ? "▲" : "▼"} {fmtNum(Math.abs(c.followersDelta))}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Próximas visitas agendadas</h3><p className="card-sub">De todos los desarrollos</p></div></header>
        <div className="visit-list">
          {leads.filter((l) => l.etapa === "visita_agendada").map((l) => {
            const c = CUENTA_BY_KEY[l.cuenta];
            return (
              <div key={l.id} className="visit-row">
                <span className="dot" style={{ background: c.brand }} />
                <span className="visit-name">{l.nombre}</span>
                <span className="visit-cuenta">{c.nombreCorto}</span>
                <span className="visit-presu">{l.presupuesto}</span>
                <span className="visit-notes">{l.notas}</span>
              </div>
            );
          })}
          {leads.filter((l) => l.etapa === "visita_agendada").length === 0 && <div className="col-empty">— sin visitas agendadas —</div>}
        </div>
      </section>
    </div>
  );
}

function KpiBig({ label, value, sub, delta, accent }) {
  return (
    <div className="kpi-big" style={{ borderTopColor: accent }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        {typeof delta === "number" && (<span className={delta >= 0 ? "delta pos" : "delta neg"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}% vs mes anterior</span>)}
        {sub && <span className="kpi-sub">{sub}</span>}
      </div>
    </div>
  );
}
function Mini({ label, value }) { return (<div className="mini"><div className="mini-label">{label}</div><div className="mini-value">{value}</div></div>); }

function TrendChart({ label, values, meses, color, prefix = "" }) {
  const last = values[values.length - 1], first = values[0];
  const delta = first > 0 ? ((last - first) / first) * 100 : 0;
  return (
    <div className="trend">
      <div className="trend-head">
        <span className="trend-label">{label}</span>
        <span className={delta >= 0 ? "trend-delta pos" : "trend-delta neg"}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</span>
      </div>
      <div className="trend-value">{prefix}{fmtNum(last)}</div>
      <Sparkline values={values} color={color} w={260} h={50} />
      <div className="trend-axis">{meses.map((mm) => <span key={mm}>{mesLabel(mm).split(" ")[0]}</span>)}</div>
    </div>
  );
}

/* ─────── Leads Pipeline ─────── */
function LeadsPipeline({ leads, filtroCuenta, setFiltroCuenta, search, setSearch, onDragStart, onDrop, onDragOver, onDragLeave, onOpenLead, onNewLead }) {
  return (
    <div className="page">
      <div className="toolbar">
        <div className="search"><input type="text" placeholder="Buscar por nombre, correo o teléfono…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="select" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}>
          <option value="todas">Todas las cuentas</option>
          {CUENTAS.map((c) => <option key={c.key} value={c.key}>{c.nombreCorto}</option>)}
        </select>
        <button className="btn btn-primary" onClick={onNewLead}><span className="plus">＋</span> Nuevo lead</button>
      </div>
      <ScrollX>
        <div className="pipeline">
          {ETAPAS.map((etapa) => {
            const cardsHere = leads.filter((l) => l.etapa === etapa.key);
            return (
              <div key={etapa.key} className="col" onDrop={(e) => onDrop(e, etapa.key)} onDragOver={onDragOver} onDragLeave={onDragLeave}>
                <div className="col-head" style={{ borderTopColor: etapa.color }}>
                  <div><div className="col-title">{etapa.title}</div><div className="col-sub">{etapa.sub}</div></div>
                  <span className="col-count" style={{ color: etapa.color, borderColor: etapa.color }}>{cardsHere.length}</span>
                </div>
                <div className="col-body">
                  {cardsHere.map((l) => {
                    const c = CUENTA_BY_KEY[l.cuenta];
                    return (
                      <div key={l.id} className="lead-card" draggable onDragStart={(e) => onDragStart(e, l.id)} onClick={() => onOpenLead(l.id)}>
                        <div className="lead-card-top"><span className="lead-name">{l.nombre}</span><span className="lead-cuenta-dot" title={c.nombreCorto} style={{ background: c.brand }} /></div>
                        <div className="lead-card-meta"><span>{l.telefono}</span><span>·</span><span>{l.origen}</span></div>
                        {l.presupuesto && <div className="lead-presu">{l.presupuesto}</div>}
                        {l.notas && <div className="lead-notes">{l.notas}</div>}
                        <div className="lead-card-foot"><span className="lead-date">{compactDate(l.fechaIngreso)}</span>{l.campana && <span className="lead-campana">📣 {l.campana}</span>}</div>
                      </div>
                    );
                  })}
                  {cardsHere.length === 0 && <div className="col-empty">— sin leads —</div>}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollX>
    </div>
  );
}

/* ─────── Donut (distribución) ─────── */
function Donut({ data, size = 184, thickness = 26 }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={thickness} style={{ stroke: "var(--bg-darker)" }} />
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        {data.map((d, i) => {
          if (!d.value || total === 0) return null;
          const len = (d.value / total) * circ;
          const seg = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} />;
          acc += len;
          return seg;
        })}
      </g>
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily="'Fraunces', serif" fontSize="30" style={{ fill: "var(--ink)" }}>{total}</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="9" letterSpacing="1.5" style={{ fill: "var(--muted)" }}>LEADS</text>
    </svg>
  );
}

/* ─────── Embudo ─────── */
function EmbudoPage({ leads }) {
  const [filtro, setFiltro] = useState("todas");
  const lc = useMemo(() => (filtro === "todas" ? leads : leads.filter((l) => l.cuenta === filtro)), [leads, filtro]);
  const total = lc.length;
  const countByKey = useMemo(() => {
    const map = {}; ETAPAS.forEach((e) => { map[e.key] = 0; });
    lc.forEach((l) => { if (map[l.etapa] != null) map[l.etapa]++; });
    return map;
  }, [lc]);
  const distrib = ETAPAS.map((e) => ({ ...e, count: countByKey[e.key] }));
  const cum = ETAPAS.map((e, i) => {
    let v = 0; for (let j = i; j < ETAPAS.length; j++) v += countByKey[ETAPAS[j].key];
    return { ...e, value: v };
  });
  const maxV = cum[0].value || 1;
  const convertidos = countByKey["reservado"];
  const tasaConv = total > 0 ? (convertidos / total) * 100 : 0;
  const steps = [];
  for (let i = 0; i < cum.length - 1; i++) {
    const from = cum[i].value, to = cum[i + 1].value;
    steps.push({ from: cum[i], to: cum[i + 1], lost: from - to, retain: from > 0 ? (to / from) * 100 : 0 });
  }
  const maxLeak = steps.reduce((b, s) => (s.lost > (b ? b.lost : -1) ? s : b), null);

  return (
    <div className="page">
      <div className="toolbar">
        <select className="select" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="todas">Todas las cuentas</option>
          {CUENTAS.map((c) => <option key={c.key} value={c.key}>{c.nombreCorto}</option>)}
        </select>
        <span className="toolbar-hint">{total} leads en el embudo</span>
      </div>

      <section className="kpi-grid">
        <KpiBig label="Leads en el embudo" value={fmtNum(total)} accent="#5b7a6b" />
        <KpiBig label="Convertidos · reservados" value={fmtNum(convertidos)} sub={`${tasaConv.toFixed(1)}% del total`} accent="#2d5d4f" />
        <KpiBig label="Tasa de conversión" value={fmtPct(tasaConv, 1)} accent="#4a7a8c" />
        <KpiBig label="Mayor fuga" value={maxLeak ? `−${fmtNum(maxLeak.lost)}` : "—"} sub={maxLeak ? `${maxLeak.from.title} → ${maxLeak.to.title}` : "sin datos"} accent="#a14f3a" />
      </section>

      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Embudo completo</h3><p className="card-sub">Leads que alcanzaron cada etapa · ancho proporcional al volumen</p></div></header>
        <div className="emb-funnel">
          {cum.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            const barPct = maxV > 0 ? (s.value / maxV) * 100 : 0;
            return (
              <div key={s.key} className="emb-row">
                <div className="emb-label"><span className="dot" style={{ background: s.color }} />{s.title}</div>
                <div className="emb-bar-wrap"><div className="emb-bar" style={{ width: `${barPct}%`, background: s.color }}><span className="emb-bar-val">{fmtNum(s.value)}</span></div></div>
                <div className="emb-meta">{pct.toFixed(0)}%<span className="emb-meta-sub">del total</span></div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <header className="card-head"><div><h3 className="card-title">Distribución actual</h3><p className="card-sub">Dónde están parados los leads hoy</p></div></header>
          <div className="donut-wrap">
            <Donut data={distrib.map((d) => ({ label: d.title, value: d.count, color: d.color }))} />
            <div className="donut-legend">
              {distrib.map((d) => (
                <div key={d.key} className="donut-legend-row">
                  <span className="dot" style={{ background: d.color }} />
                  <span className="dl-label">{d.title}</span>
                  <span className="dl-val">{fmtNum(d.count)}</span>
                  <span className="dl-pct">{total > 0 ? Math.round((d.count / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card-head"><div><h3 className="card-title">Puntos de fuga</h3><p className="card-sub">Qué porcentaje avanza a la siguiente etapa</p></div></header>
          <div className="leak-list">
            {steps.map((s, i) => {
              const sev = s.retain >= 70 ? "ok" : s.retain >= 45 ? "mid" : "low";
              const isMax = maxLeak && s.from.key === maxLeak.from.key && maxLeak.lost > 0;
              return (
                <div key={i} className={`leak-row ${isMax ? "leak-max" : ""}`}>
                  <div className="leak-label">{s.from.title} <span className="leak-arrow">→</span> {s.to.title}{isMax && <span className="leak-badge">Mayor fuga</span>}</div>
                  <div className="leak-bar-wrap"><div className={`leak-bar leak-${sev}`} style={{ width: `${s.retain}%` }} /></div>
                  <div className="leak-meta"><strong>{s.retain.toFixed(0)}%</strong> avanza · <span className="leak-lost">−{fmtNum(s.lost)} leads</span></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─────── Pautas Meta ─────── */
function PautasPage({ campanas, filtroCuenta, setFiltroCuenta }) {
  const filtradas = filtroCuenta === "todas" ? campanas : campanas.filter((c) => c.cuenta === filtroCuenta);
  const totGasto = filtradas.reduce((a, c) => a + c.gasto, 0);
  const totLeads = filtradas.reduce((a, c) => a + c.leads, 0);
  const totReach = filtradas.reduce((a, c) => a + c.alcance, 0);
  const totClicks = filtradas.reduce((a, c) => a + c.clicks, 0);
  const cpl = totLeads > 0 ? totGasto / totLeads : 0;
  const cpc = totClicks > 0 ? totGasto / totClicks : 0;
  const ctr = totReach > 0 ? (totClicks / totReach) * 100 : 0;
  const maxGasto = Math.max(1, ...CUENTAS.map((c) => campanas.filter((x) => x.cuenta === c.key).reduce((a, x) => a + x.gasto, 0)));
  return (
    <div className="page">
      <div className="toolbar">
        <select className="select" value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}>
          <option value="todas">Todas las cuentas</option>
          {CUENTAS.map((c) => <option key={c.key} value={c.key}>{c.nombreCorto}</option>)}
        </select>
        <span className="toolbar-hint">{filtradas.length} campañas · {filtradas.filter((c) => c.estado === "activa").length} activas</span>
      </div>
      <section className="kpi-grid">
        <KpiBig label="Inversión total" value={fmtMoney(totGasto)} accent="#b08940" sub={`${filtradas.length} campañas`} />
        <KpiBig label="Leads generados" value={fmtNum(totLeads)} accent="#2d5d4f" sub={`CPL ${fmtMoney(cpl)}`} />
        <KpiBig label="Alcance" value={fmtNum(totReach)} accent="#4a7a8c" sub={`CTR ${ctr.toFixed(2)}%`} />
        <KpiBig label="Clicks" value={fmtNum(totClicks)} accent="#8a6a9c" sub={`CPC ${fmtMoney(cpc)}`} />
      </section>
      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Inversión por cuenta</h3><p className="card-sub">Distribución del gasto en pautas activas + finalizadas</p></div></header>
        <div className="bars">
          {CUENTAS.map((c) => {
            const gasto = campanas.filter((x) => x.cuenta === c.key).reduce((a, x) => a + x.gasto, 0);
            return <BarRow key={c.key} label={c.nombreCorto} value={gasto} max={maxGasto} color={c.brand} suffix={` USD`} />;
          })}
        </div>
      </section>
      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Detalle de campañas</h3><p className="card-sub">Meta Ads · Instagram</p></div></header>
        <ScrollX>
          <table className="table">
            <thead><tr><th>Campaña</th><th>Cuenta</th><th>Objetivo</th><th>Estado</th><th className="num">Gasto</th><th className="num">Alcance</th><th className="num">Clicks</th><th className="num">Leads</th><th className="num">CPL</th></tr></thead>
            <tbody>
              {filtradas.map((c) => {
                const cu = CUENTA_BY_KEY[c.cuenta];
                return (
                  <tr key={c.id}>
                    <td><div className="td-strong">{c.nombre}</div><div className="td-sub">{compactDate(c.inicio)} → {compactDate(c.fin)}</div></td>
                    <td><span className="cu-pill"><span className="dot" style={{ background: cu.brand }} />{cu.nombreCorto}</span></td>
                    <td>{c.objetivo}</td>
                    <td><span className={`badge badge-${c.estado}`}>{c.estado}</span></td>
                    <td className="num">{fmtMoney(c.gasto)}</td>
                    <td className="num">{fmtNum(c.alcance)}</td>
                    <td className="num">{fmtNum(c.clicks)}</td>
                    <td className="num">{c.leads}</td>
                    <td className="num">{fmtMoney(c.cpl)}</td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && <tr><td colSpan={9} className="col-empty">— sin campañas —</td></tr>}
            </tbody>
          </table>
        </ScrollX>
      </section>
    </div>
  );
}

/* ─────── Página por cuenta ─────── */
function CuentaPage({ cuentaKey, metricas, leads, campanas, posts, meses, onImport, onGoLeads, onGoPautas, onGoReporte }) {
  const c = CUENTA_BY_KEY[cuentaKey];
  const m = metricas.filter((x) => x.cuenta === cuentaKey);
  const mesActual = meses[meses.length - 1];
  const mesPrev = meses[meses.length - 2] || mesActual;
  const mAct = m.find((x) => x.mes === mesActual) || {};
  const mPrev = m.find((x) => x.mes === mesPrev) || {};
  const lc = leads.filter((l) => l.cuenta === cuentaKey);
  const cc = campanas.filter((x) => x.cuenta === cuentaKey);
  const seriesReach = meses.map((mes) => (m.find((x) => x.mes === mes) || {}).alcance || 0);
  const seriesFollowers = meses.map((mes) => (m.find((x) => x.mes === mes) || {}).followers || 0);
  const seriesLeads = meses.map((mes) => (m.find((x) => x.mes === mes) || {}).leads || 0);
  const porEtapa = ETAPAS.map((e) => ({ ...e, count: lc.filter((l) => l.etapa === e.key).length }));
  const totalLeads = lc.length;
  const reservados = lc.filter((l) => l.etapa === "reservado").length;
  const inversionAcum = cc.reduce((a, x) => a + x.gasto, 0);
  const postsCuenta = posts[cuentaKey] || [];
  return (
    <div className="page">
      <section className="cuenta-hero" style={{ borderTopColor: c.brand }}>
        <div className="hero-left">
          <div className="hero-mark" style={{ background: c.brand }}>{c.nombreCorto.split(" ").map((w) => w[0]).join("").slice(0,2)}</div>
          <div>
            <div className="hero-eyebrow">{c.tipo} · {c.ubicacion}</div>
            <div className="hero-title">{c.nombre}</div>
            <div className="hero-sub">{c.handle} · {c.fechaInicio}</div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-stats-row">
            <div className="hero-stat"><div className="hsv">{fmtMoney(c.precioDesde)}</div><div className="hsl">Precio desde</div></div>
            <div className="hero-stat"><div className="hsv">{c.unidadesVendidas}/{c.unidadesTotales}</div><div className="hsl">Unidades vendidas</div></div>
            <div className="hero-stat"><div className="hsv">{fmtPct((c.unidadesVendidas / c.unidadesTotales) * 100, 0)}</div><div className="hsl">Avance comercial</div></div>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiBig label="Seguidores" value={fmtNum(mAct.followers)} delta={mPrev.followers ? ((mAct.followers - mPrev.followers) / mPrev.followers) * 100 : 0} accent={c.brand} />
        <KpiBig label="Alcance mes" value={fmtNum(mAct.alcance)} sub={`Impresiones ${fmtNum(mAct.impresiones)}`} accent="#4a7a8c" />
        <KpiBig label="Engagement" value={fmtPct(mAct.engagement, 1)} sub={`Visitas perfil ${fmtNum(mAct.visitasPerfil)}`} accent="#8a6a9c" />
        <KpiBig label="Inversión Meta mes" value={fmtMoney(mAct.inversion)} sub={`${cc.filter((x) => x.estado === "activa").length} pautas activas`} accent="#b08940" />
      </section>

      <div className="two-col">
        <section className="card">
          <header className="card-head"><div><h3 className="card-title">Evolución {meses.length} meses</h3><p className="card-sub">Métricas clave del desarrollo en IG</p></div></header>
          <div className="trend-grid two">
            <TrendChart label="Alcance" values={seriesReach} meses={meses} color={c.brand} />
            <TrendChart label="Seguidores" values={seriesFollowers} meses={meses} color="#4a7a8c" />
            <TrendChart label="Leads" values={seriesLeads} meses={meses} color="#b08940" />
          </div>
        </section>
        <section className="card">
          <header className="card-head"><div><h3 className="card-title">Pipeline interno</h3><p className="card-sub">{totalLeads} leads · {reservados} cerrados</p></div><button className="btn" onClick={onGoLeads}>Abrir pipeline →</button></header>
          <div className="pipeline-mini">
            {porEtapa.map((e) => (
              <div key={e.key} className="pipeline-mini-row">
                <span className="pipeline-mini-dot" style={{ background: e.color }} />
                <span className="pipeline-mini-label">{e.title}</span>
                <div className="pipeline-mini-bar"><div className="pipeline-mini-bar-fill" style={{ width: `${totalLeads ? (e.count/totalLeads)*100 : 0}%`, background: e.color }} /></div>
                <span className="pipeline-mini-count">{e.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Pautas Meta de esta cuenta</h3><p className="card-sub">Inversión acumulada {fmtMoney(inversionAcum)}</p></div><button className="btn" onClick={onGoPautas}>Ver todas →</button></header>
        <ScrollX>
          <table className="table">
            <thead><tr><th>Campaña</th><th>Objetivo</th><th>Estado</th><th className="num">Gasto</th><th className="num">Leads</th><th className="num">CPL</th></tr></thead>
            <tbody>
              {cc.map((x) => (
                <tr key={x.id}>
                  <td><div className="td-strong">{x.nombre}</div><div className="td-sub">{compactDate(x.inicio)} → {compactDate(x.fin)}</div></td>
                  <td>{x.objetivo}</td>
                  <td><span className={`badge badge-${x.estado}`}>{x.estado}</span></td>
                  <td className="num">{fmtMoney(x.gasto)}</td>
                  <td className="num">{x.leads}</td>
                  <td className="num">{fmtMoney(x.cpl)}</td>
                </tr>
              ))}
              {cc.length === 0 && <tr><td colSpan={6} className="col-empty">— sin campañas —</td></tr>}
            </tbody>
          </table>
        </ScrollX>
      </section>

      <section className="card">
        <header className="card-head"><div><h3 className="card-title">Top posts del mes</h3><p className="card-sub">Por alcance orgánico</p></div></header>
        <div className="posts-grid">
          {postsCuenta.map((p) => (
            <div key={p.id} className="post-card">
              <div className="post-head"><span className="post-tipo" style={{ borderColor: c.brand, color: c.brand }}>{p.tipo}</span><span className="post-date">{compactDate(p.fecha)}</span></div>
              <div className="post-title">{p.titulo}</div>
              <div className="post-stats">
                <span><strong>{fmtNum(p.alcance)}</strong><br/>Alcance</span>
                <span><strong>{fmtNum(p.likes)}</strong><br/>Likes</span>
                <span><strong>{fmtNum(p.comentarios)}</strong><br/>Coment.</span>
                <span><strong>{fmtNum(p.guardados)}</strong><br/>Guardad.</span>
              </div>
            </div>
          ))}
          {postsCuenta.length === 0 && <div className="col-empty">— sin posts cargados —</div>}
        </div>
      </section>

      <div className="cta-row"><button className="btn btn-primary" onClick={onGoReporte}>📄 Generar informe mensual</button></div>
    </div>
  );
}

/* ─────── Reportes ─────── */
function ReportesPage({ cuenta, setCuenta, mes, setMes, metricas, leads, campanas, posts, meses }) {
  const c = CUENTA_BY_KEY[cuenta];
  const m = metricas.find((x) => x.cuenta === cuenta && x.mes === mes) || {};
  const mPrev = metricas.find((x) => x.cuenta === cuenta && x.mes === prevMes(mes, meses)) || {};
  const lc = leads.filter((l) => l.cuenta === cuenta);
  const cc = campanas.filter((x) => x.cuenta === cuenta);
  const postsCuenta = (posts[cuenta] || []).slice(0, 3);
  function delta(a, b) { if (!b) return 0; return ((a - b) / b) * 100; }
  return (
    <div className="page">
      <div className="toolbar">
        <select className="select" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>{CUENTAS.map((cc) => <option key={cc.key} value={cc.key}>{cc.nombreCorto}</option>)}</select>
        <select className="select" value={mes} onChange={(e) => setMes(e.target.value)}>{meses.slice().reverse().map((mm) => <option key={mm} value={mm}>{mesLabel(mm)}</option>)}</select>
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Imprimir / Exportar PDF</button>
        <span className="toolbar-hint">Vista lista para presentar al cliente · 1 slide por sección</span>
      </div>
      <div className="report">
        <div className="slide" style={{ background: `linear-gradient(135deg, ${c.brand}10, var(--paper))` }}>
          <div className="slide-eyebrow">NORBOT GROUP · INFORME MENSUAL</div>
          <h2 className="slide-title">{c.nombre}</h2>
          <div className="slide-sub">{c.handle} · {mesLabel(mes)}</div>
          <div className="slide-portada-foot">
            <div><strong>Período</strong><br/>{mesLabel(mes)}</div>
            <div><strong>Cuenta</strong><br/>{c.handle}</div>
            <div><strong>Preparado por</strong><br/>Istmo Marketing PA</div>
            <div><strong>Fecha</strong><br/>{longDate(new Date())}</div>
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">RESUMEN EJECUTIVO</div>
          <h3 className="slide-h3">Lo más importante del mes</h3>
          <div className="exec-grid">
            <ExecKpi label="Alcance" value={fmtNum(m.alcance)} delta={delta(m.alcance, mPrev.alcance)} />
            <ExecKpi label="Seguidores" value={fmtNum(m.followers)} delta={delta(m.followers, mPrev.followers)} />
            <ExecKpi label="Engagement" value={fmtPct(m.engagement, 1)} delta={delta(m.engagement, mPrev.engagement)} />
            <ExecKpi label="Leads" value={fmtNum(m.leads)} delta={delta(m.leads, mPrev.leads)} />
            <ExecKpi label="Inversión" value={fmtMoney(m.inversion)} delta={delta(m.inversion, mPrev.inversion)} reverse />
            <ExecKpi label="Conversiones" value={fmtNum(m.conversiones)} delta={delta(m.conversiones, mPrev.conversiones)} />
          </div>
          <div className="exec-note">
            <strong>Lectura del mes:</strong> {c.nombreCorto} cerró {mesLabel(mes)} con un alcance de {fmtNum(m.alcance)} personas en Instagram, generando {fmtNum(m.leads)} leads cualificados y un costo por lead promedio de {fmtMoney((m.inversion||0)/(m.leads||1))}. Durante el período se ejecutaron {cc.filter((x)=>x.estado==="activa").length} campañas activas con una inversión total de {fmtMoney(m.inversion)} en Meta Ads.
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">META ADS · CAMPAÑAS</div>
          <h3 className="slide-h3">Pautas y desempeño</h3>
          <table className="table report-table">
            <thead><tr><th>Campaña</th><th>Objetivo</th><th className="num">Gasto</th><th className="num">Alcance</th><th className="num">Leads</th><th className="num">CPL</th></tr></thead>
            <tbody>
              {cc.map((x) => (<tr key={x.id}><td><div className="td-strong">{x.nombre}</div></td><td>{x.objetivo}</td><td className="num">{fmtMoney(x.gasto)}</td><td className="num">{fmtNum(x.alcance)}</td><td className="num">{x.leads}</td><td className="num">{fmtMoney(x.cpl)}</td></tr>))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}><strong>Total</strong></td>
                <td className="num"><strong>{fmtMoney(cc.reduce((a,x)=>a+x.gasto,0))}</strong></td>
                <td className="num"><strong>{fmtNum(cc.reduce((a,x)=>a+x.alcance,0))}</strong></td>
                <td className="num"><strong>{cc.reduce((a,x)=>a+x.leads,0)}</strong></td>
                <td className="num"><strong>{fmtMoney(cc.reduce((a,x)=>a+x.gasto,0) / Math.max(1, cc.reduce((a,x)=>a+x.leads,0)))}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">CONTENIDO DESTACADO</div>
          <h3 className="slide-h3">Top posts del mes</h3>
          <div className="posts-grid">
            {postsCuenta.map((p) => (
              <div key={p.id} className="post-card">
                <div className="post-head"><span className="post-tipo" style={{ borderColor: c.brand, color: c.brand }}>{p.tipo}</span><span className="post-date">{compactDate(p.fecha)}</span></div>
                <div className="post-title">{p.titulo}</div>
                <div className="post-stats">
                  <span><strong>{fmtNum(p.alcance)}</strong><br/>Alcance</span>
                  <span><strong>{fmtNum(p.likes)}</strong><br/>Likes</span>
                  <span><strong>{fmtNum(p.comentarios)}</strong><br/>Coment.</span>
                  <span><strong>{fmtNum(p.guardados)}</strong><br/>Guardad.</span>
                </div>
              </div>
            ))}
            {postsCuenta.length === 0 && <div className="col-empty">— sin posts cargados —</div>}
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">LEADS · PIPELINE</div>
          <h3 className="slide-h3">Embudo del mes</h3>
          <div className="funnel">
            {ETAPAS.map((e) => {
              const count = lc.filter((l) => l.etapa === e.key).length;
              const max = lc.length || 1;
              return (
                <div key={e.key} className="funnel-row">
                  <span className="funnel-dot" style={{ background: e.color }} />
                  <span className="funnel-label">{e.title}</span>
                  <div className="funnel-bar"><div className="funnel-fill" style={{ width: `${(count/max)*100}%`, background: e.color }} /></div>
                  <span className="funnel-count">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="funnel-foot">
            <strong>Tasa de conversión IG → reserva:</strong> {fmtPct((lc.filter((l)=>l.etapa==="reservado").length / Math.max(1, lc.length))*100, 1)} · <strong>Visitas agendadas:</strong> {lc.filter((l)=>l.etapa==="visita_agendada").length} · <strong>Visitas realizadas:</strong> {lc.filter((l)=>l.etapa==="visita_realizada").length}
          </div>
        </div>
        <div className="slide">
          <div className="slide-eyebrow">PRÓXIMAS ACCIONES</div>
          <h3 className="slide-h3">Plan para el próximo mes</h3>
          <ul className="acciones">
            <li><strong>Retomar contacto</strong> con {lc.filter((l)=>l.etapa==="contactado").length} leads en estado "Contactado" sin avance.</li>
            <li><strong>Confirmar visitas agendadas</strong> ({lc.filter((l)=>l.etapa==="visita_agendada").length}) con recordatorio 24h antes.</li>
            <li><strong>Optimizar pautas con CPL alto</strong>: revisar copy y segmentación de campañas sobre {fmtMoney(40)} CPL.</li>
            <li><strong>Calendario de contenido:</strong> publicar 8 piezas (3 reels, 3 carruseles, 2 stories) enfocadas en testimoniales y avance de obra.</li>
          </ul>
        </div>
        <div className="slide slide-cierre" style={{ background: `linear-gradient(135deg, ${c.brand}, ${c.brand}cc)` }}>
          <div className="slide-cierre-text">
            <div className="slide-eyebrow light">PRESENTADO POR</div>
            <h2 className="slide-cierre-title">Istmo Marketing PA</h2>
            <div className="slide-cierre-sub">david@istmomarketingpa.com · Panamá</div>
          </div>
          <div className="slide-cierre-foot">Gracias · {longDate(new Date())}</div>
        </div>
      </div>
    </div>
  );
}

function ExecKpi({ label, value, delta, reverse }) {
  const positive = reverse ? delta < 0 : delta >= 0;
  return (
    <div className="exec-kpi">
      <div className="exec-label">{label}</div>
      <div className="exec-value">{value}</div>
      <div className={`exec-delta ${positive ? "pos" : "neg"}`}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%</div>
    </div>
  );
}
function prevMes(mes, meses) { const idx = meses.indexOf(mes); return idx > 0 ? meses[idx - 1] : mes; }

/* ─────── modal lead ─────── */
function LeadModal({ lead, onClose, onSave, onDelete, onMove }) {
  const [form, setForm] = useState({ etapa: lead.etapa, notas: lead.notas, telefono: lead.telefono, email: lead.email, presupuesto: lead.presupuesto || "" });
  const c = CUENTA_BY_KEY[lead.cuenta];
  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow"><span className="dot" style={{ background: c.brand }} />{c.nombreCorto} · {lead.origen}{lead.campana ? ` · ${lead.campana}` : ""}</div>
            <h3 className="modal-title">{lead.nombre}</h3>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="lead-actions">
            {(form.telefono || "").replace(/\D/g, "").length >= 7 ? (
              <>
                <a className="btn lead-action call" href={"tel:+" + (form.telefono || "").replace(/\D/g, "")}>📞 Llamar</a>
                <a className="btn lead-action wapp" href={"https://wa.me/" + (form.telefono || "").replace(/\D/g, "")} target="_blank" rel="noopener noreferrer">💬 Escribir a WhatsApp</a>
              </>
            ) : (
              <span className="lead-actions-empty">Agrega un teléfono para llamar o escribir por WhatsApp</span>
            )}
          </div>
          <div className="fld">
            <label>Etapa</label>
            <div className="etapa-pills">
              {ETAPAS.map((e) => (
                <button key={e.key} className={`etapa-pill ${form.etapa === e.key ? "active" : ""}`}
                  style={form.etapa === e.key ? { background: e.color, borderColor: e.color, color: "#fff" } : { borderColor: e.color, color: e.color }}
                  onClick={() => setForm({ ...form, etapa: e.key })}>{e.title}</button>
              ))}
            </div>
          </div>
          <div className="fld-row">
            <div className="fld"><label>Teléfono</label><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
            <div className="fld"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="fld">
            <label>Presupuesto</label>
            <select value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}>
              <option value="">— sin definir —</option>
              {PRESUPUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="fld"><label>Notas internas</label><textarea rows={5} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
          <div className="fld-info"><span><strong>Ingreso:</strong> {compactDate(lead.fechaIngreso)}</span><span><strong>ID:</strong> {lead.id}</span></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-danger" onClick={onDelete}>Eliminar</button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); if (form.etapa !== lead.etapa) onMove(form.etapa); onClose(); }}>Guardar</button>
        </div>
      </div>
    </>
  );
}

/* ─────── modal nuevo lead ─────── */
function NewLeadModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", cuenta: "san_antonio", origen: "Pauta IG", campana: "", presupuesto: "$180-250k", notas: "" });
  function submit() { if (!form.nombre.trim()) { alert("El nombre es obligatorio"); return; } onCreate(form); }
  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal">
        <div className="modal-head"><div><div className="modal-eyebrow">Nuevo lead · Pipeline IG</div><h3 className="modal-title">Agregar contacto</h3></div><button className="x" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="fld-row">
            <div className="fld"><label>Nombre *</label><input autoFocus value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div className="fld"><label>Teléfono</label><input placeholder="+507 6XXX-XXXX" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></div>
          </div>
          <div className="fld-row">
            <div className="fld"><label>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="fld"><label>Cuenta</label><select value={form.cuenta} onChange={(e) => setForm({ ...form, cuenta: e.target.value })}>{CUENTAS.map((c) => <option key={c.key} value={c.key}>{c.nombreCorto}</option>)}</select></div>
          </div>
          <div className="fld-row">
            <div className="fld"><label>Origen</label><select value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })}>{ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
            <div className="fld"><label>Campaña (opcional)</label><input value={form.campana} onChange={(e) => setForm({ ...form, campana: e.target.value })} /></div>
          </div>
          <div className="fld"><label>Presupuesto</label><select value={form.presupuesto} onChange={(e) => setForm({ ...form, presupuesto: e.target.value })}>{PRESUPUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
          <div className="fld"><label>Notas</label><textarea rows={4} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
        </div>
        <div className="modal-foot"><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancelar</button><button className="btn btn-primary" onClick={submit}>Crear lead</button></div>
      </div>
    </>
  );
}

/* ─────── modal importar CSV ─────── */
function ImportModal({ imported, cuentaContext, onClose, onImport, onRestore }) {
  const [tipo, setTipo] = useState("leads");
  const [result, setResult] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef(null);
  const ctxCuenta = cuentaContext ? CUENTA_BY_KEY[cuentaContext] : null;

  function reset() { setResult(null); setFileName(""); }
  function pickTipo(t) { setTipo(t); reset(); }
  function handleFile(file) {
    if (!file) return;
    setParsing(true); setFileName(file.name);
    Papa.parse(file, {
      header: true, skipEmptyLines: "greedy",
      complete: (res) => {
        try { const out = PARSERS[tipo]((res.data || []), cuentaContext || null); setResult({ ...out, total: (res.data || []).length }); }
        catch (err) { setResult({ error: String(err) }); }
        setParsing(false);
      },
      error: (err) => { setResult({ error: String(err) }); setParsing(false); },
    });
  }
  function onZoneDrop(e) { e.preventDefault(); e.currentTarget.classList.remove("drag-over"); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }
  function aplicar() { if (!result || result.error || !result.count) return; onImport(tipo, result.data); reset(); }

  const info = IMPORT_INFO[tipo];
  const tiposActivos = Object.entries(imported).filter(([, v]) => v).map(([k]) => IMPORT_INFO[k].label);

  return (
    <>
      <div className="modal-back" onClick={onClose} />
      <div className="modal modal-wide">
        <div className="modal-head">
          <div>
            <div className="modal-eyebrow">Datos reales · Importación CSV{ctxCuenta ? ` · ${ctxCuenta.nombreCorto}` : ""}</div>
            <h3 className="modal-title">Importar datos</h3>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="fld">
            <label>¿Qué quieres importar?</label>
            <div className="import-tipos">
              {Object.entries(IMPORT_INFO).map(([k, v]) => (
                <button key={k} className={`import-tipo ${tipo === k ? "active" : ""}`} onClick={() => pickTipo(k)}>{v.label}{imported[k] && <span className="import-tipo-check">✓</span>}</button>
              ))}
            </div>
          </div>
          <p className="import-desc">{info.desc}</p>
          <div className="import-note">
            Al aplicar, se actualizan <strong>solo las cuentas presentes en el archivo</strong>; las demás se conservan intactas.
            {ctxCuenta && <> Las filas sin cuenta reconocida se asignarán a <strong>{ctxCuenta.nombreCorto}</strong>.</>}
          </div>
          <div className="tpl-row">
            <span className="import-desc">Columnas esperadas (nombres flexibles):</span>
            <button className="link-btn" onClick={() => downloadTemplate(tipo)}>↓ Descargar plantilla CSV</button>
          </div>
          <div className="import-fields">{info.headers.join("  ·  ")}</div>
          <div className="drop-zone" onClick={() => fileRef.current?.click()} onDrop={onZoneDrop}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("drag-over"); }}
            onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}>
            <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
            <div className="drop-icon">↥</div>
            <div className="drop-title">{parsing ? "Procesando…" : fileName ? fileName : "Arrastra tu CSV aquí o haz click para elegir"}</div>
            <div className="drop-sub">Formato .csv · separado por comas</div>
          </div>
          {result && !result.error && (
            <div className="import-summary">
              <div><span className="ok">✓ {result.count} {info.label.toLowerCase()} válidas</span> de {result.total} filas leídas.</div>
              {result.errores > 0 && <div className="err">✕ {result.errores} filas omitidas (faltan datos obligatorios).</div>}
              {result.avisos && result.avisos.slice(0, 3).map((a, i) => <div key={i} className="warn">⚠ {a}</div>)}
              {result.avisos && result.avisos.length > 3 && <div className="warn">⚠ …y {result.avisos.length - 3} avisos más.</div>}
              {result.count === 0 && <div className="err">No se reconoció ninguna fila. Revisa que las columnas coincidan con la plantilla.</div>}
            </div>
          )}
          {result && result.error && <div className="import-summary"><div className="err">No se pudo leer el archivo: {result.error}</div></div>}
          {tiposActivos.length > 0 && (<div className="import-active">Datos importados activos: <strong>{tiposActivos.join(", ")}</strong></div>)}
        </div>
        <div className="modal-foot">
          <button className="btn btn-danger" onClick={() => { onRestore(); reset(); }}>Restaurar demo</button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" disabled={!result || result.error || !result.count} onClick={aplicar}>Aplicar al CRM</button>
        </div>
      </div>
    </>
  );
}

/* ──────────────────── ESTILOS ──────────────────── */
function Styles() {
  return (
    <style>{`
:root {
  --bg:#f5f1ea; --bg-darker:#ebe5d9; --ink:#1a2820; --ink-soft:#3a4a40; --muted:#6b7a70;
  --line:#d4cdbe; --paper:#fbf8f2; --accent:#2d5d4f; --accent-hover:#1e4337;
  --gold:#b08940; --rust:#a14f3a;
  --shadow-card:0 1px 2px rgba(26,40,32,.04),0 2px 8px rgba(26,40,32,.06);
  --shadow-card-hover:0 4px 12px rgba(26,40,32,.10),0 8px 24px rgba(26,40,32,.08);
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; padding: 0; }
body {
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--bg); color: var(--ink); min-height: 100vh;
  background-image: radial-gradient(circle at 20% 10%, rgba(45,93,79,.04) 0, transparent 50%), radial-gradient(circle at 80% 60%, rgba(176,137,64,.04) 0, transparent 50%);
}
button { font-family: inherit; }
input, select, textarea { font-family: inherit; color: var(--ink); }

.layout { display: flex; min-height: 100vh; }
.sidebar { width: 256px; flex-shrink: 0; background: var(--paper); border-right: 1px solid var(--line); padding: 24px 16px; display: flex; flex-direction: column; gap: 12px; }
.main { flex: 1; padding: 28px 36px 60px; min-width: 0; }

.brand-row { display: flex; align-items: center; gap: 10px; padding: 4px 6px 16px; border-bottom: 1px solid var(--line); }
.brand-mark { width: 36px; height: 36px; border-radius: 8px; background: var(--accent); color: #fff; font-family: 'Fraunces', serif; font-weight: 500; font-size: 20px; display: flex; align-items: center; justify-content: center; }
.brand-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; letter-spacing: -.01em; color: var(--ink); line-height: 1; }
.brand-sub { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

.nav { display: flex; flex-direction: column; gap: 2px; padding-top: 8px; flex: 1; overflow-y: auto; }
.nav-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border: 0; background: transparent; border-radius: 6px; color: var(--ink-soft); font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; transition: all .15s; }
.nav-btn:hover { background: var(--bg-darker); color: var(--ink); }
.nav-btn.active { background: var(--accent); color: #fff; }
.nav-icon { font-size: 14px; opacity: .85; }

.nav-section { display: flex; align-items: center; justify-content: space-between; padding: 16px 12px 6px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.muted-small { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }

.cuenta-btn { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; background: transparent; border-radius: 6px; cursor: pointer; text-align: left; transition: all .15s; }
.cuenta-btn:hover { background: var(--bg-darker); }
.cuenta-btn.active { background: var(--bg-darker); box-shadow: inset 2px 0 0 var(--ink); }
.cuenta-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cuenta-text { flex: 1; min-width: 0; }
.cuenta-name { font-size: 12.5px; font-weight: 600; color: var(--ink); line-height: 1.1; }
.cuenta-handle { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; color: var(--muted); margin-top: 2px; }
.cuenta-count { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); background: var(--bg); border-radius: 8px; padding: 2px 6px; }

.sidebar-foot { border-top: 1px solid var(--line); padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.foot-row { display: flex; justify-content: space-between; gap: 8px; font-size: 10.5px; }
.foot-key { color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: .08em; text-transform: uppercase; }
.foot-val { color: var(--ink-soft); text-align: right; overflow: hidden; text-overflow: ellipsis; }

.page-header { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 22px; margin-bottom: 26px; border-bottom: 1px solid var(--line); gap: 24px; flex-wrap: wrap; }
.hl .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.hl h1 { margin: 0; font-family: 'Fraunces', serif; font-weight: 400; font-size: 38px; letter-spacing: -.02em; line-height: 1; color: var(--ink); }
.hl h1 em { font-style: italic; color: var(--accent); font-weight: 400; }
.hl .sub { font-size: 13px; color: var(--muted); margin-top: 6px; }
.sync-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; background: var(--bg-darker); border-radius: 10px; font-size: 9px; }
.sync-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.sync-dot.local { background: var(--rust); }

.hr { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; }
.stat { text-align: right; padding-right: 16px; border-right: 1px solid var(--line); }
.stat:last-of-type { border-right: 0; padding-right: 0; }
.stat-num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 500; line-height: 1; color: var(--ink); }
.stat-num .pct { font-size: 16px; color: var(--muted); }
.stat-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

.page { display: flex; flex-direction: column; gap: 28px; }

.kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
@media (max-width: 1024px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
.kpi-big { background: var(--paper); border: 1px solid var(--line); border-top: 3px solid var(--accent); border-radius: 8px; padding: 18px 18px 14px; box-shadow: var(--shadow-card); }
.kpi-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.kpi-value { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 400; line-height: 1; color: var(--ink); margin-top: 8px; }
.kpi-foot { margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; font-size: 11px; color: var(--muted); }
.delta.pos { color: var(--accent); font-weight: 500; }
.delta.neg { color: var(--rust); font-weight: 500; }
.kpi-sub { color: var(--muted); }

.card { background: var(--paper); border: 1px solid var(--line); border-radius: 10px; padding: 22px; box-shadow: var(--shadow-card); }
.card-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.card-title { margin: 0; font-family: 'Fraunces', serif; font-size: 19px; font-weight: 500; color: var(--ink); }
.card-sub { margin: 4px 0 0; font-size: 12.5px; color: var(--muted); }

.trend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.trend-grid.two { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 900px) { .trend-grid, .trend-grid.two { grid-template-columns: 1fr; } }
.trend { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
.trend-head { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; letter-spacing: .1em; text-transform: uppercase; }
.trend-delta.pos { color: var(--accent); }
.trend-delta.neg { color: var(--rust); }
.trend-value { font-family: 'Fraunces', serif; font-size: 24px; margin: 6px 0 10px; }
.trend-axis { display: flex; justify-content: space-between; margin-top: 4px; font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); }

.cuenta-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 1100px) { .cuenta-cards { grid-template-columns: 1fr; } }
.cuenta-card { text-align: left; padding: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--paper); cursor: pointer; transition: all .15s; overflow: hidden; box-shadow: var(--shadow-card); }
.cuenta-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-card-hover); }
.cuenta-card-head { display: grid; grid-template-columns: 6px 1fr auto; gap: 12px; align-items: center; padding: 14px 16px 12px; }
.cuenta-stripe { width: 6px; height: 36px; border-radius: 3px; }
.cuenta-card-name { font-family: 'Fraunces', serif; font-size: 17px; color: var(--ink); }
.cuenta-card-handle { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 2px; }
.cuenta-card-pill { font-family: 'JetBrains Mono', monospace; font-size: 10px; padding: 3px 8px; border: 1px solid; border-radius: 12px; }
.cuenta-card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 4px 16px 14px; }
.mini { background: var(--bg); border-radius: 6px; padding: 8px 10px; }
.mini-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.mini-value { font-family: 'Fraunces', serif; font-size: 17px; color: var(--ink); margin-top: 2px; }
.cuenta-card-spark { padding: 12px 16px 16px; border-top: 1px solid var(--line); background: var(--bg); }
.cuenta-card-spark-foot { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 6px; }
.pos { color: var(--accent); }
.neg { color: var(--rust); }

.visit-list { display: flex; flex-direction: column; }
.visit-row { display: grid; grid-template-columns: 12px 180px 140px 100px 1fr; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid var(--line); font-size: 13px; }
.visit-row:last-child { border-bottom: 0; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.visit-name { font-weight: 500; }
.visit-cuenta { color: var(--ink-soft); font-size: 12px; }
.visit-presu { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--gold); }
.visit-notes { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.toolbar { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.search { flex: 1 1 auto; max-width: 380px; min-width: 240px; position: relative; }
.search input { width: 100%; padding: 10px 14px 10px 36px; border: 1px solid var(--line); background: var(--paper); border-radius: 6px; font-size: 14px; outline: none; }
.search input:focus { border-color: var(--accent); }
.search::before { content:""; position: absolute; left: 12px; top: 50%; width: 14px; height: 14px; transform: translateY(-50%); background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%236b7a70' stroke-width='1.5'><circle cx='7' cy='7' r='5'/><path d='m11 11 3 3'/></svg>") no-repeat 50%; }
.select { padding: 10px 14px; border: 1px solid var(--line); background: var(--paper); border-radius: 6px; font-size: 14px; color: var(--ink); cursor: pointer; outline: none; }
.select:focus { border-color: var(--accent); }
.btn { padding: 10px 16px; border: 1px solid var(--line); background: var(--paper); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--ink); transition: all .15s; display: inline-flex; align-items: center; gap: 6px; }
.btn:hover { background: var(--bg-darker); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled:hover { background: var(--accent); }
.btn-danger { color: var(--rust); border-color: rgba(161,79,58,.3); }
.btn-danger:hover { background: rgba(161,79,58,.08); }
.plus { font-size: 16px; line-height: 1; }
.toolbar-hint { font-size: 12px; color: var(--muted); }

/* scrollbar horizontal arriba */
.scrollx { display: flex; flex-direction: column; }
.scrollx-top { overflow-x: auto; overflow-y: hidden; margin-bottom: 8px; scrollbar-width: thin; scrollbar-color: var(--muted) var(--bg-darker); }
.scrollx-top > div { height: 1px; }
.scrollx-top::-webkit-scrollbar { height: 10px; }
.scrollx-top::-webkit-scrollbar-track { background: var(--bg-darker); border-radius: 5px; }
.scrollx-top::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 5px; }
.scrollx-top::-webkit-scrollbar-thumb:hover { background: var(--ink-soft); }
.scrollx-body { overflow-x: auto; scrollbar-width: none; }
.scrollx-body::-webkit-scrollbar { display: none; }

.pipeline { display: grid; grid-template-columns: repeat(7, minmax(216px, 1fr)); gap: 14px; align-items: start; }
.col { background: var(--paper); border: 1px solid var(--line); border-radius: 10px; min-height: 200px; transition: all .15s; }
.col.drag-over { background: var(--bg-darker); border-color: var(--accent); }
.col-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px; border-top: 3px solid; border-radius: 10px 10px 0 0; }
.col-title { font-family: 'Fraunces', serif; font-size: 15px; color: var(--ink); }
.col-sub { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--muted); letter-spacing: .1em; text-transform: uppercase; margin-top: 2px; }
.col-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; border: 1px solid; padding: 2px 7px; border-radius: 10px; font-weight: 500; }
.col-body { padding: 8px 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.col-empty { font-size: 11px; color: var(--muted); text-align: center; padding: 18px 8px; font-style: italic; }

.lead-card { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; cursor: grab; transition: all .12s; box-shadow: var(--shadow-card); }
.lead-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-card-hover); border-color: var(--ink-soft); }
.lead-card:active { cursor: grabbing; }
.lead-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.lead-name { font-weight: 600; font-size: 13px; color: var(--ink); }
.lead-cuenta-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.lead-card-meta { display: flex; gap: 5px; font-size: 11px; color: var(--muted); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
.lead-presu { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--gold); margin-top: 6px; padding: 2px 6px; background: rgba(176,137,64,.08); border-radius: 4px; display: inline-block; }
.lead-notes { font-size: 12px; color: var(--ink-soft); margin-top: 8px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.lead-card-foot { display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--line); font-size: 10.5px; color: var(--muted); gap: 8px; }
.lead-campana { color: var(--accent); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lead-date { font-family: 'JetBrains Mono', monospace; }

.bars { display: flex; flex-direction: column; gap: 10px; }
.bar-row { display: grid; grid-template-columns: 180px 1fr 120px; align-items: center; gap: 14px; font-size: 13px; }
.bar-label { color: var(--ink); }
.bar-track { background: var(--bg); border-radius: 4px; height: 12px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width .3s; }
.bar-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; text-align: right; color: var(--ink-soft); }

.table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }
.table th, .table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); }
.table th { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); font-weight: 500; background: var(--bg); }
.table .num { text-align: right; font-variant-numeric: tabular-nums; }
.td-strong { font-weight: 500; color: var(--ink); }
.td-sub { font-size: 11px; color: var(--muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
.cu-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.badge { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; padding: 2px 8px; border-radius: 10px; }
.badge-activa { background: rgba(45,93,79,.12); color: var(--accent); }
.badge-pausada { background: rgba(176,137,64,.12); color: var(--gold); }
.badge-finalizada { background: rgba(107,122,112,.15); color: var(--muted); }

.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }
@media (max-width: 1100px) { .two-col { grid-template-columns: 1fr; } }

.cuenta-hero { background: var(--paper); border: 1px solid var(--line); border-top: 4px solid; border-radius: 10px; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; box-shadow: var(--shadow-card); }
.hero-left { display: flex; align-items: center; gap: 18px; }
.hero-mark { width: 56px; height: 56px; border-radius: 12px; color: #fff; font-family: 'Fraunces', serif; font-size: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: -.04em; }
.hero-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.hero-title { font-family: 'Fraunces', serif; font-size: 26px; color: var(--ink); margin: 4px 0 2px; line-height: 1.05; }
.hero-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--muted); }
.hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
.hero-import-btn { padding: 8px 14px; font-size: 12.5px; }
.import-ico { font-size: 15px; line-height: 1; }
.hero-stats-row { display: flex; gap: 24px; }
.hero-stat { text-align: right; }
.hsv { font-family: 'Fraunces', serif; font-size: 20px; color: var(--ink); }
.hsl { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-top: 4px; }
@media (max-width: 760px) { .hero-right { align-items: flex-start; width: 100%; } .hero-stats-row { flex-wrap: wrap; } }

.pipeline-mini { display: flex; flex-direction: column; gap: 8px; }
.pipeline-mini-row { display: grid; grid-template-columns: 12px 1fr 1fr 30px; gap: 12px; align-items: center; font-size: 12.5px; }
.pipeline-mini-dot { width: 10px; height: 10px; border-radius: 50%; }
.pipeline-mini-label { color: var(--ink); }
.pipeline-mini-bar { background: var(--bg); height: 10px; border-radius: 4px; overflow: hidden; }
.pipeline-mini-bar-fill { height: 100%; transition: width .25s; }
.pipeline-mini-count { font-family: 'JetBrains Mono', monospace; font-size: 12px; text-align: right; }

.posts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
@media (max-width: 900px) { .posts-grid { grid-template-columns: 1fr; } }
.post-card { background: var(--bg); border: 1px solid var(--line); border-radius: 8px; padding: 14px; }
.post-head { display: flex; justify-content: space-between; align-items: center; }
.post-tipo { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .12em; text-transform: uppercase; border: 1px solid; padding: 2px 7px; border-radius: 10px; }
.post-date { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); }
.post-title { font-family: 'Fraunces', serif; font-size: 15px; color: var(--ink); margin: 10px 0 12px; line-height: 1.3; }
.post-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 10.5px; color: var(--muted); }
.post-stats strong { font-family: 'Fraunces', serif; font-size: 16px; color: var(--ink); display: block; }

.cta-row { display: flex; justify-content: flex-end; }

.emb-funnel { display: flex; flex-direction: column; gap: 6px; }
.emb-row { display: grid; grid-template-columns: 160px 1fr 120px; align-items: center; gap: 14px; }
.emb-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink); }
.emb-bar-wrap { display: flex; justify-content: center; }
.emb-bar { height: 40px; min-width: 52px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: width .35s ease; box-shadow: var(--shadow-card); }
.emb-bar-val { font-family: 'Fraunces', serif; font-size: 18px; color: #fff; }
.emb-meta { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--ink-soft); text-align: right; }
.emb-meta-sub { display: block; font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); margin-top: 2px; }
@media (max-width: 720px) { .emb-row { grid-template-columns: 100px 1fr 64px; gap: 8px; } .emb-label { font-size: 11px; } }

.donut-wrap { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
.donut-legend { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }
.donut-legend-row { display: grid; grid-template-columns: 12px 1fr auto 38px; gap: 10px; align-items: center; font-size: 12.5px; }
.dl-label { color: var(--ink); }
.dl-val { font-family: 'JetBrains Mono', monospace; color: var(--ink-soft); }
.dl-pct { font-family: 'JetBrains Mono', monospace; color: var(--muted); text-align: right; }

.leak-list { display: flex; flex-direction: column; gap: 12px; }
.leak-row { display: flex; flex-direction: column; gap: 6px; padding: 11px 13px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); }
.leak-row.leak-max { border-color: var(--rust); background: rgba(161,79,58,.05); }
.leak-label { font-size: 12.5px; color: var(--ink); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.leak-arrow { color: var(--muted); }
.leak-badge { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; background: var(--rust); color: #fff; padding: 2px 6px; border-radius: 8px; }
.leak-bar-wrap { background: var(--bg-darker); height: 8px; border-radius: 4px; overflow: hidden; }
.leak-bar { height: 100%; border-radius: 4px; transition: width .35s ease; }
.leak-bar.leak-ok { background: var(--accent); }
.leak-bar.leak-mid { background: var(--gold); }
.leak-bar.leak-low { background: var(--rust); }
.leak-meta { font-size: 11.5px; color: var(--muted); }
.leak-meta strong { color: var(--ink); font-family: 'JetBrains Mono', monospace; }
.leak-lost { color: var(--rust); font-family: 'JetBrains Mono', monospace; }

.report { display: flex; flex-direction: column; gap: 18px; }
.slide { background: var(--paper); border: 1px solid var(--line); border-radius: 12px; padding: 40px 44px; min-height: 540px; aspect-ratio: 16 / 9; display: flex; flex-direction: column; box-shadow: var(--shadow-card); page-break-after: always; position: relative; }
.slide-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.slide-eyebrow.light { color: rgba(255,255,255,.85); }
.slide-title { font-family: 'Fraunces', serif; font-weight: 400; font-size: 48px; letter-spacing: -.02em; color: var(--ink); margin: 0 0 8px; line-height: 1; }
.slide-h3 { font-family: 'Fraunces', serif; font-weight: 400; font-size: 32px; color: var(--ink); margin: 0 0 24px; }
.slide-sub { font-size: 14px; color: var(--muted); }
.slide-portada-foot { margin-top: auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding-top: 24px; border-top: 1px solid var(--line); font-size: 12px; color: var(--muted); }
.slide-portada-foot strong { display: block; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 4px; }

.exec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.exec-kpi { background: var(--bg); border-radius: 8px; padding: 18px; border: 1px solid var(--line); }
.exec-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.exec-value { font-family: 'Fraunces', serif; font-size: 32px; color: var(--ink); margin-top: 6px; line-height: 1; }
.exec-delta { font-size: 11px; margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
.exec-note { background: var(--bg); border-left: 3px solid var(--accent); padding: 14px 16px; font-size: 13px; color: var(--ink-soft); border-radius: 4px; line-height: 1.55; }

.report-table { min-width: 0; }
.report-table thead th { background: var(--bg); }
.report-table tfoot td { background: var(--bg); border-top: 2px solid var(--ink-soft); }

.funnel { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
.funnel-row { display: grid; grid-template-columns: 12px 200px 1fr 50px; gap: 14px; align-items: center; font-size: 13px; }
.funnel-dot { width: 10px; height: 10px; border-radius: 50%; }
.funnel-bar { background: var(--bg); border-radius: 4px; height: 18px; overflow: hidden; }
.funnel-fill { height: 100%; transition: width .3s; }
.funnel-count { font-family: 'JetBrains Mono', monospace; font-size: 13px; text-align: right; }
.funnel-foot { background: var(--bg); border-left: 3px solid var(--accent); padding: 12px 16px; font-size: 12.5px; color: var(--ink-soft); border-radius: 4px; }

.acciones { padding-left: 20px; margin: 0; }
.acciones li { font-size: 14px; margin-bottom: 14px; line-height: 1.5; color: var(--ink-soft); }

.slide-cierre { color: #fff; justify-content: center; align-items: center; text-align: center; }
.slide-cierre-text .slide-eyebrow.light { color: rgba(255,255,255,.7); margin-bottom: 16px; }
.slide-cierre-title { font-family: 'Fraunces', serif; font-size: 56px; color: #fff; margin: 0 0 14px; font-weight: 400; }
.slide-cierre-sub { color: rgba(255,255,255,.85); font-size: 14px; }
.slide-cierre-foot { position: absolute; bottom: 28px; left: 0; right: 0; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: rgba(255,255,255,.7); letter-spacing: .12em; text-transform: uppercase; }

.modal-back { position: fixed; inset: 0; background: rgba(26,40,32,.42); backdrop-filter: blur(4px); z-index: 50; }
.modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(620px, 92vw); max-height: 88vh; overflow-y: auto; background: var(--paper); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 30px 60px rgba(26,40,32,.25); z-index: 60; display: flex; flex-direction: column; }
.modal-wide { width: min(680px, 94vw); }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 22px 14px; border-bottom: 1px solid var(--line); gap: 16px; }
.modal-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.modal-title { font-family: 'Fraunces', serif; font-size: 24px; color: var(--ink); margin: 6px 0 0; font-weight: 500; }
.x { background: transparent; border: 0; font-size: 24px; line-height: 1; color: var(--muted); cursor: pointer; padding: 4px 8px; }
.x:hover { color: var(--ink); }

.modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.fld { display: flex; flex-direction: column; gap: 6px; }
.fld label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
.fld input, .fld select, .fld textarea { padding: 10px 12px; border: 1px solid var(--line); background: var(--paper); border-radius: 6px; font-size: 13.5px; color: var(--ink); outline: none; transition: border-color .15s; resize: vertical; }
.fld input:focus, .fld select:focus, .fld textarea:focus { border-color: var(--accent); }
.fld-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fld-info { display: flex; gap: 18px; font-size: 11.5px; color: var(--muted); padding-top: 8px; border-top: 1px dashed var(--line); }
.fld-info strong { color: var(--ink-soft); }

.etapa-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.etapa-pill { background: var(--paper); border: 1px solid; padding: 5px 10px; border-radius: 14px; font-size: 11.5px; cursor: pointer; transition: all .15s; }
.etapa-pill:hover { transform: translateY(-1px); }

.lead-actions { display: flex; gap: 8px; }
.lead-action { flex: 1; justify-content: center; text-decoration: none; }
.lead-action.call { background: var(--accent); border-color: var(--accent); color: #fff; }
.lead-action.call:hover { background: var(--accent-hover); }
.lead-action.wapp { background: #25d366; border-color: #25d366; color: #fff; }
.lead-action.wapp:hover { background: #1fb457; border-color: #1fb457; }
.lead-actions-empty { flex: 1; font-size: 12px; color: var(--muted); text-align: center; padding: 9px; border: 1px dashed var(--line); border-radius: 6px; }

.modal-foot { padding: 16px 22px 20px; display: flex; gap: 8px; align-items: center; border-top: 1px solid var(--line); background: var(--bg); border-radius: 0 0 12px 12px; }

.import-tipos { display: flex; flex-wrap: wrap; gap: 6px; }
.import-tipo { background: var(--paper); border: 1px solid var(--line); padding: 7px 12px; border-radius: 14px; font-size: 12px; cursor: pointer; transition: all .15s; color: var(--ink-soft); display: inline-flex; align-items: center; gap: 6px; }
.import-tipo:hover { border-color: var(--accent); }
.import-tipo.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.import-tipo-check { font-size: 10px; opacity: .85; }
.import-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin: 0; }
.import-note { font-size: 12.5px; color: var(--ink-soft); background: rgba(45,93,79,.06); border-left: 3px solid var(--accent); padding: 10px 12px; border-radius: 4px; line-height: 1.5; }
.import-note strong { color: var(--accent); }
.tpl-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.link-btn { background: none; border: 0; color: var(--accent); cursor: pointer; font-size: 12.5px; font-weight: 600; text-decoration: underline; padding: 0; font-family: inherit; }
.link-btn:hover { color: var(--accent-hover); }
.import-fields { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-soft); background: var(--bg); padding: 10px 12px; border-radius: 6px; line-height: 1.7; border: 1px solid var(--line); }
.drop-zone { border: 2px dashed var(--line); border-radius: 10px; padding: 28px 20px; text-align: center; cursor: pointer; transition: all .15s; background: var(--bg); }
.drop-zone:hover, .drop-zone.drag-over { border-color: var(--accent); background: rgba(45,93,79,.05); }
.drop-icon { font-size: 28px; color: var(--accent); line-height: 1; }
.drop-title { font-size: 13.5px; color: var(--ink); font-weight: 500; margin-top: 10px; word-break: break-word; }
.drop-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--muted); margin-top: 5px; letter-spacing: .06em; text-transform: uppercase; }
.import-summary { background: var(--bg); border-radius: 8px; padding: 14px 16px; font-size: 13px; border: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; line-height: 1.5; }
.import-summary .ok { color: var(--accent); font-weight: 600; }
.import-summary .warn { color: var(--gold); }
.import-summary .err { color: var(--rust); }
.import-active { font-size: 12px; color: var(--muted); background: rgba(45,93,79,.06); border-radius: 6px; padding: 8px 12px; }
.import-active strong { color: var(--accent); }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--ink); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 13px; box-shadow: 0 8px 24px rgba(26,40,32,.3); z-index: 80; animation: rise .2s ease-out; }
@keyframes rise { from { transform: translate(-50%, 8px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

@media print {
  body { background: #fff; }
  .sidebar, .page-header, .toolbar { display: none !important; }
  .main { padding: 0; }
  .slide { box-shadow: none; border: 0; border-radius: 0; min-height: 100vh; aspect-ratio: unset; }
}
`}</style>
  );
}