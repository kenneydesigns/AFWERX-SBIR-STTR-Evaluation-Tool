import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileCheck2, FileText, FolderCog, HelpCircle, Rocket, UploadCloud, Wand2, Workflow } from "lucide-react";

/**
 * AFWERX SBIR/STTR Proposal Evaluator – Configurable Web App (Single-File Demo)
 *
 * Goals
 * - Load new solicitation instructions each release (AFWERX TRI / DoD BAA) via JSON config (no code changes)
 * - Load new OUSD(R&E) Critical Technology Areas via JSON
 * - Evaluate Phase I, Phase II, and D2P2 proposals with the same engine
 * - Enforce mandatory gate checks + rubric scoring + milestone/transition assessment
 * - Export a clean report for submission readiness
 *
 * NOTE: This is a front-end demo scaffold. File parsing hooks are stubbed; connect these to backend services
 * (e.g., FastAPI/Node) for real PDF/XLSX extraction, due diligence checks, and roadmap mapping.
 */

// -----------------------------
// Types & Config Schema
// -----------------------------

type Phase = "Phase I" | "Phase II" | "D2P2";

type MandatoryCriterion = {
  id: string;
  label: string;
  // Optional auto-check key names for extractor (if available)
  extractorKey?: string;
  // Optional limits for auto-logic
  limit?: { kind: "number" | "months" | "pages"; value: number };
  required: boolean;
};

type RubricCriterion = {
  id: string;
  label: string;
  description?: string;
  weight: number; // 0-1 within category
  howToExcellence?: string;
};

type Category = {
  id: string; // e.g., TECH, DEF_NEED, COMM
  label: string;
  weight: number; // 0-1 overall
  criteria: RubricCriterion[];
};

type MilestoneRule = {
  id: string;
  label: string;
  rule: string; // e.g., "must include measurable R&D deliverable"
};

type SolicitationConfig = {
  meta: {
    name: string; // e.g., "AFX25.5 Release 8"
    version: string; // e.g., "2025-05-22-Amendment1"
    component: "DAF" | "USSF" | "DoD";
    openDate?: string;
    closeDate?: string;
  };
  phasesSupported: Phase[];
  mandatory: MandatoryCriterion[]; // hard disqualifiers if required && false
  additional?: MandatoryCriterion[]; // soft checks
  categories: Category[]; // evaluation categories/weights
  milestoneRules: MilestoneRule[];
  pagePolicy?: {
    techVolumeMaxPages?: number;
    excludes?: string[]; // e.g., ["TOC","Glossary","Cover"]
  };
  costCapUSD?: number; // e.g., 1250000 for D2P2 Open Topic
  maxPoPMonths?: number; // e.g., 21 for AFX D2P2, ~24 for many Phase II
  references?: {
    triUrl?: string;
    baaUrl?: string;
  };
};

type OUSDREArea = { id: string; label: string; keywords?: string[] };

type OUSDRECatalog = {
  version: string; // e.g. "2023-03-21"
  areas: OUSDREArea[];
};

// -----------------------------
// Demo Defaults (can be replaced by uploaded JSON)
// -----------------------------

