"""Tests never touch the real data: they get their own database on the same server."""

import os
import subprocess
from pathlib import Path

import psycopg
import pytest

SERVER = 'postgresql://creator:creator@localhost:5433'
TEST_URL = f'{SERVER}/creator_test'
os.environ.setdefault('TEST_DATABASE_URL', TEST_URL)
os.environ['DATABASE_URL'] = os.environ['TEST_DATABASE_URL']  # before core.conf is imported


@pytest.fixture(scope='session')
def test_database():
    url = os.environ['DATABASE_URL']
    with psycopg.connect(url.rsplit('/', 1)[0] + '/postgres', autocommit=True) as c:
        name = url.rsplit('/', 1)[1]
        if not c.execute('select 1 from pg_database where datname = %s', (name,)).fetchone():
            c.execute(f'create database {name}')
    subprocess.run(['alembic', 'upgrade', 'head'], cwd=Path(__file__).parents[3], check=True)
