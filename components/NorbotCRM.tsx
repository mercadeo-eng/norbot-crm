"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { CUENTA_BY_KEY, ETAPA_BY_KEY, MESES } from "@/lib/data";
import { IMPORT_INFO } from "@/lib/csv";
import type { Campana, ImportFlags, ImportTipo, Lead, Metrica, PostsByCuenta } from "@/lib/types";
import {
  addLeadAction,
  deleteLeadAction,
  importTableAction,
  moveLeadAction,
  restoreDemoAction,
  updateLeadAction,
} from "@/app/actions";
import { Sidebar } from "./Sidebar";
import { Stat } from "./charts";
import { PanelGeneral } from "./PanelGeneral";
import { LeadsPipeline } from "./LeadsPipeline";
import { EmbudoPage } from "./EmbudoPage";
import { PautasPage } from "./PautasPage";
import { ReportesPage } from "./ReportesPage";
import { CuentaPage } from "./CuentaPage";
import { LeadModal } from "./LeadModal";
import { NewLeadModal } from "./NewLeadModal";
import { ImportModal } from "./ImportModal";

type NewLeadData = Omit<Lead, "id" | "etapa" | "fechaIngreso">;

interface NorbotCRMProps {
  initialLeads: Lead[];
  initialCampanas: Campana[];
  initialMetricas: Metrica[];
  initialPosts: PostsByCuenta;
  userEmail: string;
}

