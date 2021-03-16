var socket = io();

var game = {};
var info = {index : roomNum, hostName : hostName, playerId : player};
  

// 게임 정보에 맞게 렌더링
var render = (gameInfo) => {

    var playerPos = gameInfo.players.indexOf(player);
    
    // player render
    $("#gameDiv").html("");
    for (var i = playerPos; i < gameInfo.players.length; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i] + " : " + gameInfo.playerSurfaceCard[i].fruit + ", " + gameInfo.playerSurfaceCard[i].num + "</div>"
        console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    for (var i = 0; i < playerPos; i++){
        var tmp = "<div class=\"player\">" + gameInfo.players[i] + " : " + gameInfo.playerSurfaceCard[i].fruit + ", " + gameInfo.playerSurfaceCard[i].num + "</div>";
        console.log(gameInfo.players[i]);
        $("#gameDiv").append(tmp);
    }
    
    // player stat render
    $("#playerStat").html("나의 남은 카드 : " + gameInfo.playerLeftCards[playerPos]);
    // nowTurn render
    $("#nowTurn").html("현재 차례 : " + gameInfo.players[gameInfo.nowTurn]);
    //
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
    console.log(text);
    $("#notice").html(text);
});

socket.on("refresh", (gameInfo) => {
    game = gameInfo;
    render(game);
});

socket.on("getRoomInfo", (roomInfo) => {
    console.log(roomInfo);
});

// joinRoom
socket.emit("joinRoom", {index : roomNum, hostName : hostName, playerId : player});