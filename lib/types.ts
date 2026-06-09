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

export interface VendedorInfo {
  id: string;
  email: string;
  cuentas: string[];
}
