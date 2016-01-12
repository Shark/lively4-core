'use strict';

var persistenceTimerInterval;

function isLively4Script(node) {
    return node.tagName
        && node.tagName.toLocaleLowerCase() == 'script'
        && node.type == 'lively4script'
}

function initialize(){
    resetPersistenceSessionStore();

    var observer = new MutationObserver((mutations, observer) => {
        mutations.forEach(record => {
            if (record.target.id == 'console'
                || record.target.id == 'editor') return;
            var shouldSave = false;
            if (record.type == 'childList') {
                /*var nodes = [...record.addedNodes].concat([...record.removedNodes]);
                shouldSave = nodes.some(node => {
                    return isLively4Script(node);
                });*/
                shouldSave = true;
            }
            else if (record.type == 'characterData') {
                shouldSave = true;
            }
            else if (record.type == 'attributes') {
                shouldSave = true;
            }

            if (shouldSave) {
                sessionStorage["lively.scriptMutationsDetected"] = 'true';
                if (isPersistOnIntervalActive()) {
                    restartPersistenceTimerInterval();
                }
            }
        })
    }).observe(document, {childList: true, subtree: true, characterData: true, attributes: true});
}

function getURL(){
    var baseurl = $('#baseurl').val() // How to abstract from UI? #TODO #JensLincke
    var filename = $('#filename').val()

    var url = document.URL;
    var r = /https:\/\/([\w-]+)\.github\.io\/([\w-]+)\/(.+)/i;
    var results = url.match(r);

    if (results)
    {
        filename = results[3];
    }
    else
    {
        r = /localhost:8080\/(.+)/i;
        results = url.match(r);
        if (results)
        {
            filename = results[1];
        }
    }

    return new URL(baseurl + filename)
}

export function startPersistenceTimerInterval() {
    persistenceTimerInterval = setInterval(checkForMutationsToSave, 5000);
}

export function stopPersistenceTimerInterval() {
    clearInterval(persistenceTimerInterval);
    persistenceTimerInterval = undefined;
}

function restartPersistenceTimerInterval() {
    stopPersistenceTimerInterval();
    startPersistenceTimerInterval();
}

function resetPersistenceSessionStore() {
    sessionStorage["lively.scriptMutationsDetected"] = 'false';
    sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
}

function checkForMutationsToSave() {
    if (isSaveDOMAllowed() && sessionStorage["lively.scriptMutationsDetected"] === 'true') {
        console.log("[persistence] timer-based mutations detected, saving DOM...")
        saveDOM();
    }
}

function isSaveDOMAllowed() {
    return isPersistOnIntervalActive();
}

function isPersistOnIntervalActive() {
    var check = $("#persistOnInterval");
    if (!check || check.size() == 0) return false;

    return check[0].checked;
}

export function isCurrentlyCloning() {
    return sessionStorage["lively.persistenceCurrentlyCloning"] === 'true';
}

function saveDOM() {
    var world;
    sessionStorage["lively.persistenceCurrentlyCloning"] = 'true';
    try {
        world = $("html").clone();
    }
    finally {
        sessionStorage["lively.persistenceCurrentlyCloning"] = 'false';
    }

    world.find("[data-lively4-donotpersist='children']").empty();
    world.find("[data-lively4-donotpersist='all']").remove();
    world.find("#editor").empty();
    world.find("#console").empty();
    world.find("#ace_editor\\.css").remove();
    world.find("#ace-tm").remove();
    world.find("style").filter((i,e) => /\s*\.error_widget_wrapper+/.test(e.textContent)).remove();
    
    var content = "<!DOCTYPE html>\n" + world[0].outerHTML;

    resetPersistenceSessionStore();

    writeFile(content);
}

function writeFile(content) {
    var url = getURL()
    console.log("[persistence] save " + url)
    $.ajax({
        url: url,
        type: 'PUT',
        data: content,
        success: text => {
            console.log("[persistence] file " + url + " written.")
        },
        error: (xhr, status, error) => {
            console.log("[persistence] could not write " + url + ": " + error)
        }
    });
}

initialize();