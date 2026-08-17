(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* reveal on scroll */
  var els=document.querySelectorAll('.rv');
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} });
    },{threshold:0.15});
    els.forEach(function(el){ io.observe(el); });
  }else{
    els.forEach(function(el){ el.classList.add('in'); });
  }

  /* canvas aperture — animated signal pulse */
  var cv=document.getElementById('aperture');
  if(!cv)return;
  var ctx=cv.getContext('2d');
  var dpr=Math.min(window.devicePixelRatio||1,2);
  function size(){
    var r=cv.getBoundingClientRect();
    cv.width=r.width*dpr;cv.height=r.height*dpr;
  }
  size();window.addEventListener('resize',size);
  var t=0, scrollV=0;
  window.addEventListener('scroll',function(){scrollV=window.scrollY;},{passive:true});
  function arcSet(cx,cy,r,segs,gap,rot,w,color,alpha){
    ctx.lineWidth=w;ctx.strokeStyle=color;ctx.globalAlpha=alpha;
    var span=(Math.PI*2)/segs;
    for(var i=0;i<segs;i++){
      ctx.beginPath();
      ctx.arc(cx,cy,r,rot+i*span+gap/2,rot+(i+1)*span-gap/2);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function ticks(cx,cy,r1,r2,n,rot,color,alpha,w){
    ctx.lineWidth=w;ctx.strokeStyle=color;ctx.globalAlpha=alpha;
    for(var i=0;i<n;i++){
      var a=rot+(Math.PI*2/n)*i;
      ctx.beginPath();
      ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
      ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
  }
  function frame(){
    var w=cv.width,h=cv.height,cx=w/2,cy=h/2,R=Math.min(w,h)/2;
    ctx.clearRect(0,0,w,h);
    var rot=t*0.0016 + scrollV*0.0012;
    /* outer segmented ring */
    arcSet(cx,cy,R*0.92,8,0.22,rot,2*dpr,'#565C78',0.7);
    /* tick ring */
    ticks(cx,cy,R*0.80,R*0.85,72,-rot*0.6,'#565C78',0.45,1*dpr);
    /* cyan live arc */
    arcSet(cx,cy,R*0.70,3,1.5,rot*1.6,2.5*dpr,'#00CED1',0.85);
    /* mid segmented */
    arcSet(cx,cy,R*0.58,12,0.16,-rot*0.9,1.5*dpr,'#565C78',0.5);
    /* inner ticks */
    ticks(cx,cy,R*0.44,R*0.48,36,rot*1.2,'#00CED1',0.35,1*dpr);
    /* violet signal arc */
    arcSet(cx,cy,R*0.50,2,2.2,-rot*1.4,2*dpr,'#9D5CFF',0.65);
    /* lime pin arc */
    arcSet(cx,cy,R*0.36,1,5.6,rot*2.2,2.5*dpr,'#ADFF2F',0.9);
    /* hub */
    ctx.beginPath();ctx.arc(cx,cy,R*0.06,0,Math.PI*2);
    ctx.strokeStyle='#9AA0B8';ctx.lineWidth=1.5*dpr;ctx.globalAlpha=0.8;ctx.stroke();ctx.globalAlpha=1;
    t++;
    if(!reduce)requestAnimationFrame(frame);
  }
  frame();
})();