export default function NorbotCRM({
  initialLeads,
  initialCampanas,
  initialMetricas,
  initialPosts,
  userEmail,
}: NorbotCRMProps) {
  const [page, setPage] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [campanas, setCampanas] = useState<Campana[]>(initialCampanas);
  const [metricas, setMetricas] = useState<Metrica[]>(initialMetricas);
  const [posts, setPosts] = useState<PostsByCuenta>(initialPosts);
  const [imported, setImported] = useState<ImportFlags>({
    leads: false,
    campanas: false,
    metricas: false,
    posts: false,
  });
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importCuenta, setImportCuenta] = useState<string | null>(null);
  const [filtroCuenta, setFiltroCuenta] = useState("todas");
  const [search, setSearch] = useState("");
  const [reporteCuenta, setReporteCuenta] = useState("san_antonio");
  const [reporteMes, setReporteMes] = useState("2026-05");
  const [toast, setToast] = useState("");
  const dragLeadId = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meses = useMemo(() => {
    const s = [...new Set(metricas.map((m) => m.mes))].filter(Boolean).sort();
    return s.length ? s : MESES;
  }, [metricas]);

  const realData = imported.leads || imported.campanas || imported.metricas || imported.posts;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedLeadId(null);
        setShowNewLead(false);
        setShowImport(false);
      }
      const tag = document.activeElement?.tagName;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !["INPUT", "TEXTAREA", "SELECT"].includes(tag || "")) {
        e.preventDefault();
        setShowNewLead(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!meses.includes(reporteMes)) setReporteMes(meses[meses.length - 1]);
  }, [meses, reporteMes]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }

  const leadsFiltrados = useMemo(() => {
    let xs = leads;
    if (filtroCuenta !== "todas") xs = xs.filter((l) => l.cuenta === filtroCuenta);
    if (search.trim()) {
      const q = search.toLowerCase();
      xs = xs.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.telefono || "").includes(q),
      );
    }
    return xs;
  }, [leads, filtroCuenta, search]);

  const headerStats = useMemo(() => {
    const total = leads.length;
    const enProceso = leads.filter((l) =>
      ["contactado", "llamar_whatsapp", "info_enviada", "visita_agendada"].includes(l.etapa),
    ).length;
    const visitas = leads.filter((l) => ["visita_agendada", "visita_realizada"].includes(l.etapa)).length;
    const cerrados = leads.filter((l) => l.etapa === "reservado").length;
    const conv = total > 0 ? (cerrados / total) * 100 : 0;
    return { total, enProceso, visitas, cerrados, conv };
  }, [leads]);

  async function moveLead(id: string, newEtapa: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.etapa === newEtapa) return;
    const prev = leads;
    setLeads((xs) => xs.map((l) => (l.id === id ? { ...l, etapa: newEtapa } : l)));
    showToast(`${lead.nombre} → ${ETAPA_BY_KEY[newEtapa].title}`);
    try {
      await moveLeadAction(id, newEtapa);
    } catch {
      setLeads(prev);
      showToast("⚠ No se pudo guardar el cambio");
    }
  }
  async function updateLead(id: string, patch: Partial<Lead>) {
    const prev = leads;
    setLeads((xs) => xs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      await updateLeadAction(id, patch);
    } catch {
      setLeads(prev);
      showToast("⚠ No se pudieron guardar los cambios");
    }
  }
  async function deleteLead(id: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead) return;
    if (!confirm(`¿Eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`)) return;
    const prev = leads;
    setLeads((xs) => xs.filter((l) => l.id !== id));
    setSelectedLeadId(null);
    showToast(`Lead eliminado`);
    try {
      await deleteLeadAction(id);
    } catch {
      setLeads(prev);
      showToast("⚠ No se pudo eliminar el lead");
    }
  }
  async function addLead(data: NewLeadData) {
    try {
      const created = await addLeadAction(data);
      setLeads((xs) => [created, ...xs]);
      showToast(`${created.nombre} agregado`);
    } catch {
      showToast("⚠ No se pudo crear el lead");
    }
  }

  /* importación con fusión por cuenta (persistida en Supabase) */
  async function aplicarImport(tipo: ImportTipo, data: Lead[] | Campana[] | Metrica[] | PostsByCuenta) {
    const cuentasIn =
      tipo === "posts"
        ? Object.keys(data as PostsByCuenta)
        : [...new Set((data as { cuenta: string }[]).map((x) => x.cuenta))];
    try {
      const fresh = await importTableAction(tipo, data);
      setLeads(fresh.leads);
      setCampanas(fresh.campanas);
      setMetricas(fresh.metricas);
      setPosts(fresh.posts);
      setImported((s) => ({ ...s, [tipo]: true }));
      const nombres = cuentasIn
        .map((k) => CUENTA_BY_KEY[k]?.nombreCorto)
        .filter(Boolean)
        .join(", ");
      showToast(`${IMPORT_INFO[tipo].label} importados${nombres ? " · " + nombres : ""}`);
    } catch {
      showToast("⚠ No se pudo importar a la base de datos");
    }
  }
  async function restaurarDemo() {
    try {
      const fresh = await restoreDemoAction();
      setLeads(fresh.leads);
      setCampanas(fresh.campanas);
      setMetricas(fresh.metricas);
      setPosts(fresh.posts);
      setImported({ leads: false, campanas: false, metricas: false, posts: false });
      showToast("Datos demo restaurados");
    } catch {
      showToast("⚠ No se pudo restaurar la demo");
    }
  }
  function abrirImport(cuentaKey?: string) {
    setImportCuenta(cuentaKey || null);
    setShowImport(true);
  }

  function onDragStart(e: DragEvent, id: string) {
    dragLeadId.current = id;
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  }
  function onDrop(e: DragEvent, etapaKey: string) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const id = e.dataTransfer.getData("text/plain") || dragLeadId.current;
    if (id) moveLead(id, etapaKey);
  }
  function onDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
  }
  function onDragLeave(e: DragEvent) {
    e.currentTarget.classList.remove("drag-over");
  }

  const pageHeader = useMemo<{ eyebrow: ReactNode; title: ReactNode; sub: ReactNode }>(() => {
    if (page === "dashboard")
      return {
        eyebrow: "NORBOT Group · Gestión social",
        title: (
          <>
            Panel <em>general</em>
          </>
        ),
        sub: "Vista agregada de los 3 desarrollos en redes",
      };
    if (page === "leads")
      return {
        eyebrow: "Pipeline · Leads Instagram",
        title: (
          <>
            Seguimiento de <em>leads</em>
          </>
        ),
        sub: "Desde el primer DM hasta la reserva",
      };
    if (page === "embudo")
      return {
        eyebrow: "Embudo · Recorrido del lead",
        title: (
          <>
            Análisis de <em>embudo</em>
          </>
        ),
        sub: "Conversión y puntos de fuga entre etapas",
      };
    if (page === "pautas")
      return {
        eyebrow: "Meta Ads · Campañas activas",
        title: (
          <>
            Pautas y <em>resultados</em>
          </>
        ),
        sub: "Inversión, alcance y costo por lead",
      };
    if (page === "reportes")
      return {
        eyebrow: "Reportes mensuales",
        title: (
          <>
            Informe <em>ejecutivo</em>
          </>
        ),
        sub: "Listo para presentar al cliente",
      };
    if (page.startsWith("cuenta:")) {
      const c = CUENTA_BY_KEY[page.split(":")[1]];
      return { eyebrow: `${c.tipo} · ${c.ubicacion}`, title: <>{c.nombreCorto}</>, sub: c.handle };
    }
    return { eyebrow: "", title: "", sub: "" };
  }, [page]);

  const selectedLead = selectedLeadId ? leads.find((l) => l.id === selectedLeadId) : null;

  return (
    <>
      <div className="layout">
        <Sidebar page={page} onNavigate={setPage} leads={leads} realData={realData} userEmail={userEmail} />
        <main className="main">
          <header className="page-header">
            <div className="hl">
              <div className="eyebrow">
                <span>{pageHeader.eyebrow}</span>
                <span className="sync-badge">
                  <span className={`sync-dot ${realData ? "" : "local"}`} />
                  {realData ? "Datos importados" : "Modo demo"}
                </span>
                {page.startsWith("cuenta:") && (
                  <button className="btn btn-primary hero-import-btn" onClick={() => abrirImport(page.split(":")[1])}>
                    <span className="import-ico">↥</span> Importar datos
                  </button>
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
              <Stat
                label="Conversión"
                value={
                  <>
                    {headerStats.conv.toFixed(0)}
                    <span className="pct">%</span>
                  </>
                }
              />
            </div>
          </header>

          {page === "dashboard" && (
            <PanelGeneral
              metricas={metricas}
              leads={leads}
              campanas={campanas}
              meses={meses}
              onOpenCuenta={(k) => setPage(`cuenta:${k}`)}
            />
          )}
          {page === "leads" && (
            <LeadsPipeline
              leads={leadsFiltrados}
              filtroCuenta={filtroCuenta}
              setFiltroCuenta={setFiltroCuenta}
              search={search}
              setSearch={setSearch}
              onDragStart={onDragStart}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onOpenLead={setSelectedLeadId}
              onNewLead={() => setShowNewLead(true)}
            />
          )}
          {page === "embudo" && <EmbudoPage leads={leads} />}
          {page === "pautas" && (
            <PautasPage campanas={campanas} filtroCuenta={filtroCuenta} setFiltroCuenta={setFiltroCuenta} />
          )}
          {page === "reportes" && (
            <ReportesPage
              cuenta={reporteCuenta}
              setCuenta={setReporteCuenta}
              mes={reporteMes}
              setMes={setReporteMes}
              metricas={metricas}
              leads={leads}
              campanas={campanas}
              posts={posts}
              meses={meses}
            />
          )}
          {page.startsWith("cuenta:") && (
            <CuentaPage
              cuentaKey={page.split(":")[1]}
              metricas={metricas}
              leads={leads}
              campanas={campanas}
              posts={posts}
              meses={meses}
              onImport={() => abrirImport(page.split(":")[1])}
              onGoLeads={() => {
                setFiltroCuenta(page.split(":")[1]);
                setPage("leads");
              }}
              onGoPautas={() => {
                setFiltroCuenta(page.split(":")[1]);
                setPage("pautas");
              }}
              onGoReporte={() => {
                setReporteCuenta(page.split(":")[1]);
                setPage("reportes");
              }}
            />
          )}
        </main>
      </div>

      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onSave={(patch) => {
            updateLead(selectedLead.id, patch);
            showToast("Cambios guardados");
          }}
          onDelete={() => deleteLead(selectedLead.id)}
          onMove={(etapa) => moveLead(selectedLead.id, etapa)}
        />
      )}
      {showNewLead && (
        <NewLeadModal
          onClose={() => setShowNewLead(false)}
          onCreate={(data) => {
            addLead(data);
            setShowNewLead(false);
          }}
        />
      )}
      {showImport && (
        <ImportModal
          imported={imported}
          cuentaContext={importCuenta}
          onClose={() => setShowImport(false)}
          onImport={aplicarImport}
          onRestore={restaurarDemo}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
