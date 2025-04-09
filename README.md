# MediaCheck

A media tracking application with Django backend and React Native mobile app.

## Project Structure

```
MediaCheck/
├── mysite/              # Django backend
│   ├── media/          # Main Django app
│   └── mysite/         # Django project settings
└── MediaCheckMobile/   # React Native mobile app
```

## Backend Setup (Django)

1. Navigate to the Django project:
```bash
cd mysite
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure settings:
- Open `mysite/settings.py`
- Update `ALLOWED_HOSTS` with your development machine's IP:
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'YOUR_LOCAL_IP']
```

5. Apply database migrations:
```bash
python manage.py migrate
```

6. Run the development server:
```bash
python manage.py runserver 0.0.0.0:8000
```

The API will be available at:
- Media list: `http://YOUR_LOCAL_IP:8000/api/media/`
- User media: `http://YOUR_LOCAL_IP:8000/api/user-media/`

## Mobile App Setup (React Native)

1. Navigate to the React Native project:
```bash
cd MediaCheckMobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure API connection:
- Open `src/services/api.ts`
- Update `API_URL` with your Django server's address:
```typescript
const API_URL = 'http://YOUR_LOCAL_IP:8000/api/';
```

4. Start the development server:
```bash
npm start
```

5. Run the app:
- Install Expo Go on your mobile device
- Scan the QR code with your camera (iOS) or Expo Go app (Android)
- Make sure your phone is on the same network as your development machine

## Development Notes

### API Access
- The API is configured for development with:
  - CORS enabled for all origins
  - Authentication disabled
  - Anonymous access allowed for viewing media
  - User authentication required for ratings and states

### Database
- Using SQLite for development
- Media and user data are stored locally in `db.sqlite3`
- Mobile app uses SQLite for offline storage and syncs with backend

### Security Notes
Current setup is for development only. For production:
- Implement proper authentication
- Secure API endpoints
- Configure proper CORS settings
- Use environment variables for sensitive data
- Set `DEBUG = False` in Django settings
- Use a production-grade database

## Troubleshooting

1. API Connection Issues:
   - Verify Django server is running on `0.0.0.0:8000`
   - Check `ALLOWED_HOSTS` includes your IP
   - Ensure phone and development machine are on same network

2. Mobile App Issues:
   - Clear app cache in Expo Go
   - Verify API_URL is correctly set
   - Check console logs for connection errors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request