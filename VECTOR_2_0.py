"""
V.E.C.T.O.R. 2.0
Virtual Enhanced Cognitive Technology & Operational Response

A single-file, offline desktop assistant for Windows.
- Futuristic JARVIS-inspired interface (original VECTOR identity)
- Offline question matching with similarity scores
- Built-in knowledge pack, time/date, and arithmetic
- Optional Windows text-to-speech using built-in SAPI (no extra package)

Important:
This starter contains a curated starter knowledge pack and generates many
question phrasings for matching. It is NOT 10,000 independently verified facts.
For offline microphone speech recognition, a speech engine/model must be added
separately; this version accepts typed questions and can speak answers aloud.
"""

import ast
import datetime as dt
import difflib
import math
import operator
import random
import re
import subprocess
import sys
import tkinter as tk
from tkinter import scrolledtext

APP_TITLE = "V.E.C.T.O.R. 2.0"
FULL_NAME = "Virtual Enhanced Cognitive Technology & Operational Response"

# Starter offline knowledge pack. Add more entries using:
# {"questions": ["question one", "another way to ask"], "answer": "the answer"}
KNOWLEDGE = [
    (["what does vector stand for", "vector full form", "what is the full form of vector"],
     f"V.E.C.T.O.R. stands for {FULL_NAME}."),
    (["what is cpu", "cpu full form", "expand cpu", "what does cpu stand for"],
     "CPU stands for Central Processing Unit. It executes instructions in a computer."),
    (["what is gpu", "gpu full form", "expand gpu"],
     "GPU stands for Graphics Processing Unit. It processes graphics and parallel computing tasks."),
    (["what is ram", "ram full form", "expand ram"],
     "RAM stands for Random Access Memory. It temporarily stores data currently being used."),
    (["what is rom", "rom full form", "expand rom"],
     "ROM stands for Read-Only Memory. It stores data that is generally retained without power."),
    (["what is nasa", "nasa full form", "expand nasa"],
     "NASA stands for National Aeronautics and Space Administration, the United States' civil space agency."),
    (["what is isro", "isro full form", "expand isro"],
     "ISRO stands for Indian Space Research Organisation, India's national space agency."),
    (["what is drdo", "drdo full form", "expand drdo"],
     "DRDO stands for Defence Research and Development Organisation, an Indian defence research agency."),
    (["what is unesco", "unesco full form", "expand unesco"],
     "UNESCO stands for United Nations Educational, Scientific and Cultural Organization."),
    (["what is who", "who full form", "expand who"],
     "WHO stands for World Health Organization."),
    (["what is un", "un full form", "expand un"],
     "UN stands for United Nations, an international organisation founded in 1945."),
    (["what is html", "html full form", "expand html"],
     "HTML stands for HyperText Markup Language. It structures content on web pages."),
    (["what is css", "css full form", "expand css"],
     "CSS stands for Cascading Style Sheets. It controls the presentation of web pages."),
    (["what is url", "url full form", "expand url"],
     "URL stands for Uniform Resource Locator. It is the address of a resource on the internet."),
    (["what is usb", "usb full form", "expand usb"],
     "USB stands for Universal Serial Bus, a standard for connecting devices."),
    (["what is ai", "ai full form", "expand ai"],
     "AI stands for Artificial Intelligence: computer systems performing tasks that normally require human-like intelligence."),
    (["what is lcd", "lcd full form", "expand lcd"],
     "LCD stands for Liquid Crystal Display."),
    (["what is led", "led full form", "expand led"],
     "LED stands for Light-Emitting Diode."),
    (["what is pdf", "pdf full form", "expand pdf"],
     "PDF stands for Portable Document Format."),
    (["what is gps", "gps full form", "expand gps"],
     "GPS stands for Global Positioning System, a satellite-based navigation system."),
    (["what is atm", "atm full form", "expand atm"],
     "ATM stands for Automated Teller Machine."),
    (["what is pincode", "pin code full form", "what is a pin code"],
     "PIN means Postal Index Number in India's postal addressing system."),
    (["what is cbse", "cbse full form", "expand cbse"],
     "CBSE stands for Central Board of Secondary Education."),
    (["what is ncert", "ncert full form", "expand ncert"],
     "NCERT stands for National Council of Educational Research and Training."),
    (["what is constitution", "define constitution"],
     "A constitution is the fundamental set of principles and laws by which a country or organisation is governed."),
    (["when did india become independent", "india independence day date"],
     "India became independent on 15 August 1947."),
    (["when is republic day in india", "india republic day date"],
     "India celebrates Republic Day on 26 January. The Constitution came into effect on 26 January 1950."),
    (["what is the capital of india", "india capital"],
     "New Delhi is the capital of India."),
    (["what is the national animal of india", "india national animal"],
     "The Bengal tiger is India's national animal."),
    (["what is the national bird of india", "india national bird"],
     "The Indian peacock is India's national bird."),
    (["what is the national flower of india", "india national flower"],
     "The lotus is India's national flower."),
    (["how many states are in india", "number of states in india"],
     "India has 28 states and 8 union territories."),
    (["what is the largest planet", "largest planet in solar system"],
     "Jupiter is the largest planet in our Solar System."),
    (["what is the smallest planet", "smallest planet in solar system"],
     "Mercury is the smallest planet in our Solar System."),
    (["which planet is called the red planet", "red planet"],
     "Mars is commonly called the Red Planet because iron minerals in its soil give it a reddish appearance."),
    (["how many planets are in solar system", "number of planets"],
     "There are 8 recognised planets in our Solar System."),
    (["what is photosynthesis", "define photosynthesis"],
     "Photosynthesis is the process by which green plants use sunlight, water and carbon dioxide to make food, releasing oxygen."),
    (["what is gravity", "define gravity"],
     "Gravity is the attractive force between objects with mass."),
    (["what is force", "define force"],
     "A force is a push or pull that can change an object's motion or shape."),
    (["what is speed formula", "formula for speed"],
     "Speed = Distance ÷ Time."),
    (["what is distance formula", "formula for distance"],
     "Distance = Speed × Time."),
    (["what is time formula", "formula for time"],
     "Time = Distance ÷ Speed."),
    (["what is water chemical formula", "chemical formula of water"],
     "The chemical formula of water is H₂O."),
    (["what is oxygen symbol", "chemical symbol of oxygen"],
     "The chemical symbol for oxygen is O. Oxygen gas commonly exists as O₂."),
    (["what is gold symbol", "chemical symbol of gold"],
     "The chemical symbol for gold is Au."),
    (["what is iron symbol", "chemical symbol of iron"],
     "The chemical symbol for iron is Fe."),
    (["what is the boiling point of water", "water boiling point"],
     "At standard atmospheric pressure, pure water boils at 100 °C."),
    (["what is the freezing point of water", "water freezing point"],
     "At standard atmospheric pressure, pure water freezes at 0 °C."),
    (["how many bones are in an adult human", "adult human bones count"],
     "A typical adult human skeleton has 206 bones."),
    (["what is the heart function", "what does the heart do"],
     "The heart pumps blood through the circulatory system."),
    (["what is democracy", "define democracy"],
     "Democracy is a form of government in which people have a role in choosing their representatives or making decisions."),
    (["who makes laws in india", "which body makes laws in india"],
     "At the Union level, Parliament makes laws. State legislatures make laws on matters within their constitutional powers."),
    (["what are the houses of indian parliament", "indian parliament houses"],
     "The Indian Parliament consists of the President, the Lok Sabha (House of the People) and the Rajya Sabha (Council of States)."),
    (["what is lok sabha", "define lok sabha"],
     "The Lok Sabha is the lower house of India's Parliament. Its members are directly elected by eligible voters."),
    (["what is rajya sabha", "define rajya sabha"],
     "The Rajya Sabha is the Council of States, the upper house of India's Parliament."),
    (["what is the supreme court of india", "india highest court"],
     "The Supreme Court of India is the country's highest judicial court."),
    (["what is the president of india", "who is india's president"],
     "The President is the constitutional head of the Republic of India. Ask an up-to-date source to verify the current office-holder."),
    (["who is the prime minister of india", "india prime minister"],
     "The Prime Minister is the head of the Union Council of Ministers. Ask an up-to-date source to verify the current office-holder."),
    (["what is karnataka capital", "capital of karnataka"],
     "Bengaluru is the capital of Karnataka."),
    (["what is the currency of india", "india currency"],
     "The currency of India is the Indian rupee (INR), symbol ₹."),
    (["how many continents are there", "number of continents"],
     "The commonly taught model has 7 continents."),
    (["what is the largest ocean", "largest ocean in the world"],
     "The Pacific Ocean is the largest ocean on Earth."),
    (["what is the largest hot desert", "largest hot desert"],
     "The Sahara is the world's largest hot desert."),
    (["who wrote the indian national anthem", "author of jana gana mana"],
     "Rabindranath Tagore wrote the words and composed the music of Jana Gana Mana."),
    (["what is the national anthem of india", "india national anthem"],
     "India's national anthem is Jana Gana Mana."),
    (["what is the national song of india", "india national song"],
     "India's national song is Vande Mataram, written by Bankim Chandra Chatterjee."),
    (["what is python programming", "what is python"],
     "Python is a high-level, general-purpose programming language known for readable syntax."),
    (["what is arduino", "define arduino"],
     "Arduino is an open-source electronics platform based on easy-to-use hardware and software."),
    (["what is a sensor", "define sensor"],
     "A sensor detects a physical input such as light, temperature, distance or motion and produces a corresponding signal."),
    (["what is an ldr", "ldr full form", "expand ldr"],
     "LDR stands for Light Dependent Resistor. Its resistance changes with the amount of light falling on it."),
    (["what is a servo motor", "define servo motor"],
     "A servo motor is a motor system that can control position, commonly used for precise angular movement."),
    (["what is electricity", "define electricity"],
     "Electricity is associated with the presence and movement of electric charge."),
    (["what is voltage", "define voltage"],
     "Voltage is electric potential difference, measured in volts (V)."),
    (["what is current", "electric current definition"],
     "Electric current is the rate of flow of electric charge, measured in amperes (A)."),
    (["what is resistance", "electrical resistance definition"],
     "Electrical resistance opposes the flow of electric current and is measured in ohms (Ω)."),
    (["what is ohms law", "ohm's law formula"],
     "Ohm's law is V = I × R, where V is voltage, I is current and R is resistance."),
    (["what is a prime number", "define prime number"],
     "A prime number is a whole number greater than 1 with exactly two positive factors: 1 and itself."),
    (["what is pi", "value of pi"],
     "Pi (π) is the ratio of a circle's circumference to its diameter, approximately 3.14159."),
    (["what is percentage formula", "formula for percentage"],
     "Percentage = (Part ÷ Whole) × 100."),
    (["what is area of rectangle", "rectangle area formula"],
     "Area of a rectangle = length × breadth."),
    (["what is area of square", "square area formula"],
     "Area of a square = side × side = side²."),
    (["what is perimeter of square", "square perimeter formula"],
     "Perimeter of a square = 4 × side."),
    (["what is area of circle", "circle area formula"],
     "Area of a circle = π × radius²."),
    (["what is circumference of circle", "circle circumference formula"],
     "Circumference of a circle = 2 × π × radius."),
    (["what is evaporation", "define evaporation"],
     "Evaporation is the change of a liquid into vapour from its surface, and it can occur below the boiling point."),
    (["what is condensation", "define condensation"],
     "Condensation is the change of a gas or vapour into a liquid."),
    (["what is weather", "define weather"],
     "Weather is the day-to-day condition of the atmosphere at a place, including temperature, rain, wind and humidity."),
    (["what is climate", "define climate"],
     "Climate is the long-term average pattern of weather in a region, usually considered over many years."),
    (["what is a leap year", "define leap year"],
     "A leap year has 366 days, with an extra day added to February. In the Gregorian calendar, years divisible by 400 are leap years; otherwise years divisible by 100 are not, and years divisible by 4 are."),
    (["how many days are in a week", "days in a week"],
     "There are 7 days in a week."),
    (["how many months are in a year", "months in a year"],
     "There are 12 months in a year."),
    (["what is the sun", "define sun"],
     "The Sun is the star at the centre of our Solar System. Its gravity holds the planets in orbit."),
    (["what is a galaxy", "define galaxy"],
     "A galaxy is a huge collection of stars, gas, dust and dark matter held together by gravity."),
    (["what is the milky way", "define milky way"],
     "The Milky Way is the galaxy that contains our Solar System."),
    (["what is a black hole", "define black hole"],
     "A black hole is a region of space where gravity is so strong that nothing, not even light, can escape from within its event horizon."),
    (["what is the internet", "define internet"],
     "The internet is a global network of interconnected computer networks that communicate using standard protocols."),
    (["what is a website", "define website"],
     "A website is a collection of related web pages and resources available under a common domain."),
    (["what is an operating system", "define operating system", "os full form"],
     "OS stands for Operating System. It manages a computer's hardware and software resources."),
    (["what is a database", "define database"],
     "A database is an organised collection of data that can be stored, searched and updated."),
    (["what is machine learning", "define machine learning"],
     "Machine learning is a field of AI in which computer systems learn patterns from data to make predictions or decisions."),
    (["what is robotics", "define robotics"],
     "Robotics is the branch of technology concerned with designing, building, programming and operating robots."),
    (["what is a robot", "define robot"],
     "A robot is a programmable machine that can carry out tasks automatically or with guidance."),
    (["what is a firewall", "define firewall"],
     "A firewall monitors and controls network traffic according to security rules."),
    (["what is cybersecurity", "define cybersecurity"],
     "Cybersecurity is the practice of protecting computers, networks, systems and data from digital attacks."),
    (["what is a password manager", "define password manager"],
     "A password manager securely stores and helps generate passwords. Use a reputable one and protect it with a strong master password."),
    (["what is an algorithm", "define algorithm"],
     "An algorithm is a finite, step-by-step set of instructions for solving a problem or completing a task."),
    (["what is a variable in programming", "define variable programming"],
     "A variable is a named place in a program used to refer to a value."),
    (["what is a loop in programming", "define loop programming"],
     "A loop repeats a block of instructions while a condition is met or for a set number of iterations."),
    (["what is a function in programming", "define function programming"],
     "A function is a reusable block of code that performs a particular task."),
    (["what is a compiler", "define compiler"],
     "A compiler translates source code into another form, often machine code or bytecode."),
    (["what is open source", "define open source"],
     "Open-source software makes its source code available under a licence that grants specified rights to use, study, modify and share it."),
    (["what is github", "define github"],
     "GitHub is an online platform for hosting Git repositories and collaborating on software projects."),
    (["what is git", "define git"],
     "Git is a distributed version control system used to track changes in files, especially source code."),
    (["what is a variable", "variable meaning"],
     "In mathematics, a variable is a symbol that represents a number or an unknown value."),
    (["what is a fraction", "define fraction"],
     "A fraction represents part of a whole and is written as a numerator over a non-zero denominator."),
    (["what is an integer", "define integer"],
     "An integer is a whole number, its negative, or zero; it has no fractional part."),
    (["what is a triangle", "define triangle"],
     "A triangle is a polygon with three sides and three angles."),
    (["sum of angles in a triangle", "triangle angle sum"],
     "The interior angles of a Euclidean triangle add up to 180 degrees."),
    (["what is a noun", "define noun"],
     "A noun is a word used to name a person, place, thing or idea."),
    (["what is a verb", "define verb"],
     "A verb expresses an action, occurrence or state of being."),
    (["what is an adjective", "define adjective"],
     "An adjective describes or gives more information about a noun or pronoun."),
    (["what is a synonym", "define synonym"],
     "A synonym is a word or phrase with the same or nearly the same meaning as another word or phrase."),
    (["what is an antonym", "define antonym"],
     "An antonym is a word with the opposite meaning of another word."),
    (["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
     "Hello! I am V.E.C.T.O.R. How can I help you?"),
    (["who are you", "introduce yourself", "what are you"],
     f"I am V.E.C.T.O.R., {FULL_NAME}. I am your offline desktop assistant."),
    (["what can you do", "your features", "help"],
     "I can answer questions from my built-in knowledge pack, calculate expressions, tell the current time and date, and speak answers aloud. My knowledge pack can be expanded."),
    (["thank you", "thanks"],
     "You're welcome. Always ready to assist."),
    (["goodbye", "bye", "exit", "quit"],
     "Goodbye. VECTOR signing off.")
]

# Generate lots of alternative phrasings for matching. These are question
# patterns, not additional independently verified facts.
PREFIXES = [
    "what is", "what's", "tell me", "explain", "define", "describe",
    "can you explain", "please explain", "give me information about",
    "i want to know about", "what do you know about"
]
SUFFIXES = ["", " please", " in simple words", " in short", " meaning", " definition"]
PATTERNS = []
for questions, answer in KNOWLEDGE:
    for q in questions:
        PATTERNS.append((q, answer))
        clean = q.strip()
        for prefix in PREFIXES:
            PATTERNS.append((f"{prefix} {clean}", answer))
        for suffix in SUFFIXES:
            if suffix:
                PATTERNS.append((clean + suffix, answer))

# Safe arithmetic evaluator: only numeric constants and approved operators.
_ALLOWED_BIN = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod, ast.Pow: operator.pow
}
_ALLOWED_UNARY = {ast.UAdd: operator.pos, ast.USub: operator.neg}

def safe_calculate(text):
    expr = text.lower().replace("×", "*").replace("÷", "/")
    expr = expr.replace("multiplied by", "*").replace("divided by", "/")
    expr = expr.replace("plus", "+").replace("minus", "-")
    expr = expr.replace(" into ", "*").replace(" x ", "*")
    expr = re.sub(r"[^0-9+\-*/().% ]", "", expr).strip()
    if not expr or not re.search(r"\d", expr):
        return None
    try:
        tree = ast.parse(expr, mode="eval")
        def walk(node):
            if isinstance(node, ast.Expression):
                return walk(node.body)
            if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
                return node.value
            if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_BIN:
                left, right = walk(node.left), walk(node.right)
                if isinstance(node.op, ast.Pow) and abs(right) > 8:
                    raise ValueError("Exponent too large")
                result = _ALLOWED_BIN[type(node.op)](left, right)
                if abs(result) > 10**15:
                    raise ValueError("Result too large")
                return result
            if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_UNARY:
                return _ALLOWED_UNARY[type(node.op)](walk(node.operand))
            raise ValueError("Unsupported expression")
        result = walk(tree)
        if not math.isfinite(float(result)):
            return None
        return result
    except Exception:
        return None

def normalise(s):
    s = s.lower().replace("’", "'")
    s = re.sub(r"[^a-z0-9.+*/% -]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def answer_question(question):
    q = normalise(question)
    if not q:
        return "Please type a question."

    if any(x in q for x in ["what time", "current time", "tell me the time"]):
        return "The current time is " + dt.datetime.now().strftime("%I:%M:%S %p") + "."
    if any(x in q for x in ["what date", "today's date", "current date", "what day"]):
        return "Today is " + dt.datetime.now().strftime("%A, %d %B %Y") + "."
    if q in ["date", "time"]:
        now = dt.datetime.now()
        return now.strftime("It is %I:%M %p on %A, %d %B %Y.")

    calc_phrases = ["calculate", "what is", "solve", "how much is"]
    candidate = q
    for phrase in calc_phrases:
        candidate = candidate.replace(phrase, " ")
    result = safe_calculate(candidate)
    if result is not None and re.search(r"\d\s*[+\-*/%]", candidate):
        return f"The answer is {result:g}."

    best_score, best_answer = 0.0, None
    for pattern, answer in PATTERNS:
        p = normalise(pattern)
        score = difflib.SequenceMatcher(None, q, p).ratio()
        q_words, p_words = set(q.split()), set(p.split())
        if q_words and p_words:
            overlap = len(q_words & p_words) / len(q_words | p_words)
            score = max(score, 0.72 * score + 0.28 * overlap)
        if score > best_score:
            best_score, best_answer = score, answer

    if best_score >= 0.53 and best_answer:
        return f"{best_answer}\n\nMatch score: {best_score * 100:.0f}%"
    return ("I couldn't find a reliable answer in my offline knowledge pack. "
            "Try rephrasing the question or add the answer to my knowledge database.")

class VectorApp:
    BG = "#06111f"
    PANEL = "#0b1c2e"
    PANEL2 = "#10263b"
    CYAN = "#20d9ff"
    BLUE = "#168bff"
    TEXT = "#d9f5ff"
    MUTED = "#83a9bd"
    GREEN = "#32e6a1"

    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE + " | Offline Intelligence")
        self.root.geometry("1180x760")
        self.root.minsize(900, 620)
        self.root.configure(bg=self.BG)
        self.build_ui()
        self.update_clock()
        self.add_message("VECTOR", f"Hello! I am V.E.C.T.O.R.\n{FULL_NAME}\n\nOffline systems online. Ask me a question.")

    def panel(self, parent, **kwargs):
        return tk.Frame(parent, bg=self.PANEL, highlightbackground="#145477",
                        highlightthickness=1, **kwargs)

    def build_ui(self):
        header = tk.Frame(self.root, bg="#071827", height=66)
        header.pack(fill="x")
        header.pack_propagate(False)
        tk.Label(header, text="◈  V.E.C.T.O.R.", fg=self.CYAN, bg="#071827",
                 font=("Segoe UI", 22, "bold")).pack(side="left", padx=22)
        tk.Label(header, text="2.0  |  OFFLINE INTELLIGENCE", fg=self.MUTED,
                 bg="#071827", font=("Segoe UI", 10, "bold")).pack(side="left", padx=8)
        self.status = tk.Label(header, text="● OFFLINE MODE ACTIVE", fg=self.GREEN,
                               bg="#071827", font=("Segoe UI", 10, "bold"))
        self.status.pack(side="right", padx=24)

        body = tk.Frame(self.root, bg=self.BG)
        body.pack(fill="both", expand=True, padx=16, pady=14)

        left = self.panel(body, width=235)
        left.pack(side="left", fill="y", padx=(0, 12))
        left.pack_propagate(False)
        tk.Label(left, text="SYSTEM PROFILE", bg=self.PANEL, fg=self.CYAN,
                 font=("Segoe UI", 11, "bold")).pack(anchor="w", padx=15, pady=(17, 8))
        tk.Label(left, text="V.E.C.T.O.R.", bg=self.PANEL, fg=self.TEXT,
                 font=("Segoe UI", 18, "bold")).pack(anchor="w", padx=15)
        tk.Label(left, text=FULL_NAME, bg=self.PANEL, fg=self.MUTED,
                 font=("Segoe UI", 9), wraplength=195, justify="left").pack(anchor="w", padx=15, pady=5)
        self.clock_label = tk.Label(left, text="", bg=self.PANEL, fg=self.CYAN,
                                    font=("Consolas", 14, "bold"))
        self.clock_label.pack(anchor="w", padx=15, pady=(20, 2))
        self.date_label = tk.Label(left, text="", bg=self.PANEL, fg=self.MUTED,
                                   font=("Segoe UI", 9))
        self.date_label.pack(anchor="w", padx=15)
        tk.Frame(left, bg="#17435b", height=1).pack(fill="x", padx=14, pady=17)
        tk.Label(left, text="KNOWLEDGE MODULES", bg=self.PANEL, fg=self.CYAN,
                 font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=15, pady=(0, 8))
        for item in ["Full Forms & Abbreviations", "General Knowledge", "Science & Technology",
                     "Mathematics", "Indian Government", "Geography & History", "Education",
                     "Everyday Questions"]:
            tk.Label(left, text="▸  " + item, bg=self.PANEL, fg=self.TEXT,
                     font=("Segoe UI", 9), anchor="w").pack(fill="x", padx=15, pady=4)
        tk.Frame(left, bg="#17435b", height=1).pack(fill="x", padx=14, pady=14)
        tk.Label(left, text=f"Question patterns: {len(PATTERNS):,}+", bg=self.PANEL,
                 fg=self.GREEN, font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=15)
        tk.Label(left, text=f"Knowledge entries: {len(KNOWLEDGE)} starter facts",
                 bg=self.PANEL, fg=self.MUTED, font=("Segoe UI", 9)).pack(anchor="w", padx=15, pady=5)

        right = tk.Frame(body, bg=self.BG)
        right.pack(side="left", fill="both", expand=True)

        top = self.panel(right)
        top.pack(fill="x", pady=(0, 12))
        tk.Label(top, text="◉  NEURAL INTERFACE", bg=self.PANEL, fg=self.CYAN,
                 font=("Segoe UI", 11, "bold")).pack(anchor="w", padx=16, pady=(12, 3))
        tk.Label(top, text="Your offline assistant is ready.", bg=self.PANEL,
                 fg=self.MUTED, font=("Segoe UI", 10)).pack(anchor="w", padx=16, pady=(0, 12))

        chat_panel = self.panel(right)
        chat_panel.pack(fill="both", expand=True)
        tk.Label(chat_panel, text="COMMUNICATION CHANNEL", bg=self.PANEL, fg=self.CYAN,
                 font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=14, pady=(12, 6))
        self.chat = scrolledtext.ScrolledText(
            chat_panel, bg="#071522", fg=self.TEXT, insertbackground=self.CYAN,
            font=("Segoe UI", 11), wrap="word", relief="flat", padx=14, pady=12,
            state="disabled"
        )
        self.chat.pack(fill="both", expand=True, padx=12, pady=(0, 12))
        self.chat.tag_config("user", foreground="#70d8ff", font=("Segoe UI", 10, "bold"))
        self.chat.tag_config("vector", foreground=self.GREEN, font=("Segoe UI", 10, "bold"))
        self.chat.tag_config("body", foreground=self.TEXT)

        controls = tk.Frame(right, bg=self.BG)
        controls.pack(fill="x", pady=(12, 0))
        self.entry = tk.Entry(controls, bg="#10263b", fg=self.TEXT, insertbackground=self.CYAN,
                              font=("Segoe UI", 12), relief="flat")
        self.entry.pack(side="left", fill="x", expand=True, ipady=13, padx=(0, 8))
        self.entry.bind("<Return>", lambda event: self.send())
        self.entry.insert(0, "Ask VECTOR anything...")
        self.entry.bind("<FocusIn>", self.clear_placeholder)
        tk.Button(controls, text="SEND  ➤", command=self.send, bg="#087eae", fg="white",
                  activebackground="#0aa9d8", activeforeground="white", relief="flat",
                  font=("Segoe UI", 10, "bold"), padx=22, pady=12).pack(side="right")
        tk.Label(right, text="Tip: Try 'CPU full form', 'what time is it?', or '25 * 4'",
                 bg=self.BG, fg=self.MUTED, font=("Segoe UI", 9)).pack(anchor="w", pady=8)

    def clear_placeholder(self, _event):
        if self.entry.get() == "Ask VECTOR anything...":
            self.entry.delete(0, "end")

    def add_message(self, speaker, message):
        self.chat.configure(state="normal")
        tag = "user" if speaker == "YOU" else "vector"
        self.chat.insert("end", f"\n{speaker}\n", tag)
        self.chat.insert("end", message + "\n", "body")
        self.chat.see("end")
        self.chat.configure(state="disabled")

    def send(self):
        question = self.entry.get().strip()
        if not question or question == "Ask VECTOR anything...":
            return
        self.entry.delete(0, "end")
        self.add_message("YOU", question)
        answer = answer_question(question)
        self.add_message("VECTOR", answer)
        self.speak(answer.split("\n\nMatch score:")[0])

    def speak(self, text):
        # Uses Windows' built-in Speech API through PowerShell; no Python package needed.
        if sys.platform != "win32":
            return
        safe = text.replace("'", "''")
        script = (
            "Add-Type -AssemblyName System.Speech; "
            "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            f"$s.Speak('{safe}')"
        )
        try:
            subprocess.Popen(
                ["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", script],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
        except Exception:
            pass

    def update_clock(self):
        now = dt.datetime.now()
        self.clock_label.config(text=now.strftime("%I:%M:%S %p"))
        self.date_label.config(text=now.strftime("%a, %d %b %Y"))
        self.root.after(1000, self.update_clock)

def main():
    root = tk.Tk()
    VectorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
