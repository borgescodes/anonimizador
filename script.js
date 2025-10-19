const tw = document.getElementById("toasts");


function toast(message, typeOrOpts = "info", ttlMaybe = 3000) {
    const opts = typeof typeOrOpts === "object"
        ? { type: "info", ttl: 3000, dismissible: true, actionText: null, onAction: null, ...typeOrOpts }
        : { type: typeOrOpts, ttl: ttlMaybe, dismissible: true, actionText: null, onAction: null };

    if (!tw) return console.warn("Área de toasts não encontrada.");

    const t = document.createElement("div");
    t.className = `toast ${opts.type} toast--in`;
    t.setAttribute("role", opts.type === "warn" ? "alert" : "status");
    t.style.setProperty("--ttl", `${opts.ttl}ms`);

    const icon = document.createElement("span");
    icon.className = "toast__icon";
    icon.innerHTML = {
        success: "✔",
        warn: "⚠",
        info: "ℹ"
    }[opts.type] || "ℹ";

    const text = document.createElement("div");
    text.className = "toast__text";
    text.textContent = String(message ?? "");

    const actions = document.createElement("div");
    actions.className = "toast__actions";

    if (opts.actionText && typeof opts.onAction === "function") {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "toast__btn";
        btn.textContent = opts.actionText;
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            try { opts.onAction(); } catch { }
            closeToast(true);
        });
        actions.appendChild(btn);
    }

    if (opts.dismissible) {
        const close = document.createElement("button");
        close.type = "button";
        close.className = "toast__close";
        close.setAttribute("aria-label", "Fechar alerta");
        close.textContent = "×";
        close.addEventListener("click", (e) => {
            e.stopPropagation();
            closeToast(true);
        });
        actions.appendChild(close);
    }

    const bar = document.createElement("span");
    bar.className = "toast__bar";

    t.append(icon, text, actions, bar);
    tw.appendChild(t);

    let remaining = opts.ttl;
    let start = performance.now();
    let timer = setTimeout(() => closeToast(), remaining);

    function pause() {
        clearTimeout(timer);
        const elapsed = performance.now() - start;
        remaining = Math.max(0, remaining - elapsed);
        t.classList.add("toast--paused");
    }
    function resume() {
        start = performance.now();
        t.classList.remove("toast--paused");
        timer = setTimeout(() => closeToast(), remaining);
    }

    t.addEventListener("mouseenter", pause);
    t.addEventListener("mouseleave", resume);

    function closeToast(immediate = false) {
        clearTimeout(timer);
        t.classList.remove("toast--in");
        t.classList.add("toast--out");
        const duration = immediate ? 150 : 220;
        t.style.setProperty("--out", `${duration}ms`);
        setTimeout(() => t.remove(), duration);
    }
}


function syncHeights() { }

