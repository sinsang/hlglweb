var socket = io();

var game = {};
var info = {index : roomNum, hostName : hostName, playerId : player, TOKEN : TOKEN};

var hitBellSound = new Audio("../../sounds/hitBell.mp3");
hitBellSound.loop = false;
hitBellSound.volume = 0.6;

var holdOutCardSound = new Audio("../../sounds/holdOutCard.mp3");
holdOutCardSound.loop = false;
holdOutCardSound.volume = 0.6;

var preLoading = () => {
    for (var i = 1; i <= 5; i++){
        for (var j = 1; j <= 5; j++){
            var img = new Image();
            img.src = "../../images/" + i + "_" + j + ".png";
        }
    }
}

// 상대 카드 렌더링 (css 조정)
var anotherPlayersModifyCss = () => {
    var anotherPlayersDivWidth = $("#anotherPlayersDiv").css("width").replace("px", "") * 1;
    var anotherPlayersDivHeight = $("#anotherPlayersDiv").css("height").replace("px", "") * 1;

    for (var i = 0; i < $(".anotherPlayer").length; i++) {
        $(".anotherPlayer").eq(i).css("margin-top", anotherPlayersDivHeight / 2 - $(".anotherPlayer").eq(0).css("height").replace("px","") * 0.3 + "px");
    }
    
    switch ($(".anotherPlayer").length) {
        case 1: // 상대방 1명
            $(".anotherPlayer").eq(0).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 1 / 2 + "px");
            break;

        case 2: // 상대방 2명
            $(".anotherPlayer").eq(0).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 2 + "px");
            $(".anotherPlayer").eq(0).css("transform", "rotate(-30deg)");

            $(".anotherPlayer").eq(1).css("margin-left", anotherPlayersDivWidth / 2 + $(".anotherPlayer").eq(0).css("width").replace("px","") * 1 + "px");
            $(".anotherPlayer").eq(1).css("transform", "rotate(30deg)");
            break;

        case 3: // 상대방 3명
            $(".anotherPlayer").eq(0).css("margin-top", $("#bellDiv").css("margin-top").replace("px","") * 1 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 0.3 + "px");
            $(".anotherPlayer").eq(0).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("height").replace("px","") * 1.3 + "px");
            $(".anotherPlayer").eq(0).css("transform", "rotate(-90deg)");

            $(".anotherPlayer").eq(1).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 1 / 2 + "px");

            $(".anotherPlayer").eq(2).css("margin-top", $("#bellDiv").css("margin-top").replace("px","") * 1 - $(".anotherPlayer").eq(2).css("width").replace("px","") * 0.3 + "px");
            $(".anotherPlayer").eq(2).css("margin-left", anotherPlayersDivWidth / 2 + $(".anotherPlayer").eq(0).css("height").replace("px","") * 0.7 + "px");
            $(".anotherPlayer").eq(2).css("transform", "rotate(90deg)");
            break;
        case 4:
            $(".anotherPlayer").eq(0).css("margin-top", $("#bellDiv").css("margin-top").replace("px","") * 1 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 0.3 + "px");
            $(".anotherPlayer").eq(0).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("height").replace("px","") * 1.5 + "px");
            $(".anotherPlayer").eq(0).css("transform", "rotate(-90deg)");

            $(".anotherPlayer").eq(1).css("margin-left", anotherPlayersDivWidth / 2 - $(".anotherPlayer").eq(0).css("width").replace("px","") * 1.7 + "px");
            $(".anotherPlayer").eq(1).css("transform", "rotate(-30deg)");

            $(".anotherPlayer").eq(2).css("margin-left", anotherPlayersDivWidth / 2 + $(".anotherPlayer").eq(0).css("width").replace("px","") * 0.7 + "px");
            $(".anotherPlayer").eq(2).css("transform", "rotate(30deg)");

            $(".anotherPlayer").eq(3).css("margin-top", $("#bellDiv").css("margin-top").replace("px","") * 1 - $(".anotherPlayer").eq(2).css("width").replace("px","") * 0.3 + "px");
            $(".anotherPlayer").eq(3).css("margin-left", anotherPlayersDivWidth / 2 + $(".anotherPlayer").eq(0).css("height").replace("px","") * 1 + "px");
            $(".anotherPlayer").eq(3).css("transform", "rotate(90deg)");

    }
}

