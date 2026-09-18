import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.NOVA_HOST || "0.0.0.0";
const OLLAMA = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const LOCAL_URL = process.env.LOCAL_AI_URL || `${OLLAMA}/v1/chat/completions`;
const CLOUD_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
let localModel = process.env.LOCAL_AI_MODEL || "qwen2.5:3b";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"10mb"}));
app.use(express.static(path.join(__dirname,"public")));

const state = {
  local:{status:"UNKNOWN",lastError:null,lastChecked:0},
  cloud:{status:"UNKNOWN",lastError:null}
};

async function ollama(pathname, options={}) {
  const r = await fetch(`${OLLAMA}${pathname}`, {
    ...options,
    headers:{"Content-Type":"application/json",...(options.headers||{})}
  });
  const text = await r.text();
  let data={};
  try { data=text?JSON.parse(text):{}; } catch { data={raw:text}; }
  if(!r.ok) throw new Error(data.error || data.message || `Ollama HTTP ${r.status}`);
  return data;
}

async function checkOllama() {
  try {
    const data=await ollama("/api/tags");
    state.local={status:"AVAILABLE",lastError:null,lastChecked:Date.now()};
    return data;
  } catch(e) {
    state.local={status:"OFFLINE",lastError:e.message,lastChecked:Date.now()};
    throw e;
  }
}

async function localChat(messages) {
  const r=await fetch(LOCAL_URL,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:localModel,messages,temperature:.7,stream:false})
  });
  const text=await r.text();
  let data={};
  try { data=text?JSON.parse(text):{}; } catch { data={}; }
  if(!r.ok) throw new Error(data?.error?.message || data?.error || `Local AI HTTP ${r.status}`);
  return data?.choices?.[0]?.message?.content || data?.message?.content || data?.response || "";
}

app.get("/api/health", async (_req,res)=>{
  let ollamaOk=true;
  try { await checkOllama(); } catch { ollamaOk=false; }
  res.json({ok:true,version:"5.2.0",host:HOST,port:PORT,ollama:ollamaOk});
});

app.get("/api/providers", async (_req,res)=>{
  try { await checkOllama(); } catch {}
  res.json({ok:true,providers:state,models:{local:localModel,cloud:CLOUD_MODEL}});
});

app.get("/api/local/ollama", async (_req,res)=>{
  try {
    await checkOllama();
    res.json({ok:true,url:OLLAMA,status:state.local});
  } catch(e) {
    res.status(503).json({ok:false,url:OLLAMA,status:state.local,error:e.message});
  }
});

app.get("/api/local/models", async (_req,res)=>{
  try {
    const data=await checkOllama();
    res.json({
      ok:true,
      activeModel:localModel,
      models:(data.models||[]).map(m=>({name:m.name,size:m.size,modifiedAt:m.modified_at,details:m.details||{}}))
    });
  } catch(e) {
    res.status(503).json({ok:false,error:e.message,activeModel:localModel,models:[]});
  }
});

app.get("/api/local/model", async (_req,res)=>{
  try {
    const data=await ollama("/api/show",{method:"POST",body:JSON.stringify({name:localModel})});
    res.json({ok:true,activeModel:localModel,model:data});
  } catch(e) {
    res.status(503).json({ok:false,activeModel:localModel,error:e.message});
  }
});

app.post("/api/local/model",(req,res)=>{
  const model=String(req.body?.model||"").trim();
  if(!model) return res.status(400).json({ok:false,error:"model is required"});
  localModel=model;
  res.json({ok:true,activeModel:localModel});
});

app.post("/api/local/test",async (_req,res)=>{
  try {
    const response=await localChat([{role:"user",content:"Ответь только: NOVA-LOCAL-OK"}]);
    res.json({ok:true,provider:"local",model:localModel,response});
  } catch(e) {
    res.status(503).json({ok:false,error:e.message,model:localModel});
  }
});

app.post("/api/chat",async (req,res)=>{
  const message=String(req.body?.message||"").trim();
  if(!message) return res.status(400).json({ok:false,error:"message is required"});
  try {
    const response=await localChat([{role:"user",content:message}]);
    res.json({
      ok:true,response,provider:"local",model:localModel,
      source:`🟢 LOCAL AI — ${localModel} · Ollama`
    });
  } catch(e) {
    res.status(502).json({ok:false,error:e.message});
  }
});

app.get("/api/config",(_req,res)=>res.json({
  version:"5.2.0",
  localModel,
  ollamaUrl:OLLAMA,
  localConfigured:true,
  cloudConfigured:Boolean(process.env.OPENAI_API_KEY),
  host:HOST,
  architecture:["runtime","local-ai-manager","ollama-manager","model-router","mobile-network-access","response-source"]
}));

app.use((_req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

app.listen(PORT,HOST,()=>console.log(`NOVA 5.2: http://${HOST}:${PORT}`));
