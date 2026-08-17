(function(){
  var ticket=document.getElementById('calcTicket'), missed=document.getElementById('calcMissed'),
      ticketVal=document.getElementById('calcTicketVal'), missedVal=document.getElementById('calcMissedVal'),
      weeklyOut=document.getElementById('calcWeekly'), annualOut=document.getElementById('calcAnnual');
  if(!ticket) return; // guard: only run on pages that have the calculator
  function fmt(n){ return '$'+Math.round(n).toLocaleString('en-US'); }
  function update(){
    var t=parseFloat(ticket.value), m=parseFloat(missed.value);
    ticketVal.textContent=fmt(t); missedVal.textContent=m;
    var weeklyMissed=t*m, recoverableAnnual=weeklyMissed*0.30*52;
    weeklyOut.textContent=fmt(weeklyMissed); annualOut.textContent=fmt(recoverableAnnual);
  }
  ticket.addEventListener('input',update); missed.addEventListener('input',update); update();
})();
