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
function renderLearningCanvas(question,answer){const canvas=document.querySelector(".lesson-canvas");if(!canvas)return;canvas.innerHTML="";canvas.classList.add("has-lesson");const head=document.createElement("div");head.className="lesson-result-head";const tag=document.createElement("span");tag.className="eyebrow";tag.textContent="LEARNING STUDIO · LIVE LESSON";const title=document.createElement("h2");title.textContent=question.length>68?question.slice(0,65)+"…":question;head.append(tag,title);canvas.appendChild(head);const stage=document.createElement("article");stage.className="lesson-stage-card";const stageHead=document.createElement("div");stageHead.className="lesson-stage-heading";const number=document.createElement("span");number.className="lesson-step-number";number.textContent=String(lessonStep||1).padStart(2,"0");const label=document.createElement("span");label.className="eyebrow";label.textContent="KONSEP SEMASA";stageHead.append(number,label);stage.appendChild(stageHead);const body=document.createElement("div");body.className="lesson-stage-content";renderMarkdown(body,answer);stage.appendChild(body);canvas.appendChild(stage);const foot=document.createElement("div");foot.className="lesson-canvas-foot";foot.textContent="Satu konsep pada satu masa · Visual akan dibina bersama penerangan";canvas.appendChild(foot);}
function resetLearningCanvas(){lessonActive=false;lessonStep=0;lessonDone=false;lessonTitle="";updateLessonControls();const canvas=document.querySelector(".lesson-canvas");if(!canvas)return;canvas.classList.remove("has-lesson");canvas.innerHTML='<div class="canvas-welcome"><div class="canvas-emblem">✦</div><span class="eyebrow">YOUR IDEAS START HERE</span><h2>Apakah yang ingin<br>anda <span class="gradient-text">pelajari hari ini?</span></h2><p>Mulakan dengan bertanya kepada tutor. Penerangan dan bahan visual akan dipaparkan di ruang ini.</p><div class="canvas-chips"><span>✧ Penerangan visual</span><span>▱ Langkah demi langkah</span><span>⌁ Contoh interaktif</span></div></div><div class="canvas-corner">EDUBOARD AI · CANVAS</div>';}
function setChatBusy(busy){chatInput.disabled=busy;document.querySelector("#chatForm button[type='submit']").disabled=busy;document.querySelector("#chatForm button[type='submit']").textContent=busy?"…":"↑";}

