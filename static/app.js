const $=s=>document.querySelector(s), fmt=n=>Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:1});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(url,data,method="POST"){let r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:data?JSON.stringify(data):undefined}),j=await r.json();if(!r.ok)throw Error(j.error||"Request failed");return j}
function values(f){let o=Object.fromEntries(new FormData(f));for(let k in o)if(o[k]!==""&&Number.isFinite(Number(o[k])))o[k]=Number(o[k]);return o}
async function refresh(){let s=await api("/api/summary",null,"GET");$("#count").textContent=fmt(s.records);$("#litres").textContent=fmt(s.total_litres)+" L";$("#reuse").textContent=fmt(s.reuse_litres)+" L";let rs=await api("/api/records",null,"GET");$("#rows").innerHTML=rs.slice(0,100).map(r=>`<tr><td>${esc(r.record_date)}</td><td>${esc(r.entity)}</td><td>${esc(r.entity_type)}</td><td>${fmt(r.litres)}</td><td>${esc(r.category)}</td></tr>`).join("")||'<tr><td colspan="5">No records yet. Add a water-use record or load example records.</td></tr>';let cats={};rs.forEach(r=>cats[r.category]=(cats[r.category]||0)+1);if(window.cc)cc.destroy();window.cc=new Chart($("#chart"),{type:"bar",data:{labels:Object.keys(cats),datasets:[{label:"Records",data:Object.values(cats),backgroundColor:"#078f95",borderRadius:5}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});let is=await api("/api/issues",null,"GET");$("#issueList").innerHTML=is.map(i=>`<div class="source"><b>${esc(i.id)} · ${esc(i.category)}</b><p>${esc(i.description)}</p><small>${esc(i.locality||"Locality not provided")} · ${esc(i.status)}</small></div>`).join("")||'<p class="muted">No reports submitted.</p>'}
$("#generate").onclick=async()=>{try{let r=await api("/api/generate-demo",{count:120});alert("Loaded "+r.created+" example records for chart preview.");refresh()}catch(e){alert(e.message)}};
$("#recordForm").onsubmit=async e=>{e.preventDefault();try{await api("/api/records",values(e.target));$("#recordMsg").textContent="Record saved successfully.";e.target.reset();refresh()}catch(x){$("#recordMsg").textContent=x.message}};
async function calculator(form,endpoint,target,render){$(form).onsubmit=async e=>{e.preventDefault();try{let r=await api(endpoint,values(e.target));target.innerHTML=render(r)}catch(x){target.textContent=x.message}}}
calculator("#rain","/api/rainwater",$("#rainResult"),r=>`<b>${fmt(r.harvestable_litres)} L</b> estimated harvest potential. <small>Calculated estimate; actual capture varies.</small>${r.single_tank_storage_litres!==undefined?`<br>Single tank storage: ${fmt(r.single_tank_storage_litres)} L`:""}`);
calculator("#forecast","/api/forecast",$("#forecastResult"),r=>`<b>${fmt(r.daily_demand_litres)} L/day</b><br>${fmt(r.period_demand_litres)} L for ${r.period_days} days.<br><small>MODELLED ESTIMATE, not official demographic data.</small>`);
calculator("#anomaly","/api/anomaly",$("#anomalyResult"),r=>`<b>${r.flag_for_inspection?"Inspection suggested":"No threshold alert"}</b><br>Change: ${r.change_percent===null?"Baseline is zero":fmt(r.change_percent)+"%"}<br><small>Not proof of leakage.</small>`);
calculator("#irrigation","/api/irrigation",$("#irrigationResult"),r=>`<b>${fmt(r.estimated_gross_litres)} L</b> estimated gross requirement.<br><small>Planning estimate, not crop-specific advice.</small>`);
$("#issueForm").onsubmit=async e=>{e.preventDefault();try{let r=await api("/api/issues",values(e.target));alert("Report saved in this browser. Reference: "+r.id);e.target.reset();refresh()}catch(x){alert(x.message)}};
(async()=>{let src=await api("/api/sources",null,"GET");$("#sourceList").innerHTML=src.map(s=>`<div class="source"><b>${esc(s.name)}</b><p><a target="_blank" rel="noopener" href="${esc(s.url)}">Open official portal ↗</a></p><small>${esc(s.status)}</small></div>`).join("");refresh()})().catch(console.error);

// Competition features: transparent rules and calculations, not a trained AI model.
function readNums(form){const o=Object.fromEntries(new FormData(form));for(const k in o)o[k]=Number(o[k]);return o}
function riskAssessment(d){if(d.stock<0||d.daily_demand<=0||d.rainfall<0||d.baseline_demand<=0)throw Error('Enter non-negative water/rainfall and positive daily demand values.');const days=d.stock/d.daily_demand;const demandChange=(d.daily_demand-d.baseline_demand)/d.baseline_demand*100;let score=0,reasons=[];if(days<=3){score+=45;reasons.push('Stored water covers 3 days or less.')}else if(days<=7){score+=25;reasons.push('Stored water covers 7 days or less.')}if(d.rainfall<10){score+=25;reasons.push('Expected rainfall is low (under 10 mm).')}else if(d.rainfall<25){score+=12;reasons.push('Expected rainfall is limited (under 25 mm).')}if(demandChange>=20){score+=20;reasons.push('Daily demand is at least 20% above the usual level.')}score=Math.min(100,score);const level=score>=60?'HIGH':score>=30?'MEDIUM':'LOW';if(!reasons.length)reasons.push('Entered stock, rainfall and demand do not trigger the prototype warning rules.');let actions=[];if(days<=7)actions.push('Prioritise essential use and check the next supply/refill date.');if(d.rainfall<25)actions.push('Review rainwater capture and backup supply options.');if(demandChange>=20)actions.push('Check for overflow, running taps or a change in use.');if(level==='LOW')actions.push('Keep tracking daily stock and consumption.');return {days,score,level,reasons,actions,demandChange}}
$('#riskForm').addEventListener('submit',e=>{e.preventDefault();const out=$('#riskResult');try{const r=riskAssessment(readNums(e.target));out.innerHTML=`<div class="risk-score">${r.level} RISK · ${r.score}/100</div><b>Estimated water cover:</b> ${fmt(r.days)} days<br><b>Why:</b><ul>${r.reasons.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><b>Suggested next actions:</b><ul>${r.actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><small>Rule-based screening score, not a probability or official drought alert. Actual supply depends on replenishment, losses and local conditions.</small>`}catch(x){out.textContent=x.message}});
$('#simForm').addEventListener('submit',e=>{e.preventDefault();const out=$('#simResult');try{const d=readNums(e.target);if(Object.values(d).some(v=>v<0)||d.reduction>90)throw Error('Values must be non-negative; reduction must be 0–90%.');const saved=d.use*d.reduction/100,after=d.use-saved,harvest=d.roof*d.rain*.8,stored=Math.min(harvest,d.tank),reuse=Math.min(d.reuse,after),net=after-reuse;out.innerHTML=`<b>Daily use after reduction:</b> ${fmt(after)} L/day<br><b>Estimated daily reduction:</b> ${fmt(saved)} L/day (${fmt(saved*7)} L/week)<br><b>Potential rain captured:</b> ${fmt(harvest)} L; with this tank, up to ${fmt(stored)} L can be stored per event<br><b>Reuse offset (entered estimate):</b> ${fmt(reuse)} L/day<br><b>Illustrative net demand after reduction and reuse:</b> ${fmt(Math.max(0,net))} L/day<br><small>Scenario estimates. Reuse water must be suitable for its intended use; rain capture depends on roof, rainfall, first-flush and losses.</small>`}catch(x){out.textContent=x.message}});
const areas=[{area:'Demo Ward A',stock:18000,demand:3000},{area:'Demo Ward B',stock:4000,demand:2000}];function drawAreas(){const body=$('#areaRows');body.innerHTML=areas.map(a=>{const days=a.stock/a.demand,level=days<=3?'High':days<=7?'Medium':'Low';return `<tr><td>${esc(a.area)}</td><td>${fmt(a.stock)} L</td><td>${fmt(a.demand)} L</td><td>${fmt(days)} days</td><td><span class="stress-${level.toLowerCase()}">${level}</span></td></tr>`}).join('')}
$('#areaForm').addEventListener('submit',e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.stock=Number(d.stock);d.demand=Number(d.demand);if(!d.area.trim()||d.stock<0||d.demand<=0){alert('Enter an area name, non-negative stock and positive demand.');return}areas.unshift(d);if(areas.length>20)areas.pop();drawAreas();e.target.reset()});drawAreas();


// WSRIP Research Lab: transparent water-cover calculations and provenance-labelled records.
const JR_RESEARCH_KEY="jalrakshak_wsrip_observations_v1";
function jrReadResearch(){try{return JSON.parse(localStorage.getItem(JR_RESEARCH_KEY)||"[]")}catch(_){return []}}
function jrWriteResearch(rows){localStorage.setItem(JR_RESEARCH_KEY,JSON.stringify(rows.slice(0,5000)))}
function jrRisk(available,demand,rain,cut,grey){
  const vals=[available,demand,rain,cut,grey];
  if(vals.some(v=>!Number.isFinite(v)||v<0)||demand<=0||cut>90)throw Error("Use non-negative values, demand above zero, and demand reduction between 0 and 90%.");
  const net=Math.max(1,demand*(1-cut/100)-grey),usable=available+rain,days=usable/net;
  const band=days<3?"HIGH":days<7?"MEDIUM":"LOW";
  const reasons=[];
  if(days<7)reasons.push("Estimated water cover is below seven days.");
  if(rain===0)reasons.push("No additional rainwater capture is included.");
  if(cut>0)reasons.push(`Demand reduction assumption: ${cut}%.`);
  if(grey>0)reasons.push("Greywater offsets freshwater demand only for suitable non-potable uses.");
  if(!reasons.length)reasons.push("Estimated water cover is at least seven days under the entered assumptions.");
  return {net,usable,days,band,reasons};
}
function jrRiskFormValues(){const d=Object.fromEntries(new FormData($("#researchRiskForm")));return ["available","demand","rainwater","reduction","greywater"].map(k=>Number(d[k]))}
function jrShowRisk(){
  const out=$("#researchRiskResult");
  try{const [a,d,r,c,g]=jrRiskFormValues(),x=jrRisk(a,d,r,c,g);
    out.innerHTML=`<div class="risk-score">${x.band} RISK · ${fmt(x.days)} days</div><b>Usable water:</b> ${fmt(x.usable)} L<br><b>Net freshwater demand:</b> ${fmt(x.net)} L/day<br><b>Why this result?</b><ul>${x.reasons.map(t=>`<li>${esc(t)}</li>`).join("")}</ul><small>Assumptions: constant demand; rainwater is treated as a one-time usable addition; tank overflow and rainfall timing are simplified. This is not an official drought warning.</small>`;
  }catch(e){out.textContent=e.message}
}
$("#researchRiskForm").addEventListener("submit",e=>{e.preventDefault();jrShowRisk()});
$("#researchCompare").addEventListener("click",()=>{
  try{
    const [a,d,r,c,g]=jrRiskFormValues();
    const scenarios=[["Current baseline",0,0,0],["Consumption reduction",0,c,0],["Rainwater harvesting",r,0,0],["Greywater reuse",0,0,g],["Combined strategy",r,c,g]];
    $("#researchScenarioRows").innerHTML=scenarios.map(([name,rain,cut,grey])=>{
      const x=jrRisk(a,d,rain,cut,grey);
      const css=x.band==="HIGH"?"stress-high":x.band==="MEDIUM"?"stress-medium":"stress-low";
      return `<tr><td>${name}</td><td>${fmt(x.net)}</td><td>${fmt(x.days)}</td><td><span class="${css}">${x.band}</span></td></tr>`;
    }).join("");
  }catch(e){alert(e.message)}
});
function jrRenderResearchRecords(){
  const rows=jrReadResearch();
  $("#researchRecordRows").innerHTML=rows.length?rows.slice(0,100).map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.state)} / ${esc(r.area)}</td><td>${fmt(r.available)}</td><td>${fmt(r.demand)}</td><td>${fmt(r.rainfall)}</td><td>${esc(r.source)}</td></tr>`).join(""):'<tr><td colspan="6">No research observations saved yet.</td></tr>';
}
$("#researchRecordForm").addEventListener("submit",e=>{
  e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  d.available=Number(d.available);d.demand=Number(d.demand);d.rainfall=Number(d.rainfall);
  if(!d.state.trim()||!d.area.trim()||!d.date||d.available<0||d.demand<=0||d.rainfall<0){$("#researchRecordMsg").textContent="Please check the required fields and numeric values.";return}
  const rows=jrReadResearch();rows.unshift({...d,id:"JR-WR-"+Date.now(),created_at:new Date().toISOString()});jrWriteResearch(rows);
  $("#researchRecordMsg").textContent="Observation saved in this browser with its source label. Verify source metadata before using it in research.";
  e.target.reset();jrRenderResearchRecords();
});
$("#exportResearchCSV").addEventListener("click",()=>{
  const rows=jrReadResearch(),fields=["id","state","area","date","available","demand","rainfall","source","notes","created_at"];
  const csv=[fields.join(","),...rows.map(r=>fields.map(k=>'"'+String(r[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="jalrakshak_wsrip_observations.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
jrRenderResearchRecords();
jrShowRisk();
