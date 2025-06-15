// ゲームの状態を管理するクラス
class MinesweeperGame {
    constructor(width, height, mineCount) {
        this.width = width;
        this.height = height;
        this.mineCount = mineCount;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.shipPosition = null;
        this.gameStarted = false;
        this.gameOver = false;
        this.gameWon = false;
        this.timer = 0;
        this.timerInterval = null;
        this.minesLeft = mineCount;
        
        this.initializeBoard();
    }
    
    // ボードの初期化
    initializeBoard() {
        // ボードの作成（まだ地雷は配置しない）
        this.board = Array(this.height).fill().map(() => Array(this.width).fill(0));
        this.revealed = Array(this.height).fill().map(() => Array(this.width).fill(false));
        this.flagged = Array(this.height).fill().map(() => Array(this.width).fill(false));
    }
    
    // 最初のクリック後に地雷を配置
    placeMines(firstClickRow, firstClickCol) {
        let minesPlaced = 0;
        
        // 最初にクリックしたセルとその周囲には地雷を配置しない
        const safeZone = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const r = firstClickRow + dr;
                const c = firstClickCol + dc;
                if (r >= 0 && r < this.height && c >= 0 && c < this.width) {
                    safeZone.push({ row: r, col: c });
                }
            }
        }
        
        // ランダムに地雷を配置
        while (minesPlaced < this.mineCount) {
            const row = Math.floor(Math.random() * this.height);
            const col = Math.floor(Math.random() * this.width);
            
            // 既に地雷があるか、安全地帯ならスキップ
            if (this.board[row][col] === -1 || safeZone.some(pos => pos.row === row && pos.col === col)) {
                continue;
            }
            
            this.board[row][col] = -1; // -1 は地雷を表す
            minesPlaced++;
            
            // 周囲のセルの数字を更新
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    
                    const r = row + dr;
                    const c = col + dc;
                    
                    if (r >= 0 && r < this.height && c >= 0 && c < this.width && this.board[r][c] !== -1) {
                        this.board[r][c]++;
                    }
                }
            }
        }
    }
    
    // セルを開く
    revealCell(row, col) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width || 
            this.revealed[row][col] || this.flagged[row][col] || this.gameOver) {
            return;
        }
        
        // 最初のクリックの場合
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.shipPosition = { row, col };
            this.placeMines(row, col);
            this.startTimer();
        }
        
        this.revealed[row][col] = true;
        
        // 地雷を踏んだ場合
        if (this.board[row][col] === -1) {
            this.endGame(false);
            return;
        }
        
        // 空白セルの場合、周囲も開く
        if (this.board[row][col] === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    this.revealCell(row + dr, col + dc);
                }
            }
        }
        
        // 勝利条件をチェック
        this.checkWinCondition();
    }
    
    // フラグを切り替える
    toggleFlag(row, col) {
        if (row < 0 || row >= this.height || col < 0 || col >= this.width || 
            this.revealed[row][col] || this.gameOver) {
            return;
        }
        
        this.flagged[row][col] = !this.flagged[row][col];
        this.minesLeft += this.flagged[row][col] ? -1 : 1;
        
        // UI更新
        document.getElementById('mines-left').textContent = this.minesLeft;
    }
    
    // 船を移動
    moveShip(direction) {
        if (!this.gameStarted || this.gameOver || !this.shipPosition) return;
        
        let { row, col } = this.shipPosition;
        
        // 方向に基づいて移動
        switch (direction) {
            case 'up':
                row = Math.max(0, row - 1);
                break;
            case 'down':
                row = Math.min(this.height - 1, row + 1);
                break;
            case 'left':
                col = Math.max(0, col - 1);
                break;
            case 'right':
                col = Math.min(this.width - 1, col + 1);
                break;
            case 'up-left':
                row = Math.max(0, row - 1);
                col = Math.max(0, col - 1);
                break;
            case 'up-right':
                row = Math.max(0, row - 1);
                col = Math.min(this.width - 1, col + 1);
                break;
            case 'down-left':
                row = Math.min(this.height - 1, row + 1);
                col = Math.max(0, col - 1);
                break;
            case 'down-right':
                row = Math.min(this.height - 1, row + 1);
                col = Math.min(this.width - 1, col + 1);
                break;
        }
        
        // 移動先が現在位置と同じなら何もしない
        if (row === this.shipPosition.row && col === this.shipPosition.col) {
            return;
        }
        
        // 船の位置を更新
        this.shipPosition = { row, col };
        
        // 移動先のセルを開く
        this.revealCell(row, col);
        
        // UI更新
        this.updateBoard();
    }
    
    // ジャンプ（1マス先に移動）
    jumpShip(direction) {
        if (!this.gameStarted || this.gameOver || !this.shipPosition) return;
        
        let { row, col } = this.shipPosition;
        
        // 方向に基づいて2マス移動（ジャンプ）
        switch (direction) {
            case 'up':
                row = Math.max(0, row - 2);
                break;
            case 'down':
                row = Math.min(this.height - 1, row + 2);
                break;
            case 'left':
                col = Math.max(0, col - 2);
                break;
            case 'right':
                col = Math.min(this.width - 1, col + 2);
                break;
            case 'up-left':
                row = Math.max(0, row - 2);
                col = Math.max(0, col - 2);
                break;
            case 'up-right':
                row = Math.max(0, row - 2);
                col = Math.min(this.width - 1, col + 2);
                break;
            case 'down-left':
                row = Math.min(this.height - 1, row + 2);
                col = Math.max(0, col - 2);
                break;
            case 'down-right':
                row = Math.min(this.height - 1, row + 2);
                col = Math.min(this.width - 1, col + 2);
                break;
        }
        
        // 移動先が現在位置と同じなら何もしない
        if (row === this.shipPosition.row && col === this.shipPosition.col) {
            return;
        }
        
        // 船の位置を更新
        this.shipPosition = { row, col };
        
        // 移動先のセルを開く
        this.revealCell(row, col);
        
        // UI更新
        this.updateBoard();
    }
    
    // タイマーを開始
    startTimer() {
        // 既存のタイマーがあれば停止
        this.stopTimer();
        
        this.timerInterval = setInterval(() => {
            this.timer++;
            document.getElementById('timer').textContent = this.timer;
        }, 1000);
    }
    
    // タイマーを停止
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // 勝利条件をチェック
    checkWinCondition() {
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                // 地雷以外のセルで、まだ開かれていないものがあれば続行
                if (this.board[row][col] !== -1 && !this.revealed[row][col]) {
                    return;
                }
            }
        }
        
        // すべての非地雷セルが開かれていれば勝利
        this.endGame(true);
    }
    
    // ゲーム終了処理
    endGame(isWin) {
        this.gameOver = true;
        this.gameWon = isWin;
        this.stopTimer();
        
        // すべての地雷を表示
        if (!isWin) {
            for (let row = 0; row < this.height; row++) {
                for (let col = 0; col < this.width; col++) {
                    if (this.board[row][col] === -1) {
                        this.revealed[row][col] = true;
                    }
                }
            }
        }
        
        // UI更新
        this.updateBoard();
        
        // ゲームオーバーメッセージ
        const gameStatus = document.getElementById('game-status');
        if (isWin) {
            gameStatus.textContent = '勝利！おめでとうございます！';
            gameStatus.className = 'win';
        } else {
            gameStatus.textContent = '地雷を踏みました！ゲームオーバー';
            gameStatus.className = 'lose';
        }
        
        // ゲームオーバーオーバーレイを表示
        const boardContainer = document.querySelector('.game-board-container');
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        
        const message = document.createElement('div');
        message.className = 'game-over-message';
        message.textContent = isWin ? '勝利！' : 'ゲームオーバー';
        message.classList.add(isWin ? 'win' : 'lose');
        
        overlay.appendChild(message);
        boardContainer.appendChild(overlay);
    }
    
    // ボードのUI更新
    updateBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateColumns = `repeat(${this.width}, 40px)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.height}, 40px)`;
        
        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 開かれたセルの処理
                if (this.revealed[row][col]) {
                    cell.classList.add('revealed');
                    
                    if (this.board[row][col] === -1) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[row][col] > 0) {
                        cell.textContent = this.board[row][col];
                        cell.dataset.number = this.board[row][col];
                    }
                }
                // フラグが立てられたセル
                else if (this.flagged[row][col]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }
                
                // 船の位置（最後に追加して他の要素より前面に表示）
                if (this.shipPosition && this.shipPosition.row === row && this.shipPosition.col === col) {
                    cell.classList.add('ship');
                    
                    // 数字があるマスに船が被った場合、船を半透明にする
                    if (this.revealed[row][col] && this.board[row][col] > 0) {
                        cell.classList.add('has-number');
                    } else {
                        cell.textContent = '🚢';
                    }
                }
                
                gameBoard.appendChild(cell);
            }
        }
        
        // 少し遅延して実行
        setTimeout(() => {
            this.updateShipDisplay();
        }, 0);
    }
    
    // 船の表示を更新（数字の上に船がある場合の処理）
    updateShipDisplay() {
        if (!this.shipPosition || !this.gameStarted) return;
        
        const { row, col } = this.shipPosition;
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        
        if (!cell) return;
        
        // 数字があるマスに船が被った場合
        if (this.revealed[row][col] && this.board[row][col] > 0) {
            // 船のアイコンと数字を両方表示
            if (!cell.querySelector('.ship-icon')) {
                const shipIcon = document.createElement('div');
                shipIcon.className = 'ship-icon';
                shipIcon.textContent = '🚢';
                shipIcon.style.position = 'absolute';
                shipIcon.style.top = '0';
                shipIcon.style.left = '0';
                shipIcon.style.width = '100%';
                shipIcon.style.height = '100%';
                shipIcon.style.display = 'flex';
                shipIcon.style.justifyContent = 'center';
                shipIcon.style.alignItems = 'center';
                shipIcon.style.opacity = '0.75';
                shipIcon.style.pointerEvents = 'none';
                cell.style.position = 'relative';
                cell.appendChild(shipIcon);
            }
        }
    }
    
    // 船の位置の数字をツールチップで表示
    updateTooltip() {
        const tooltip = document.getElementById('tooltip');
        
        if (!this.shipPosition || !this.gameStarted || this.gameOver) {
            tooltip.classList.add('hidden');
            return;
        }
        
        const { row, col } = this.shipPosition;
        const value = this.board[row][col];
        
        if (value > 0) {
            tooltip.textContent = value;
            tooltip.classList.remove('hidden');
            
            // 船の位置に合わせてツールチップを配置（船のひとマス分上に表示）
            const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
            if (!cell) return;
            
            const cellRect = cell.getBoundingClientRect();
            const boardRect = document.getElementById('game-board').getBoundingClientRect();
            
            // 船の真上に表示
            tooltip.style.top = `${cellRect.top - boardRect.top - 40}px`;
            tooltip.style.left = `${cellRect.left - boardRect.left + (cellRect.width / 2)}px`;
        } else {
            tooltip.classList.add('hidden');
        }
    }
}

