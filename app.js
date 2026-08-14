/* ==========================================
   MEDVERSE APP.JS
   PART 1
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    initializeLoader();
    initializeMobileMenu();
    initializeStickyNavbar();
    initializeSmoothScroll();
    initializeActiveNav();
    initializeScrollTop();
    initializeRevealAnimation();

});

/* ==========================================
   LOADING SCREEN
========================================== */

function initializeLoader(){

    const loader = document.querySelector(".loader-wrapper");

    if(loader){

        window.addEventListener("load",()=>{

            loader.style.opacity="0";

            setTimeout(()=>{

                loader.style.display="none";

            },500);

        });

    }

}

/* ==========================================
   MOBILE MENU
========================================== */

function initializeMobileMenu(){

    const menu=document.querySelector(".menu-toggle");

    const nav=document.querySelector(".nav-links");

    if(!menu || !nav) return;

    menu.addEventListener("click",()=>{

        nav.classList.toggle("active");

        menu.classList.toggle("active");

    });

}

/* ==========================================
   STICKY NAVBAR
========================================== */

function initializeStickyNavbar(){

    const navbar=document.querySelector("header");

    if(!navbar) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>70){

            navbar.classList.add("sticky");

        }

        else{

            navbar.classList.remove("sticky");

        }

    });

}

/* ==========================================
   SMOOTH SCROLL
========================================== */

function initializeSmoothScroll(){

    const links=document.querySelectorAll('a[href^="#"]');

    links.forEach(link=>{

        link.addEventListener("click",function(e){

            e.preventDefault();

            const target=document.querySelector(this.getAttribute("href"));

            if(target){

                target.scrollIntoView({

                    behavior:"smooth"

                });

            }

        });

    });

}

/* ==========================================
   ACTIVE NAVIGATION
========================================== */

function initializeActiveNav(){

    const sections=document.querySelectorAll("section");

    const navLinks=document.querySelectorAll(".nav-links a");

    window.addEventListener("scroll",()=>{

        let current="";

        sections.forEach(section=>{

            const top=section.offsetTop-120;

            const height=section.offsetHeight;

            if(window.scrollY>=top){

                current=section.getAttribute("id");

            }

        });

        navLinks.forEach(link=>{

            link.classList.remove("active");

            if(link.getAttribute("href")==="#" + current){

                link.classList.add("active");

            }

        });

    });

}

/* ==========================================
   SCROLL TO TOP
========================================== */

function initializeScrollTop(){

    const button=document.querySelector(".scroll-top");

    if(!button) return;

    window.addEventListener("scroll",()=>{

        if(window.scrollY>400){

            button.classList.add("show");

        }

        else{

            button.classList.remove("show");

        }

    });

    button.addEventListener("click",()=>{

        window.scrollTo({

            top:0,

            behavior:"smooth"

        });

    });

}

/* ==========================================
   REVEAL ANIMATION
========================================== */

function initializeRevealAnimation(){

    const reveal=document.querySelectorAll(".reveal");

    const observer=new IntersectionObserver(entries=>{

        entries.forEach(entry=>{

            if(entry.isIntersecting){

                entry.target.classList.add("active");

            }

        });

    },{

        threshold:.15

    });

    reveal.forEach(item=>{

        observer.observe(item);

    });

}
/* ==========================================
   MEDVERSE APP.JS
   PART 2
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

    initializeDarkMode();

    initializeMedicineReminder();

    initializeProfile();

    initializeHistory();

});

/* ==========================================
   DARK MODE
========================================== */

function initializeDarkMode(){

    const themeButton=document.querySelector(".theme-toggle");

    if(!themeButton) return;

    if(localStorage.getItem("theme")==="dark"){

        document.body.classList.add("dark");

    }

    themeButton.addEventListener("click",()=>{

        document.body.classList.toggle("dark");

        if(document.body.classList.contains("dark")){

            localStorage.setItem("theme","dark");

        }

        else{

            localStorage.setItem("theme","light");

        }

    });

}

/* ==========================================
   MEDICINE REMINDER
========================================== */

function initializeMedicineReminder(){

    const reminderForm=document.querySelector("#reminderForm");

    if(!reminderForm) return;

    reminderForm.addEventListener("submit",(e)=>{

        e.preventDefault();

        const medicine=document.querySelector("#medicineName").value;

        const time=document.querySelector("#medicineTime").value;

        let reminders=JSON.parse(localStorage.getItem("reminders")) || [];

        reminders.push({

            medicine,

            time

        });

        localStorage.setItem("reminders",JSON.stringify(reminders));

        alert("Medicine reminder saved successfully!");

        reminderForm.reset();

    });

}

/* ==========================================
   PROFILE SAVE
========================================== */

function initializeProfile(){

    const profileForm=document.querySelector("#profileForm");

    if(!profileForm) return;

    profileForm.addEventListener("submit",(e)=>{

        e.preventDefault();

        const profile={

            name:document.querySelector("#name").value,

            age:document.querySelector("#age").value,

            gender:document.querySelector("#gender").value,

            blood:document.querySelector("#bloodGroup").value

        };

        localStorage.setItem(

            "profile",

            JSON.stringify(profile)

        );

        alert("Profile saved successfully!");

    });

}

