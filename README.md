# (Spotify App Project Name) Description

/ ... /

-----

# Setup Guide 

Local setup guide to run the React frontend and Django backend 

---

## Getting Started

### 1. Clone the Repository

Start by cloning the main repository to your machine, creating your own branch, and switching to that branch.

### 2. Python Environment and Backend Dependencies
#### a) Create a Python environment (only do once)
```bash
cd BackEnd-CS222
python -m venv .venv
```
#### b) Activate the environment (do this every time you run or work on the project)
On Windows
```bash
.venv\Scripts\activate
```
On Mac
```bash
source .venv/bin/activate
```
#### c) To install the dependencies, run the first line, and when introducing new dependencies (like pip installing anything new), run the second line (this updates requirements.txt)
```bash
pip install -r requirements.txt
pip freeze > requirements.txt
```
### 3. Starting the Django Backend server
- Open the address listed in the terminal and see what directories our server has
```bash
cd spotifyapp
python manage.py migrate
python manage.py runserver
```

### 4. Node.js and Frontend Dependencies
#### Install Node.js and Verify the Installation
- Go to https://nodejs.org
- Install the LTS version and make sure to check "Add to Path"
- Then verify the installation in the VSCode terminal (may need to restart VSCode a few times, etc.)
```bash
node -v
npm -v
```
### 5. Starting the React Frontend server
- This should open a window in your browser
```bash
cd FrontEnd-CS222
npm install
npm start
```
### 6. Adding OpenAI API key
- Create a .env file in
```bash
BackEnd-CS222/spotifyapp/
```
- With the following line and enter the key (saved in Slack)
```bash
OPENAI_API_KEY=""
```