const onlyDigits = (s) => (s ?? "").toString().replace(/\D+/g, "");
function fixLatin1Utf8(str) {
    if (typeof str !== "string") return str;
    let cur = str;
    const score = (s) => (s.match(/[ÃÂ ]/g) || []).length;
    for (let i = 0; i < 4; i++) {
        const bytes = new Uint8Array(Array.from(cur, (c) => c.charCodeAt(0) & 0xff));
        let cand = cur;
        try { cand = new TextDecoder("utf-8", { fatal: false }).decode(bytes); } catch { }
        if (score(cand) >= score(cur)) break;
        cur = cand;
    }
    return cur;
}
const mapPairs = [
    ["Ã¡", "á"], ["Ã ", "à"], ["Ã£", "ã"], ["Ã¢", "â"], ["Ã¤", "ä"],
    ["Ã©", "é"], ["Ã¨", "è"], ["Ãª", "ê"], ["Ã«", "ë"],
    ["Ã­", "í"], ["Ã¬", "ì"], ["Ã®", "î"], ["Ã¯", "ï"],
    ["Ã³", "ó"], ["Ã²", "ò"], ["Ã´", "ô"], ["Ãµ", "õ"], ["Ã¶", "ö"],
    ["Ãº", "ú"], ["Ã¹", "ù"], ["Ã»", "û"], ["Ã¼", "ü"],
    ["Ã§", "ç"], ["Ã±", "ñ"],
    ["Ã ", "Á"], ["Ã€", "À"], ["Ãƒ", "Ã"], ["Ã‚", "Â"], ["Ã„", "Ä"],
    ["Ã‰", "É"], ["Ãˆ", "È"], ["ÃŠ", "Ê"], ["Ã‹", "Ë"],
    ["Ã ", "Í"], ["ÃŒ", "Ì"], ["ÃŽ", "Î"], ["Ã ", "Ï"],
    ["Ã“", "Ó"], ["Ã’", "Ò"], ["Ã”", "Ô"], ["Ã•", "Õ"], ["Ã–", "Ö"],
    ["Ãš", "Ú"], ["Ã™", "Ù"], ["Ã›", "Û"], ["Ãœ", "Ü"],
    ["Ã‡", "Ç"], ["Ã‘", "Ñ"],
    ["â€œ", "“"], ["â€\x9d", "”"], ["â€˜", "‘"], ["â€™", "’"],
    ["â€“", "–"], ["â€”", "—"], ["â€¢", "•"], ["â€¦", "…"],
];
const fixList = [
    [/Fran /g, "Franç"], [/M xico/gi, "México"], [/Col mbia/gi, "Colômbia"],
    [/Austr lia/gi, "Austrália"], [/Jap o/gi, "Japão"], [/It lia/gi, "Itália"],
    [/Canad /gi, "Canadá"], [/Urugua /gi, "Uruguai"],
];
function applyMaps(s) {
    let out = s;
    for (const [bad, good] of mapPairs) out = out.split(bad).join(good);
    for (const [rx, good] of fixList) out = out.replace(rx, good);
    return out;
}
function normalizeText(v) {
    if (v == null) return v;
    if (typeof v !== "string") return v;
    let s = v;
    s = fixLatin1Utf8(s);
    s = applyMaps(s);
    try { s = s.normalize("NFC"); } catch { }
    s = s.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
    return s;
}

