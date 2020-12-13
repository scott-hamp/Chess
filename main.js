const chess = new Chess();

const stockfish = STOCKFISH();

stockfish.onmessage = function(event) 
{
    StockfishReceiveData(event.data ? event.data : event);
};


var squares = [ "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8" ];

var pieces = [ "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "R1", "R2", "N1", "N2", "B1", "B2", "Q1", "Q2", "K", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "r1", "r2", "n1", "n2", "b1", "b2", "q1", "q2", "k" ];

var piecesMap = new Array(8);

for (var i = 0; i < piecesMap.length; i++) 
	piecesMap[i] = new Array(8);

for (var i = 0; i < 8; i++) 
{ 
	for (var j = 0; j < 8; j++) 
		piecesMap[i][j] = "";
}

var turn = 0;
var playerPlayAs = 0;
var gameEnded = false;
var gameResult = "";
var gameScore = "";
var halfMoveIndex = -1;
var fullMoveIndex = -1;
var halfMovesHistory = new Array(0);
var FENHistory = new Array(0);

var pieceSelected = "";
var pieceSelectedMoves = null;

var stockfishIsReady = false;
var stockfishEnabledAsPlayer = false;

var currentPuzzle = null;

var squarePixelSize = 90;
var pieceAnimationSpeed = 2;
var pieceAnimationSpeedReal = pieceAnimationSpeed * (squarePixelSize / 90);


function AnimatePieceUsingMoveObject(piece, moveObject) 
{
	var element = document.getElementById("piece_" + piece);
	
	var rank = moveObject.to.charAt(1);
	var file = moveObject.to.charAt(0);

	var fileNumber = GetFileNumberForLetter(file);

	var xx = ((fileNumber - 1) * squarePixelSize) + (10 * (squarePixelSize / 90));
	var yy = ((squarePixelSize * 7) - ((rank - 1) * squarePixelSize)) + (10 * (squarePixelSize / 90));

	x = element.offsetLeft;
	y = element.offsetTop; 

	var x1 = GetFileNumberForLetter(moveObject.from.charAt(0)) - 1;
	var y1 = moveObject.from.charAt(1) - 1;
	var x2 = GetFileNumberForLetter(moveObject.to.charAt(0)) - 1;
	var y2 = moveObject.to.charAt(1) - 1;

	var pieceAtMoveTo = piecesMap[x2][y2];
	var pieceAtMoveToHidden = false;

	var f1 = setInterval(AnimatePieceUsingMoveObjectUpdate, 1);

    function AnimatePieceUsingMoveObjectUpdate() 
	{
		if (x == xx && y == yy)
		{
		  piecesMap[x1][y1] = "";
		  
		  SetPiecePosition(piece, moveObject.to);

		  if(moveObject.san.includes("=Q"))
		  {
			var pieceColor = GetPieceColor(piece);

			if(pieceColor == "white")
			{
				ShowHidePiece("Q2", true);
				SetPiecePosition("Q2", moveObject.to);

				ShowHidePiece(piece, false);

				piecesMap[x2][y2] = "Q2";
			}
			else
			{
				ShowHidePiece("q2", true);
				SetPiecePosition("q2", moveObject.to);

				ShowHidePiece(piece, false);

				piecesMap[x2][y2] = "q2";
			}
		  }

		  NextTurn(moveObject);

		  clearInterval(f1);
		} 
		else 
		{
		  if(x < xx) x += pieceAnimationSpeedReal;
		  if(x > xx) x -= pieceAnimationSpeedReal;
		  if(y < yy) y += pieceAnimationSpeedReal;
		  if(y > yy) y -= pieceAnimationSpeedReal;

		  var distance = GetDistance(x, y, xx, yy);

		  if(distance <= (pieceAnimationSpeedReal * 1.5))
		  {
			 x = xx;
			 y = yy;
		  }

		  element.style.left = x + "px";
		  element.style.top = y + "px";

		  if(pieceAtMoveTo.length > 0 && !pieceAtMoveToHidden)
		  {
			 if(distance <= 50)
			 {
				 pieceAtMoveToHidden = true;
				 ShowHidePiece(pieceAtMoveTo, false);
			 }
		  }
		}
	}
}

function AnimatePieceUsingMoveTo(piece, to) 
{
	var element = document.getElementById("piece_" + piece);
	
	var rank = to.charAt(1);
	var file = to.charAt(0);

	var fileNumber = GetFileNumberForLetter(file);

	var _xx = ((fileNumber - 1) * squarePixelSize) + (10 * (squarePixelSize / 90));
	var _yy = ((squarePixelSize * 7) - ((rank - 1) * squarePixelSize)) + (10 * (squarePixelSize / 90));

	_x = element.offsetLeft;
	_y = element.offsetTop;

	var from = GetPiecePosition(piece);

	var _x1 = GetFileNumberForLetter(from.charAt(0)) - 1;
	var _y1 = from.charAt(1) - 1;
	var _x2 = GetFileNumberForLetter(to.charAt(0)) - 1;
	var _y2 = to.charAt(1) - 1;

	var pieceAtMoveTo = piecesMap[_x2][_y2];
	var pieceAtMoveToHidden = false;

	var _f1 = setInterval(AnimatePieceUsingMoveToUpdate, 1);

    function AnimatePieceUsingMoveToUpdate() 
	{
		if (_x == _xx && _y == _yy)
		{
		  piecesMap[_x1][_y1] = "";

		  SetPiecePosition(piece, moveObject.to);

		  clearInterval(_f1);
		} 
		else 
		{
		  if(_x < _xx) _x += pieceAnimationSpeedReal;
		  if(_x > _xx) _x -= pieceAnimationSpeedReal;
		  if(_y < _yy) _y += pieceAnimationSpeedReal;
		  if(_y > _yy) _y -= pieceAnimationSpeedReal;

		  var distance = GetDistance(_x, _y, _xx, _yy);

		  if(distance <= (pieceAnimationSpeedReal * 1.5))
		  {
			 _x = _xx;
			 _y = _yy;
		  }

		  element.style.left = _x + "px";
		  element.style.top = _y + "px";
		}
	}
}

function ClearHighlights()
{
	for (var i = 0; i < 8; i++) 
	{ 
		for (var j = 0; j < 8; j++) 
		{ 
			var rank = j + 1;
			var file = GetLetterForFileNumber(i + 1);

			HighlightSquare(file + rank, "");
		} 
	}
}

function ClearPiecesMap()
{
	piecesMap = new Array(8);

	for (var i = 0; i < piecesMap.length; i++) 
		piecesMap[i] = new Array(8);

	for (var i = 0; i < 8; i++) 
	{ 
		for (var j = 0; j < 8; j++) 
			piecesMap[i][j] = "";
	}
}

function GetDistance(x1, y1, x2, y2) 
{
	
	var xs = x2 - x1;
	var ys = y2 - y1;	
	
	xs *= xs;
	ys *= ys;
	 
	return Math.sqrt(xs + ys);
};

function GetFileNumberForLetter(letter)
{
	switch(letter) 
	{
	  case 'a':
		return 1;
		break;
      case 'b':
		return 2;
		break;
	  case 'c':
		return 3;
		break;
	  case 'd':
		return 4;
		break;
	  case 'e':
		return 5;
		break;
	  case 'f':
		return 6;
		break;
      case 'g':
		return 7;
		break;
      case 'h':
		return 8;
		break;
	  default:
		return -1;
	}

	return fileNumber;
}

function GetLetterForFileNumber(number)
{
	switch(number) 
	{
	  case 1:
		return 'a';
		break;
      case 2:
		return 'b';
		break;
	  case 3:
		return 'c';
		break;
	  case 4:
		return 'd';
		break;
	  case 5:
		return 'e';
		break;
	  case 6:
		return 'f';
		break;
      case 7:
		return 'g';
		break;
      case 8:
		return 'h';
		break;
	  default:
		return ' '
	}

	return fileNumber;
}

function GetPieceAtPosition(position)
{
	var rank = position.charAt(1);
	var file = position.charAt(0);

	var fileNumber = GetFileNumberForLetter(file);

	return piecesMap[fileNumber - 1][rank - 1];
}

function GetPieceColor(piece)
{
	var chr = piece.charAt(0);

	if(chr == 'P' || chr == 'R' || chr == 'N' || chr == 'B' || 
	   chr == 'Q' || chr == 'K')
	   return "white";

	return "black";
}

function GetPiecePosition(piece)
{
	for (var i = 0; i < 8; i++) 
	{ 
		for (var j = 0; j < 8; j++) 
		{ 
			if(piecesMap[i][j] != piece) continue;

			var rank = j + 1;
			var file = GetLetterForFileNumber(i + 1);

			return file + rank;
		} 
	}

	return " ";
}

function GetTimeString()
{
	var date = new Date();
	var y = (date.getFullYear() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var m = (date.getMonth() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var d = (date.getDate() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var h = (date.getHours() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var ms = (date.getMinutes() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});
	var s = (date.getSeconds() + "").toLocaleString
		('en-US', {minimumIntegerDigits: 2, useGrouping:false});

	return y + "/" + m + "/" + d + " " + h + ":" + ms + ":" + s;
}

function HighlightSquare(position, type)
{
	var element = document.getElementById("square_" + position + "_img");

	var squareColor = chess.square_color(position);
	var squareColorNumber = 0;
	if(squareColor == "dark")
		squareColorNumber = 1;

	var imageSource = "Images\\square-" + squareColorNumber;

	if(type.length > 0)
	{
		imageSource += "-" + type;
	}

	imageSource += ".png";

	element.src = imageSource;
}

function Move(piece, move)
{
	var moveObject = chess.move(move, { sloppy: true });

	ClearHighlights();
	HighlightSquare(moveObject.from, "from");
	HighlightSquare(moveObject.to, "to");

	AnimatePieceUsingMoveObject(piece, moveObject);

	var color = GetPieceColor(pieceSelected);

	if(move == "O-O" || move == "O-O-O")
	{
		if(move == "O-O")
		{
			if(color == "white")
				AnimatePieceUsingMoveTo("R2", "f1");
			else
				AnimatePieceUsingMoveTo("r2", "f8");
		}
		else
		{
			if(color == "white")
				AnimatePieceUsingMoveTo("R1", "d1");
			else
				AnimatePieceUsingMoveTo("r1", "d8");
		}
	}
}

function NextTurn(moveObject)
{
	if(turn == 0)
		turn = 1;
	else
		turn = 0;

	halfMoveIndex++;
	if(fullMoveIndex < 0)
		fullMoveIndex++;
	else
	{
		if(halfMoveIndex % 2 == 0)
			fullMoveIndex++;
	}

	if(halfMoveIndex <= halfMovesHistory.length - 1)
	{
		while(halfMoveIndex <= halfMovesHistory.length - 1)
		{
			halfMovesHistory.pop();
			FENHistory.pop();
		}
	}

	halfMovesHistory.push(moveObject.san);
	FENHistory.push(chess.fen());

	pieceSelected = "";
	pieceSelectedMoves = null;

	if(chess.in_check())
	{
		var position = GetPiecePosition("K");
		if(turn == 1)
			position = GetPiecePosition("k");

		if(chess.in_checkmate())
		{
			HighlightSquare(position, "checkmate");
		}
		else
		{
			HighlightSquare(position, "check");
		}
	}

	if(chess.game_over())
	{
		gameEnded = true;
		gameScore = "1/2-1/2";

		if(chess.in_checkmate())
		{
			gameResult = "Checkmate.";
			gameScore = "0-1";

			if(turn == 1)
				gameScore = "1-0";
		}

		if(chess.in_threefold_repetition())
		{
			gameResult = "Threefold repetition.";
			gameScore = "1/2-1/2";
		}

		if(chess.insufficient_material())
		{
			gameResult = "Insufficient material.";
			gameScore = "1/2-1/2";
		}

		alert(gameResult + "\nScore: " + gameScore);
	}

	if(stockfishEnabledAsPlayer)
		UpdateStockfishMessage("Ready.");

	UpdateStockfish(moveObject);

	UpdateTextAreas();
	UpdateOpeningDetails();
}

function PieceClicked(piece)
{
	if(gameEnded) return;

	var position = GetPiecePosition(piece);
	var color = GetPieceColor(piece);

	if(pieceSelected.length > 0)
	{
		if(GetPieceColor(pieceSelected) != color)
		{
			for (var i = 0; i < pieceSelectedMoves.length; i++) 
			{ 
				if(pieceSelectedMoves[i].to != position) continue;

				Move(pieceSelected, pieceSelectedMoves[i].san);

				break;
			} 
		
			return;
		}
	}

	if(stockfishEnabledAsPlayer)
	{
		if(playerPlayAs != turn) return;
	}

	if((color == "white" && turn == 1) || 
		(color == "black" && turn == 0))
		return;

	pieceSelected = piece;

	pieceSelectedMoves = chess.moves({ square: position, verbose: true });

	ClearHighlights();
	HighlightSquare(position, "move");

	for (var i = 0; i < pieceSelectedMoves.length; i++) 
	{ 
        HighlightSquare(pieceSelectedMoves[i].to, "move");
    } 
}

function Reset()
{
	chess.reset();

	gameEnded = false;
	gameResult = "";
	gameScore = "";
	turn = 0;
	halfMoveIndex = -1;
	fullMoveIndex = -1;
	halfMovesHistory = new Array(0);
	FENHistory = new Array(0);

	pieceSelected = "";
    pieceSelectedMoves = null;
    
    currentPuzzle = null;

	SetPiecesStarting();

	ResetStockfish();

	UpdateTextAreas();
    UpdateOpeningDetails();
    UpdatePuzzleDetails();
	ClearHighlights();
}

function ResetPuzzle()
{
    if(currentPuzzle == null) return;

    var puzzle = currentPuzzle;

    Reset();

	chess.load(puzzle.FEN);
	
	turn = 0;
	if(chess.turn() == 'b') turn = 1;

    SetPiecesToBoard();

    currentPuzzle = puzzle;

    UpdateTextAreas();
    UpdateOpeningDetails();
    UpdatePuzzleDetails();
}

function ResetStockfish()
{
	StockfishPostMessage("position startpos");
}

function SaveGame()
{
	var text = "";

	var date = new Date();
	text += GetTimeString();
	text += "\n" + document.getElementById("FENTextArea").value;
	text += "\n" + document.getElementById("movesTextArea").value;

	if(gameEnded)
		text += "\n" + gameResult + "\nScore: " + gameScore;
	
	var blob = new Blob([ text ], { type: 'text/plain' });
	  
	var name = "game.txt";

  	var a = document.createElement("a");
  	a.download = name;
	a.href = window.URL.createObjectURL(blob);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function SaveBoardAsImage()
{
	html2canvas(document.getElementById("board")).then
		(function(canvas) 
		{
			try
			{
				var image = canvas.toDataURL("image/png").replace
					("image/png", "image/octet-stream"); 
				image.crossOrigin = "anonymous";

				var a = document.createElement('a');
				a.setAttribute('download', 'board.png');
				a.setAttribute('href', image);
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
			catch(error)
			{
				alert("Could not save the board as an image. \n\"" + error.message + "\"");
			}
		});
}

function SetMoveRelative(by)
{
	if(halfMoveIndex < 0) return;

	halfMoveIndex = Math.min(Math.max(halfMoveIndex + by, 0), halfMovesHistory.length - 1);

	fullMoveIndex = 0;

	for(var i = 0; i < halfMoveIndex; i++)
	{
		if((i + 1) % 2 == 0)
			fullMoveIndex++;
	}

	chess.load(FENHistory[halfMoveIndex]);

	turn = 0;
	if(chess.turn() == 'b') turn = 1;

	pieceSelected = "";
	pieceSelectedMoves = null;

	SetPiecesToBoard();

	UpdateTextAreas();
	ClearHighlights();
}

function SetMoves(moves)
{
	moves = moves.trim();

	Reset();

	for(var i = 1; i < 1000; i++)
		moves = moves.replace(i + ". ", "");

	var parts = moves.split(" ");

	for(var i = 0; i < parts.length; i++)
	{
		var move = parts[i].trim();
		var moveObject = chess.move(move, { sloppy: true });

		var piece = GetPieceAtPosition(moveObject.from);
		var pieceAtMoveTo = GetPieceAtPosition(moveObject.to);

		var rank = moveObject.from.charAt(1);
		var file = moveObject.from.charAt(0);

		var fileNumber = GetFileNumberForLetter(file);

		piecesMap[fileNumber - 1][rank - 1] = "";

		SetPiecePosition(piece, moveObject.to);

		if(pieceAtMoveTo.length > 0)
			ShowHidePiece(pieceAtMoveTo, false);

		var color = GetPieceColor(piece);

		if(move.includes("=Q"))
		{
			ShowHidePiece(piece, false);

			if(color == "white")
			{
				ShowHidePiece("Q2", true);
				SetPiecePosition("Q2", moveObject.to);
			}
			else
			{
				ShowHidePiece("q2", true);
				SetPiecePosition("q2", moveObject.to);
			}
		}
		else
		{
			if(move == "O-O" || move == "O-O-O")
			{
				if(move == "O-O")
				{
					if(color == "white")
						SetPiecePosition("R2", "f1");
					else
						SetPiecePosition("r2", "f8");
				}
				else
				{
					if(color == "white")
						SetPiecePosition("R1", "d1");
					else
						SetPiecePosition("r1", "d8");
				}
			}
		}

		halfMoveIndex++;
		if(fullMoveIndex < 0)
			fullMoveIndex++;
		else
		{
			if(halfMoveIndex % 2 == 0)
				fullMoveIndex++;
		}

		halfMovesHistory.push(moveObject.san);
		FENHistory.push(chess.fen());
	}

	turn = 0;
	if(chess.turn() == 'b') turn = 1;

	UpdateTextAreas();
	UpdateOpeningDetails();
}

function SetPiecePosition(piece, position) 
{
	var element = document.getElementById("piece_" + piece);
	
	var rank = position.charAt(1);
	var file = position.charAt(0);

	var fileNumber = GetFileNumberForLetter(file);

	var x = ((fileNumber - 1) * squarePixelSize) + (10 * (squarePixelSize / 90));
	var y = ((squarePixelSize * 7) - ((rank - 1) * squarePixelSize)) + (10 * (squarePixelSize / 90));

	element.style.left = x + "px";
	element.style.top = y + "px";

	piecesMap[fileNumber - 1][rank - 1] = piece;
}

function SetPiecesStarting()
{
	ClearPiecesMap();

	for(var i = 0; i < pieces.length; i++)
		ShowHidePiece(pieces[i], true);

	SetPiecePosition("P1", "a2");
	SetPiecePosition("P2", "b2");
	SetPiecePosition("P3", "c2");
	SetPiecePosition("P4", "d2");
	SetPiecePosition("P5", "e2");
	SetPiecePosition("P6", "f2");
	SetPiecePosition("P7", "g2");
	SetPiecePosition("P8", "h2");
	SetPiecePosition("R1", "a1");
	SetPiecePosition("R2", "h1");
	SetPiecePosition("N1", "b1");
	SetPiecePosition("N2", "g1");
	SetPiecePosition("B1", "c1");
	SetPiecePosition("B2", "f1");
	SetPiecePosition("Q1", "d1");
	SetPiecePosition("K", "e1");
	ShowHidePiece("Q2", false);

	SetPiecePosition("p1", "a7");
	SetPiecePosition("p2", "b7");
	SetPiecePosition("p3", "c7");
	SetPiecePosition("p4", "d7");
	SetPiecePosition("p5", "e7");
	SetPiecePosition("p6", "f7");
	SetPiecePosition("p7", "g7");
	SetPiecePosition("p8", "h7");
	SetPiecePosition("r1", "a8");
	SetPiecePosition("r2", "h8");
	SetPiecePosition("n1", "b8");
	SetPiecePosition("n2", "g8");
	SetPiecePosition("b1", "c8");
	SetPiecePosition("b2", "f8");
	SetPiecePosition("q1", "d8");
	SetPiecePosition("k", "e8");
	ShowHidePiece("q2", false);
}

function SetPiecesToBoard()
{
	ClearPiecesMap();

	for(var i = 0; i < pieces.length; i++)
		ShowHidePiece(pieces[i], true);

	var piecesSet = new Array(0);

	for(var i = 0; i < squares.length; i++)
	{
		var pieceObject = chess.get(squares[i]);

		if(pieceObject == null) continue;

		var value = pieceObject.type;

		if(pieceObject.color == 'w') value = value.toUpperCase();

		for(var j = 0; j < pieces.length; j++)
		{
			if(pieces[j].charAt(0) != value) continue;
			if(piecesSet.includes(pieces[j])) continue;

			SetPiecePosition(pieces[j], squares[i]);

			piecesSet.push(pieces[j]);

			break;
		}
	}

	for(var i = 0; i < pieces.length; i++)
	{
		if(piecesSet.includes(pieces[i])) continue;

		ShowHidePiece(pieces[i], false);
	}
}

function SetToRandomPuzzle()
{
    var puzzle = GetRandomPuzzle();

    var validation = chess.validate_fen(puzzle.FEN);

    while(!validation.valid)
    {
        /*
        alert("FEN string is invalid.\n" + puzzle.FEN + "\n\"" + 
            validation.error + "\"");
        */

        puzzle = GetRandomPuzzle();
        validation = chess.validate_fen(puzzle.FEN);
    }

    Reset();

	chess.load(puzzle.FEN);
	
	turn = 0;
	if(chess.turn() == 'b') turn = 1;

    SetPiecesToBoard();

    currentPuzzle = puzzle;

    UpdateTextAreas();
    UpdateOpeningDetails();
    UpdatePuzzleDetails();
}

function Setup()
{
    SetupOpenings();
    SetupPuzzles();

	SetPiecesStarting();

	UpdateTextAreas();

	StockfishPostMessage("uci");
}

function ShowHidePiece(piece, show)
{
	var element = document.getElementById("piece_" + piece);

	if (show) 
	{
        element.style.display = "block";
    } 
	else 
	{
        element.style.display = "none";
    }
}

function ShowPuzzleSolution()
{
    if(currentPuzzle == null) return;

    document.getElementById("puzzleSolutionSpan").style.display = "inline";
}

function SquareClicked(square)
{
	if(pieceSelected.length == 0)
		return;

	for (var i = 0; i < pieceSelectedMoves.length; i++) 
	{ 
        if(pieceSelectedMoves[i].to != square) continue;

		var san = pieceSelectedMoves[i].san;

		Move(pieceSelected, san);

		break;
    }
}

function StockfishBestMoveDecided(moveAsFromTo)
{
	if(stockfishEnabledAsPlayer)
	{
		if(playerPlayAs == turn)
			return;

		var from = moveAsFromTo.substr(0, 2);
		var piece = GetPieceAtPosition(from);

		Move(piece, moveAsFromTo);

		UpdateStockfishMessage("Moving...");
	}
}

function StockfishPostMessage(message)
{
	stockfish.postMessage(message);
}

function StockfishReceiveData(data)
{
	console.log("StockfishReceiveData: '" + data + "'");

	if(!stockfishIsReady)
	{
		if(data == "uciok")
		{
			stockfishIsReady = true;

			UpdateStockfishMessage("Ready.");
		}

		return;
	}

	var parts = data.split(" ");

	if(parts[0] == "bestmove")
		StockfishBestMoveDecided(parts[1]);

	UpdateStockfishMessage("Ready.");
}

function TextAreaSelect(textArea, start, end) 
{
    if(textArea.createTextRange) 
	{
        var range = textArea.createTextRange();

        range.collapse(true);
        range.moveStart('character', start);
        range.moveEnd('character', end);
        range.select();
    } 
	else if(textArea.setSelectionRange) 
	{
        textArea.setSelectionRange(start, end);
    } 
	else if(textArea.selectionStart) 
	{
        textArea.selectionStart = start;
        textArea.selectionEnd = end;
    }

    textArea.focus();
} 

function UpdateMovesTextArea()
{
	var movesTextArea = document.getElementById("movesTextArea");

	if(halfMoveIndex == -1)
	{
		movesTextArea.value = "";

		return;
	}

	var pgnMoves = "";

	var fullMoveCounter = 0;

	for(var i = 0; i < halfMovesHistory.length; i++)
	{
		if(i == 0 || i % 2 == 0)
		{
			fullMoveCounter++;
			pgnMoves += fullMoveCounter + ". ";
		}

		pgnMoves += halfMovesHistory[i] + " ";
	}

	pgnMoves = pgnMoves.trim();

	movesTextArea.value = pgnMoves;

	if(fullMoveIndex >= 0)
	{
		var parts = pgnMoves.split(" ");

		move = parts[halfMoveIndex + (fullMoveIndex + 1)];

		var indexFirst = pgnMoves.search((fullMoveIndex + 1) + ". ");
		var indexSecond = pgnMoves.indexOf(move, indexFirst);
		var indexThird = pgnMoves.indexOf(" ", indexSecond);

		if(indexThird == -1)
			indexThird = pgnMoves.length + 1;

		TextAreaSelect(document.getElementById('movesTextArea'), indexSecond, indexThird);
	}
}

function UpdateOpeningDetails()
{
	var movesTextArea = document.getElementById("movesTextArea");

	if(movesTextArea.value.length == 0)
	{
		openingDetailsSpan.textContent = "...";

		return;
	}

	var opening = GetOpeningMatchingMoves(movesTextArea.value);

	openingDetailsSpan = document.getElementById("openingDetailsSpan");

	if(opening == null)
	{
		var textContent = openingDetailsSpan.textContent;

		if(textContent.length > 3)
		{
			if(textContent.substr(textContent.length - 3) != "...")
				openingDetailsSpan.textContent = textContent + "...";
		}

		return;
	}

	openingDetailsSpan.textContent = "(" + opening.ECOCode + ") " + opening.name;
}

function UpdatePuzzleDetails()
{
    if(currentPuzzle == null)
    {
        document.getElementById("puzzleInstructionsSpan").textContent = "";
        document.getElementById("puzzleDescriptionSpan").textContent = "";
        document.getElementById("puzzleResetButton").style.display = "none";
        document.getElementById("puzzleSolutionButton").style.display = "none";
        document.getElementById("puzzleSolutionSpan").style.display = "none";

        return;
    }

    document.getElementById("puzzleInstructionsSpan").textContent = 
        currentPuzzle.instructions;
    document.getElementById("puzzleDescriptionSpan").textContent = 
        currentPuzzle.description;
    document.getElementById("puzzleResetButton").style.display = 
        "inline";
    document.getElementById("puzzleSolutionButton").style.display = 
        "inline";
    document.getElementById("puzzleSolutionSpan").style.display = 
        "none";
    document.getElementById("puzzleSolutionSpan").textContent = 
        currentPuzzle.solution;
}

function UpdateStockfish(moveObject)
{
	if(!stockfishIsReady) return;

	if(moveObject != null)
	{
		var notation = moveObject.from + moveObject.to;

		StockfishPostMessage("position fen " + chess.fen() + " moves " + notation);
	}
	else
		StockfishPostMessage("position fen " + chess.fen());

	StockfishPostMessage("go depth 1");

	UpdateStockfishMessage("Thinking...");
}

function UpdateStockfishMessage(message)
{
	document.getElementById("stockfishMessageSpan").textContent = message;
}

function UpdateTextAreas()
{
	document.getElementById("FENTextArea").value = chess.fen();
	
	UpdateMovesTextArea();
}


function movesTextArea_OnClick()
{
	UpdateMovesTextArea();
}

function openingsInput_OnInput()
{
	var element = document.getElementById("openingsInput");

	var filter = element.value;

	FillSelectWithOpenings(document.getElementById("openingsSelect"), filter);
}

function openingsSelect_OnChange()
{
	var element = document.getElementById("openingsSelect");

	var index = element.selectedIndex;
	var filter = document.getElementById("openingsInput").value;

	var opening = GetOpeningByIndex(index, filter);

	if(opening == null) return;

	SetMoves(opening.moves);
}

function playerPlayAsSelect_OnChange()
{
	var element = document.getElementById("playerPlayAsSelect");

	playerPlayAs = element.selectedIndex;

	if(halfMovesHistory.length > 0)
		UpdateStockfish(halfMovesHistory[halfMovesHistory.length - 1]);
	else
		UpdateStockfish(null);
}

function stockfishEnableAsPlayerCheckbox_OnClick()
{
	var element = document.getElementById("stockfishEnableAsPlayerCheckbox");

	stockfishEnabledAsPlayer = element.checked;

	if(halfMovesHistory.length > 0)
		UpdateStockfish(halfMovesHistory[halfMovesHistory.length - 1]);
	else
		UpdateStockfish(null);
}