(function(){
  "use strict";
  var Q = window.QUIZ.questions, L = ["A","B","C","D"], N = Q.length;
  var answers, hints, idx;
  var $ = function(id){ return document.getElementById(id); };
  var el = function(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };

  function reset(){ answers = new Array(N).fill(null); hints = new Array(N).fill(false); idx = 0; }
  function score(){ return answers.reduce(function(s,a,i){ return s + (a===Q[i].a ? 1 : 0); },0); }
  function show(id){ ["start","quiz","results"].forEach(function(s){ $(s).hidden = (s!==id); }); }

  function render(){
    var item = Q[idx], picked = answers[idx], locked = picked !== null;
    $("progressLabel").textContent = "Question " + (idx+1) + " of " + N;
    $("scoreLabel").textContent = "Score: " + score() + " / " + answers.filter(function(a){return a!==null;}).length;
    $("progressFill").style.width = ((idx+1)/N*100) + "%";
    $("progressBar").setAttribute("aria-valuenow", idx+1);
    $("progressBar").setAttribute("aria-valuetext", "Question " + (idx+1) + " of " + N);
    $("qText").textContent = (idx+1) + ". " + item.q;

    var box = $("options"); box.innerHTML = "";
    item.o.forEach(function(opt, i){
      var b = el("button","option"); b.type="button";
      b.appendChild(el("span","letter",L[i]));
      b.appendChild(el("span","otext",opt));
      if(locked){
        b.disabled = true;
        if(i===item.a){ b.classList.add("correct"); b.appendChild(el("span","mark","✓ Correct answer")); }
        else if(i===picked){ b.classList.add("wrong"); b.appendChild(el("span","mark","✗ Your answer")); }
        else b.classList.add("dim");
      } else {
        b.setAttribute("aria-label", L[i] + ": " + opt);
        b.addEventListener("click", function(){ choose(i); });
      }
      box.appendChild(b);
    });

    var hb = $("hintBox");
    hb.hidden = !hints[idx];
    hb.innerHTML = ""; hb.appendChild(el("strong",null,"Hint: ")); hb.appendChild(document.createTextNode(item.h));
    $("hintBtn").disabled = locked || hints[idx];
    $("hintBtn").setAttribute("aria-expanded", hints[idx] ? "true" : "false");

    var fb = $("feedback");
    if(locked){
      var ok = picked===item.a;
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = "";
      fb.appendChild(el("strong",null, ok ? "✓ Correct!" : "✗ Not quite. The correct answer is " + L[item.a] + "."));
      fb.appendChild(el("span",null,item.e));
      if(item.ref) fb.appendChild(el("span","ref",item.ref));
      fb.hidden = false;
    } else fb.hidden = true;

    $("prevBtn").disabled = idx===0;
    $("nextBtn").textContent = idx===N-1 ? "See results →" : "Next →";
  }

  function choose(i){
    if(answers[idx]!==null) return;
    answers[idx] = i; render();
    $("feedback").setAttribute("tabindex","-1"); $("feedback").focus({preventScroll:true});
  }
  function go(n){ idx = n; render(); $("qText").focus({preventScroll:true}); $("quiz").scrollIntoView({behavior:"smooth",block:"start"}); }

  function results(){
    var s = score(), pct = Math.round(s/N*100);
    $("finalScore").textContent = s + " / " + N;
    $("finalPct").textContent = pct + "%";
    var unanswered = answers.filter(function(a){return a===null;}).length;
    var msg = pct>=80 ? "Excellent work. You have a strong grasp of how Canada came together." :
              pct>=60 ? "Good effort. Review the questions you missed below, then try again." :
                        "Keep going. Read the explanations for the questions you missed, review Chapter 7, and retake the quiz.";
    if(unanswered) msg += " (" + unanswered + " question" + (unanswered>1?"s were":" was") + " left unanswered.)";
    $("finalMsg").textContent = msg;
    var list = $("reviewList"); list.innerHTML = "";
    Q.forEach(function(item,i){
      var li = el("li"), a = answers[i];
      li.appendChild(el("div","r-q",item.q));
      var line = el("div");
      if(a===null){ line.appendChild(el("span","r-skip","— Not answered. ")); }
      else if(a===item.a){ line.appendChild(el("span","r-ok","✓ Correct: ")); line.appendChild(document.createTextNode(L[a]+") "+item.o[a])); line.appendChild(el("br")); }
      else { line.appendChild(el("span","r-no","✗ Your answer: ")); line.appendChild(document.createTextNode(L[a]+") "+item.o[a])); line.appendChild(el("br")); }
      if(a!==item.a){ line.appendChild(el("strong",null,"Correct answer: ")); line.appendChild(document.createTextNode(L[item.a]+") "+item.o[item.a])); line.appendChild(el("br")); }
      var jump = el("button",null,"Go to question"); jump.type="button";
      jump.addEventListener("click", function(){ show("quiz"); go(i); });
      line.appendChild(jump);
      li.appendChild(line); list.appendChild(li);
    });
    show("results"); $("resultsHeading").focus();
  }

  function buildStatic(){
    var kl = $("keyList"), bl = $("bookletList");
    Q.forEach(function(item){
      var li = el("li");
      li.appendChild(el("div",null,item.q));
      var ans = el("div"); ans.appendChild(el("span","k-ans", L[item.a]+") "+item.o[item.a]));
      li.appendChild(ans); li.appendChild(el("div",null,item.e));
      if(item.ref) li.appendChild(el("div","ref",item.ref));
      kl.appendChild(li);
      var b = el("li"); b.appendChild(document.createTextNode(item.q));
      var ol = el("ol"); item.o.forEach(function(o){ ol.appendChild(el("li",null,o)); });
      b.appendChild(ol); bl.appendChild(b);
    });
  }

  $("startBtn").addEventListener("click", function(){ show("quiz"); go(0); });
  $("prevBtn").addEventListener("click", function(){ if(idx>0) go(idx-1); });
  $("nextBtn").addEventListener("click", function(){ if(idx<N-1) go(idx+1); else results(); });
  $("hintBtn").addEventListener("click", function(){ hints[idx]=true; render(); });
  $("retakeBtn").addEventListener("click", function(){ reset(); show("quiz"); go(0); });
  $("keyToggle").addEventListener("click", function(){
    var k = $("answerKey"), open = k.hidden;
    k.hidden = !open; $("printBtn").hidden = !open;
    document.body.classList.toggle("key-open", open);
    this.setAttribute("aria-expanded", open ? "true" : "false");
    this.textContent = open ? "Hide answer key" : "Show full answer key";
  });
  $("printBtn").addEventListener("click", function(){ window.print(); });
  document.addEventListener("keydown", function(e){
    if($("quiz").hidden || e.target.tagName==="INPUT") return;
    var k = e.key.toUpperCase(), i = L.indexOf(k);
    if(i>-1 && !e.ctrlKey && !e.metaKey && !e.altKey) choose(i);
    else if(e.key==="ArrowRight" && answers[idx]!==null) $("nextBtn").click();
    else if(e.key==="ArrowLeft") $("prevBtn").click();
  });

  reset(); buildStatic();
})();
