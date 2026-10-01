/**
 * @name plainChat
 * @author 	tuxedocatsgoated
 * @link    https://github.com/tuxedocatsgoated/plain-chat
 */

(function () {
    'use strict';

    const monsterToAlly = new Map();

    function cleanText(text) {
        return text.replace(/#[^\s]+/g, '');
    }

    let observer = null;
    let observedDocument = null;

    function processChat(doc) {
        if (!doc || !doc.body) return;


        // NORMAL CHAT — MESSAGE TEXT

        doc.querySelectorAll('.chat-message .message').forEach((element) => {
            const text = element.textContent;

            if (!text) return;

            const cleaned = cleanText(text);

            if (cleaned === text) return;

            element.style.visibility = 'hidden';
            element.textContent = cleaned;
            element.style.visibility = '';
        });

        // NORMAL CHAT — PLAYER NAME

        doc.querySelectorAll('.chat-message .message-name').forEach((element) => {
            const text = element.textContent;

            if (!text) return;

            let cleaned = text;

            // Remove #tags
            cleaned = cleanText(cleaned);

            // Remove "(Monster)" 
            // Ally 2 (Scuttle Crab) ---> Ally 2

            cleaned = cleaned.replace(
                /\s*\((?:Gromp|Krug|Raptor|Murk Wolf|Scuttle Crab)\)/gi,
                ''
            );

            // REPLACE MONSTER NAME
            // Scuttle Crab ---> Ally 2

            monsterToAlly.forEach((allyName, monsterName) => {

                const escapedMonsterName =
                    monsterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                cleaned = cleaned.replace(
                    new RegExp(`\\b${escapedMonsterName}\\b`, 'gi'),
                    allyName
                );
            });

            cleaned = cleaned.trim();

            if (cleaned === text) return;

            element.style.visibility = 'hidden';
            element.textContent = cleaned;
            element.style.visibility = '';

        });

        // SYSTEM MESSAGES

        doc.querySelectorAll('.system-message span').forEach((element) => {
            const text = element.textContent;

            if (!text) return;

            let cleaned = cleanText(text);

            monsterToAlly.forEach((allyName, monsterName) => {

                const escapedMonsterName =
                    monsterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                cleaned = cleaned.replace(
                    new RegExp(`\\b${escapedMonsterName}\\b`, 'gi'),
                    allyName
                );
            });

            cleaned = cleaned.trim();

            if (cleaned === text) return;

            element.style.visibility = 'hidden';
            element.textContent = cleaned;
            element.style.visibility = '';

        });

        // POST GAME

        doc.querySelectorAll('.message-name').forEach((element) => {

            if (element.closest('.chat-message')) return;

            const text = element.textContent;

            if (!text) return;

            let cleaned = cleanText(text);

            cleaned = cleaned.replace(
                /\s*\((?:Gromp|Krug|Raptor|Murk Wolf|Scuttle Crab)\)/gi,
                ''
            );

            cleaned = cleaned.trim();

            if (cleaned === text) return;
            element.textContent = cleaned;

        });
    }


    // CHAMPION SELECT — ALLY NAMES

    let allyObserver = null;

    function processAllyNames() {
        const containers = [...document.querySelectorAll('.summoner-container')];

        if (!containers.length) return;

        // FIND MYSELF

        const myContainer = containers.find(container =>
            container.querySelector('.image-ring-spinner.is-self')
        );

        if (!myContainer) return;

        const myNameElement =
            myContainer.querySelector('.player-name-wrapper');

        if (!myNameElement) return;


        // CLEAN MY BANNER

        const myCurrentName =
            myNameElement.textContent.trim();

        const myCleanName = myCurrentName.replace(
            /\s*\((?:Gromp|Krug|Raptor|Murk Wolf|Scuttle Crab)\)/gi,
            ''
        ).trim();

        if (myCleanName !== myCurrentName) {
            myNameElement.textContent = myCleanName;
        }


        // FIND TEAM CONTAINERS


        const alliedContainers = containers.slice(0, 5);

        const otherAllies = alliedContainers.filter(
            container => container !== myContainer
        );


        otherAllies.forEach((container, index) => {

            const nameElement =
                container.querySelector('.player-name-wrapper');

            if (!nameElement) return;

            const currentName =
                nameElement.textContent.trim();

            const wantedName =
                `Ally ${index + 1}`;


            if (
                currentName &&
                currentName !== wantedName &&
                !currentName.startsWith('Ally ')
            ) {

                const monsterName = currentName
                    .replace(
                        /\s*\((?:Gromp|Krug|Raptor|Murk Wolf|Scuttle Crab)\)/gi,
                        ''
                    )
                    .trim();

                monsterToAlly.set(
                    monsterName,
                    wantedName
                );

            }

            if (currentName !== wantedName) {
                nameElement.textContent = wantedName;
            }
        });
    }

    function observeAllyNames() {

        processAllyNames();

        if (allyObserver) return;

        allyObserver = new MutationObserver(() => {
            processAllyNames();
        });

        allyObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

    }

    function observeChat() {
        const frame = document.querySelector('#embedded-messages-frame');

        if (!frame) return;

        const doc = frame.contentDocument;

        if (!doc || !doc.body) return;

        if (observer && observedDocument === doc) {
            return;
        }

        if (observer) {
            observer.disconnect();
        }

        observedDocument = doc;

        processChat(doc);

        observer = new MutationObserver(() => {
            processChat(doc);
        });

        observer.observe(doc.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

    }

    function init() {

        observeChat();
        observeAllyNames();

        const mainObserver = new MutationObserver(() => {
            observeChat();
        });

        mainObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        const interval = setInterval(observeChat, 500);

        setTimeout(() => {
            clearInterval(interval);
        }, 15000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();