// ゲームコントローラー
class GameController {
    constructor() {
        this.game = null;
        this.difficultySettings = {
            beginner: { width: 9, height: 9, mines: 10 },
            intermediate: { width: 16, height: 16, mines: 40 },
            expert: { width: 16, height: 30, mines: 99 },
            custom: { width: 10, height: 10, mines: 10 }
        };
        this.currentDifficulty = 'beginner';
        this.keysPressed = {};
        
        this.initializeEventListeners();
        this.startNewGame();
    }
    
    // イベントリスナーの初期化
    initializeEventListeners() {
        // 難易度選択ボタン
        document.querySelectorAll('.difficulty-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                this.currentDifficulty = button.id;
                
                // カスタム設定の表示/非表示
                const customSettings = document.getElementById('custom-settings');
                customSettings.classList.toggle('hidden', this.currentDifficulty !== 'custom');
            });
        });
        
        // 新しいゲームボタン
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        // ゲームボード上のクリックイベント
        document.getElementById('game-board').addEventListener('click', (e) => {
            if (!this.game) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Ctrlキーまたはcommandキー（Mac）が押されている場合はフラグを立てる
            if (e.ctrlKey || e.metaKey) {
                this.game.toggleFlag(row, col);
                this.game.updateBoard();
            } else if (!this.game.gameStarted) {
                this.game.revealCell(row, col);
                this.game.updateBoard();
            }
        });
        
        // キーボードイベント
        document.addEventListener('keydown', (e) => {
            if (!this.game) return;
            
            // ゲーム中は矢印キーによるスクロールを防止
            if (this.game.gameStarted && !this.game.gameOver && 
                (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                 e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                 e.key === ' ' || e.key === 'Spacebar')) {
                e.preventDefault();
            }
            
            if (!this.game.gameStarted || this.game.gameOver) return;
            
            this.keysPressed[e.key] = true;
            
            // 移動処理
            this.handleMovement();
        });
        
        document.addEventListener('keyup', (e) => {
            delete this.keysPressed[e.key];
        });
    }
    
    // キー入力に基づく移動処理
    handleMovement() {
        // スペースキーが押されているかチェック
        const isJumping = this.keysPressed[' '] || this.keysPressed['Spacebar'];
        
        // 方向キーの状態をチェック
        const up = this.keysPressed['ArrowUp'] || this.keysPressed['w'];
        const down = this.keysPressed['ArrowDown'] || this.keysPressed['s'];
        const left = this.keysPressed['ArrowLeft'] || this.keysPressed['a'];
        const right = this.keysPressed['ArrowRight'] || this.keysPressed['d'];
        
        // 移動方向の決定
        let direction = null;
        
        if (up && left) direction = 'up-left';
        else if (up && right) direction = 'up-right';
        else if (down && left) direction = 'down-left';
        else if (down && right) direction = 'down-right';
        else if (up) direction = 'up';
        else if (down) direction = 'down';
        else if (left) direction = 'left';
        else if (right) direction = 'right';
        
        // 方向が決定されていれば移動
        if (direction) {
            if (isJumping) {
                this.game.jumpShip(direction);
            } else {
                this.game.moveShip(direction);
            }
        }
    }
    
    // 新しいゲームを開始
    startNewGame() {
        // 既存のタイマーがあれば停止
        if (this.game && this.game.timerInterval) {
            clearInterval(this.game.timerInterval);
        }
        
        // 現在の難易度に基づいて設定を取得
        let settings;
        
        if (this.currentDifficulty === 'custom') {
            const width = parseInt(document.getElementById('custom-width').value) || 10;
            const height = parseInt(document.getElementById('custom-height').value) || 10;
            const mines = parseInt(document.getElementById('custom-mines').value) || 10;
            
            // 値の検証
            settings = {
                width: Math.min(Math.max(width, 5), 50),
                height: Math.min(Math.max(height, 5), 50),
                mines: Math.min(Math.max(mines, 1), Math.floor(width * height * 0.8))
            };
            
            // 入力欄を更新
            document.getElementById('custom-width').value = settings.width;
            document.getElementById('custom-height').value = settings.height;
            document.getElementById('custom-mines').value = settings.mines;
        } else {
            settings = this.difficultySettings[this.currentDifficulty];
        }
        
        // ゲームの初期化
        this.game = new MinesweeperGame(settings.width, settings.height, settings.mines);
        
        // UI更新
        document.getElementById('mines-left').textContent = settings.mines;
        document.getElementById('timer').textContent = '0';
        document.getElementById('game-status').textContent = '';
        document.getElementById('game-status').className = '';
        
        // ゲームボードの更新
        this.game.updateBoard();
        
        // ゲームオーバーオーバーレイを削除
        const overlay = document.querySelector('.game-over-overlay');
        if (overlay) overlay.remove();
    }
}

// ページ読み込み時にゲームを初期化
document.addEventListener('DOMContentLoaded', () => {
    new GameController();
});
