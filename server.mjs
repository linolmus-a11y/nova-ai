import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const app=express(), PORT=Number(process.env.PORT||3000), HOST=process.env.NOVA_HOST||"0.0.0.0";
const OLLAMA=process.env.OLLAMA_BASE_URL||"http://127.0.0.1:11434";
const LOCAL_URL=process.env.LOCAL_AI_URL||`${OLLAMA}/v1/chat/completions`;
const CLOUD_MODEL=process.env.OPENAI_MODEL||"gpt-5-mini";
let localModel=process.env.LOCAL_AI_MODEL||"qwen2.5:3b";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"10mb"})); app.use(express.static(path.join(__dirname,"public")));
const state={local:{status:"UNKNOWN",lastError:null,lastChecked:0},cloud:{status:"UNKNOWN",lastError:null}};
async function ollama(p,o={}){const r=await fetch(`${OLLAMA}${p}`,{...o,headers:{"Content-Type":"application/json",...(o.headers||{})}});const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{d={raw:t}}if(!r.ok)throw new Error(d.error||d.message||`Ollama HTTP ${r.status}`);return d}
async function checkOllama(){try{const d=await ollama("/api/tags");state.local={status:"AVAILABLE",lastError:null,lastChecked:Date.now()};return d}catch(e){state.local={status:"OFFLINE",lastError:e.message,lastChecked:Date.now()};throw e}}
async function localChat(messages){const r=await fetch(LOCAL_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:localModel,messages,temperature:.7,stream:false})});const t=await r.text();let d={};try{d=t?JSON.parse(t):{}}catch{}if(!r.ok)throw new Error(d?.error?.message||d?.error||`Local AI HTTP ${r.status}`);return d?.choices?.[0]?.message?.content||d?.message?.content||d?.response||""}
app.get("/api/health",async(_q,res)=>{let ok=true;try{await checkOllama()}catch{ok=false}res.json({ok:true,version:"5.3.0",host:HOST,port:PORT,ollama:ok})});
app.get("/api/providers",async(_q,res)=>{try{await checkOllama()}catch{}res.json({ok:true,providers:state,models:{local:localModel,cloud:CLOUD_MODEL}})});
app.get("/api/local/ollama",async(_q,res)=>{try{await checkOllama();res.json({ok:true,url:OLLAMA,status:state.local})}catch(e){res.status(503).json({ok:false,url:OLLAMA,status:state.local,error:e.message})}});
app.get("/api/local/models",async(_q,res)=>{try{const d=await checkOllama();res.json({ok:true,activeModel:localModel,models:(d.models||[]).map(m=>({name:m.name,size:m.size,modifiedAt:m.modified_at,details:m.details||{}}))})}catch(e){res.status(503).json({ok:false,error:e.message,activeModel:localModel,models:[]})}});
app.get("/api/local/model",async(_q,res)=>{try{const d=await ollama("/api/show",{method:"POST",body:JSON.stringify({name:localModel})});res.json({ok:true,activeModel:localModel,model:d})}catch(e){res.status(503).json({ok:false,activeModel:localModel,error:e.message})}});
app.post("/api/local/model",(req,res)=>{const m=String(req.body?.model||"").trim();if(!m)return res.status(400).json({ok:false,error:"model is required"});localModel=m;res.json({ok:true,activeModel:localModel})});
app.post("/api/local/test",async(_q,res)=>{try{const response=await localChat([{role:"user",content:"Ответь только: NOVA-LOCAL-OK"}]);res.json({ok:true,provider:"local",model:localModel,response})}catch(e){res.status(503).json({ok:false,error:e.message,model:localModel})}});
app.post("/api/chat",async(req,res)=>{const m=String(req.body?.message||"").trim();if(!m)return res.status(400).json({ok:false,error:"message is required"});try{const response=await localChat([{role:"user",content:m}]);res.json({ok:true,response,provider:"local",model:localModel,source:`🟢 LOCAL AI — ${localModel} · Ollama`})}catch(e){res.status(502).json({ok:false,error:e.message})}});
app.get("/api/config",(_q,res)=>res.json({version:"5.3.0",localModel,ollamaUrl:OLLAMA,localConfigured:true,cloudConfigured:Boolean(process.env.OPENAI_API_KEY),host:HOST,architecture:["runtime","local-ai-manager","ollama-manager","model-router","mobile-ux","media-foundation","response-source"]}));
app.use((_q,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,HOST,()=>console.log(`NOVA 5.3: http://${HOST}:${PORT}`));
