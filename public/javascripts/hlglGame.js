var socket = io();

var game = {};
var info = {index : roomNum, hostName : hostName, playerId : player};

var hitBellSound = new Audio("../../sounds/hitBell.mp3");
hitBellSound.loop = false;
hitBellSound.volume = 0.6;

var holdOutCardSound = new Audio("../../sounds/holdOutCard.mp3");
holdOutCardSound.loop = false;
holdOutCardSound.volume = 0.6;

// 게임 정보에 맞게 렌더링
var render = (gameInfo) => {

    var playerPos = 0;

    for (var i = 0; i < gameInfo.players.length; i++) {
        if (gameInfo.players[i].name == player) {
            playerPos = i;
            break;
        }
    }

    // player render
    $("#gameDiv").html("");
    for (var i = playerPos; i < gameInfo.players.length; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i].name + " : " + gameInfo.players[i].surfaceCard.fruit + ", " + gameInfo.players[i].surfaceCard.num + "</div>"
        //console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    for (var i = 0; i < playerPos; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i].name + " : " + gameInfo.players[i].surfaceCard.fruit + ", " + gameInfo.players[i].surfaceCard.num + "</div>";
        //console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    
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
    if (hostName == player && gameInfo.nowState == 0) {
        $("#hostFunc").css("display", "block");
    }

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
    $("#hostFunc").css("display", "none");
});

// from Server
socket.on("notice", (text) => {
    //console.log(text);
    $("#notice").html(text);
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
socket.emit("joinRoom", {index : roomNum, hostName : hostName, playerId : player});