#!/usr/bin/env bash
set -o errexit
pip install -r requirements.txt
python -c "import nltk; nltk.download('vader_lexicon', quiet=True)"
python manage.py collectstatic --noinput
python manage.py migrate
