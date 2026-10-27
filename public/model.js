(function (root) {
  'use strict';
  const metrics = {
    garage: {label:'Garage consumption',unit:'W',color:'#8aaeb0'},
  };
  function validate(input) {
    if(!input || input.schemaVersion!==1 || !Array.isArray(input.samples) || !input.samples.length || input.samples.length>5000) throw Error('Use schemaVersion 1 with 1–5,000 samples.');
    const samples=input.samples.map((s,index)=>{
      if(!s || typeof s.at!=='string' || !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(s.at) || !Number.isFinite(Date.parse(s.at)) || Date.parse(s.at)>Date.now()+300000) throw Error('Sample '+(index+1)+': use a valid ISO timestamp, not a future time.');
      if(!s.values || typeof s.values!=='object' || Array.isArray(s.values) || !Object.keys(s.values).length) throw Error('Sample '+(index+1)+': values must contain at least one supported measurement.');
      const calendar=new Date(s.at.slice(0,10)+'T00:00:00Z');
      if(!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0,10)!==s.at.slice(0,10)) throw Error('Invalid calendar date.');
      const values={};
      for(const [key,value] of Object.entries(s.values)) {
        if(!Object.hasOwn(metrics,key)) throw Error('Unknown measurement: '+key);
        if(value!==null && (typeof value!=='number' || !Number.isFinite(value) || Math.abs(value)>1e9)) throw Error(key+': use a finite number or null.');
        if(value!==null && value<0) throw Error(key+': value outside the supported range.');
        values[key]=value;
      }
      return {at:new Date(s.at).toISOString(),values};
    }).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    for(let i=1;i<samples.length;i++) if(samples[i].at===samples[i-1].at) throw Error('Duplicate sample timestamps.');
    const source=typeof input.source==='string'?input.source.trim().slice(0,100):'Imported readings';
    return {schemaVersion:1,source:source||'Imported readings',samples};
  }
  function demo(now=Date.now()) {
    const end=Math.floor(now/300000)*300000,samples=[];
    for(let i=0;i<=288;i++) {
      const at=end-(288-i)*300000,garage=Math.round(260+Math.max(0,Math.sin(i/13))*650);
      const missing=i>172&&i<177;
      samples.push({at:new Date(at).toISOString(),values:{garage:missing?null:garage}});
    }
    return {schemaVersion:1,source:'Synthetic demo · not a real garage',samples};
  }
  function latest(data){return data.samples.at(-1);}
  function age(data,now=Date.now()){return Math.max(0,now-Date.parse(latest(data).at));}
  function pathSegments(samples,key,width=800,height=200) {
    const start=Date.parse(samples[0].at),end=Date.parse(samples.at(-1).at),finite=samples.map(s=>s.values[key]).filter(Number.isFinite);
    if(!finite.length)return [];
    let min=Math.min(...finite),max=Math.max(...finite);if(min===max){min-=1;max+=1;}const padding=(max-min)*.12;min-=padding;max+=padding;
    const segments=[];let current=[],prev=null;
    for(const s of samples){const value=s.values[key],time=Date.parse(s.at);if(!Number.isFinite(value)){if(current.length)segments.push(current);current=[];prev=null;continue;}if(prev!==null&&time-prev>600000){if(current.length)segments.push(current);current=[];}current.push([20+(time-start)/Math.max(1,end-start)*(width-40),15+(max-value)/(max-min)*(height-30),s]);prev=time;}
    if(current.length)segments.push(current);return segments;
  }
  root.ObservatoryModel={metrics,validate,demo,latest,age,pathSegments};
})(globalThis);