const DEFAULT_CONFIG: SolicitationConfig = {
  meta: {
    name: "AFX25.5 Release 8 (Amendment 1)",
    version: "2025-05-22",
    component: "DAF",
    openDate: "2025-05-07",
    closeDate: "2025-06-05",
  },
  phasesSupported: ["Phase I", "Phase II", "D2P2"],
  costCapUSD: 1_250_000,
  maxPoPMonths: 21,
  pagePolicy: {
    techVolumeMaxPages: 15,
    excludes: ["Coversheet", "Glossary", "Table of Contents"],
  },
  mandatory: [
    { id: "costCap", label: "SBIR cost ≤ $1.25M", extractorKey: "cost_total", limit: { kind: "number", value: 1250000 }, required: true },
    { id: "popCap", label: "Period of Performance ≤ 21 months", extractorKey: "pop_months", limit: { kind: "months", value: 21 }, required: true },
    { id: "cmSigned", label: "Signed Customer Memorandum (end-user, customer, TPOC)", extractorKey: "cm_signed", required: true },
    { id: "pages", label: "Technical Volume ≤ 15 pages (excl. Cover/TOC/Glossary)", extractorKey: "tv_pages", limit: { kind: "pages", value: 15 }, required: true },
    { id: "rcf", label: "Regulatory Compliance Form included", extractorKey: "rcf_present", required: true },
  ],
  additional: [
    { id: "fwa", label: "FWA Training proof included (Vol 6)", extractorKey: "fwa_present", required: false },
    { id: "vol7", label: "Volume 7 Disclosures completed", extractorKey: "vol7_present", required: false },
    { id: "pow", label: "% of Work meets SBIR thresholds", extractorKey: "pow_ok", required: false },
  ],
  categories: [
    {
      id: "TECH",
      label: "Technical Merit",
      weight: 0.45,
      criteria: [
        { id: "tech_problem", label: "Problem & Use Case Framing", weight: 0.2, howToExcellence: "State a specific, quantifiable operational gap tied to mission outcomes; cite pages & end-user context." },
        { id: "tech_approach", label: "Technical Approach Soundness & Merit", weight: 0.35, howToExcellence: "Provide defendable architecture, methods, and test plan with measurable performance thresholds." },
        { id: "tech_risk", label: "Level of Risk", weight: 0.15, howToExcellence: "Identify top 3 risks with mitigation and exit criteria; show schedule & budget reserves." },
        { id: "tech_innov", label: "Innovation & Differentiation", weight: 0.15, howToExcellence: "Explain what’s novel vs. current alternatives; include benchmarks or prior data." },
        { id: "team", label: "Team Qualifications", weight: 0.15, howToExcellence: "Show PIs’ relevant prior art, clear roles, and key subs with availability letters." },
      ],
    },
    {
      id: "DEF_NEED",
      label: "Defense Need",
      weight: 0.35,
      criteria: [
        { id: "mission_impact", label: "Mission Impact & Urgency", weight: 0.35, howToExcellence: "Quantify operational effect (time saved, probability of kill, availability↑). Tie to CONOPS." },
        { id: "breadth", label: "Breadth of Applicability", weight: 0.2, howToExcellence: "Map to multiple MAJCOMs/POs/platforms with similar needs." },
        { id: "specificity", label: "Specificity of Need & Adequacy of Effort", weight: 0.3, howToExcellence: "Show scope aligns with need & PoP; include CM details & path to OTAs or PALT." },
        { id: "docs", label: "CM & Supporting Docs (Phase II only)", weight: 0.15, howToExcellence: "Include signed CM; add letters/MOUs for adoption and funding pathways." },
      ],
    },
    {
      id: "COMM",
      label: "Commercialization",
      weight: 0.2,
      criteria: [
        { id: "market", label: "Market & Revenue Potential", weight: 0.35, howToExcellence: "Show TAM/SAM/SOM with defensible bottoms-up revenue model." },
        { id: "biz", label: "Business Plan", weight: 0.3, howToExcellence: "Pricing, channels, margin structure, sales plan; showcase traction KPIs." },
        { id: "interest", label: "Defense & Private Interest", weight: 0.2, howToExcellence: "Document pilots, LOIs, OTA interest, matching funds prospects." },
        { id: "docs_comm", label: "CM & Supporting Docs (Phase II)", weight: 0.15, howToExcellence: "Attach commitment forms, cost share, transition letters." },
      ],
    },
  ],
  milestoneRules: [
    { id: "rnd", label: "R&D Centric", rule: "Milestones must be primarily R&D (not training/admin)." },
    { id: "measurable", label: "Measurable Output", rule: "Each milestone includes acceptance criteria & testable deliverable." },
    { id: "timeline", label: "Time-Boxed", rule: "Each milestone has start/end within PoP and clear dependencies." },
  ],
  references: {
    triUrl: "https://afwerx.com/divisions/ventures/open-topic/",
    baaUrl: "https://www.dodsbirsttr.mil/",
  },
};

