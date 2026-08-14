console.log("✅ assistant.js loaded");
/* ==========================================================
        MEDVERSE AI v2.0
        PART 1A
        Foundation
========================================================== */

"use strict";

/* ==========================================================
        DOM ELEMENTS
========================================================== */

const chatMessages = document.querySelector(".chat-messages");
const chatInput = document.querySelector("#chatInput");
const sendBtn = document.querySelector(".send-btn");

const voiceBtn = document.querySelector(".voice-btn");

const imageInput = document.querySelector("#imageUpload");

const imagePreview = document.querySelector("#imagePreview");

const languageSelect = document.querySelector("#language");

const clearBtn = document.querySelector(".clear-chat");

const exportBtn = document.querySelector(".export-chat");

const quickButtons = document.querySelectorAll(".quick-btn");

const messageCounter = document.querySelector(".message-count");

const emergencyBtn = document.querySelector(".emergency-btn");


/* ==========================================================
        GLOBAL VARIABLES
========================================================== */

let conversationHistory = [];

let messageCount = 0;

let currentLanguage = "en-US";

let recognition = null;

let isListening = false;

let isSpeaking = false;


/* ==========================================================
        AUTO SCROLL
========================================================== */

function scrollBottom() {

    chatMessages.scrollTo({

        top: chatMessages.scrollHeight,

        behavior: "smooth"

    });

}


/* ==========================================================
        UPDATE MESSAGE COUNT
========================================================== */

function updateMessageCount() {

    if (!messageCounter) return;

    messageCounter.textContent =
        `Messages : ${messageCount}`;

}


/* ==========================================================
        SAVE CHAT
========================================================== */

function saveChat() {

    localStorage.setItem(

        "medverse_chat",

        JSON.stringify(conversationHistory)

    );

}


/* ==========================================================
        LOAD CHAT
========================================================== */

function loadChat() {

    const oldChat = JSON.parse(

        localStorage.getItem("medverse_chat")

    );

    if (!oldChat) return;

    conversationHistory = oldChat;

    chatMessages.innerHTML = "";

    oldChat.forEach(msg => {

        createMessage(

            msg.content,

            msg.role === "assistant"

                ? "ai"

                : "user"

        );

    });

}


/* ==========================================================
        TYPING INDICATOR
========================================================== */

function showTyping() {

    removeTyping();

    const typing = document.createElement("div");

    typing.className = "message ai-message typing";

    typing.innerHTML = `

        <div class="avatar ai-avatar">

            <i class="fa-solid fa-user-doctor"></i>

        </div>

        <div class="bubble typing-bubble">

            <span></span>
            <span></span>
            <span></span>

        </div>

    `;

    chatMessages.appendChild(typing);

    scrollBottom();

}


function removeTyping() {

    const typing = document.querySelector(".typing");

    if (typing) {

        typing.remove();

    }

}


/* ==========================================================
        CREATE MESSAGE
========================================================== */

function createMessage(text, sender) {

    const message = document.createElement("div");

    message.className = `message ${sender}-message`;

    const avatar =

        sender === "ai"

            ? `<i class="fa-solid fa-user-doctor"></i>`

            : "😊";

    message.innerHTML = `

        <div class="avatar">

            ${avatar}

        </div>

        <div class="bubble">

            ${text}

        </div>

    `;

    chatMessages.appendChild(message);

    message.animate(

        [

            {

                opacity: 0,

                transform: "translateY(15px)"

            },

            {

                opacity: 1,

                transform: "translateY(0px)"

            }

        ],

        {

            duration: 300,

            easing: "ease-out"

        }

    );

    messageCount++;

    updateMessageCount();

    scrollBottom();

}
/* ==========================================================
        PART 1B
        AI CHAT ENGINE
========================================================== */

/* ==========================================================
        TYPEWRITER EFFECT
========================================================== */

async function typeWriter(text) {

    const message = document.createElement("div");

    message.className = "message ai-message";

    message.innerHTML = `

        <div class="avatar">
            <i class="fa-solid fa-user-doctor"></i>
        </div>

        <div class="bubble"></div>

    `;

    chatMessages.appendChild(message);

    const bubble = message.querySelector(".bubble");

    let i = 0;

    const speed = 12;

    while (i < text.length) {

        bubble.innerHTML += text.charAt(i);

        i++;

        scrollBottom();

        await new Promise(resolve => setTimeout(resolve, speed));

    }

}


