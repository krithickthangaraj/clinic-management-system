# Install bcrypt

## The Issue
You're getting: `bcrypt: no backends available -- recommend you install one`

## Solution

When you have internet connection, run:

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/pip install bcrypt
```

Or reinstall all requirements:

```bash
cd "/Users/mac/Desktop/PROJECTS/clinic-software -cursor/backend"
./venv/bin/pip install -r requirements.txt
```

The `requirements.txt` already includes `passlib[bcrypt]` which should install bcrypt, but if it didn't, install it separately.

## After Installing bcrypt

Once bcrypt is installed and database permissions are fixed, run:

```bash
PYTHONPATH="$(pwd)" ./venv/bin/python -m app.init_db
```
