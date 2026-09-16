import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
dotenv.config();
const app=express(), dir=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"2mb"})); app.use(express.static(path.join(dir,"public")));
app.get("/api/health",(_,res)=>res.json({ok:true,version:"3.0.0",mode:"safe-core"}));
app.post("/api/chat",async(req,res)=>{
  const messages=req.body?.messages||[];
  if(!process.env.OPENAI_API_KEY) return res.json({message:"NOVA 3.0: демонстрационный режим. Добавь OPENAI_API_KEY в .env для подключения AI."});
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",
      headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5-mini",input:messages,store:false})});
    const d=await r.json(); if(!r.ok)return res.status(r.status).json({error:d.error?.message||"AI request failed"});
    res.json({message:d.output_text||"NOVA не получила текстовый ответ."});
  }catch{res.status(500).json({error:"Не удалось связаться с AI-сервисом."})}
});
app.use((_,res)=>res.sendFile(path.join(dir,"public","index.html")));
app.listen(process.env.PORT||3000,()=>console.log("NOVA 3.0 online"));