const DEFAULT_OUSDRE: OUSDRECatalog = {
  version: "2023-03-21",
  areas: [
    { id: "futureg", label: "FutureG", keywords: ["5G", "6G", "ORAN", "spectrum"] },
    { id: "trusted_ai", label: "Trusted AI & Autonomy", keywords: ["assurance", "robustness", "safety", "V&V"] },
    { id: "bio", label: "Biotechnology" },
    { id: "acsw", label: "Advanced Computing & Software", keywords: ["HPC", "compiler", "runtime"] },
    { id: "isc", label: "Integrated Sensing & Cyber" },
    { id: "de", label: "Directed Energy" },
    { id: "hyp", label: "Hypersonics" },
    { id: "me", label: "Microelectronics" },
    { id: "inss", label: "Integrated Network Systems-of-Systems" },
    { id: "quant", label: "Quantum Science" },
    { id: "space", label: "Space Technology" },
    { id: "energy", label: "Renewable Energy Generation & Storage" },
    { id: "mat", label: "Advanced Materials" },
    { id: "hmi", label: "Human-Machine Interfaces" },
  ],
};

// -----------------------------
// Utility helpers
// -----------------------------

const ratingOptions = ["Excellent", "Good", "Acceptable", "Marginal", "Poor"] as const;

type Rating = typeof ratingOptions[number];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function ratingToScore(r: Rating): number {
  switch (r) {
    case "Excellent":
      return 1;
    case "Good":
      return 0.8;
    case "Acceptable":
      return 0.6;
    case "Marginal":
      return 0.4;
    case "Poor":
      return 0.2;
  }
}

// -----------------------------
// Main Component
// -----------------------------

