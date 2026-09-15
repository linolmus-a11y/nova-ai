const $=s=>document.querySelector(s);
const messages=$("#messages"), input=$("#input"), welcome=$("#welcome"), list=$("#chatList");
let history=[], chats=[];

function addMessage(role,text){
  welcome.style.display="none";
  const row=document.createElement("div"); row.className="msg "+(role==="user"?"user":"ai");
  const av=document.createElement("div"); av.className="avatar"; av.textContent=role==="user"?"YOU":"N";
  const b=document.createElement("div"); b.className="bubble"; b.textContent=text;
  row.append(av,b); messages.appendChild(row); messages.scrollTop=messages.scrollHeight;
}
function save(){
  localStorage.setItem("nova-history",JSON.stringify(history));
  renderChats();
}
function renderChats(){
  list.innerHTML="";
  const titles=chats.slice(-12).reverse();
  titles.forEach(t=>{let d=document.createElement("div");d.className="chat-item";d.textContent=t;list.appendChild(d)});
}
function newChat(){
  history=[]; messages.innerHTML=""; welcome.style.display="block"; input.value=""; save();
}
async function send(text){
  text=(text??input.value).trim(); if(!text)return;
  input.value=""; input.style.height="auto"; addMessage("user",text);
  history.push({role:"user",content:text});
  if(history.length===1){chats.push(text.slice(0,42));renderChats()}
  const loading="NOVA печатает…"; addMessage("assistant",loading);
  const bubble=[...document.querySelectorAll(".msg.ai .bubble")].at(-1);
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});
    const data=await r.json(); if(!r.ok)throw Error(data.error||"Server error");
    bubble.textContent=data.text||"Пустой ответ.";
    history.push({role:"assistant",content:data.text||""}); save();
  }catch(e){bubble.textContent="Ошибка: "+e.message; history.pop();}
  messages.scrollTop=messages.scrollHeight;
}
$("#send").onclick=()=>send();
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,150)+"px"});
$("#newChat").onclick=newChat; $("#clear").onclick=newChat;
$("#mobileMenu").onclick=()=>$(".sidebar").classList.toggle("open");
document.querySelectorAll(".suggestions button").forEach(b=>b.onclick=()=>send(b.dataset.q));
try{history=JSON.parse(localStorage.getItem("nova-history")||"[]"); if(history.length)history.forEach(m=>addMessage(m.role,m.content));}catch{}
renderChats();