/* ==========================================================
        SEND MESSAGE
========================================================== */

async function sendMessage() {

    const text = chatInput.value.trim();

    if (!text) return;

    createMessage(text, "user");

    conversationHistory.push({

        role: "user",

        content: text

    });

    saveChat();

    chatInput.value = "";

    showTyping();

    try {

        const response = await fetch("http://localhost:3000/chat", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify({
    message: text,
    history: conversationHistory,
    language: currentLanguage
})

        });

        if (!response.ok) {

            throw new Error("Server Error");

        }

        const data = await response.json();

        removeTyping();

        conversationHistory.push({

            role: "assistant",

            content: data.reply

        });

        saveChat();

        await typeWriter(data.reply);

        speak(data.reply);

    }

    catch (error) {

        removeTyping();

        console.error(error);

        createMessage(

            "❌ Unable to connect to MedVerse AI.",

            "ai"

        );

    }

}


/* ==========================================================
        SEND BUTTON
========================================================== */

sendBtn.addEventListener("click", sendMessage);


/* ==========================================================
        ENTER KEY
========================================================== */

chatInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        event.preventDefault();

        sendMessage();

    }
});


/* ==========================================================
        QUICK ACTION BUTTONS
========================================================== */

quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        chatInput.value = button.innerText;

        sendMessage();

    });

});


/* ==========================================================
        WELCOME MESSAGE
========================================================== */

window.addEventListener("load", () => {

    loadChat();

    if (conversationHistory.length === 0) {

        createMessage(

            "👋 Hello! I'm MedVerse AI. Ask me any health-related question, upload an image, or use the microphone to talk with me.",

            "ai"

        );

    }

});
/* ==========================================================
        PART 2A
        VOICE ASSISTANT
========================================================== */

/* ==========================================================
        TEXT TO SPEECH
========================================================== */

/* ==========================================================
        TEXT TO SPEECH
        Clean AI formatting before speaking
========================================================== */

