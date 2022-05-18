var timer_start, timer_finish, timer_hide, timer_time, good_positions, best_route, blinking_pos, last_pos, wrong, speed, timerStart;
var game_started = false;


function listener(ev) {
    if(!game_started) return;
    let pos_clicked = parseInt(ev.target.dataset.position);
    if(pos_clicked === 0) return;
    
    if(last_pos === 0){
        document.querySelectorAll('.chess-group.breathing')
            .forEach(el => { el.classList.remove('breathing') });
        document.querySelector('.chess-groups').classList.add('transparent');
        
        if(pos_clicked === blinking_pos || pos_clicked === blinking_pos * 7){
            last_pos = pos_clicked;
            ev.target.classList.add('good');
        }else{
            wrong++;
            ev.target.classList.add('bad');
        }
    }else{
        let pos_jumps = parseInt(document.querySelectorAll('.chess-group')[last_pos].innerText, 10);
        let maxV = maxVertical(last_pos);
        let maxH = maxHorizontal(last_pos);
        
        if(pos_jumps <= maxH && pos_clicked === last_pos + pos_jumps){
            last_pos = pos_clicked;
            ev.target.classList.add('good');
        }else if(pos_jumps <= maxV && pos_clicked === last_pos + (pos_jumps * 7)){
            last_pos = pos_clicked;
            ev.target.classList.add('good');
        }else{
            wrong++;
            ev.target.classList.add('bad');
        }
    }

    check();
}

function addListeners() {
    document.querySelectorAll('.chess-group').forEach(el => {
        el.addEventListener('mousedown', listener);
    });
}

function check() {
    if (wrong === 3) {
        resetTimer();
        game_started = false;

        document.querySelector('.chess-groups').classList.remove('transparent');
        let blocks = document.querySelectorAll('.chess-group');
        good_positions.push(48);
        good_positions.forEach( pos => {
            blocks[pos].classList.add('proper');
        });

        setTimeout(function() { 
            $(".chess-hack").fadeOut();
            resetChess()
            $.post(`https://${GetParentResourceName()}/chess-callback`, JSON.stringify({ 'success': false }));
        }, 4000);
        
        return;
    }
    if (last_pos === 48) {
        stopTimer();
        document.querySelector('.chess-groups').classList.add('hidden');
        document.querySelector('.chess-splash').classList.remove('hidden');
        document.querySelector('.chess-splash .chess-text').innerHTML = 'SUCCESS!';
        setTimeout(function() { 
            $(".chess-hack").fadeOut();
            resetChess()
            $.post(`https://${GetParentResourceName()}/chess-callback`, JSON.stringify({ 'success': true }));
        }, 4000);
    }
}

function maxVertical(pos) {
    return Math.floor((48-pos)/7);
}

function maxHorizontal(pos) {
    let max = (pos+1) % 7;
    if(max > 0) return 7-max;
        else return 0;
}

function generateNextPosition(pos) {
    let maxV = maxVertical(pos);
    let maxH = maxHorizontal(pos);
    if( maxV === 0 ){
        let new_pos = random(random(1, maxH), maxH);
        return [new_pos, pos+new_pos];
    }
    if( maxH === 0 ){
        let new_pos = random(random(1, maxV), maxV);
        return [new_pos, pos+(new_pos*7)];
    }
    if( random(1,1000) % 2 === 0 ){
        let new_pos = random(random(1, maxH), maxH);
        return [new_pos, pos+new_pos];
    }else{
        let new_pos = random(random(1, maxV), maxV);
        return [new_pos, pos+(new_pos*7)];
    }
}

function generateBestRoute(start_pos) {
    let route = [];
    if( random(1,1000) % 2 === 0 ){
        start_pos *= 7;
    }
    while(start_pos < 48){
        let new_pos = generateNextPosition(start_pos);
        route[start_pos] = new_pos[0];
        start_pos = new_pos[1];
    }
    
    return route;
}

function resetChess() {
    game_started = false;
    last_pos = 0;

    resetTimer();
    clearTimeout(timer_start);
    clearTimeout(timer_hide);
    clearTimeout(timer_finish);

    document.querySelectorAll('.chess-group').forEach(el => { el.remove(); });
}

function startChess() {
    wrong = 0;
    last_pos = 0;
    
    blinking_pos = random(1,4);
    best_route = generateBestRoute(blinking_pos);
    good_positions = Object.keys(best_route);

    let div = document.createElement('div');
    div.classList.add('chess-group');
    const groups = document.querySelector('.chess-groups');
    for(let i=0; i < 49; i++){
        let group = div.cloneNode();
        group.dataset.position = i.toString();
        let text;
        switch(i){
            case 0:
                text = '&#xf796;';break;
            case 48:
                text = '&#xf6ff;';break;
            case blinking_pos:
            case (blinking_pos*7):
                group.classList.add('breathing');
                text = random(1,4);
                break;
            default:
                text = random(1,5);
        }
        if( good_positions.includes( i.toString() ) ){
            text = best_route[i];
        }
        group.innerHTML = text;
        groups.appendChild(group);
    }
    addListeners();

    timer_start = sleep(2000, function(){
        document.querySelector('.chess-groups').classList.remove('hidden');
        
        timer_hide = sleep(6000, function(){
            document.querySelector('.chess-groups').classList.add('transparent');
        });
        
        startTimer();
        timer_finish = sleep((speed * 1000), function(){
            game_started = false;
            wrong = 3;
            check();
        });
    });
}

function startTimer() {
    timerStart = new Date();
    timer_time = setInterval(timer,1);
}

function timer() {
    let timerNow = new Date();
    let timerDiff = new Date();
    timerDiff.setTime(timerNow - timerStart);
    let ms = timerDiff.getMilliseconds();
    let sec = timerDiff.getSeconds();
    if (ms < 10) {ms = "00"+ms;}else if (ms < 100) {ms = "0"+ms;}
}

function stopTimer() {
    clearInterval(timer_time);
}

function resetTimer() {
    clearInterval(timer_time);
}

window.addEventListener('message', (event) => {
    if (event.data.action === 'chess-start') {
        speed = event.data.speed
        document.querySelector('.chess-splash').classList.remove('hidden');
        document.querySelector('.chess-splash .chess-text').innerHTML = 'Network Access Blocked... Override Required';
        $(".chess-hack").fadeIn()
        sleep(3000, function() {
            document.querySelector('.chess-splash').classList.add('hidden');
            document.querySelector('.chess-groups').classList.remove('hidden', 'playing');
            game_started = true;
            startChess();
        });
    }
});

document.addEventListener("keydown", function(ev) {
    let key_pressed = ev.key;
    let valid_keys = ['Escape'];

    if (game_started && valid_keys.includes(key_pressed)) {
        switch (key_pressed) {
            case 'Escape':
                game_started = false;
                game_playing = false;
                resetChess()
                $.post(`https://${GetParentResourceName()}/chess-callback`, JSON.stringify({ 'success': false }));
                setTimeout(function() { $(".chess-hack").fadeOut() }, 500);
                break;
        }
    }
});