/* ==========================================
   LOAD PROFILE
========================================== */

window.addEventListener("load",()=>{

    const profile=JSON.parse(

        localStorage.getItem("profile")

    );

    if(profile){

        if(document.querySelector("#name"))
        document.querySelector("#name").value=profile.name;

        if(document.querySelector("#age"))
        document.querySelector("#age").value=profile.age;

        if(document.querySelector("#gender"))
        document.querySelector("#gender").value=profile.gender;

        if(document.querySelector("#bloodGroup"))
        document.querySelector("#bloodGroup").value=profile.blood;

    }

});

/* ==========================================
   HISTORY
========================================== */

function initializeHistory(){

    const historyContainer=document.querySelector(".history-list");

    if(!historyContainer) return;

    let reminders=JSON.parse(

        localStorage.getItem("reminders")

    ) || [];

    historyContainer.innerHTML="";

    reminders.forEach(item=>{

        historyContainer.innerHTML+=`

        <div class="history-card">

            <h3>${item.medicine}</h3>

            <p>${item.time}</p>

        </div>

        `;

    });

}
/* ==========================================
   MEDVERSE APP.JS
   PART 3
========================================== */

document.addEventListener("DOMContentLoaded",()=>{

    initializeImagePreview();

    initializeVoiceAssistant();

    initializeEmergencyButton();

    initializeLanguageSwitcher();

    initializeChat();

});

/* ==========================================
   IMAGE PREVIEW
========================================== */

function initializeImagePreview(){

    const input=document.querySelector("#imageUpload");

    const preview=document.querySelector(".image-preview");

    if(!input || !preview) return;

    input.addEventListener("change",()=>{

        preview.innerHTML="";

        const file=input.files[0];

        if(!file) return;

        if(!file.type.startsWith("image/")){

            alert("Please upload an image file.");

            input.value="";

            return;

        }

        const image=document.createElement("img");

        image.src=URL.createObjectURL(file);

        image.style.maxWidth="180px";

        image.style.borderRadius="15px";

        preview.appendChild(image);

    });

}

/* ==========================================
   VOICE ASSISTANT
========================================== */

function initializeVoiceAssistant(){

    const button=document.querySelector(".voice-btn");

    const input=document.querySelector("#chatInput");

    if(!button || !input) return;

    if(!("webkitSpeechRecognition" in window)){

        console.log("Speech Recognition Not Supported");

        return;

    }

    const recognition=new webkitSpeechRecognition();

    recognition.lang="en-IN";

    recognition.continuous=false;

    recognition.interimResults=false;

    button.addEventListener("click",()=>{

        recognition.start();

    });

    recognition.onresult=(event)=>{

        input.value=event.results[0][0].transcript;

    };

}

/* ==========================================
   EMERGENCY BUTTON
========================================== */

function initializeEmergencyButton(){

    const emergency=document.querySelector(".emergency-btn");

    if(!emergency) return;

    emergency.addEventListener("click",()=>{

        alert(

        "Emergency Mode Activated.\n\nPlease contact your nearest hospital immediately."

        );

    });

}

/* ==========================================
   LANGUAGE SWITCH
========================================== */

function initializeLanguageSwitcher(){

    const language=document.querySelector("#language");

    if(!language) return;

    language.addEventListener("change",()=>{

        if(language.value==="hindi"){

            alert("हिंदी भाषा जल्द उपलब्ध होगी।");

        }

        else{

            alert("English Language Selected.");

        }

    });

}

/* ==========================================
   CHAT SYSTEM
========================================== */

function initializeChat(){

    const send=document.querySelector(".send-btn");

    const input=document.querySelector("#chatInput");

    const body=document.querySelector(".chat-body");

    if(!send || !input || !body) return;

    send.addEventListener("click",sendMessage);

    input.addEventListener("keypress",(e)=>{

        if(e.key==="Enter"){

            sendMessage();

        }

    });

    function sendMessage(){

        const text=input.value.trim();

        if(text==="") return;

        const user=createBubble(text,"user");

        body.appendChild(user);

        body.scrollTop=body.scrollHeight;

        input.value="";

        setTimeout(()=>{

            const ai=createBubble(

            "Thank you for your message. This is a demo response. AI integration will be added soon.",

            "ai"

            );

            body.appendChild(ai);

            body.scrollTop=body.scrollHeight;

        },900);

    }

}

/* ==========================================
   CREATE CHAT BUBBLE
========================================== */

function createBubble(message,type){

    const wrapper=document.createElement("div");

    wrapper.className=

    type==="user"

    ?

    "message user-message"

    :

    "message ai-message";

    const bubble=document.createElement("div");

    bubble.className="bubble";

    bubble.textContent=message;

    wrapper.appendChild(bubble);

    return wrapper;

}

/* ==========================================
   HELPER
========================================== */

function showNotification(message){

    console.log(message);

}