export default function App() {
  const [phase, setPhase] = useState<Phase>("D2P2");
  const [configText, setConfigText] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const [ousdreText, setOusdReText] = useState(JSON.stringify(DEFAULT_OUSDRE, null, 2));
  const [config, setConfig] = useState<SolicitationConfig>(DEFAULT_CONFIG);
  const [ousdre, setOusdRe] = useState<OUSDRECatalog>(DEFAULT_OUSDRE);

  const [proposalMeta, setProposalMeta] = useState({
    title: "",
    company: "",
    topicNumber: "",
    cmSigned: false,
    tvPages: 0,
    popMonths: 0,
    costTotal: 0,
    rcfPresent: false,
    fwaPresent: false,
    vol7Present: false,
    powOk: false,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [milestones, setMilestones] = useState<Array<{ id: string; title: string; description: string; rdCentric: boolean; measurable: boolean; start: string; end: string }>>([
    { id: "m1", title: "M1: Architecture & Test Plan", description: "Baseline architecture, verification plan, KPIs.", rdCentric: true, measurable: true, start: "", end: "" },
    { id: "m2", title: "M2: Prototype V1", description: "Alpha prototype with core feature set.", rdCentric: true, measurable: true, start: "", end: "" },
  ]);

  const overallScore = useMemo(() => {
    // Weighted category score
    let total = 0;
    for (const cat of config.categories) {
      let catScore = 0;
      for (const c of cat.criteria) {
        const r = ratings[c.id] || "Acceptable";
        catScore += ratingToScore(r) * c.weight;
      }
      total += clamp01(catScore) * cat.weight;
    }
    return +(total * 100).toFixed(1);
  }, [ratings, config.categories]);

  const mandatoryResults = useMemo(() => {
    // Use config.mandatory + proposalMeta to derive pass/fail for demo
    const map: Record<string, boolean> = {};
    for (const m of config.mandatory) {
      let ok = true;
      if (m.id === "costCap" && typeof proposalMeta.costTotal === "number" && config.costCapUSD) {
        ok = proposalMeta.costTotal <= config.costCapUSD;
      }
      if (m.id === "popCap" && typeof proposalMeta.popMonths === "number" && config.maxPoPMonths) {
        ok = proposalMeta.popMonths <= config.maxPoPMonths;
      }
      if (m.id === "pages" && typeof proposalMeta.tvPages === "number" && config.pagePolicy?.techVolumeMaxPages) {
        ok = proposalMeta.tvPages <= config.pagePolicy.techVolumeMaxPages;
      }
      if (m.id === "cmSigned") ok = !!proposalMeta.cmSigned;
      if (m.id === "rcf") ok = !!proposalMeta.rcfPresent;
      map[m.id] = !!ok;
    }
    return map;
  }, [config.mandatory, config.costCapUSD, config.maxPoPMonths, config.pagePolicy, proposalMeta]);

  const disqualified = useMemo(() => {
    return config.mandatory.some((m) => m.required && mandatoryResults[m.id] === false);
  }, [config.mandatory, mandatoryResults]);

  function handleLoadConfig() {
    try {
      const parsed = JSON.parse(configText) as SolicitationConfig;
      setConfig(parsed);
    } catch (e) {
      alert("Invalid solicitation JSON");
    }
  }

  function handleLoadOUSDRE() {
    try {
      const parsed = JSON.parse(ousdreText) as OUSDRECatalog;
      setOusdRe(parsed);
    } catch (e) {
      alert("Invalid OUSD(R&E) JSON");
    }
  }

  function handleFileUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Stub: In production, send to backend for extraction. Here we just simulate.
    const name = file.name.toLowerCase();
    if (name.includes("tech") || name.includes("volume2") || name.endsWith(".pdf")) {
      // Fake page count extraction
      setProposalMeta((s) => ({ ...s, tvPages: 14 }));
    }
    if (name.includes("cost") || name.includes("volume3") || name.endsWith(".xlsx")) {
      setProposalMeta((s) => ({ ...s, costTotal: 1180000 }));
    }
  }

  function setRating(id: string, val: Rating) {
    setRatings((r) => ({ ...r, [id]: val }));
  }

  function addMilestone() {
    setMilestones((ms) => [
      ...ms,
      { id: `m${ms.length + 1}`, title: `M${ms.length + 1}: New Milestone`, description: "", rdCentric: true, measurable: false, start: "", end: "" },
    ]);
  }

  const mandatoryPassCount = Object.values(mandatoryResults).filter(Boolean).length;
  const mandatoryTotal = config.mandatory.length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AFWERX SBIR/STTR Evaluator</h1>
            <p className="text-sm text-muted-foreground">Configurable web app for Phase I, Phase II, and D2P2 — load new solicitations & OUSD(R&E) without code changes.</p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline"><FolderCog className="mr-2 h-4 w-4"/>Load Config</Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[600px] sm:w-[600px]">
                <SheetHeader>
                  <SheetTitle>Solicitation & OUSD(R&E) Catalog</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Solicitation JSON</CardTitle>
                      <CardDescription>Paste new TRI/BAA rulepack here (caps, PoP, pages, mandatory list, rubric, etc.).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Textarea className="h-64" value={configText} onChange={(e)=>setConfigText(e.target.value)} />
                      <div className="flex gap-2 justify-end">
                        <Button onClick={handleLoadConfig}><Wand2 className="mr-2 h-4 w-4"/>Apply</Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>OUSD(R&E) Catalog</CardTitle>
                      <CardDescription>Paste the latest Critical Technology Areas (ids, labels, keywords).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Textarea className="h-56" value={ousdreText} onChange={(e)=>setOusdReText(e.target.value)} />
                      <div className="flex gap-2 justify-end">
                        <Button onClick={handleLoadOUSDRE}><Wand2 className="mr-2 h-4 w-4"/>Apply</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>
            <Button onClick={handleFileUpload}><UploadCloud className="mr-2 h-4 w-4"/>Upload Files</Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Proposal meta and mandatory checks */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Setup</CardTitle>
                <CardDescription>Enter key metadata and choose phase. Config: {config.meta.name} • v{config.meta.version}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phase</Label>
                  <Select value={phase} onValueChange={(v)=>setPhase(v as Phase)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select phase"/></SelectTrigger>
                    <SelectContent>
                      {config.phasesSupported.map((p)=> <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Company</Label>
                  <Input className="mt-1" placeholder="Acme Robotics, Inc." value={proposalMeta.company} onChange={(e)=>setProposalMeta({...proposalMeta, company: e.target.value})} />
                </div>
                <div>
                  <Label>Proposal Title</Label>
                  <Input className="mt-1" placeholder="Autonomous ISR Mesh for Contested Environments" value={proposalMeta.title} onChange={(e)=>setProposalMeta({...proposalMeta, title: e.target.value})} />
                </div>
                <div>
                  <Label>Topic Number</Label>
                  <Input className="mt-1" placeholder="AFX255-DPCSO3" value={proposalMeta.topicNumber} onChange={(e)=>setProposalMeta({...proposalMeta, topicNumber: e.target.value})} />
                </div>
                <div>
                  <Label>Total SBIR Cost (USD)</Label>
                  <Input type="number" className="mt-1" value={proposalMeta.costTotal} onChange={(e)=>setProposalMeta({...proposalMeta, costTotal: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Period of Performance (months)</Label>
                  <Input type="number" className="mt-1" value={proposalMeta.popMonths} onChange={(e)=>setProposalMeta({...proposalMeta, popMonths: Number(e.target.value)})} />
                </div>
                <div>
                  <Label>Tech Volume Pages (excl. Cover/TOC/Glossary)</Label>
                  <Input type="number" className="mt-1" value={proposalMeta.tvPages} onChange={(e)=>setProposalMeta({...proposalMeta, tvPages: Number(e.target.value)})} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="cm" checked={proposalMeta.cmSigned} onCheckedChange={(v)=>setProposalMeta({...proposalMeta, cmSigned: Boolean(v)})} />
                  <Label htmlFor="cm">Signed Customer Memorandum present</Label>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="rcf" checked={proposalMeta.rcfPresent} onCheckedChange={(v)=>setProposalMeta({...proposalMeta, rcfPresent: Boolean(v)})} />
                  <Label htmlFor="rcf">Regulatory Compliance Form included</Label>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="fwa" checked={proposalMeta.fwaPresent} onCheckedChange={(v)=>setProposalMeta({...proposalMeta, fwaPresent: Boolean(v)})} />
                  <Label htmlFor="fwa">FWA Training proof included (Vol 6)</Label>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="vol7" checked={proposalMeta.vol7Present} onCheckedChange={(v)=>setProposalMeta({...proposalMeta, vol7Present: Boolean(v)})} />
                  <Label htmlFor="vol7">Volume 7 Disclosures completed</Label>
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="pow" checked={proposalMeta.powOk} onCheckedChange={(v)=>setProposalMeta({...proposalMeta, powOk: Boolean(v)})} />
                  <Label htmlFor="pow">% of Work meets SBIR thresholds</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mandatory Criteria</CardTitle>
                  <CardDescription>Auto disqualifiers must all pass. ({mandatoryPassCount}/{mandatoryTotal} passing)</CardDescription>
                </div>
                {disqualified ? (
                  <Badge variant="destructive">Disqualified</Badge>
                ) : (
                  <Badge variant="secondary">Eligible</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {config.mandatory.map((m)=>{
                    const ok = mandatoryResults[m.id];
                    return (
                      <div key={m.id} className="border rounded-xl p-3 flex items-start gap-3">
                        <FileCheck2 className={`h-5 w-5 mt-0.5 ${ok ? "text-green-600" : "text-red-600"}`} />
                        <div>
                          <div className="font-medium">{m.label}</div>
                          <div className="text-xs text-muted-foreground">{m.limit ? `Limit: ${m.limit.value} ${m.limit.kind}` : ""}</div>
                          <div className="text-xs text-muted-foreground">{m.required ? "Required" : "Optional"}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {disqualified && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Auto-Disqualification</AlertTitle>
                    <AlertDescription>
                      One or more mandatory criteria are not satisfied. Fix red items above before progressing to scoring.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Milestone Assessment</CardTitle>
                <CardDescription>Ensure 8–12 milestones are primarily R&D, measurable, and time-boxed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.map((m,i)=> (
                  <div key={m.id} className="rounded-2xl border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Title</Label>
                        <Input className="mt-1" value={m.title} onChange={(e)=>{
                          const v=e.target.value; setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,title:v}:x));
                        }} />
                      </div>
                      <div>
                        <Label>Start</Label>
                        <Input type="date" className="mt-1" value={m.start} onChange={(e)=>{
                          const v=e.target.value; setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,start:v}:x));
                        }} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea className="mt-1" value={m.description} onChange={(e)=>{
                          const v=e.target.value; setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,description:v}:x));
                        }} />
                      </div>
                      <div>
                        <Label>End</Label>
                        <Input type="date" className="mt-1" value={m.end} onChange={(e)=>{
                          const v=e.target.value; setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,end:v}:x));
                        }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={m.rdCentric} onCheckedChange={(v)=> setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,rdCentric:Boolean(v)}:x))} />
                        <span className="text-sm">R&D Centric</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={m.measurable} onCheckedChange={(v)=> setMilestones((ms)=>ms.map(x=> x.id===m.id?{...x,measurable:Boolean(v)}:x))} />
                        <span className="text-sm">Measurable</span>
                      </div>
                      <Badge variant={(m.rdCentric && m.measurable)?"default":"secondary"}>{(m.rdCentric && m.measurable)?"Strong":"Needs Work"}</Badge>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={addMilestone}><Rocket className="mr-2 h-4 w-4"/>Add Milestone</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Scoring, OUSD(R&E), Export */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Scoring</CardTitle>
                <CardDescription>Rate each criterion (weights built into solicitation config).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.categories.map((cat)=> (
                  <div key={cat.id} className="rounded-2xl border">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">Category weight: {(cat.weight*100).toFixed(0)}%</div>
                      </div>
                      <Badge>{cat.criteria.length} criteria</Badge>
                    </div>
                    <Separator/>
                    <div className="p-4 space-y-3">
                      {cat.criteria.map((c)=> (
                        <div key={c.id} className="border rounded-xl p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium">{c.label}</div>
                              {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                              {c.howToExcellence && (
                                <div className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1"><HelpCircle className="h-3 w-3 mt-0.5"/> {c.howToExcellence}</div>
                              )}
                            </div>
                            <Select value={ratings[c.id] || "Acceptable"} onValueChange={(v)=> setRating(c.id, v as Rating)}>
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Rate"/>
                              </SelectTrigger>
                              <SelectContent>
                                {ratingOptions.map((r)=> <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">Criterion weight: {(c.weight*100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Alert>
                  <AlertTitle>Provisional Score</AlertTitle>
                  <AlertDescription className="flex items-center justify-between mt-1">
                    <span>Weighted overall (all categories):</span>
                    <span className="text-xl font-semibold">{overallScore} / 100</span>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OUSD(R&E) Alignment</CardTitle>
                <CardDescription>Map your solution to critical tech areas (uploadable each cycle).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {ousdre.areas.map((a)=> (
                    <Badge key={a.id} variant="outline">{a.label}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">Tip: Keep your config fresh with the latest DoD Critical Technology Area Roadmaps.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Readiness Report</CardTitle>
                <CardDescription>Download a structured summary for color team reviews.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={()=>{
                  // Simple client-side export: JSON snapshot
                  const snapshot = {
                    configMeta: config.meta,
                    phase,
                    proposalMeta,
                    mandatoryResults,
                    disqualified,
                    ratings,
                    overallScore,
                    milestones,
                    ousdreVersion: ousdre.version,
                  };
                  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `readiness_${(proposalMeta.title||"proposal").replace(/\s+/g,'_')}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}>
                  <Download className="mr-2 h-4 w-4"/> Download JSON Snapshot
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Integrate a PDF exporter (WeasyPrint/Playwright via backend) for a polished report matching AFWERX format.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Helpful References</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4"/> TRI / Open Topic page (keep current): {config.references?.triUrl ?? "—"}</div>
                <div className="flex items-center gap-2"><Workflow className="h-4 w-4"/> DoD SBIR BAA home: {config.references?.baaUrl ?? "—"}</div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <footer className="text-xs text-muted-foreground text-center pt-4">
          This demo focuses on configurability. Wire file extractors, DSIP packaging helpers, and risk/FOCI checks on the backend to go to production.
        </footer>
      </div>
    </div>
  );
}
