(function(){
  const STORE_RECORDS="jalrakshak_records_v1", STORE_ISSUES="jalrakshak_issues_v1";
  const read=(k)=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch(_){return []}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const today=()=>new Date().toISOString().slice(0,10);
  const sources=[
    {name:"India-WRIS",url:"https://indiawris.gov.in/",status:"Official portal link; requires internet; not live-connected"},
    {name:"National Water Data Portal",url:"https://nwdp.nwic.gov.in/",status:"Official portal link; manual verified dataset import required"},
    {name:"CGWB",url:"https://cgwb.gov.in/",status:"Official portal link; not live-connected"},
    {name:"IMD API docs",url:"https://api.imd.gov.in/public/api_reference.html",status:"API access may require authorization"},
    {name:"Jal Jeevan Mission",url:"https://jaljeevanmission.gov.in/",status:"Official portal link; not live-connected"}
  ];
  const response=(payload,status=200)=>({ok:status>=200&&status<300,status,json:async()=>payload});
  const num=(v)=>Number(v);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const id=()=> "JR-"+Math.random().toString(36).slice(2,10).toUpperCase();
  function addRecord(d,type="USER_REPORTED"){
    const r={id:id(),entity:String(d.entity||"").slice(0,100),entity_type:String(d.entity_type||"Household"),litres:num(d.litres),category:String(d.category||"domestic"),record_type:type,record_date:String(d.record_date||today()),created_at:new Date().toISOString()};
    const rows=read(STORE_RECORDS);rows.unshift(r);write(STORE_RECORDS,rows.slice(0,5000));return r;
  }
  function addIssue(d){
    const r={id:id(),category:String(d.category||"").slice(0,60),description:String(d.description||"").slice(0,1000),locality:String(d.locality||"").slice(0,120),status:"Saved on this device",created_at:new Date().toISOString()};
    const rows=read(STORE_ISSUES);rows.unshift(r);write(STORE_ISSUES,rows);return r;
  }
  function rain(d){
    const a=num(d.area_m2),p=num(d.rainfall_mm),r=num(d.runoff??.8),e=num(d.efficiency??.85);
    if(a<0||p<0||r<0||r>1||e<0||e>1)throw Error("Enter valid area, rainfall and coefficients from 0 to 1.");
    const v=p*a*r*e, out={harvestable_litres:Math.round(v*100)/100};
    if(d.tank_litres!==undefined&&d.tank_litres!==""){const t=num(d.tank_litres);if(t<0)throw Error("Tank capacity must be non-negative.");out.single_tank_storage_litres=Math.round(Math.min(v,t)*100)/100;}
    return out;
  }
  function forecast(d){
    const pop=num(d.population),l=num(d.litres_per_person),g=num(d.growth_percent||0),days=num(d.days||30);
    if(pop<0||l<0||g< -100||days<1)throw Error("Enter valid forecast inputs.");
    const daily=pop*l;return {daily_demand_litres:Math.round(daily*100)/100,period_demand_litres:Math.round(daily*Math.pow(1+g/100,days/365)*days*100)/100,period_days:days};
  }
  function anomaly(d){
    const b=num(d.baseline),c=num(d.current),t=num(d.threshold_percent||25);
    if(b<0||c<0||t<0)throw Error("Inputs must be non-negative.");
    const change=b?(c-b)/b*100:null;return {change_percent:change===null?null:Math.round(change*100)/100,flag_for_inspection:b===0?c>0:change>=t};
  }
  function irrigation(d){
    const a=num(d.area_hectares),m=num(d.mm_per_day),days=num(d.days||1);
    if(a<0||m<0||days<1)throw Error("Enter valid irrigation inputs.");
    return {estimated_gross_litres:Math.round(a*m*10000*days*100)/100};
  }
  window.fetch=async function(input,options={}){
    const url=typeof input==="string"?input:input.url;
    if(!url.startsWith("/api/")) return Promise.reject(new Error("This app runs offline. Official links need internet."));
    const method=(options.method||"GET").toUpperCase(), d=options.body?JSON.parse(options.body):{};
    let records=read(STORE_RECORDS),issues=read(STORE_ISSUES);
    try{
      switch(url.split("?")[0]){
        case "/api/summary": return response({records:records.length,total_litres:records.reduce((s,r)=>s+num(r.litres),0),reuse_litres:records.filter(r=>r.category==="reuse").reduce((s,r)=>s+num(r.litres),0),synthetic_records:records.filter(r=>r.record_type==="SYNTHETIC").length});
        case "/api/records": if(method==="GET")return response(records); if(!d.entity||d.litres===undefined||num(d.litres)<0)return response({error:"Provide entity, entity type, non-negative litres and category."},400); return response(addRecord(d),201);
        case "/api/generate-demo": {
          const n=clamp(parseInt(d.count||120,10)||120,1,1000), rng=()=>{let x=Math.sin((records.length+1)*999+Math.random())*10000;return x-Math.floor(x)};
          const types=[["Household","Household"],["Apartment Society","Society"],["Farm","Farmer"]];
          for(let i=0;i<n;i++){const [typ,prefix]=types[i%3];const litres=+(typ==="Household"?80+rng()*870:typ==="Apartment Society"?1200+rng()*16800:800+rng()*11200).toFixed(1);addRecord({entity:"Sample "+prefix+" "+(records.length+i+1),entity_type:typ,litres,category:["domestic","irrigation","reuse","cleaning"][i%4],record_date:`2026-${String(i%9+1).padStart(2,"0")}-${String(i%27+1).padStart(2,"0")}`},"SYNTHETIC");}
          return response({created:n});
        }
        case "/api/rainwater": return response(rain(d));
        case "/api/forecast": return response(forecast(d));
        case "/api/anomaly": return response(anomaly(d));
        case "/api/irrigation": return response(irrigation(d));
        case "/api/issues": if(method==="GET")return response(issues);if(!d.category||!d.description)return response({error:"Category and description are required."},400);return response(addIssue(d),201);
        case "/api/sources": return response(sources);
        default:return response({error:"Offline feature not found."},404);
      }
    }catch(e){return response({error:e.message||"Invalid input."},400)}
  };
  // Export the device's locally stored records as CSV.
  document.addEventListener("click",function(e){
    const a=e.target.closest('a[href="/api/export.csv"]');if(!a)return;e.preventDefault();
    const rows=read(STORE_RECORDS),fields=["id","entity","entity_type","litres","category","record_type","record_date","created_at"];
    const csv=[fields.join(","),...rows.map(r=>fields.map(k=>'"'+String(r[k]??"").replace(/"/g,'""')+'"').join(","))].join("\r\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),u=URL.createObjectURL(blob),link=document.createElement("a");link.href=u;link.download="jalrakshak_records.csv";link.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
  });
  // Replace remote chart library with a lightweight offline bar chart.
  window.Chart=function(canvas,config){
    this.destroy=function(){};
    const cats=config.data.labels,vals=config.data.datasets[0].data;
    const parent=canvas.parentElement;
    let old=parent.querySelector(".offline-chart");if(old)old.remove();
    const box=document.createElement("div");box.className="offline-chart";
    const max=Math.max(1,...vals);
    cats.forEach((cat,i)=>{const row=document.createElement("div");row.className="offline-chart-row";row.innerHTML='<span></span><div class="offline-chart-track"><i></i></div><b></b>';row.children[0].textContent=cat;row.children[1].firstElementChild.style.width=(vals[i]/max*100)+"%";row.children[2].textContent=vals[i];box.appendChild(row)});
    canvas.hidden=true;parent.appendChild(box);
  };
})();