function cleanTextForSpeech(text) {

    return text

        // Remove markdown bold / italic symbols
        .replace(/\*+/g, "")

        // Remove markdown underscores
        .replace(/_+/g, "")

        // Remove backticks
        .replace(/`+/g, "")

        // Remove markdown headings
        .replace(/^#+\s*/gm, "")

        // Remove bullet symbols
        .replace(/^\s*[-•]\s*/gm, "")

        // Clean multiple spaces
        .replace(/\s+/g, " ")

        .trim();
}


function speak(text) {

    if (!("speechSynthesis" in window)) {

        console.log("Speech Synthesis not supported");

        return;

    }


    // Clean AI response ONLY for voice

    const cleanText =
        cleanTextForSpeech(text);


    speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(cleanText);


    speech.lang = currentLanguage;

    speech.rate = 1;

    speech.pitch = 1;

    speech.volume = 1;


    isSpeaking = true;


    speech.onstart = () => {

        isSpeaking = true;

        if (voiceBtn) {

            voiceBtn.classList.add("speaking");

        }

    };


    speech.onend = () => {

        isSpeaking = false;

        if (voiceBtn) {

            voiceBtn.classList.remove("speaking");

        }

    };


    speech.onerror = () => {

        isSpeaking = false;

        if (voiceBtn) {

            voiceBtn.classList.remove("speaking");

        }

    };


    speechSynthesis.speak(speech);

}
/* ==========================================================
        SPEECH RECOGNITION
========================================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.lang = currentLanguage;

    recognition.interimResults = false;

    recognition.continuous = false;

    recognition.maxAlternatives = 1;

} else {

    console.log("Speech Recognition not supported.");

}

/* ==========================================================
        START LISTENING
========================================================== */

function startListening() {

    if (!recognition) return;

    if (isListening) return;

    speechSynthesis.cancel();

    recognition.lang = currentLanguage;

    recognition.start();

}

/* ==========================================================
        STOP LISTENING
========================================================== */

function stopListening() {

    if (!recognition) return;

    recognition.stop();

}

/* ==========================================================
        MICROPHONE BUTTON
========================================================== */

if (voiceBtn) {

    voiceBtn.addEventListener("click", () => {

        if (isListening) {

            stopListening();

        } else {

            startListening();

        }

    });

}
/* ==========================================================
        PART 2B
        VOICE EVENTS & LANGUAGE
========================================================== */

/* ==========================================================
        RECOGNITION START
========================================================== */

if (recognition) {

    recognition.onstart = () => {

        isListening = true;

        console.log("🎤 Listening...");

        if (voiceBtn) {

            voiceBtn.classList.add("listening");

            voiceBtn.innerHTML =
                '<i class="fa-solid fa-microphone-lines"></i>';

        }

    };


/* ==========================================================
        SPEECH RESULT
========================================================== */

    recognition.onresult = (event) => {

        const transcript =
            event.results[0][0].transcript;

        console.log("You said:", transcript);

        chatInput.value = transcript;

        sendMessage();

    };


/* ==========================================================
        RECOGNITION END
========================================================== */

    recognition.onend = () => {

        isListening = false;

        if (voiceBtn) {

            voiceBtn.classList.remove("listening");

            voiceBtn.innerHTML =
                '<i class="fa-solid fa-microphone"></i>';

        }

    };


/* ==========================================================
        RECOGNITION ERROR
========================================================== */

    recognition.onerror = (event) => {

        console.error("Speech Error:", event.error);

        isListening = false;

        if (voiceBtn) {

            voiceBtn.classList.remove("listening");

            voiceBtn.innerHTML =
                '<i class="fa-solid fa-microphone"></i>';

        }

    };

}


/* ==========================================================
        LANGUAGE SELECTOR
========================================================== */

if (languageSelect) {

    languageSelect.addEventListener("change", () => {

    currentLanguage = languageSelect.value;

    localStorage.setItem(
        "medverse-language",
        currentLanguage
    );

    if (recognition) {

        recognition.lang = currentLanguage;

    }

    if (speechSynthesis.speaking) {

        speechSynthesis.cancel();

    }

    console.log(
        "🌐 Language changed:",
        currentLanguage
    );

});

}


/* ==========================================================
        STOP SPEAKING WHEN USER CLICKS INPUT
========================================================== */

chatInput.addEventListener("focus", () => {

    speechSynthesis.cancel();

});


/* ==========================================================
        ESC KEY STOPS EVERYTHING
========================================================== */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        speechSynthesis.cancel();

        if (recognition && isListening) {

            recognition.stop();

        }

    }

});
/* ==========================================================
        PART 3A
        CHAT FEATURES
========================================================== */


/* ==========================================================
        CLEAR CHAT
========================================================== */

function clearChat() {

    if (!confirm("Delete entire conversation?")) return;

    conversationHistory = [];

    messageCount = 0;

    updateMessageCount();

    localStorage.removeItem("medverse_chat");

    chatMessages.innerHTML = "";

    createMessage(

        "👋 Chat cleared successfully.",

        "ai"

    );

}


if (clearBtn) {

    clearBtn.addEventListener("click", clearChat);

}


/* ==========================================================
        EXPORT CHAT
========================================================== */

function exportChat() {

    if (conversationHistory.length === 0) {

        alert("No conversation to export.");

        return;

    }

    let chat = "";

    conversationHistory.forEach(message => {

        chat +=

`${message.role.toUpperCase()}

${message.content}

---------------------------------------

`;

    });

    const blob = new Blob(

        [chat],

        {

            type: "text/plain"

        }

    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download =

        "MedVerse_Chat.txt";

    link.click();

}


if (exportBtn) {

    exportBtn.addEventListener(

        "click",

        exportChat

    );

}


/* ==========================================================
        IMAGE UPLOAD + PREVIEW
========================================================== */

if (imageInput) {

    imageInput.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) return;


        /* Check that the selected file is actually an image */

        if (!file.type.startsWith("image/")) {

            alert("Please select a valid medical image.");

            this.value = "";

            return;

        }


        /* Create image reader */

        const reader = new FileReader();


        reader.onload = function (event) {

            if (!imagePreview) return;


            /* Clear previous preview */

            imagePreview.innerHTML = "";


            /* Create actual IMG element */

            const img = document.createElement("img");

            img.src = event.target.result;

            img.alt = "Selected medical image";


            /* Add image to preview container */

            imagePreview.appendChild(img);


            /* Show preview */

            imagePreview.style.display = "flex";


            console.log("✅ Medical image selected:", file.name);

        };


        reader.readAsDataURL(file);

    });

}


/* ==========================================================
        CHAT TIMESTAMP
========================================================== */

function getCurrentTime() {

    const now = new Date();

    return now.toLocaleTimeString([], {

        hour: "2-digit",

        minute: "2-digit"

    });

}
/* ==========================================================
        PART 3B
        PREMIUM FEATURES
========================================================== */


/* ==========================================================
        MESSAGE TIMESTAMP
========================================================== */

function addTimestamp() {

    const messages = document.querySelectorAll(".bubble");

    if (messages.length === 0) return;

    const lastBubble = messages[messages.length - 1];

    const time = document.createElement("div");

    time.className = "message-time";

    time.textContent = getCurrentTime();

    lastBubble.appendChild(time);

}


/* ==========================================================
        AUTO SAVE AFTER EVERY MESSAGE
========================================================== */

const originalCreateMessage = createMessage;

createMessage = function (text, sender) {

    originalCreateMessage(text, sender);

    addTimestamp();

    saveChat();

};


/* ==========================================================
        QUICK BUTTONS
========================================================== */

quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        chatInput.value = button.innerText;

        sendMessage();

    });

});


/* ==========================================================
        EMERGENCY DETECTOR
========================================================== */

const emergencyWords = [

    "heart attack",

    "stroke",

    "chest pain",

    "difficulty breathing",

    "can't breathe",

    "bleeding",

    "blood",

    "unconscious",

    "accident",

    "suicide"

];


function checkEmergency(text) {

    const message = text.toLowerCase();

    return emergencyWords.some(word =>

        message.includes(word)

    );

}


/* ==========================================================
        EMERGENCY WARNING
========================================================== */

function showEmergencyMessage() {

    createMessage(

`🚨 Emergency detected.

Please seek immediate medical attention or call your local emergency services.

MedVerse AI cannot replace emergency healthcare.`,

"ai"

    );

}


/* ==========================================================
        PATCH sendMessage()
========================================================== */

const oldSendMessage = sendMessage;

sendMessage = async function () {

    const text = chatInput.value.trim();

    if (!text) return;

    if (checkEmergency(text)) {

        showEmergencyMessage();

    }

    await oldSendMessage();

};


/* ==========================================================
        SCROLL TO BOTTOM BUTTON
========================================================== */

window.addEventListener("scroll", () => {

    scrollBottom();

});


/* ==========================================================
        CHAT SOUND
========================================================== */

function playNotificationSound() {

    const audio = new Audio(

        "https://actions.google.com/sounds/v1/cartoon/pop.ogg"

    );

    audio.volume = 0.2;

    audio.play().catch(() => {});

}


/* ==========================================================
        PLAY SOUND AFTER AI REPLY
========================================================== */

const oldTypeWriter = typeWriter;

typeWriter = async function (text) {

    await oldTypeWriter(text);

    playNotificationSound();

}
/* ==========================================
   DARK MODE
========================================== */

const themeBtn = document.getElementById("themeBtn");

if (themeBtn) {

    // Load saved theme
    const savedTheme = localStorage.getItem("medverseTheme");

    if (savedTheme === "dark") {

        document.body.classList.add("dark-mode");
        themeBtn.innerHTML = "☀️";

    }

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("dark-mode");

        if (document.body.classList.contains("dark-mode")) {

            localStorage.setItem("medverseTheme","dark");
            themeBtn.innerHTML = "☀️";

        } else {

            localStorage.setItem("medverseTheme","light");
            themeBtn.innerHTML = "🌙";

        }

    });

}