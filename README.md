# Development Notes

## Virtual Enviorment Control
```bash
# Crea entorno virtual
python -m venv venv

# Activa en linux
source venv/bin/activate
# Activa en Windows
.\venv\Scripts\activate
# Instala dependencias
pip install -r requirements.txt

# Actualizar requirements.txt
pip freeze > requirements.txt
```

## Django manage.py
```bash
django-admin startproject mysite
python manage.py runserver
python manage.py migrations

# crea usuario admin
python manage.py createsuperuser

# bbdd desde linea de comandos
python manage.py dbshell
-> .tables
-> .schema $tabla
-> SELECT * FROM auth_user;

# crea App
python manage.py startapp $App

# Migraciones
python manage.py makemigrations $App
python manage.py migrate $App

# erase y restore data (MediaCheck/mysite/media/management/commands/erase_data.py)
python manage.py erase_data --action erase
python manage.py erase_data --action restore
```