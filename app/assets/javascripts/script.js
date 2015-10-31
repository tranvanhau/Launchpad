<!--guitar hero launchpad/DDR launchpad-->
$(document).ready(function(){
    
    loadSounds(sound1Srcs, sounds1, 1);
    loadSounds(sound4Srcs, sounds4, 4);
    loadSounds(sound2Srcs, sounds2, 2);
    
    $(window).resize(function(){
        reformat();
    });
});

function loadSounds(srcArr, soundArr, chain){
    for(var i = 0; i < srcArr.length; i++){
        soundArr.push(null);
    }

    for(var i = 0; i < srcArr.length; i++){
        if(srcArr[i] == ""){
            checkLoaded();
        }
        else{
            $.ajax({
                type: "POST",
                url: "/get_asset_path",
                data: {file_name: srcArr[i], sindex: i, chain: chain},
                success: function(data, textStatus, jqXHR) {
                  //console.log(data);
                  // console.log(textStatus);
                  // console.log(jqXHR);
                  var tempi = parseInt(data.sindex);
                  soundArr[tempi] = new Howl({urls: [data.asset_path]});
                  checkLoaded();
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error=" + errorThrown);
                    $(".soundPack").html("There was an error. Please Reload the page");
                }
            });
        }
    }
}

function checkLoaded(){
    numLoaded++;
    if(numLoaded == 4*12*numSoundPacks){
        combSounds = [sounds1, sounds4, sounds2];
        loadKeyboard();
    }
}

function loadKeyboard(){
    for(var i = 0; i < 4; i++){
        $(".buttons").append('<div class="button-row"></div>');
        for(var j = 0; j < 12; j++){
            var press = false;
            if(pressures[0].indexOf((i*12+j)) != -1)
                press = true;
            var str = String.fromCharCode(keyPairs[i*12+j]);
            if(keyPairs[i*12+j] == 13)
                str = "\\n"
            if(keyPairs[i*12+j] == 16)
                str = "\\s"
            $(".button-row:last").append('<div class="button button-'+(i*12+j)+'" pressure="'+press+'" released="true">'+str+'</div>');
            $('.button-'+(i*12+j)+'').css("background-color", $('.button-'+(i*12+j)+'').attr("pressure") == "true" ? "lightgray" : "white");
        }
    }
    
    $(".soundPack").html("Sound Pack: "+curSound);
    
    $(".button").click(function(){
       $(this).attr("pressure", $(this).attr("pressure") == "false" ? "true" : "false");
       $(this).css("background-color", $(this).attr("pressure") == "true" ? "lightgray" : "white");
    });
    
    $(document).keydown(function(e){
        //console.log(e.keyCode);
        if(e.keyCode == 39){
            curSound = 1;
            $(".soundPack").html("Sound Pack: "+curSound);
            switchSoundPack();
        }
        else if(e.keyCode == 37){
            curSound = 0;
            $(".soundPack").html("Sound Pack: "+curSound);
            switchSoundPack();
        }
        else if(e.keyCode == 38){
            curSound = 2;
            $(".soundPack").html("Sound Pack: "+curSound);
            switchSoundPack();
        }
        else{
            //console.log(e.keyCode);
            if($(".button-"+(keyPairs.indexOf(e.keyCode))+"").attr("released") == "true" && combSounds[curSound][keyPairs.indexOf(e.keyCode)] != null){
                combSounds[curSound][keyPairs.indexOf(e.keyCode)].play();
                kdRecordInput(e.keyCode);
            }
            $(".button-"+(keyPairs.indexOf(e.keyCode))+"").attr("released","false");
            $(".button-"+(keyPairs.indexOf(e.keyCode))+"").css("background-color","rgb(255,160,0)");
        }
        
        kdRecordInputSwitch(e.keyCode);
    });
    $(document).keyup(function(e){
        if($(".button-"+(keyPairs.indexOf(e.keyCode))+"").attr("pressure") == "true" && combSounds[curSound][keyPairs.indexOf(e.keyCode)] != null)
            combSounds[curSound][keyPairs.indexOf(e.keyCode)].stop();
        $(".button-"+(keyPairs.indexOf(e.keyCode))+"").attr("released","true");
        $(".button-"+(keyPairs.indexOf(e.keyCode))+"").css("background-color", $(".button-"+(keyPairs.indexOf(e.keyCode))+"").attr("pressure") == "true" ? "lightgray" : "white");
    
        kuRecordInput(e.keyCode); 
    });
    
    $("#play_button").click(function(){
        if(song_playing){
            $("#play_button").html("Play");
            song_playing = false;
        }
        else{
            playSong();
            $("#play_button").html("Pause");
        }
    });
    
        
    setupEditor();
    
    reformat();
    $("#editor_canvas").attr({"width": $(".buttons").width()+"px", "height": "250px"});
    
    edcWidth = parseInt($("#editor_canvas").attr("width"));
    edcHeight = parseInt($("#editor_canvas").attr("height"));
    setupToolBar();
}

function switchSoundPack(){
    for(var i = 0; i < 4; i++){
        for(var j = 0; j < 12; j++){
            var press = false;
            if(pressures[curSound].indexOf((i*12+j)) != -1)
                press = true;
            $('.button-'+(i*12+j)+'').attr("pressure", ""+press+"");
            $('.button-'+(i*12+j)+'').css("background-color", $('.button-'+(i*12+j)+'').attr("pressure") == "true" ? "lightgray" : "white");
        }
    }
}

function playSong(){
    setupSongInterval();
}

function setupSongInterval(){
    frame = 0;
    time = 0;
    indAt = 0;
    resolution = 50;
    intro_loop = 0;
    song_playing = true;
    startTime = new Date().getTime();
    
    setTimeout(songInterval, resolution);
}

function songInterval(){
    var stop = false;
    while(songIntro[indAt].p <= frame){
        if(songIntro[indAt].kc != -1)
            keyTap(songIntro[indAt].kc, songIntro[indAt].dn);
        indAt++;
        if(indAt >= songIntro.length){
            if(intro_loop > 6){
            stop = true;
                break;
            }
            else{
                indAt = 0;
                frame = -resolution;
                intro_loop++;
            }
        }
    }
    frame+=resolution;
    time+=resolution;
    diff = (new Date().getTime() - startTime) - time;
    if(!stop && song_playing)
        setTimeout(songInterval, (resolution - diff));
}

function keyTap(keycode, duration){
    $(document).trigger(jQuery.Event( 'keydown', { which: keyPairs[keycode], keyCode: keyPairs[keycode] } ));
    setTimeout(function(){
        $(document).trigger(jQuery.Event( 'keyup', { which: keyPairs[keycode], keyCode: keyPairs[keycode] } ));
    },duration);
}

function reformat(){
    $(".buttons").css("margin", "0");
    $(".buttons").css("margin","0 "+(($("body").innerWidth()-$(".buttons").width()-30)/2)+"px");
    
    $("#editor_canvas").css("margin", "10px "+(($("body").innerWidth()-$(".buttons").width()-30)/2)+"px");
}