# 36°C Challenge - AgroGuard NG

Climate-smart agriculture webapp for Nigerian farmers.  
Helps with **location-based weather**, **manual crop inputs**, **personalized advice** on planting, irrigation, heat stress alerts, and resilience.

## Tech Stack
- **Backend**: Django + Django REST Framework
- **Frontend**: React JS (JavaScript) + Vite

## Team
- Alex Dominion
- Oloyode Michael
- Miriam Odeyiany
- etc.

## Features
- Geolocation + manual farm/crop input
- Real-time weather integration
- Personalized climate-smart recommendations (planting calendar, irrigation, drought/heat tips)
- Farm observation journal

## How to Run (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm (or yarn)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/alexgrate/AgroGuard.git   
cd AgroGuard

### Backend 
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers django-environ

# (After you add more packages later, save them with:)
# pip freeze > requirements.txt

# Run migrations (after creating models)
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional, for admin panel)
python manage.py createsuperuser

# Start Django server
python manage.py runserver

### Backend
cd backend

# 1. Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate

# macOS / Linux:
# source venv/bin/activate

# 2. Install dependencies from requirements.txt
pip install -r requirements.txt

# 3. Apply database migrations
python manage.py makemigrations
python manage.py migrate

# 4. (Optional) Create a superuser for the admin panel
python manage.py createsuperuser

# 5. Start the Django development server
python manage.py runserver

### frontend 

cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev