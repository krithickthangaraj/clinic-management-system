from app.core.config import settings
import psycopg2
import sys
url = settings.DATABASE_URL
print('Connecting to', url)
try:
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    cur.execute("SELECT * FROM alembic_version;")
    rows = cur.fetchall()
    print('Current alembic_version:', rows)
    with open('alembic_version_backup.txt','w') as f:
        f.write(str(rows))
    # Update to tmpl_fields_001
    cur.execute("UPDATE alembic_version SET version_num = %s;", ('tmpl_fields_001',))
    conn.commit()
    print('Updated alembic_version to tmpl_fields_001')
    cur.execute("SELECT * FROM alembic_version;")
    print('Now:', cur.fetchall())
    cur.close(); conn.close()
except Exception as e:
    print('Error:', e)
    sys.exit(1)