// 게임 정보에 맞게 렌더링
var render = (gameInfo) => {

    var playerPos = 0;

    for (var i = 0; i < gameInfo.players.length; i++) {
        if (gameInfo.players[i].name == player) {
            playerPos = i;
            break;
        }
    }

    // playerCard render
    $("#anotherPlayersDiv").html("");
    for (var i = playerPos + 1; i < gameInfo.players.length; i++){
        var tmp = "<div class=\"anotherPlayer\">" + gameInfo.players[i].name + ":" + gameInfo.players[i].leftCards + "<br/>";
        if (gameInfo.players[i].surfaceCard.num > 0){
            tmp += "<div class=\"another card\">";
            tmp += "<img src=\"../../images/" + gameInfo.players[i].surfaceCard.fruit + "_" + gameInfo.players[i].surfaceCard.num + ".png\" />";
            tmp += "</div></div>";
        }
        else {
            tmp += "<div class=\"another card\" style=\"background-color: red;\"></div></div>";
        }
        $("#anotherPlayersDiv").append(tmp);
    }
    for (var i = 0; i < playerPos; i++){
        var tmp = "<div class=\"another\">" + gameInfo.players[i].name + ":" + gameInfo.players[i].leftCards + "<br/>";
        if (gameInfo.players[i].surfaceCard.num > 0){
            tmp += "<div class=\"card\">";
            tmp += "<img src=\"../../images/" + gameInfo.players[i].surfaceCard.fruit + "_" + gameInfo.players[i].surfaceCard.num + ".png\" />";
            tmp += "</div></div>";
        }
        else {
            tmp += "<div class=\"another card\" style=\"background-color: red;\"></div></div>";
        }
        $("#anotherPlayersDiv").append(tmp);
    }

    if (gameInfo.players[playerPos].surfaceCard.num > 0){
        var tmp = "<img src=\"../../images/" + gameInfo.players[playerPos].surfaceCard.fruit + "_" + gameInfo.players[playerPos].surfaceCard.num + ".png\" />";
    }
    else {
        var tmp = "<div class=\"card\" id=\"myHoldOutCard\" style=\"background-color: red;\"></div>";
    }
    $("#myHoldOutCard").html(tmp);

    // player stat render
    if (gameInfo.players[playerPos].available) { 
        $("#playerStat").html("나의 남은 카드 : " + gameInfo.players[playerPos].leftCards);
    }
    else {
        $("#playerStat").html("남은 카드가 없습니다.");
    }

    // nowTurn render
    $("#nowTurn").html("현재 차례 : " + gameInfo.players[gameInfo.nowTurn].name);
    
    // hostFunc render
    if (hostName == player) {
        switch (gameInfo.nowState) {
            case 0: 
            case 3:
                $("#hostFunc").css("display", "block");
                $("#gameStart").css("display", "block");
                break;
            case 1:
            case 2:
                $("#hostFunc").css("display", "none");
                break;
        }
    }

    // modify css
    anotherPlayersModifyCss();

};

// click event
$("#bell").click((e) => {
    socket.emit("hitBell", info);
}); 

$("#myDeck").click((e) => {
    socket.emit("holdOutCard", info);
});

$("#gameStart").click((e) => {
    socket.emit("gameStart", info);
    //$("#hostFunc").css("display", "none");
});

$("#exit").click((e) => {
    location.href = "../../game/list";
});

$(".hamburger").click((e) => {
    document.querySelector(".hamburger").classList.toggle("is-active");
    $("#menu").slideToggle("fast");
});

$("#showLog").click((e) => {
    $("#notice").toggle();
    $("#notice").draggable();
})

// from Server
socket.on("notice", (text) => {
    //console.log(text);
    $("#notice").html(text + "<br/>" + $("#notice").html());
});

socket.on("refresh", (gameInfo) => {
    game = gameInfo;
    render(game);
});

socket.on("ring", () => {
    hitBellSound.load();
    hitBellSound.play();
});

socket.on("cardSound", () => {
    holdOutCardSound.load();
    holdOutCardSound.play();
});

socket.on("getRoomInfo", (roomInfo) => {
    console.log(roomInfo);
});

// joinRoom
socket.emit("joinRoom", info);

// img preloading
preLoading();

// css 
$("#menu").css("padding-top", $(".hamburger").css("width"));
$("#myDiv").css("margin-top", $("#anotherPlayersDiv").css("height").replace("px", "") * 1 + $("#bellDiv").css("height").replace("px", "") * 1 + 30 + "px");
$("#bellDiv").css("margin-top", $("#anotherPlayersDiv").css("height"));