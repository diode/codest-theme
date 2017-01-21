(function(){

  var runner = document.getElementById("runner");
  if(!runner){
    intuition();
    runner.addEventListener("animationend", intuition, false);
    runner.addEventListener("webkitAnimationEnd", intuition, false);
    runner.addEventListener("oanimationend", intuition, false);
    runner.addEventListener("MSAnimationEnd", intuition, false);
  }

  function intuition(){

    //console.log("think");
    if(runner.className.indexOf("runner-animation") > -1){
      runner.className = "runner-reset ";
    }

    setTimeout(function(){
      var trigger = Math.random() * 999;
      //console.log("think.. " + trigger);
      if(trigger < 300){
        runner.className += "runner-animation";
      }else{
        intuition();
      }
    }, 3000);
  }

})();