function toYYYYMM(v) {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "YYYY-MM";
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${m}`;
}
function birthToAge(v, todayStr = "2025-10-17") {
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    const t = new Date(todayStr);
    let age = t.getFullYear() - d.getFullYear();
    const md = t.getMonth() - d.getMonth();
    if (md < 0 || (md === 0 && t.getDate() < d.getDate())) age--;
    return age;
}
function hashToken(x) {
    const s = String(x);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i);
    const hex = (h >>> 0).toString(16).padStart(8, "0");
    return "tok_" + hex;
}
function maskPhone(v) {
    const d = onlyDigits(v);
    return d.length >= 4 ? `(**) *****-${d.slice(-4)}` : "oculto";
}
function maskCEP(v) {
    const d = onlyDigits(v);
    return d.length >= 5 ? d.slice(0, 5) + "-XXX" : "oculto";
}
function generalizeCity(v) {
    const s = normalizeText(v);
    if (!s) return s;
    return s[0].toUpperCase() + "***";
}
const directKeys = [
    "cpf", "rg", "nome", "mae", "mãe", "email", "e-mail", "telefone", "celular", "placa",
    "cartao", "cartão", "senha", "endereco", "endereço", "logradouro", "numero", "número",
    "complemento", "id", "cartao_credito", "cartão_crédito",
];
const indirectKeys = [
    "nascimento", "cep", "cidade", "município", "municipio", "bairro", "data", "dt_",
    "admissao", "admissão", "desfecho",
];
const like = (c, list) => list.some((k) => c.toLowerCase().includes(k));
function anonymizeRow(row) {
    const out = {};
    for (const [col, raw] of Object.entries(row)) {
        const colL = col.toLowerCase();
        const val0 = typeof raw === "string" ? normalizeText(raw) : raw;
        let val = val0;
        if (like(colL, directKeys)) {
            if (colL.includes("email") || colL.includes("e-mail")) {
                val = hashToken(val0) + "@exemplo.com";
            } else if (colL.includes("telefone") || colL.includes("celular")) {
                val = maskPhone(val0);
            } else if (colL.includes("senha")) {
                val = null;
            } else if (colL.includes("nome") || colL.includes("mae") || colL.includes("mãe")) {
                val = "REMOVIDO";
            } else if (
                colL.includes("endereco") || colL.includes("endereço") ||
                colL.includes("logradouro") || colL.includes("numero") ||
                colL.includes("número") || colL.includes("complemento")
            ) {
                val = "OCULTO";
            } else {
                val = hashToken(val0);
            }
            out[col] = val;
            continue;
        }
        if (like(colL, indirectKeys)) {
            if (colL.includes("nascimento")) {
                out["idade_" + col] = birthToAge(val0);
                continue;
            } else if (colL.includes("cep")) {
                val = maskCEP(val0);
            } else if (colL.includes("cidade") || colL.includes("municipio") || colL.includes("município")) {
                val = generalizeCity(val0);
            } else if (colL.startsWith("dt_") || colL.includes("data") || colL.includes("admissao") ||
                colL.includes("admissão") || colL.includes("desfecho")) {
                val = toYYYYMM(val0);
            }
            out[col] = val;
            continue;
        }
        out[col] = typeof val0 === "string" ? normalizeText(val0) : val0;
    }
    const changed = Object.keys(row).some((k) => String(row[k]) !== String(out[k]));
    if (!changed) {
        for (const k of Object.keys(out)) {
            const v = out[k];
            if (typeof v === "string" && v.length > 3) out[k] = hashToken(v);
        }
    }
    return out;
}

let dataRaw = [], dataView = [], columns = [], page = 1;
const pageSize = 25;
const el = (id) => document.getElementById(id);
function refreshSummary(name) {
    document.getElementById("summaryCard").classList.remove("hidden");
    document.getElementById("resultados").classList.remove("hidden");
    if (name) el("fileName").textContent = name;
    el("rowsCount").textContent = dataView.length;
    el("colsCount").textContent = columns.length;
    syncHeights();
}

function renderTable() {
    const head = el("tableHead"), body = el("tableBody");
    head.innerHTML = ""; body.innerHTML = "";
    const trh = document.createElement("tr");
    columns.forEach((c) => {
        const th = document.createElement("th");
        th.className = "sticky px-3 py-2 text-left text-xs font-semibold text-slate-700 uppercase tracking-wide";
        th.textContent = c;
        trh.appendChild(th);
    });
    head.appendChild(trh);
    const start = (page - 1) * pageSize;
    const rows = dataView.slice(start, start + pageSize);
    rows.forEach((r) => {
        const tr = document.createElement("tr");
        tr.className = "odd:bg-white even:bg-slate-50";
        columns.forEach((c) => {
            const td = document.createElement("td");
            td.className = "px-3 py-2 border-t border-slate-100 align-top";
            const v = r[c];
            td.textContent = v == null ? "" : String(v);
            tr.appendChild(td);
        });
        body.appendChild(tr);
    });
    el("pageInfo").textContent = `Página ${page} de ${Math.max(1, Math.ceil(dataView.length / pageSize))}`;
}

function applyFilter() {
    const q = el("searchInput").value.toLowerCase();
    if (!q) {
        dataView = [...dataRaw];
        page = 1; renderTable(); refreshSummary(); return;
    }
    dataView = dataRaw.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
    page = 1; renderTable(); refreshSummary();
}

async function processWorkbook(file) {
    try {
        toast(`Lendo ${file.name}…`, "info", 1500);
        const normalize = el("optNormalize").checked;
        const anonymize = el("optAnonymize").checked;
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.SheetNames[0];
        const ws = wb.Sheets[sheet];
        let rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
        if (normalize) {
            rows = rows.map((r) =>
                Object.fromEntries(
                    Object.entries(r).map(([k, v]) => [k, typeof v === "string" ? normalizeText(v) : v])
                )
            );
        }
        const processed = anonymize ? rows.map((r) => anonymizeRow(r)) : rows;
        dataRaw = processed; dataView = [...processed];
        columns = Array.from(new Set(processed.flatMap((r) => Object.keys(r))));
        page = 1;

        const sensitiveCols = columns.filter((c) =>
            ["cpf", "rg", "nome", "email", "telefone", "celular", "endereco", "endereço", "id", "cartao", "cartão", "senha"]
                .some((k) => c.toLowerCase().includes(k))
        );
        const quasiCols = columns.filter((c) =>
            ["cep", "cidade", "município", "municipio", "bairro", "data", "dt_", "nascimento"]
                .some((k) => c.toLowerCase().includes(k))
        );
        document.getElementById("sensitiveCount").textContent = sensitiveCols.length;
        document.getElementById("qidCount").textContent = quasiCols.length;

        refreshSummary(file.name);
        renderTable();
        toast("Processamento concluído.", { type: "success", ttl: 1800 });
    } catch (e) {
        console.error(e);
        toast("Erro ao processar: " + (e.message || e), { type: "warn", ttl: 6000, actionText: "Fechar" });
    }
}

function csvDownload(rows, cols, filename = "dados_anonimizados.csv") {
    const header = cols.join(",");
    const body = rows.map((r) =>
        cols.map((c) => {
            const v = r[c];
            if (v == null) return "";
            const s = String(v).replace(/\"/g, '""');
            return /,|\n|\"/.test(s) ? `\"${s}\"` : s;
        }).join(",")
    ).join("\n");
    const blob = new Blob(["\ufeff" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}
function downloadXLSX() {
    const ws = XLSX.utils.json_to_sheet(dataView, { header: columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anonimizados");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dados_anonimizados.xlsx"; a.click();
    URL.revokeObjectURL(url);
}

const dz = document.getElementById("dropzone");
const fi = document.getElementById("fileInput");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("border-emerald-400"); });
dz.addEventListener("dragleave", () => dz.classList.remove("border-emerald-400"));
dz.addEventListener("drop", (e) => {
    e.preventDefault(); dz.classList.remove("border-emerald-400");
    const f = e.dataTransfer.files?.[0]; if (f) processWorkbook(f);
});
fi.addEventListener("change", (e) => {
    const f = e.target.files?.[0]; if (f) processWorkbook(f);
});
document.getElementById("btnClear").addEventListener("click", () => {
    dataRaw = []; dataView = []; columns = []; page = 1; fi.value = "";
    document.getElementById("summaryCard").classList.add("hidden");
    document.getElementById("resultados").classList.add("hidden");
    toast("Interface limpa.", "info", 1200);
});
document.getElementById("btnSample").addEventListener("click", async () => {
    toast("Carregando amostra…", "info", 1200);
    const sample = [
        { pais: "FranÃ§a", cidade: "FlorianÃ³polis", email: "maria@x.com", telefone: "(48) 99999-1234", dt_evento: "2023-07-21", cep: "88000-000", cpf: "111.222.333-44", nome: "Maria" },
        { pais: "MÃ©xico", cidade: "SÃ£o Paulo", email: "joao@x.com", telefone: "(11) 98888-4321", dt_evento: "2022-11-03", cep: "01000-000", cpf: "222.333.444-55", nome: "João" },
        { pais: "ItÃ¡lia", cidade: "Porto Alegre", email: "ana@x.com", telefone: "(51) 97777-5678", dt_evento: "2024-02-02", cep: "90000-000", cpf: "333.444.555-66", nome: "Ana" },
        { pais: "ColÃ´mbia", cidade: "VitÃ³ria", email: "paulo@x.com", telefone: "(27) 99999-0000", dt_evento: "2021-05-18", cep: "29000-000", cpf: "444.555.666-77", nome: "Paulo" },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Amostra");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fa = new File([out], "amostra.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    processWorkbook(fa);
});
document.getElementById("btnDownloadCSV").addEventListener("click", () => csvDownload(dataView, columns));
document.getElementById("btnDownloadXLSX").addEventListener("click", downloadXLSX);
document.getElementById("searchInput").addEventListener("input", () => { applyFilter(); });
document.getElementById("prevPage").addEventListener("click", () => {
    if (page > 1) { page--; renderTable(); }
});
document.getElementById("nextPage").addEventListener("click", () => {
    const max = Math.max(1, Math.ceil(dataView.length / 25));
    if (page < max) { page++; renderTable(); }
});
