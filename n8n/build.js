/**
 * Injeta n8n/normalizar.js dentro do node "Normalizar e filtrar" do workflow.
 *
 * O n8n guarda código de node como uma string dentro do JSON, o que é péssimo
 * para revisar e impossível de testar. Aqui o código vive num .js de verdade e
 * este script monta o JSON final.
 *
 *   node n8n/build.js
 */
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const wfPath = path.join(dir, "noticias-rss.json");

const wf = JSON.parse(fs.readFileSync(wfPath, "utf8"));
const codigo = fs.readFileSync(path.join(dir, "normalizar.js"), "utf8");

const node = wf.nodes.find((n) => n.id === "normalizar");
if (!node) throw new Error('node "normalizar" não encontrado no workflow');
node.parameters.jsCode = codigo;

// O casamento por domínio precisa de site_url; garantir que o SELECT traz.
const busca = wf.nodes.find((n) => n.id === "buscar-fontes");
const select = busca.parameters.queryParameters.parameters.find((p) => p.name === "select");
select.value = "id,nome,feed_url,site_url,categoria,confianca,idioma";

fs.writeFileSync(wfPath, JSON.stringify(wf, null, 2) + "\n");

console.log("workflow montado:", path.relative(process.cwd(), wfPath));
console.log("  nodes:", wf.nodes.length);
console.log("  select das fontes:", select.value);
console.log("  código do normalizar:", codigo.length, "chars");