let lessonActive=false,lessonStep=0,lessonBusy=false,lessonMode="topik",lessonDone=false,lessonTitle="";
function tutorInstruction(kind){
 const mode=lessonMode==="ujian"?"Beri fokus kepada konsep penting dan teknik menjawab peperiksaan.":lessonMode==="kerja"?"Gunakan kaedah bimbingan: beri petunjuk kecil dan jangan terus beri jawapan akhir.":"Ajar dengan bahasa yang mudah, mesra dan sesuai untuk pelajar.";
 const common="PENTING: Anda ialah tutor dalam Learning Studio, bukan chatbot jawapan segera. Sebelum menjawab, rancang secara dalaman urutan pengajaran untuk topik ini, tetapi JANGAN paparkan keseluruhan rancangan. Jawab HANYA SATU konsep kecil untuk giliran ini. Jangan senaraikan beberapa langkah yang belum diajar. Terangkan satu idea dengan bahasa sekolah yang mudah, sebab di sebalik idea itu, dan satu contoh ringkas jika sesuai. Akhiri dengan SATU soalan semakan kefahaman yang mudah. Berhenti selepas itu dan tunggu respons atau butang sambung. Jangan dedahkan konsep seterusnya. "+mode+" Papan putih ialah ruang utama pembelajaran: jika visual membantu, keluarkan satu arahan visual pada baris berasingan menggunakan format [[FORMULA: LaTeX]], [[GRAPH: y=2x+1]] atau [[DIAGRAM: A -> B -> C]]. Untuk graf, gunakan persamaan tepat yang berkaitan dengan penerangan. Sokong [[GRAPH: y=2x+1]] untuk graf linear dan [[GRAPH: y=x^2-4]] untuk graf kuadratik. Gunakan [[POINTS: (0,0); (1,2); (2,4)]] untuk titik koordinat jika sesuai. Gunakan [[DIAGRAM: A -> B -> C]] untuk rajah aliran. Untuk formula, gunakan notasi LaTeX yang sah. Keluarkan hanya visual yang membantu penerangan. Jika pelajaran benar-benar selesai, tulis [[DONE]] pada baris terakhir.";
 if(kind==="start")return common+" Ini ialah LANGKAH 1. Mulakan dengan idea atau konsep paling asas sahaja.";
 if(kind==="next")return common+" Sambung dengan SATU langkah seterusnya sahaja berdasarkan perbualan terdahulu. Jangan ulang semua langkah.";
 return "Pelajar sedang mengikuti pelajaran berperingkat. Jawab soalan susulan ini sahaja dengan ringkas dan jelas. Jangan lompat ke langkah seterusnya atau menamatkan pelajaran. Akhiri dengan bertanya sama ada pelajar mahu sambung.";
}
function makeGraph(expression){
 const source=expression.replace(/\s/g,"").toLowerCase();
 const quadratic=source.match(/^y=([+-]?(?:\d*\.?\d+)?)x\^2([+-]\d*\.?\d+)?$/);
 const linear=source.match(/^y=([+-]?(?:\d*\.?\d+)?)x([+-]\d*\.?\d+)?$/);
 if(!quadratic&&!linear)return null;
 const match=quadratic||linear,coefficient=match[1];
 const a=coefficient===""||coefficient==="+"?1:coefficient==="-"?-1:Number(coefficient);
 const b=Number(match[2]||0),evaluate=x=>quadratic?a*x*x+b:a*x+b;
 const w=560,h=330,pad=38,xMin=-5,xMax=5,yMin=-8,yMax=8;
 const X=x=>pad+(x-xMin)/(xMax-xMin)*(w-pad*2),Y=y=>h-pad-(y-yMin)/(yMax-yMin)*(h-pad*2);
 const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg");
 svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("role","img");svg.setAttribute("aria-label","Graf "+expression);
 const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));if(text!==undefined)el.textContent=text;svg.appendChild(el);return el;};
 for(let x=xMin;x<=xMax;x++){add("line",{x1:X(x),y1:Y(yMin),x2:X(x),y2:Y(yMax),stroke:"#263550","stroke-width":1});if(x!==0)add("text",{x:X(x),y:Y(0)+16,fill:"#8292b0","font-size":10,"text-anchor":"middle"},String(x));}
 for(let y=yMin;y<=yMax;y+=2){add("line",{x1:X(xMin),y1:Y(y),x2:X(xMax),y2:Y(y),stroke:"#263550","stroke-width":1});if(y!==0)add("text",{x:X(0)-9,y:Y(y)+3,fill:"#8292b0","font-size":10,"text-anchor":"end"},String(y));}
 add("line",{x1:X(0),y1:Y(yMin),x2:X(0),y2:Y(yMax),stroke:"#a9bad8","stroke-width":1.7});
 add("line",{x1:X(xMin),y1:Y(0),x2:X(xMax),y2:Y(0),stroke:"#a9bad8","stroke-width":1.7});
 add("text",{x:X(xMax)-4,y:Y(0)-9,fill:"#dce7fb","font-size":12,"text-anchor":"end"},"x");
 add("text",{x:X(0)+10,y:Y(yMax)+12,fill:"#dce7fb","font-size":12},"y");
 let d="";for(let i=0;i<=300;i++){const x=xMin+(xMax-xMin)*i/300,y=evaluate(x);d+=(i?"L":"M")+X(x).toFixed(2)+" "+Y(Math.max(yMin,Math.min(yMax,y))).toFixed(2)+" ";}
 add("path",{d,fill:"none",stroke:"#75dce8","stroke-width":3,"stroke-linecap":"round","stroke-linejoin":"round"});
 return svg;
}
function makePoints(source){
 const points=[...source.matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g)].map(m=>({x:Number(m[1]),y:Number(m[2])})).slice(0,12);
 if(!points.length)return null;
 const ns="http://www.w3.org/2000/svg",w=520,h=260,pad=38;
 const maxX=Math.max(4,...points.map(p=>Math.abs(p.x)+1)),maxY=Math.max(4,...points.map(p=>Math.abs(p.y)+1));
 const X=x=>pad+(x+maxX)/(2*maxX)*(w-pad*2),Y=y=>h-pad-(y+maxY)/(2*maxY)*(h-pad*2);
 const svg=document.createElementNS(ns,"svg");svg.setAttribute("viewBox","0 0 "+w+" "+h);svg.setAttribute("role","img");svg.setAttribute("aria-label","Plot titik koordinat");
 const add=(tag,attrs)=>{const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));svg.appendChild(el);return el;};
 for(let i=-Math.ceil(maxX);i<=Math.ceil(maxX);i++)add("line",{x1:X(i),y1:Y(-maxY),x2:X(i),y2:Y(maxY),stroke:"#263550","stroke-width":1});
 for(let i=-Math.ceil(maxY);i<=Math.ceil(maxY);i++)add("line",{x1:X(-maxX),y1:Y(i),x2:X(maxX),y2:Y(i),stroke:"#263550","stroke-width":1});
 add("line",{x1:X(0),y1:Y(-maxY),x2:X(0),y2:Y(maxY),stroke:"#a9bad8","stroke-width":1.6});
 add("line",{x1:X(-maxX),y1:Y(0),x2:X(maxX),y2:Y(0),stroke:"#a9bad8","stroke-width":1.6});
 points.forEach(p=>{add("circle",{cx:X(p.x),cy:Y(p.y),r:5,fill:"#75dce8",stroke:"#e7fbff","stroke-width":1.5});const label=document.createElementNS(ns,"text");label.setAttribute("x",X(p.x)+8);label.setAttribute("y",Y(p.y)-8);label.setAttribute("fill","#dce7fb");label.setAttribute("font-size","11");label.textContent="("+p.x+", "+p.y+")";svg.appendChild(label);});
 return svg;
}
function makeZoomableVisual(svg,captionText){
 const holder=document.createElement("div");holder.className="visual-graph visual-zoomable";
 const toolbar=document.createElement("div");toolbar.className="visual-zoom-controls";toolbar.setAttribute("role","group");toolbar.setAttribute("aria-label","Kawalan zum visual");
 const viewport=document.createElement("div");viewport.className="visual-viewport";viewport.appendChild(svg);
 let zoom=1;
 const applyZoom=()=>{svg.style.transform="scale("+zoom+")";svg.style.transformOrigin="center center";svg.style.transition="transform .2s ease";};
 const makeButton=(label,action,title)=>{const button=document.createElement("button");button.type="button";button.textContent=label;button.title=title;button.setAttribute("aria-label",title);button.addEventListener("click",action);toolbar.appendChild(button);return button;};
 makeButton("−",()=>{zoom=Math.max(.75,+(zoom-.15).toFixed(2));applyZoom();},"Zum keluar");
 const readout=document.createElement("span");readout.textContent="100%";toolbar.appendChild(readout);
 const updateReadout=()=>{readout.textContent=Math.round(zoom*100)+"%";};
 toolbar.querySelector("button").addEventListener("click",updateReadout);
 makeButton("+",()=>{zoom=Math.min(1.9,+(zoom+.15).toFixed(2));applyZoom();updateReadout();},"Zum masuk");
 makeButton("↺",()=>{zoom=1;applyZoom();updateReadout();},"Tetapkan semula zum");
 holder.append(toolbar,viewport);
 const caption=document.createElement("p");caption.textContent=captionText;holder.appendChild(caption);
 return holder;
}
function renderVisuals(answer){
 const canvas=document.querySelector(".lesson-canvas");if(!canvas)return;
 canvas.querySelectorAll(".lesson-visual").forEach(el=>el.remove());
 const formula=[...answer.matchAll(/\[\[FORMULA:\s*([\s\S]*?)\s*\]\]/g)].map(m=>m[1].trim());
 const graphs=[...answer.matchAll(/\[\[GRAPH:\s*([^\]]+)\]\]/g)].map(m=>m[1].trim());
 const diagrams=[...answer.matchAll(/\[\[DIAGRAM:\s*([^\]]+)\]\]/g)].map(m=>m[1].trim());
 const pointSets=[...answer.matchAll(/\[\[POINTS:\s*([\s\S]*?)\s*\]\]/g)].map(m=>m[1].trim());
 const addCard=(label,content)=>{const card=document.createElement("div");card.className="lesson-visual";const tag=document.createElement("span");tag.className="eyebrow";tag.textContent=label;card.appendChild(tag);if(typeof content==="string"){const body=document.createElement("div");body.className="visual-formula";body.textContent="\\("+content+"\\)";card.appendChild(body);}else card.appendChild(content);canvas.appendChild(card);};
 formula.forEach(x=>addCard("FORMULA UTAMA",x));
 graphs.forEach(x=>{const graph=makeGraph(x);if(graph){const holder=makeZoomableVisual(graph,"Graf bagi "+x);addCard("GRAF FUNGSI",holder);}else addCard("PERSAMAAN GRAF",x);});
 pointSets.forEach(x=>{const points=makePoints(x);if(points){const holder=makeZoomableVisual(points,"Titik pada satah koordinat");addCard("PLOT KOORDINAT",holder);}});
 diagrams.forEach(x=>{
  const holder=document.createElement("div");holder.className="visual-flow visual-flow-interactive";
  const parts=x.split(/\s*->\s*/).map(v=>v.trim()).filter(Boolean).slice(0,7);
  const detail=document.createElement("div");detail.className="visual-node-detail";detail.setAttribute("aria-live","polite");detail.textContent="Pilih mana-mana langkah untuk melihat penerangannya.";
  let dragged=null;
  const selectNode=(node,label)=>{holder.querySelectorAll(".visual-flow-node").forEach(n=>{n.classList.toggle("selected",n===node);n.setAttribute("aria-pressed",String(n===node));});detail.textContent="Langkah dipilih: "+label+". Bincangkan bahagian ini dengan tutor AI untuk penerangan lanjut.";};
  parts.forEach((label,i)=>{
   const node=document.createElement("button");node.type="button";node.className="visual-flow-node";node.textContent=label;node.draggable=true;node.setAttribute("aria-label","Pilih langkah "+(i+1)+": "+label);node.setAttribute("aria-pressed","false");
   node.addEventListener("click",()=>selectNode(node,label));
   node.addEventListener("dragstart",e=>{dragged=node;node.classList.add("dragging");e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",label);});
   node.addEventListener("dragend",()=>{node.classList.remove("dragging");dragged=null;});
   node.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";});
   node.addEventListener("drop",e=>{e.preventDefault();if(!dragged||dragged===node)return;const rect=node.getBoundingClientRect();const after=e.clientX>rect.left+rect.width/2;holder.insertBefore(dragged,after?node.nextSibling:node);const ordered=[...holder.querySelectorAll(".visual-flow-node")];holder.replaceChildren();ordered.forEach((item,index)=>{holder.appendChild(item);if(index<ordered.length-1){const arrow=document.createElement("b");arrow.className="visual-flow-arrow";arrow.textContent="→";holder.appendChild(arrow);}});});
   holder.appendChild(node);
   if(i<parts.length-1){const arrow=document.createElement("b");arrow.className="visual-flow-arrow";arrow.textContent="→";holder.appendChild(arrow);}
  });
  const hint=document.createElement("p");hint.className="visual-flow-hint";hint.textContent="Tekan untuk pilih · Seret untuk susun semula";
  const interactive=document.createElement("div");interactive.className="visual-flow-interaction";interactive.append(holder,detail,hint);
  addCard("RAJAH ALIRAN INTERAKTIF",interactive);
 });
 if(window.MathJax?.typesetPromise)window.MathJax.typesetPromise([canvas]).catch(()=>{});
}
function updateLessonControls(done=lessonDone){
 const controls=document.getElementById("lessonStepControls");if(!controls)return;controls.hidden=!lessonActive;
 const label=document.getElementById("lessonStepLabel");if(label)label.textContent=done?"Pelajaran selesai":"Langkah "+lessonStep+" · Belajar mengikut rentak anda";
 const next=document.getElementById("nextLessonStep");if(next){next.hidden=done;next.disabled=lessonBusy;next.textContent="Langkah seterusnya →";}
 const finish=document.getElementById("lessonDoneLabel");if(finish)finish.hidden=!done;
}
function cleanTutorAnswer(answer){return answer.replace(/\[\[(?:FORMULA|GRAPH|DIAGRAM|POINTS):[\s\S]*?\]\]/g,"").replace(/^\s*\[\[DONE\]\]\s*$/m,"").trim();}
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
const voiceButton=document.getElementById("voiceButton"),voiceInputButton=document.getElementById("voiceInputButton");
voiceButton.addEventListener("click",()=>{
 if(!("speechSynthesis" in window)){alert("Fungsi bacaan suara tidak disokong oleh pelayar ini.");return;}
 const last=chatMessages.querySelector(".assistant-message:last-child .message-bubble");if(!last)return;
 speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(last.textContent);
 utterance.lang=/[\\u0E00-\\u0E7F]/.test(last.textContent)?"th-TH":(document.getElementById("languageToggle").textContent.trim().startsWith("EN")?"en-US":"ms-MY");
 const voices=speechSynthesis.getVoices();const preferred=voices.find(v=>v.lang.toLowerCase().startsWith(utterance.lang.slice(0,2)));
 if(preferred)utterance.voice=preferred;
 voiceButton.classList.add("speaking");utterance.onend=utterance.onerror=()=>voiceButton.classList.remove("speaking");speechSynthesis.speak(utterance);
});
let speechRecognition=null,isListening=false;
const SpeechRecognitionAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
function setListening(active,message){
 isListening=active;voiceInputButton.classList.toggle("listening",active);
 voiceInputButton.setAttribute("aria-pressed",String(active));
 voiceInputButton.title=active?"Hentikan rakaman suara":"Cakap untuk menaip soalan";
 const hint=document.getElementById("voiceStatus");if(hint)hint.textContent=message|| (active?"Sedang mendengar…":"MS / EN · Cloud AI");
}
if(SpeechRecognitionAPI){
 speechRecognition=new SpeechRecognitionAPI();speechRecognition.continuous=false;speechRecognition.interimResults=true;
 speechRecognition.lang="ms-MY";
 let finalTranscript="";
 speechRecognition.onstart=()=>{finalTranscript="";setListening(true,"Sedang mendengar…");};
 speechRecognition.onresult=event=>{
  let interim="";
  for(let i=event.resultIndex;i<event.results.length;i++){const transcript=event.results[i][0].transcript;if(event.results[i].isFinal)finalTranscript+=transcript;else interim+=transcript;}
  chatInput.value=[chatInput.value.trim(),finalTranscript,interim].filter(Boolean).join(" ").trim();
 };
 speechRecognition.onerror=event=>{setListening(false,event.error==="not-allowed"?"Akses mikrofon ditolak. Benarkan mikrofon dalam tetapan pelayar.":"Suara tidak dapat dikenal pasti. Cuba sekali lagi.");};
 speechRecognition.onend=()=>setListening(false,chatInput.value.trim()?"Suara berjaya ditukar kepada teks.":"MS / EN · Cloud AI");
 voiceInputButton.addEventListener("click",()=>{
  if(isListening){speechRecognition.stop();return;}
  try{speechRecognition.lang=document.getElementById("languageToggle").textContent.trim().startsWith("EN")?"en-US":"ms-MY";speechRecognition.start();}
  catch(error){setListening(false,"Mikrofon sedang digunakan. Cuba sebentar lagi.");}
 });
}else{
 voiceInputButton.disabled=true;voiceInputButton.title="Pengecaman suara tidak disokong dalam pelayar ini";
 voiceInputButton.addEventListener("click",()=>alert("Pelayar ini tidak menyokong input suara. Cuba Chrome atau pelayar yang menyokong Speech Recognition."));
}
const canvas=document.getElementById("whiteboard"),ctx=canvas.getContext("2d");let drawing=false,tool="pen",lastPoint=null;
let boardHistory=[],boardFuture=[];
function rememberBoard(){try{boardHistory.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(boardHistory.length>35)boardHistory.shift();boardFuture=[];updateBoardHistoryButtons();}catch(error){}}
function updateBoardHistoryButtons(){const undo=document.getElementById("undoBoard"),redo=document.getElementById("redoBoard");if(undo)undo.disabled=boardHistory.length<2;if(redo)redo.disabled=boardFuture.length===0;}
function restoreBoard(imageData){ctx.clearRect(0,0,canvas.width,canvas.height);if(imageData)ctx.putImageData(imageData,0,0);updateBoardHistoryButtons();}
function resizeCanvas(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const old=document.createElement("canvas");old.width=canvas.width;old.height=canvas.height;old.getContext("2d").drawImage(canvas,0,0);const dpr=window.devicePixelRatio||1;canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(old.width&&old.height)ctx.drawImage(old,0,0,old.width,old.height,0,0,rect.width,rect.height);ctx.lineCap="round";ctx.lineJoin="round";boardHistory=[];boardFuture=[];rememberBoard();}
window.addEventListener("resize",()=>{if(document.getElementById("boardView").classList.contains("active"))resizeCanvas();});
document.querySelectorAll(".tool").forEach(b=>b.addEventListener("click",()=>{tool=b.dataset.tool;document.querySelectorAll(".tool").forEach(x=>x.classList.toggle("active",x===b));}));
function point(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
canvas.addEventListener("pointerdown",e=>{drawing=true;lastPoint=point(e);canvas.setPointerCapture(e.pointerId);ctx.beginPath();ctx.arc(lastPoint.x,lastPoint.y,(tool==="eraser"?24:Number(document.getElementById("penSize").value))/2,0,Math.PI*2);ctx.fillStyle=tool==="eraser"?"#101a2e":document.getElementById("penColor").value;ctx.fill();});
canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=point(e),mid={x:(lastPoint.x+p.x)/2,y:(lastPoint.y+p.y)/2};ctx.beginPath();ctx.moveTo(lastPoint.x,lastPoint.y);ctx.quadraticCurveTo(lastPoint.x,lastPoint.y,mid.x,mid.y);ctx.strokeStyle=tool==="eraser"?"#101a2e":document.getElementById("penColor").value;ctx.lineWidth=tool==="eraser"?24:Number(document.getElementById("penSize").value);ctx.stroke();lastPoint=p;});
function stopDraw(){if(!drawing)return;drawing=false;lastPoint=null;rememberBoard();}
canvas.addEventListener("pointerup",stopDraw);canvas.addEventListener("pointercancel",stopDraw);
document.getElementById("clearBoard").addEventListener("click",()=>{rememberBoard();ctx.clearRect(0,0,canvas.width,canvas.height);rememberBoard();});
document.getElementById("undoBoard").addEventListener("click",()=>{if(boardHistory.length<2)return;boardFuture.push(boardHistory.pop());restoreBoard(boardHistory[boardHistory.length-1]);});
document.getElementById("redoBoard").addEventListener("click",()=>{if(!boardFuture.length)return;const next=boardFuture.pop();boardHistory.push(next);restoreBoard(next);});
document.getElementById("exportBoard").addEventListener("click",()=>{const link=document.createElement("a");link.download="eduboard-whiteboard.png";link.href=canvas.toDataURL("image/png");link.click();});
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
