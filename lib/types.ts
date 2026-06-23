// Tipos del dominio del CRM de NORBOT.

export interface Cuenta {
  key: string;
  nombre: string;
  nombreCorto: string;
  handle: string;
  tipo: string;
  ubicacion: string;
  brand: string;
  precioDesde: number;
  unidadesTotales: number;
  unidadesVendidas: number;
  fechaInicio: string;
}

export interface Etapa {
  key: string;
  title: string;
  sub: string;
  color: string;
}

export interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  cuenta: string;
  origen: string;
  campana: string;
  etapa: string;
  fechaIngreso: string;
  presupuesto: string;
  notas: string;
  /** ID (uuid) del vendedor que atiende este lead; null = sin asignar. */
  vendedor?: string | null;
}

export interface Campana {
  id: string;
  cuenta: string;
  nombre: string;
  objetivo: string;
  inicio: string;
  fin: string;
  gasto: number;
  alcance: number;
  impresiones: number;
  clicks: number;
  leads: number;
  cpl: number;
  estado: string;
}

export interface Metrica {
  mes: string;
  cuenta: string;
  followers: number;
  alcance: number;
  impresiones: number;
  engagement: number;
  visitasPerfil: number;
  inversion: number;
  leads: number;
  conversiones: number;
}

export interface Post {
  id: string;
  tipo: string;
  titulo: string;
  alcance: number;
  likes: number;
  comentarios: number;
  guardados: number;
  fecha: string;
}

export type PostsByCuenta = Record<string, Post[]>;

export type ImportTipo = "leads" | "campanas" | "metricas" | "posts";

export interface ImportInfo {
  label: string;
  desc: string;
  headers: string[];
  rows: string[][];
}

export interface ParseResult {
  data: Lead[] | Campana[] | Metrica[] | PostsByCuenta;
  errores: number;
  avisos: string[];
  count: number;
  total?: number;
  error?: string;
}

export interface ImportFlags {
  leads: boolean;
  campanas: boolean;
  metricas: boolean;
  posts: boolean;
}

/** Datos opcionales de registro del vendedor (viven en app_metadata.perfil). */
export interface VendedorPerfil {
  sexo?: string; // "F" | "M" | "Otro" | ""
  cedula?: string;
  domicilio?: string;
  telefono?: string;
  telefono2?: string;
  foto?: string; // URL pública (Supabase Storage)
}

export interface VendedorInfo {
  id: string;
  email: string;
  nombre: string;
  /** Número secuencial del vendedor (se muestra como 4 dígitos: 0001, 0002…). */
  num: number;
  cuentas: string[];
  /** Registro opcional (foto, sexo, domicilio, teléfonos…). */
  perfil?: VendedorPerfil;
}

/** Usuario administrador (rol admin). */
export interface AdminInfo {
  id: string;
  email: string;
  nombre: string;
}

/** Resumen de uso de tokens de la API de Claude (bot de WhatsApp). */
export interface TokenUsoModelo {
  modelo: string;
  input: number;
  output: number;
  mensajes: number;
}
export interface TokenUsoReciente {
  createdAt: string;
  telefono: string;
  modelo: string;
  input: number;
  output: number;
}
export interface TokenUsoResumen {
  /** true si la tabla token_usage existe y respondió (aunque tenga 0 filas). */
  activo: boolean;
  totalInput: number;
  totalOutput: number;
  totalCosto: number;
  mensajes: number;
  porModelo: TokenUsoModelo[];
  recientes: TokenUsoReciente[];
}

export interface LeadHistorialEntry {
  id: string;
  leadId: string;
  etapaAnterior: string | null;
  etapaNueva: string;
  cambiadoPor: string;
  createdAt: string;
}
