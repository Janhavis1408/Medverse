require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

// ==========================================
// BASIC MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// FILE PATHS
// ==========================================

const USERS_FILE = path.join(__dirname, "users.json");

// ==========================================
// USER AUTHENTICATION
// ==========================================

// Read users from users.json
function getUsers() {
    try {
        const data = fs.readFileSync(
            USERS_FILE,
            "utf8"
        );

        return JSON.parse(data);

    } catch (error) {
        console.log("Error reading users:", error);
        return [];
    }
}

// Save users to users.json
function saveUsers(users) {
    fs.writeFileSync(
        USERS_FILE,
        JSON.stringify(users, null, 2)
    );
}

// Hash password securely
function hashPassword(password) {

    const salt =
        crypto.randomBytes(16).toString("hex");

    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        ).toString("hex");

    return {
        salt,
        hash
    };
}

// Verify password
function verifyPassword(
    password,
    salt,
    storedHash
) {

    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        ).toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(hash, "hex"),
        Buffer.from(storedHash, "hex")
    );
}

// ==========================================
// SIGN UP
// ==========================================

app.post("/api/signup", (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password
        } = req.body;

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please fill in all fields."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });

        }

        const users = getUsers();

        const existingUser =
            users.find(
                user =>
                    user.email.toLowerCase() ===
                    email.trim().toLowerCase()
            );

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message:
                    "An account with this email already exists."
            });

        }

        const passwordData =
            hashPassword(password);

        const newUser = {

            id: crypto.randomUUID(),

            name: name.trim(),

            email:
                email.trim().toLowerCase(),

            phone: phone.trim(),

            passwordHash:
                passwordData.hash,

            passwordSalt:
                passwordData.salt,

            createdAt:
                new Date().toISOString()
        };

        users.push(newUser);

        saveUsers(users);

        console.log(
            "✅ New user created:",
            newUser.email
        );

        res.status(201).json({

            success: true,

            message:
                "Account created successfully!"
        });

    } catch (error) {

        console.error(
            "Signup error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to create account."
        });
    }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter your email and password."
            });

        }

        const users = getUsers();

        const user =
            users.find(
                user =>
                    user.email.toLowerCase() ===
                    email.trim().toLowerCase()
            );

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });

        }

        const passwordCorrect =
            verifyPassword(
                password,
                user.passwordSalt,
                user.passwordHash
            );

        if (!passwordCorrect) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."
            });

        }

        console.log(
            "✅ User logged in:",
            user.email
        );

        res.json({

            success: true,

            message:
                "Login successful!",

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                phone: user.phone
            }
        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to login."
        });
    }
});

// ==========================================
// GROQ CLIENT
// ==========================================

const client = new OpenAI({

    apiKey:
        process.env.GROQ_API_KEY,

    baseURL:
        "https://api.groq.com/openai/v1"
});

// ==========================================
// AI CHAT
// ==========================================

app.post("/chat", async (req, res) => {

    console.log("📨 Chat request received!");

    try {

        const {
            message,
            language
        } = req.body;

        const languageInstruction =
            language === "hi-IN"

                ? "Reply completely in Hindi (हिन्दी). Use simple, natural Hindi. Do not reply in English unless the user asks for English."

                : "Reply completely in English. Use simple, clear English.";

        console.log(
            "🚀 Sending request to Groq..."
        );

        const completion =
            await client.chat.completions.create({

                model:
                    "llama-3.3-70b-versatile",

                temperature:
                    0.5,

                max_tokens:
                    300,

                messages: [

                    {
                        role: "system",

                        content: `

You are Dr. MedVerse AI.

You are a professional virtual healthcare assistant.

${languageInstruction}

Rules:

- Give educational health information only.
- Never diagnose diseases.
- Be friendly, calm and supportive.
- Recommend consulting a doctor for persistent or severe symptoms.
- If the user mentions chest pain, difficulty breathing, stroke symptoms, unconsciousness, severe bleeding or any medical emergency, immediately advise them to seek emergency medical care.
- Keep responses between 80 and 150 words.
- Use bullet points whenever helpful.
- Never claim to be a real doctor.
- End every response with:

"This information is educational and is not a substitute for professional medical advice."

`
                    },

                    {
                        role: "user",
                        content: message
                    }
                ]
            });

        console.log(
            "✅ Groq replied successfully!"
        );

        const reply =
            completion
                .choices?.[0]
                ?.message
                ?.content ||

            "Sorry, I couldn't generate a response.";

        res.json({
            reply
        });

    } catch (error) {

        console.log(
            "\n========== GROQ ERROR ==========\n"
        );

        console.log(error);

        if (error.response) {

            console.log(
                "Status:",
                error.response.status
            );

            console.log(
                error.response.data
            );
        }

        res.status(500).json({

            reply:
                "Sorry, MedVerse AI is currently unavailable."
        });
    }
});

// ==========================================
// FRONTEND FILE SERVER
// ==========================================

// Homepage
app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "index.html"
        )
    );
});

// ------------------------------------------
// HTML FILES
// ------------------------------------------

const htmlPages = [
    "index.html",
    "assistant.html",
    "dashboard.html",
    "hospital.html",
    "login.html",
    "signup.html",
    "profile.html",
    "reminder.html"
];

htmlPages.forEach(page => {

    app.get(`/${page}`, (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                page
            )
        );

    });

});

// ------------------------------------------
// CSS FILES
// ------------------------------------------

const cssFiles = [
    "style.css",
    "assistant.css",
    "dashboard.css",
    "dashboard2.css",
    "login.css"
];

cssFiles.forEach(file => {

    app.get(`/${file}`, (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                file
            )
        );

    });

});

// ------------------------------------------
// JAVASCRIPT FILES
// ------------------------------------------

const jsFiles = [
    "app.js",
    "assistant.js",
    "simple.js",
    "test.js"
];

jsFiles.forEach(file => {

    app.get(`/${file}`, (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                file
            )
        );

    });

});

// ------------------------------------------
// IMAGE FILES
// ------------------------------------------

app.get("/doctor.png", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "doctor.png"
        )
    );

});

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).send(
        "MedVerse: Page not found."
    );

});

// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 MedVerse AI Server running on http://localhost:${PORT}`
    );

});