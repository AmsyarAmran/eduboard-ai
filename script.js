const views={home:"Papan pemuka",tutor:"Tutor AI",board:"Papan putih",scan:"Imbas soalan",study:"Nota & ulang kaji"};
function showView(name){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));const target=document.getElementById(name+"View");if(target)target.classList.add("active");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));document.getElementById("crumb").textContent=views[name]||"Workspace";document.getElementById("sidebar").classList.remove("open");if(name==="board")resizeCanvas();}
document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.view)));
document.getElementById("menuToggle").addEventListener("click",()=>document.getElementById("sidebar").classList.toggle("open"));
document.getElementById("languageToggle").addEventListener("click",e=>{const b=e.currentTarget;b.innerHTML=b.textContent.trim().startsWith("MS")?"EN <span>⌄</span>":"MS <span>⌄</span>";});
const chatMessages=document.getElementById("chatMessages"),chatInput=document.getElementById("chatInput");
const TUTOR_API="https://eduboard-ai-tutor.amsyar291008.workers.dev/chat";
const conversation=[];
function appendInlineMarkdown(parent,text){const pattern=/(\`[^\`]+\`|\*\*[^*]+\*\*|(?<!\*)\*[^*\n]+\*(?!\*)|__[^_]+__|_[^_\n]+_)/g;let last=0,match;while((match=pattern.exec(text))){if(match.index>last)parent.appendChild(document.createTextNode(text.slice(last,match.index)));const token=match[0],isCode=token.startsWith("\`"),isBold=token.startsWith("**")||token.startsWith("__"),node=document.createElement(isCode?"code":isBold?"strong":"em");node.textContent=isCode?token.slice(1,-1):isBold?token.slice(2,-2):token.slice(1,-1);parent.appendChild(node);last=pattern.lastIndex;}if(last<text.length)parent.appendChild(document.createTextNode(text.slice(last)));}
function renderMarkdown(target,text){
 target.replaceChildren();
 const lines=String(text).replace(/\r/g,"").split("\n");
 let i=0,list=null,listType="";
 const flushList=()=>{list=null;listType="";};
 const isTableRow=line=>line.trim().startsWith("|")&&line.trim().endsWith("|");
 const cells=line=>line.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(x=>x.trim());
 while(i<lines.length){
  const raw=lines[i],trimmed=raw.trim();
  if(!trimmed){flushList();i++;continue;}
  if(/^---+|^\*\*\*+$|^___+$/.test(trimmed)){flushList();target.appendChild(document.createElement("hr"));i++;continue;}
  if((trimmed==="$$"||trimmed==="\\[")&&i+1<lines.length){
   flushList();const close=trimmed==="$$"?"$$":"\\]";const math=[];
   i++;while(i<lines.length&&lines[i].trim()!==close){math.push(lines[i]);i++;}
   const block=document.createElement("div");block.className="math-block";block.textContent=math.join("\n");target.appendChild(block);i++;continue;
  }
  if(isTableRow(trimmed)&&i+1<lines.length&&/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i+1].trim())){
   flushList();const headers=cells(trimmed),table=document.createElement("table"),thead=document.createElement("thead"),tr=document.createElement("tr");
   headers.forEach(value=>{const th=document.createElement("th");appendInlineMarkdown(th,value);tr.appendChild(th);});thead.appendChild(tr);table.appendChild(thead);
   const tbody=document.createElement("tbody");i+=2;
   while(i<lines.length&&isTableRow(lines[i])){const row=document.createElement("tr");cells(lines[i]).forEach((value,index)=>{const td=document.createElement("td");appendInlineMarkdown(td,value);row.appendChild(td);});tbody.appendChild(row);i++;}
   table.appendChild(tbody);target.appendChild(table);continue;
  }
  const heading=trimmed.match(/^(#{1,3})\s+(.+)$/),bullet=trimmed.match(/^[-*•]\s+(.+)$/),ordered=trimmed.match(/^\d+[.)]\s+(.+)$/);
  if(heading){flushList();const h=document.createElement("h"+Math.min(heading[1].length+2,5));appendInlineMarkdown(h,heading[2]);target.appendChild(h);i++;continue;}
  if(bullet||ordered){const type=bullet?"ul":"ol";if(!list||listType!==type){list=document.createElement(type);target.appendChild(list);listType=type;}const li=document.createElement("li");appendInlineMarkdown(li,(bullet||ordered)[1]);list.appendChild(li);i++;continue;}
  flushList();const p=document.createElement("p");appendInlineMarkdown(p,trimmed);target.appendChild(p);i++;
 }
 if(window.MathJax&&window.MathJax.typesetPromise)window.MathJax.typesetPromise([target]).catch(()=>{});
}
function addMessage(text,type){const wrap=document.createElement("div");wrap.className=type==="user"?"user-message":"assistant-message";if(type==="assistant"){const avatar=document.createElement("div");avatar.className="bot-avatar";avatar.textContent="✦";wrap.appendChild(avatar);}const content=document.createElement("div");if(type==="assistant"){const name=document.createElement("span");name.className="message-name";name.textContent="EduBoard AI · Tutor";content.appendChild(name);}const bubble=document.createElement("div");bubble.className="message-bubble";if(type==="assistant")renderMarkdown(bubble,text);else bubble.textContent=text;content.appendChild(bubble);wrap.appendChild(content);chatMessages.appendChild(wrap);chatMessages.scrollTop=chatMessages.scrollHeight;return bubble;}
function renderLearningCanvas(question,answer){const canvas=document.querySelector(".lesson-canvas");if(!canvas)return;canvas.innerHTML="";canvas.classList.add("has-lesson");const head=document.createElement("div");head.className="lesson-result-head";const tag=document.createElement("span");tag.className="eyebrow";tag.textContent="AI LESSON · VISUAL NOTES";const title=document.createElement("h2");title.textContent=question.length>68?question.slice(0,65)+"…":question;head.append(tag,title);canvas.appendChild(head);const raw=answer.split(/\n+/).map(x=>x.replace(/^\s*(?:[-*•]|\d+[.)])\s*/,"").trim()).filter(Boolean);let steps=raw.flatMap(line=>line.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/)).filter(x=>x.length>2);if(steps.length<2)steps=raw;if(!steps.length)steps=[answer];steps=steps.slice(0,7);const list=document.createElement("div");list.className="lesson-step-list";steps.forEach((step,i)=>{const card=document.createElement("article");card.className="lesson-step";const number=document.createElement("span");number.className="lesson-step-number";number.textContent=String(i+1).padStart(2,"0");const body=document.createElement("p");body.textContent=step;card.append(number,body);list.appendChild(card);});canvas.appendChild(list);const foot=document.createElement("div");foot.className="lesson-canvas-foot";foot.textContent="Dijana daripada penerangan Tutor AI · Semak setiap langkah";canvas.appendChild(foot);}
function resetLearningCanvas(){lessonActive=false;lessonStep=0;lessonDone=false;lessonTitle="";updateLessonControls();const canvas=document.querySelector(".lesson-canvas");if(!canvas)return;canvas.classList.remove("has-lesson");canvas.innerHTML='<div class="canvas-welcome"><div class="canvas-emblem">✦</div><span class="eyebrow">YOUR IDEAS START HERE</span><h2>Apakah yang ingin<br>anda <span class="gradient-text">pelajari hari ini?</span></h2><p>Mulakan dengan bertanya kepada tutor. Penerangan dan bahan visual akan dipaparkan di ruang ini.</p><div class="canvas-chips"><span>✧ Penerangan visual</span><span>▱ Langkah demi langkah</span><span>⌁ Contoh interaktif</span></div></div><div class="canvas-corner">EDUBOARD AI · CANVAS</div>';}
function setChatBusy(busy){chatInput.disabled=busy;document.querySelector("#chatForm button[type='submit']").disabled=busy;document.querySelector("#chatForm button[type='submit']").textContent=busy?"…":"↑";}

let lessonActive=false,lessonStep=0,lessonBusy=false,lessonMode="topik",lessonDone=false,lessonTitle="";
function tutorInstruction(kind){
 const mode=lessonMode==="ujian"?"Beri fokus kepada konsep penting dan teknik menjawab peperiksaan.":lessonMode==="kerja"?"Gunakan kaedah bimbingan: beri petunjuk kecil dan jangan terus beri jawapan akhir.":"Ajar dengan bahasa yang mudah, mesra dan sesuai untuk pelajar.";
 const common="PENTING: EduBoard AI menggunakan mod pengajaran berperingkat. Jangan berikan keseluruhan topik atau semua langkah sekaligus. Jawab HANYA SATU langkah kecil untuk giliran ini. Terangkan konsep itu dengan jelas dalam 2-4 perenggan ringkas, sertakan satu contoh jika sesuai, kemudian berhenti dan tanya sama ada pelajar sudah faham. Jangan dedahkan langkah seterusnya sehingga pelajar menekan butang sambung. "+mode+" Jika sesuai untuk topik ini, sertakan SATU visual menggunakan arahan tepat pada baris berasingan: [[FORMULA: LaTeX]] untuk formula; [[GRAPH: y=2x+1]] untuk graf fungsi linear atau kuadratik ringkas; [[DIAGRAM: A -> B -> C]] untuk rajah aliran. Jangan cipta visual jika tidak membantu. Jangan letakkan arahan visual di tengah ayat. Jika pelajaran sudah lengkap, tulis [[DONE]] pada baris terakhir.";
 if(kind==="start")return common+" Ini ialah LANGKAH 1. Mulakan dengan idea atau konsep paling asas sahaja.";
 if(kind==="next")return common+" Sambung dengan SATU langkah seterusnya sahaja berdasarkan perbualan terdahulu. Jangan ulang semua langkah.";
 return "Pelajar sedang mengikuti pelajaran berperingkat. Jawab soalan susulan ini sahaja dengan ringkas dan jelas. Jangan lompat ke langkah seterusnya atau menamatkan pelajaran. Akhiri dengan bertanya sama ada pelajar mahu sambung.";
}
function makeGraph(expression){
 const match=expression.match(/^y\s*=\s*([+-]?(?:\d*\.?\d+)?)\s*x\s*([+-]\s*\d*\.?\d+)?$/i);
 const quad=expression.match(/^y\s*=\s*([+-]?(?:\d*\.?\d+)?)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d+)?$/i);
 if(!match&&!quad)return null;
 let a=Number((match||quad)[1]||1),b=Number(((match||quad)[2]||"0").replace(/\s/g,""));
 const w=520,h=300,p=28,xMin=-5,xMax=5,yMin=-6,yMax=6,X=x=>p+(x-xMin)/(xMax-xMin)*(w-2*p),Y=y=>h-p-(y-yMin)/(yMax-yMin)*(h-2*p);
 const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("role","img");svg.setAttribute("aria-label","Graf "+expression);
 const line=(x1,y1,x2,y2,color,width)=>{const el=document.createElementNS(ns,"line");Object.entries({x1,y1,x2,y2,stroke:color,"stroke-width":width}).forEach(([k,v])=>el.setAttribute(k,v));svg.appendChild(el);};
 for(let x=-5;x<=5;x++)line(X(x),Y(yMin),X(x),Y(yMax),"#263550",1);
 for(let y=-6;y<=6;y++)line(X(xMin),Y(y),X(xMax),Y(y),"#263550",1);
 line(X(0),Y(yMin),X(0),Y(yMax),"#91a4c5",1.5);line(X(xMin),Y(0),X(xMax),Y(0),"#91a4c5",1.5);
 let d="";for(let i=0;i<=200;i++){const x=xMin+(xMax-xMin)*i/200,y=quad?a*x*x+b:a*x+b;d+=(i?"L":"M")+X(x).toFixed(2)+" "+Y(Math.max(yMin,Math.min(yMax,y))).toFixed(2)+" ";}
 const path=document.createElementNS(ns,"path");path.setAttribute("d",d);path.setAttribute("fill","none");path.setAttribute("stroke","#75dce8");path.setAttribute("stroke-width","3");path.setAttribute("stroke-linecap","round");svg.appendChild(path);return svg;
}
function renderVisuals(answer){
 const canvas=document.querySelector(".lesson-canvas");canvas.querySelectorAll(".lesson-visual").forEach(el=>el.remove());
 const formula=[...answer.matchAll(/\[\[FORMULA:\s*([\s\S]*?)\s*\]\]/g)].map(m=>m[1].trim());
 const graphs=[...answer.matchAll(/\[\[GRAPH:\s*([^\]]+)\]\]/g)].map(m=>m[1].trim());
 const diagrams=[...answer.matchAll(/\[\[DIAGRAM:\s*([^\]]+)\]\]/g)].map(m=>m[1].trim());
 const addCard=(label,content)=>{const card=document.createElement("div");card.className="lesson-visual";const tag=document.createElement("span");tag.className="eyebrow";tag.textContent=label;card.appendChild(tag);if(typeof content==="string"){const body=document.createElement("div");body.className="visual-formula";body.textContent="\\("+content+"\\)";card.appendChild(body);}else card.appendChild(content);canvas.appendChild(card);};
 formula.forEach(x=>addCard("FORMULA UTAMA",x));
 graphs.forEach(x=>{const graph=makeGraph(x);if(graph){const holder=document.createElement("div");holder.className="visual-graph";holder.appendChild(graph);const caption=document.createElement("p");caption.textContent="Graf bagi "+x;holder.appendChild(caption);addCard("GRAF FUNGSI",holder);}else addCard("PERSAMAAN GRAF",x);});
 diagrams.forEach(x=>{const holder=document.createElement("div");holder.className="visual-flow";const parts=x.split(/\s*->\s*/).slice(0,6);parts.forEach((label,i)=>{const node=document.createElement("span");node.textContent=label;holder.appendChild(node);if(i<parts.length-1){const arrow=document.createElement("b");arrow.textContent="→";holder.appendChild(arrow);}});addCard("RAJAH ALIRAN",holder);});
 if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([canvas]).catch(()=>{});
}
function updateLessonControls(done=lessonDone){
 const controls=document.getElementById("lessonStepControls");if(!controls)return;controls.hidden=!lessonActive;
 const label=document.getElementById("lessonStepLabel");if(label)label.textContent=done?"Pelajaran selesai":"Langkah "+lessonStep+" · Belajar mengikut rentak anda";
 const next=document.getElementById("nextLessonStep");if(next){next.hidden=done;next.disabled=lessonBusy;next.textContent="Langkah seterusnya →";}
 const finish=document.getElementById("lessonDoneLabel");if(finish)finish.hidden=!done;
}
function cleanTutorAnswer(answer){return answer.replace(/\[\[(?:FORMULA|GRAPH|DIAGRAM):[\s\S]*?\]\]/g,"").replace(/^\s*\[\[DONE\]\]\s*$/m,"").trim();}
async function sendTutorTurn(displayText,kind){
 if(lessonBusy)return;if(kind==="start"){lessonActive=true;lessonStep=1;lessonDone=false;lessonTitle=displayText.split("\n")[0];}else if(kind==="next"){lessonStep++;lessonDone=false;}
 const apiText=displayText+"\n\n"+tutorInstruction(kind);conversation.push({role:"user",content:apiText});
 if(displayText)addMessage(displayText,"user");setChatBusy(true);lessonBusy=true;updateLessonControls();
 const loading=addMessage("Sedang menyediakan langkah pembelajaran…","assistant");
 try{
  const response=await fetch(TUTOR_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:conversation.slice(-10)})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||"Permintaan tidak berjaya.");
  if(typeof data.answer!=="string"||!data.answer.trim())throw new Error("Tutor AI tidak memulangkan jawapan.");
  const raw=data.answer,clean=cleanTutorAnswer(raw);renderMarkdown(loading,clean);conversation.push({role:"assistant",content:raw});renderLearningCanvas(lessonTitle||displayText||"Pelajaran",clean);renderVisuals(raw);lessonDone=/\[\[DONE\]\]/.test(raw);updateLessonControls(lessonDone);
 }catch(error){loading.textContent=error.message||"Sambungan Tutor AI terganggu. Cuba lagi sebentar.";conversation.pop();if(kind==="next")lessonStep=Math.max(1,lessonStep-1);if(kind==="start")lessonActive=false;updateLessonControls();}
 finally{lessonBusy=false;setChatBusy(false);updateLessonControls(lessonDone);chatInput.focus();chatMessages.scrollTop=chatMessages.scrollHeight;}
}
document.getElementById("chatForm").addEventListener("submit",e=>{e.preventDefault();const q=chatInput.value.trim();if(!q||lessonBusy)return;chatInput.value="";sendTutorTurn(q,lessonActive?"question":"start");});
document.getElementById("nextLessonStep").addEventListener("click",()=>sendTutorTurn("Teruskan ke satu langkah pembelajaran yang seterusnya.","next"));
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{chatInput.value=b.dataset.prompt;chatInput.focus();}));
document.getElementById("voiceButton").addEventListener("click",()=>{if(!("speechSynthesis"in window)){alert("Fungsi suara tidak disokong oleh pelayar ini.");return;}const last=chatMessages.querySelector(".assistant-message:last-child .message-bubble");if(!last)return;const utterance=new SpeechSynthesisUtterance(last.textContent);utterance.lang="ms-MY";speechSynthesis.cancel();speechSynthesis.speak(utterance);});
const canvas=document.getElementById("whiteboard"),ctx=canvas.getContext("2d");let drawing=false,tool="pen",lastPoint=null;
function resizeCanvas(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const old=document.createElement("canvas");old.width=canvas.width;old.height=canvas.height;old.getContext("2d").drawImage(canvas,0,0);const dpr=window.devicePixelRatio||1;canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(old.width&&old.height)ctx.drawImage(old,0,0,old.width,old.height,0,0,rect.width,rect.height);ctx.lineCap="round";ctx.lineJoin="round";}
window.addEventListener("resize",()=>{if(document.getElementById("boardView").classList.contains("active"))resizeCanvas();});
document.querySelectorAll(".tool").forEach(b=>b.addEventListener("click",()=>{tool=b.dataset.tool;document.querySelectorAll(".tool").forEach(x=>x.classList.toggle("active",x===b));}));
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener("pointerdown",e=>{drawing=true;lastPoint=point(e);canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=point(e);ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle=tool==="eraser"?"#101a2e":document.getElementById("penColor").value;ctx.lineWidth=tool==="eraser"?24:Number(document.getElementById("penSize").value);ctx.stroke();lastPoint=p;});
function stopDraw(){drawing=false;lastPoint=null;}canvas.addEventListener("pointerup",stopDraw);canvas.addEventListener("pointercancel",stopDraw);document.getElementById("clearBoard").addEventListener("click",()=>ctx.clearRect(0,0,canvas.width,canvas.height));
const fileInput=document.getElementById("questionFile");fileInput.addEventListener("change",()=>{const file=fileInput.files&&fileInput.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{document.getElementById("previewImage").src=reader.result;document.getElementById("scanPreview").hidden=false;};reader.readAsDataURL(file);});
document.getElementById("askAboutImage").addEventListener("click",()=>{showView("tutor");chatInput.value="Saya telah memuat naik gambar soalan. Bantu saya fahami soalan ini (analisis imej AI belum diaktifkan).";chatInput.focus();});
const noteTitle=document.getElementById("noteTitle"),noteContent=document.getElementById("noteContent"),editor=document.getElementById("noteEditor"),notesList=document.getElementById("notesList");let notes=[];try{notes=JSON.parse(localStorage.getItem("eduboard-notes")||"[]");}catch(e){notes=[];}
function renderNotes(){notesList.innerHTML="";if(!notes.length){notesList.innerHTML='<div class="empty-state"><span>▤</span><strong>Belum ada nota</strong><p>Tekan “Nota baharu” untuk mula menulis.</p></div>';return;}notes.forEach((note,i)=>{const item=document.createElement("article");item.className="note-item";const title=document.createElement("strong");title.textContent=note.title||"Nota tanpa tajuk";const body=document.createElement("p");body.textContent=note.content;const del=document.createElement("button");del.textContent="Padam nota";del.addEventListener("click",()=>{notes.splice(i,1);persistNotes();});item.append(title,body,del);notesList.appendChild(item);});}
function persistNotes(){localStorage.setItem("eduboard-notes",JSON.stringify(notes));renderNotes();}
document.getElementById("newNote").addEventListener("click",()=>{editor.hidden=false;noteTitle.focus();});document.getElementById("cancelNote").addEventListener("click",()=>{editor.hidden=true;noteTitle.value="";noteContent.value="";});document.getElementById("saveNote").addEventListener("click",()=>{if(!noteTitle.value.trim()&&!noteContent.value.trim()){alert("Tulis tajuk atau kandungan nota terlebih dahulu.");return;}notes.unshift({title:noteTitle.value.trim(),content:noteContent.value.trim()});persistNotes();editor.hidden=true;noteTitle.value="";noteContent.value="";});renderNotes();
// Learning Studio session controls
const newSessionButton=document.getElementById("newSessionButton");
if(newSessionButton){newSessionButton.addEventListener("click",()=>{conversation.length=0;chatMessages.innerHTML="";resetLearningCanvas();addMessage("Hai! Saya tutor pembelajaran anda. 😊\n\nTopik apa yang ingin anda fahami hari ini? Anda boleh bertanya dalam Bahasa Melayu atau English.","assistant");chatInput.value="";chatInput.focus();});}

/* Home prompt and learning mode */
let activeHomeMode="topik";
document.querySelectorAll("[data-home-mode]").forEach(button=>button.addEventListener("click",()=>{activeHomeMode=button.dataset.homeMode;document.querySelectorAll("[data-home-mode]").forEach(item=>item.classList.toggle("active",item===button));}));
document.querySelectorAll("[data-home-prompt]").forEach(button=>button.addEventListener("click",()=>{const field=document.getElementById("homePrompt");field.value=button.dataset.homePrompt;field.focus();}));
document.getElementById("homePromptForm").addEventListener("submit",event=>{event.preventDefault();const field=document.getElementById("homePrompt");const prompt=field.value.trim();if(!prompt){field.focus();return;}const modeNames={topik:"Mod Topik",ujian:"Mod Ujian",kerja:"Mod Kerja Rumah"};lessonMode=activeHomeMode;const modeInstructions={topik:"Bimbing saya memahami topik ini dengan penerangan yang jelas dan contoh visual jika sesuai.",ujian:"Bantu saya membuat persediaan ujian untuk perkara ini. Terangkan konsep penting, kesilapan lazim dan berikan soalan latihan ringkas.",kerja:"Bimbing saya menyelesaikan tugasan ini secara berperingkat. Berikan petunjuk dan penerangan dahulu, bukan terus memberikan jawapan akhir."};showView("tutor");chatInput.value=modeNames[activeHomeMode]+": "+prompt+"\n\n"+modeInstructions[activeHomeMode];document.getElementById("chatForm").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
