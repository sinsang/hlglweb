var createNewDeck = () => {
    var newDeck = [];
    for (var i = 1; i <= 4; i++){
      for (var j = 0; j < 5; j++) { newDeck.push({fruit: i, num: 1}); }
      for (var j = 0; j < 3; j++) { newDeck.push({fruit: i, num: 2}); }
      for (var j = 0; j < 3; j++) { newDeck.push({fruit: i, num: 3}); }
      for (var j = 0; j < 2; j++) { newDeck.push({fruit: i, num: 4}); }
      for (var j = 0; j < 1; j++) { newDeck.push({fruit: i, num: 5}); }
    }

    return newDeck;
}
var shuffle = (sourceArray) => {
    for (var i = 0; i < sourceArray.length - 1; i++) {
        var j = i + Math.floor(Math.random() * (sourceArray.length - i));
  
        var temp = sourceArray[j];
        sourceArray[j] = sourceArray[i];
        sourceArray[i] = temp;
    }
    return sourceArray;
}

exports.GAME = class game {   

    // 게임 생성
    constructor(index, hostName, pwd) {
        
        // 서버에 남을 정보
        this.hostName = hostName;
        this.pwd = pwd;      
        this.gameMode = 0;
        this.players = [];
        
        this.surfaceCardsSum = [0, 0, 0, 0];   // 내민 카드 중 표면들의 총 합
        this.holdOutDeck = [];               // 내밀어서 쌓인 카드들
        this.playerDeck = [];                // 플레이어에게 남은 카드
        
        this.MAX_PLAYER = 5;
        this.NOW_PLAYER = 0;

        this.timeOutList = [];
        
        // 클라이언트로 보낼 게임 정보
        this.gameInfo = {
            id : index,
            isLocked : false,
            isPlaying : false,
            hostName : this.hostName,  
            title : this.hostName + "님의 방",
            nowState : 0, // 현재 게임 상태   0: 대기, 1: 플레이, 2: 일시정지(카드 분배 등), 3: 종료(결과창)
            nowTurn : 0,  // 현재 턴 
            players : [], // 현재 플레이어 
            time : 0,     // 남은 시간
        };

        if (this.pwd != "" && this.pwd != null) {
            this.gameInfo.isLocked = true;
        }

    }
    
    // 새 플레이어 생성
    createNewPlayer = (name) => {
        var newPlayer = {
            name : name,
            available : true,
            surfaceCard : {fruit : 1, num : 0},
            leftCards : 0
        };

        this.players.push(name);
        this.gameInfo.players.push(newPlayer);
        this.playerDeck.push([]);
        this.holdOutDeck.push([]);
        this.NOW_PLAYER++;
    }

    // 플레이어 제거
    deletePlayer = (name) => {

        var index = this.getPlayerIndex(name);

        // 방에서 플레이어 정보 제거
        this.players.splice(index, 1);
        this.holdOutDeck.splice(index, 1);
        this.playerDeck.splice(index, 1);
        
        this.gameInfo.players.splice(index, 1);
        this.NOW_PLAYER--;

        // 현재 차례인 사람이 나갔을 시 
        if (this.gameInfo.nowTurn == index){
            this.gameInfo.nowTurn++;
            this.gameInfo.nowTurn %= this.NOW_PLAYER;
        }

        // 나간 사람이 호스트 일 시 호스트 권한 이동
        if (this.hostName == name && this.NOW_PLAYER > 0) {
            console.log("호스트이동");
            this.hostName = this.players[0];
            this.gameInfo.hostName = this.hostName;
            console.log(this.hostName);
        }

    }

    // 이름으로 인덱스 얻기
    getPlayerIndex = (player) => {
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i] === player) {
                return i;
            }
        }
        return -1;
    }

    // 게임시작
    gameStart = (time) => {
        
        var newDeck = createNewDeck();
    
        for (var i = 0; i < 10; i++) newDeck = shuffle(newDeck);
        
        var cardPerPlayer = parseInt(newDeck.length / this.NOW_PLAYER);

        for (var i = 0; i < this.players.length; i++){
            this.playerDeck[i] = [];
            for (var j = 0; j < cardPerPlayer; j++){
                this.playerDeck[i].push(newDeck.pop());
            }
            this.gameInfo.players[i].leftCards = this.playerDeck[i].length;
            this.gameInfo.players[i].available = true;
        }

        this.time = time;
        this.gameInfo.isPlaying = true;
        this.gameInfo.nowTurn = 0;
        this.gameInfo.nowState = 1;

    }

    // 게임종료조건 체크 
    isGameSet = () => {
        if (this.gameInfo.players.filter(e => e.available === true).length <= 1) {
            return true;
        }
        
        return false;
    }

    // 게임종료, 결과 출력
    gameSet = () => {
        clearInterval(this.timeCount);
        var result = this.gameInfo.players.slice();

        this.gameInfo.nowState = 0;

        result.sort((a, b) => {
            if (a.leftCards > b.leftCards) return -1;
            if (a.leftCards < b.leftCards) return 1;
            return 0;
        });

        var resultText = "";
        for (var i = 0; i < result.length; i++){
            resultText += (i*1 + 1) + "위 : " + result[i].name + ", " + result[i].leftCards + " 장 <br/>";
        }

        return resultText;
    }

    // 카드 내밀기
    holdOutCard = (player) => {
        var playerIndex = this.getPlayerIndex(player);

        if (this.gameInfo.nowState != 1) {  // 대기
            return 1;
        }
        if (this.gameInfo.nowTurn != playerIndex) {     // 잘못된 차례
            //console.log("nowTurn : " + this.gameInfo.nowTurn);
            //console.log("player : " + playerIndex);
            return 2;
        }
        if (this.playerDeck[playerIndex].length < 1){   // 덱이 빔
            this.nextTurn();
            return 3;
        }

        var getCard = this.playerDeck[playerIndex].shift();
        
        this.holdOutDeck[playerIndex].push(getCard);

        this.surfaceCardsSum[this.gameInfo.players[playerIndex].surfaceCard.fruit - 1] -= this.gameInfo.players[playerIndex].surfaceCard.num;
        this.gameInfo.players[playerIndex].surfaceCard = getCard;
        this.surfaceCardsSum[getCard.fruit - 1] += getCard.num;

        this.gameInfo.players[playerIndex].leftCards--;
    
        this.nextTurn();

        if (this.gameInfo.players[playerIndex].leftCards < 1) {     // 카드 소진
            this.gameInfo.players[playerIndex].available = false;
            return 4;
        }

        return 5;   // 정상 종료
    }

    // 종 치기
    hitBell = (player) => {

        if (this.gameInfo.nowState != 1) {  // 대기 
            return 1;
        }

        var playerIndex = this.getPlayerIndex(player);

        if (!this.gameInfo.players[playerIndex].available) {    // 종을 친 플레이어가 생존상태가 아닐 때
            return 1;
        }
        
        if (this.surfaceCardsSum.indexOf(5) != -1) {    // 승리

            // 내민 카드 정보 정리
            this.surfaceCardsSum = [0,0,0,0];
            for (var i = 0; i < this.NOW_PLAYER; i++) {
                var len = this.holdOutDeck[i].length;
                for (var j = 0; j < len; j++){
                    this.playerDeck[playerIndex].push(this.holdOutDeck[i].pop());
                }
                this.gameInfo.players[i].surfaceCard = {fruit: 1, num: 0};
            }

            // 내민 카드들 승자에게
            for (var i = 0; i < this.NOW_PLAYER; i++){
                var len = this.holdOutDeck[i].length;
                for (var j = 0; j < len; j++){
                this.playerDeck[playerIndex].push(this.holdOutDeck[i].pop());
                }   
            }
            
            // 게임 정보 업데이트
            this.gameInfo.players[playerIndex].leftCards = this.playerDeck[playerIndex].length;
            this.gameInfo.nowState = 2;             // 카드 분배 중 일시정지                                       
            this.gameInfo.nowTurn = playerIndex;    // 이긴 사람부터 다시시작

            return 2;
        }
    
        else {  // 잘못 친 경우

            for (var i = 0; i < this.NOW_PLAYER; i++){
                if (this.playerDeck[playerIndex].length < 1) {
                    // 카드가 비게 되면 중단, 벌칙받은 플레이어는 패배  
                    break;
                }
                else if (i != playerIndex) {
                    this.playerDeck[i].push(this.playerDeck[playerIndex].pop());
                }   
                this.gameInfo.players[i].leftCards = this.playerDeck[i].length;
            }

            this.gameInfo.nowState = 2;   // 카드 분배 중 일시정지

            return 3;
        }

    }

    // 순서 변경
    nextTurn = () => {
        do {
            this.gameInfo.nowTurn++;
            this.gameInfo.nowTurn %= this.NOW_PLAYER;
        } while (!this.gameInfo.players[this.gameInfo.nowTurn].available);
    }

    // 재시작
    restart = () => {
        this.gameInfo.nowState = 1;
    }

}