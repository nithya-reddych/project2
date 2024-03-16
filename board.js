document.addEventListener('DOMContentLoaded', async () => { 
    let validWords = []; 
    let word = '';
    let currChance = 0;
    let currGuess = '';
    let gameWon = false; 
    let reveal = false;
    let keyColor = new Set();
    const board = document.getElementById('board');
    const keyboardDiv = document.getElementById('keyboard');
    const message = document.createElement('div'); 
    message.id = 'message';
    document.body.insertBefore(message, board); 

    const avgGuessesCookie = getCookie('avgGuesses');
    let totalAttempts = 0;
    let numGamesPlayed = 0;
    if (avgGuessesCookie) {
        const cookieData = JSON.parse(avgGuessesCookie);
        totalAttempts = cookieData.totalAttempts;
        numGamesPlayed = cookieData.numGamesPlayed;
    }
  
    await fetchWord(); 
    RandomAnswer();
  
    Board();
    keyBoard();
    PhyKeyboard();
  
    document.getElementById('restartButton').addEventListener('click', restartGame);
  
    async function fetchWord() {
      try {
        const response = await fetch('https://random-word-api.herokuapp.com/word?length=5');
        const data = await response.json();
        if (data && data.length > 0) {
          word = data[0].toUpperCase(); 
          console.log('Word:', word);
        }
      } catch (error) {
        console.error('Failed to fetch from API:', error);
      }
    }
  
    function RandomAnswer(){
        if (validWords.length > 0) {
            const randomIndex = Math.floor(Math.random() * validWords.length);
            word = validWords[randomIndex];
        }
    }
  
    document.getElementById('restartButton').addEventListener('click', restartGame);
  
    function Board() {
        board.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            board.appendChild(cell);
        }
    }
  
    function keyBoard() {
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
        ];
    
        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            row.forEach(key => {
            const keyElement = document.createElement('button');
            keyElement.textContent = key;
            keyElement.id = key;
            keyElement.addEventListener('click', () => keyButtons(key));
            rowDiv.appendChild(keyElement);
            });
            keyboardDiv.appendChild(rowDiv);
        });
    }

    function keyButtons(key) {
        if (!gameWon && !reveal) { 
            if (currGuess.length === 5 && !currGuess.includes('')) {
            return; 
            }
            if (key === 'ENTER') {
            if (currGuess.length === 5) {
                handleGuess(currGuess.toUpperCase());
                currGuess = ''; 
            }
            } else if (key === '⌫' || key === 'BACKSPACE') {
            currGuess = currGuess.slice(0, -1); 
            } else if (currGuess.length < 5 && /^[A-Z]$/i.test(key)) {
            currGuess += key;
            }
            colorDisplay();
        }
    }
     
    function PhyKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (!gameWon) {
            if ((e.key >= 'a' && e.key <= 'z') || (e.key >= 'A' && e.key <= 'Z')) {
                keyButtons(e.key.toUpperCase());
            } else if (e.key === 'Enter') {
                keyButtons('ENTER');
            } else if (e.key === 'Backspace') {
                keyButtons('⌫');
            }
            }
        });
    }
     
    function handleGuess(guess) {
        if (!gameWon) { 
            if (currChance < 6) {
                const guessResult = evaluateGuess(guess.toUpperCase());
                displayRes(guess.toUpperCase(), guessResult);
            
            if (guess.toUpperCase() === word) {
                displayMessage('Yay! Awesome', 5000);
                document.getElementById('restartButton').textContent = 'Play Again';
                document.getElementById('restartButton').style.display = 'block';
                gameWon = true; 

                totalAttempts += currChance;
                numGamesPlayed++;
                const avgGuesses = totalAttempts / numGamesPlayed;
                setCookie('avgGuesses', JSON.stringify({ totalAttempts, numGamesPlayed }), 365);

            } else {
                currChance++;
                if (currChance >= 6) {
                    displayMessage(`The word is: ${word}`, 5000);
                    document.getElementById('restartButton').style.display = 'block';
                }
            }
            }
        }   
    }

    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/';
    }

    function getCookie(name) {
        const nameEQ = name + '=';
        const cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1, cookie.length);
            }
            if (cookie.indexOf(nameEQ) === 0) {
                return cookie.substring(nameEQ.length, cookie.length);
            }
        }
        return null;
    }
 
    function colorDisplay() {
        const cells = board.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const attemptIndex = Math.floor(index / 5);
            const letterIndex = index % 5;
            if (attemptIndex === currChance) {
            cell.textContent = currGuess[letterIndex] || '';
            cell.classList.remove('correct', 'wrongPlace', 'notInWord','pop');
            if (currGuess[letterIndex]) {
                cell.classList.add('pop'); 
            }
            }
        });
    }
  
    function evaluateGuess(guess) {
        const result = new Array(5).fill('notInWord');
        const unmatchedLetters = new Array(5).fill(true); 
            guess.split('').forEach((letter, index) => {
            if (word[index] === letter) {
            result[index] = 'correct';
            unmatchedLetters[index] = false;
            }
        });
        guess.split('').forEach((letter, guessIndex) => {
                word.split('').forEach((answerLetter, answerIndex) => {
                if (letter === answerLetter && guessIndex !== answerIndex && unmatchedLetters[answerIndex]) {
                    result[guessIndex] = 'wrongPlace';
                    unmatchedLetters[answerIndex] = false;
                }
                });
        });    
        return result.map((status, index) => ({
            letter: guess[index],
            status
        }));
    }   
  
    function getLetterStatus(letter, index) {
        if (word[index] === letter) {
            return 'correct';
        } else if (word.includes(letter)) {
            return 'wrongPlace';
        } else {
            return 'notInWord';
        }
    }
  
    function displayRes(guess, guessResult) {
        reveal = true; 
        const start = currChance * 5;
        guessResult.forEach((result, index) => {
            const cell = board.children[start + index];
            cell.classList.remove('flip');
            setTimeout(() => {
            cell.textContent = result.letter;
            cell.className = 'cell'; 
            cell.classList.add(result.status, 'flip'); 
            if (result.status === 'correct') {
                keyColor.add(result.letter);
            }
            if (index === guessResult.length - 1) {
                updateKeyboardColor(guessResult);
                reveal = false; 
            }
            }, index * 500); 
        });
    }  

    function updateKeyboardColor(guessResult) {
        guessResult.forEach(result => {
            const keyElement = document.getElementById(result.letter);
            if (keyElement) {
                const isCorrect = keyColor.has(result.letter);
                if (isCorrect) {
                    keyElement.style.backgroundColor = '#6ca965'; 
                    keyElement.style.color = 'white';

                } else {
                    keyElement.style.backgroundColor = getBackgroundColor(result.status);
                    keyElement.style.color = 'white'; 
                }
            }
        });
    }

    function getBackgroundColor(status) {
        switch (status) {
            case 'correct':
                return '#6ca965'; 
            case 'wrongPlace':
                return '#c8b653'; 
            default:
                return '#787c7f';
        }
    }

    function displayMessage(text, duration){
        message.textContent = text; 
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, duration);
    }
     
    function restartGame() {
        currChance = 0;
        currGuess = '';
        gameWon = false; 
        displayMessage('', 0); 
        fetchWord().then(() => {
            RandomAnswer(); 
            console.log('New word:', word); 
            document.getElementById('restartButton').style.display = 'none';
            keyboardDiv.innerHTML = '';
            keyBoard();
            Board();
        });
    }
});