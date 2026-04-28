# Backend — Inventory BPA API

Django 5 + DRF + JWT (`djangorestframework-simplejwt`) + drf-spectacular.

## Quick start

```powershell
cd backend
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Open <http://127.0.0.1:8000/api/docs/> for Swagger.

## Layout

```
backend/
├── config/                     # Project (settings split, urls, wsgi/asgi)
│   ├── __init__.py             # PyMySQL shim
│   ├── settings/{base,dev,prod}.py
│   ├── urls.py
│   └── wsgi.py / asgi.py
├── apps/
│   ├── core/                   # Shared abstractions (audit models, mixins, perms)
│   ├── auth_ext/               # Step 03
│   ├── customers/ inquiries/ quotations/ orders/ inventory/
│   ├── purchase/  dispatch/   jobs/      documents/ reports/
│   └── notifications/ portal/
├── requirements/{base,dev,production}.txt
├── pytest.ini
└── .env.example
```

## Conventions

See [`apps/core/README.md`](apps/core/README.md) for the API contract
(JSON shape, status codes, pagination, errors, exports).

## Tests

```powershell
pytest
```

A smoke test in `apps/core/tests.py` keeps the suite non-empty until the
domain apps land.
